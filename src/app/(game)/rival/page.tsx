"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { rivalEventDefs, rivalFlagCount } from "@/game/rival";
import { formatMoney } from "@/game/formulas";
import { fetchLifeBeat } from "@/game/lifeAi";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, VEX_ART } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

const ALL_BEATS = [
  { key: "c10", gate: "10+ crime attempts" },
  { key: "l3", gate: "Level 3+" },
  { key: "hosp", gate: "In hospital" },
  { key: "course", gate: "Complete a course" },
  { key: "heat", gate: "Heat > 60" },
  { key: "l5", gate: "Level 5+" },
  { key: "prop", gate: "Own a property" },
  { key: "jail", gate: "In jail" },
  { key: "bank", gate: "Bank deposit once" },
  { key: "rails", gate: "Visit 3 districts" },
];

export default function RivalPage() {
  const s = useGame();
  const flags = rivalFlagCount(s);
  const ready = rivalEventDefs(s).filter((e) => !s.rivalFlags[e.key]);
  const [rivalAi, setRivalAi] = useState<{ text: string; source: "ai" | "fallback" } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadRivalAi = useCallback(
    async (force = false) => {
      if (!s.aiLife) {
        setRivalAi(null);
        return;
      }
      setBusy(true);
      try {
        const beat = await fetchLifeBeat(
          {
            kind: "rival",
            district: s.district,
            heat: s.heat,
            level: s.level,
            playerName: s.name,
            lastEvents: [s.rivalLast].filter(Boolean),
            adultNpc: s.adultNpc,
          },
          { enabled: true, seed: s.seed || "nw", force, adultNpc: s.adultNpc }
        );
        setRivalAi(beat);
      } finally {
        setBusy(false);
      }
    },
    [s.aiLife, s.adultNpc, s.district, s.heat, s.level, s.name, s.rivalLast, s.seed]
  );

  useEffect(() => {
    void loadRivalAi(false);
  }, [loadRivalAi]);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Rival — Vex"
        subtitle="Ten scripted beats. Flags fire once. Away pressure skims street when the score climbs."
        tone="city"
        image={VEX_ART}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Score {s.rivalScore}</span>
          <span className={hub.chip}>
            Flags {flags}/10
          </span>
          <span className={hub.chip}>Ready {ready.length}</span>
        </div>
      </PageHero>

      <p className={hub.sub}>
        Contacts & tips: <Link href="/contacts">Contacts</Link>
        {" · "}
        Field guide: <Link href="/almanac">Almanac</Link>
      </p>

      <div className={hub.grid2}>
        <Module title="Last word" footer="Also shown on the chrome rail">
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={VEX_ART}
              alt=""
              style={{ width: 96, height: 120, objectFit: "cover", borderRadius: 4, background: "#151518" }}
            />
            <div>
              <p className={hub.sub} style={{ marginTop: 0 }}>
                {s.rivalLast || "Vex hasn’t inked you yet."}
              </p>
              {s.aiLife ? (
                <>
                  <p className={hub.sub}>{rivalAi?.text ?? (busy ? "Listening…" : "—")}</p>
                  <GameButton variant="secondary" disabled={busy} onClick={() => void loadRivalAi(true)}>
                    Refresh line
                  </GameButton>
                </>
              ) : (
                <p className={hub.sub}>AI life off — scripted beats only.</p>
              )}
            </div>
          </div>
        </Module>

        <Module title="Away pressure" footer="Fires on catch-up ≥8h when rivalScore > 0">
          <ul className={hub.sub} style={{ margin: 0, paddingLeft: 16 }}>
            <li>Stress +5 · happy −8 on a hit</li>
            <li>~35% chance to skim street (~$100 + 5×score)</li>
            <li>Emergence can add chalk whispers while you’re gone</li>
          </ul>
          <div className={hub.statRow} style={{ marginTop: 8 }}>
            <span>Street on hand</span>
            <strong className="tabular">{formatMoney(s.street)}</strong>
          </div>
        </Module>
      </div>

      <Module title="Beat board" footer="Gates arm the beat; first trigger stamps the flag forever">
        <div className={hub.grid}>
          {ALL_BEATS.map((b) => {
            const fired = Boolean(s.rivalFlags[b.key]);
            const armed = ready.some((r) => r.key === b.key);
            return (
              <article key={b.key} className={hub.panel} style={{ opacity: fired ? 1 : armed ? 0.9 : 0.5 }}>
                <div className={hub.statRow} style={{ borderBottom: "none", paddingTop: 0 }}>
                  <strong>{b.key}</strong>
                  <span className={hub.chip}>
                    {fired ? "Fired" : armed ? "Armed" : "Locked"}
                  </span>
                </div>
                <p className={hub.sub} style={{ margin: "4px 0 0" }}>
                  {b.gate}
                </p>
                {fired && ready.find((r) => r.key === b.key) == null ? (
                  <p className={hub.sub}>On your ledger.</p>
                ) : null}
              </article>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
