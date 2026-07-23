"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, TIMELINE_HERO } from "@/components/ui/Visuals";
import { buildCityLifeBundle } from "@/game/cityLife";
import { fetchLifeBeat } from "@/game/lifeAi";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

const KIND_FILTERS = ["all", "result", "diegetic", "system"] as const;

export default function EventsPage() {
  const logs = useGame((s) => s.logs);
  const seed = useGame((s) => s.seed);
  const district = useGame((s) => s.district);
  const clock = useGame((s) => s.clock);
  const aiLife = useGame((s) => s.aiLife);
  const adultNpc = useGame((s) => s.adultNpc);
  const heat = useGame((s) => s.heat);
  const level = useGame((s) => s.level);
  const name = useGame((s) => s.name);
  const rivalLast = useGame((s) => s.rivalLast);
  const [filter, setFilter] = useState<(typeof KIND_FILTERS)[number]>("all");
  const [aiLine, setAiLine] = useState<{ text: string; source: "ai" | "fallback" } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const filtered = useMemo(() => {
    const recent = logs.slice(0, 80);
    if (filter === "all") return recent;
    return recent.filter((l) => l.kind === filter);
  }, [logs, filter]);

  const life = useMemo(
    () => buildCityLifeBundle(seed || "nw", district, clock || Date.now(), adultNpc),
    [seed, district, clock, adultNpc]
  );

  const refreshAi = useCallback(
    async (force = false) => {
      if (!aiLife) {
        setAiLine(null);
        return;
      }
      setAiLoading(true);
      try {
        const recent = logs
          .filter((l) => l.kind === "diegetic" || l.kind === "result")
          .slice(0, 3)
          .map((l) => l.text);
        const beat = await fetchLifeBeat(
          {
            kind: "rival",
            district,
            heat,
            level,
            playerName: name,
            lastEvents: [rivalLast, ...recent].filter(Boolean).slice(0, 4),
            adultNpc,
          },
          { enabled: true, seed: seed || "nw", force, adultNpc }
        );
        setAiLine(beat);
      } finally {
        setAiLoading(false);
      }
    },
    [aiLife, adultNpc, district, heat, level, name, rivalLast, seed, logs]
  );

  useEffect(() => {
    void refreshAi(false);
  }, [refreshAi]);

  const lifeFooter = aiLife
    ? "Procedural NPC schedules · optional Grok rival / city mood"
    : "Procedural NPC schedules · day event · rotating tip";

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Events"
        subtitle="Live wire log — crimes, shifts, ticks, and city life beats."
        tone="city"
        image={TIMELINE_HERO}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>{filtered.length} shown</span>
          <span className={hub.chip}>{logs.length} total</span>
          <Link className={hub.chip} href="/timeline">
            Full timeline →
          </Link>
        </div>
      </PageHero>

      <Module title="City life now" footer={lifeFooter}>
        <div className={hub.grid2}>
          <div className={hub.panel}>
            <h3 className={hub.panelTitle}>Day · {life.day.title}</h3>
            <p className={hub.sub}>{life.day.body}</p>
          </div>
          <div className={hub.panel}>
            <h3 className={hub.panelTitle}>{life.tip.title}</h3>
            <p className={hub.sub}>{life.tip.body}</p>
          </div>
        </div>
        <p className={hub.sub} style={{ marginTop: 8 }}>
          {life.ambient.body}
        </p>
        {life.npcs.map((n) => (
          <div key={n.id} className={hub.statRow}>
            <span>{n.title}</span>
            <strong style={{ fontWeight: 400, textAlign: "right", maxWidth: "70%" }}>{n.body}</strong>
          </div>
        ))}
        {aiLife ? (
          <div className={hub.panel} style={{ marginTop: 10, padding: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <h3 className={hub.panelTitle} style={{ margin: 0 }}>
                Rival mood · city wire
              </h3>
              <GameButton variant="secondary" disabled={aiLoading} onClick={() => void refreshAi(true)}>
                {aiLoading ? "Listening…" : "Refresh"}
              </GameButton>
            </div>
            <p className={hub.sub} style={{ marginBottom: 0 }}>
              {aiLine?.text ?? rivalLast}
            </p>
            {aiLine ? (
              <div className={hub.chipRow} style={{ marginTop: 6 }}>
                <span className={hub.chip}>{aiLine.source === "ai" ? "Grok" : "Fallback"}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </Module>

      <Module
        title="Wire log"
        footer="Newest first · filter by kind · full history on Timeline"
        tabs={
          <div className={styles.tabs}>
            {KIND_FILTERS.map((k) => (
              <button
                key={k}
                type="button"
                className={filter === k ? styles.tabActive : styles.tab}
                onClick={() => setFilter(k)}
              >
                {k}
              </button>
            ))}
          </div>
        }
      >
        {filtered.length === 0 ? (
          <p className={hub.sub}>
            Nothing on this wire yet. Attempt a crime, take a shift, or enroll a course.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 88 }}>Kind</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td className="tabular" style={{ color: "var(--text-dim)", fontSize: 11 }}>
                    {l.kind}
                  </td>
                  <td style={{ fontSize: 12, lineHeight: 1.35 }}>{l.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Module>
    </div>
  );
}
