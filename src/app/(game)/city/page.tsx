"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, DISTRICT_ART } from "@/components/ui/Visuals";
import { NavIcon } from "@/components/ui/Icons";
import { useGame } from "@/store/gameStore";
import { DISTRICTS } from "@/content/catalog";
import { buildCityLifeBundle } from "@/game/cityLife";
import { fetchLifeBeat } from "@/game/lifeAi";
import { formatMoney } from "@/game/formulas";
import styles from "./city.module.css";
import hub from "../hub.module.css";

const ACTIONS = [
  { href: "/crimes", name: "Crimes", desc: "Spend nerve for street cash" },
  { href: "/gym", name: "Gym", desc: "Train STR / DEF / SPD / DEX" },
  { href: "/jobs", name: "Jobs", desc: "Clean shifts, weekly cap" },
  { href: "/gigs", name: "Gigs", desc: "Short contracts, even unemployed" },
  { href: "/advisor", name: "Advisor", desc: "Legal vs street EV call" },
  { href: "/planner", name: "Planner", desc: "Build mixes and nerve spend" },
  { href: "/education", name: "Education", desc: "Courses unlock crimes & bonuses" },
  { href: "/travel", name: "Travel", desc: "Change district risk & shops" },
  { href: "/casino", name: "Casino", desc: "Clean cash, honest house edge" },
  { href: "/hospital", name: "Hospital", desc: "Wards, meds, discharge" },
];

export default function CityPage() {
  const s = useGame();
  const d = DISTRICTS.find((x) => x.id === s.district);
  const art = DISTRICT_ART[s.district] ?? "/art/city/skyline.webp";
  const life = useMemo(
    () => buildCityLifeBundle(s.seed || "nw", s.district, Date.now(), s.adultNpc),
    [s.seed, s.district, s.clock, s.adultNpc]
  );
  const [aiBeat, setAiBeat] = useState<{ text: string; source: "ai" | "fallback" } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const refreshAiBeat = useCallback(
    async (force = false) => {
      if (!s.aiLife) {
        setAiBeat(null);
        return;
      }
      setAiLoading(true);
      try {
        const recent = (s.logs ?? [])
          .filter((l) => l.kind === "diegetic" || l.kind === "result")
          .slice(0, 3)
          .map((l) => l.text);
        const beat = await fetchLifeBeat(
          {
            kind: "city",
            district: s.district,
            heat: s.heat,
            level: s.level,
            playerName: s.name,
            lastEvents: recent,
            adultNpc: s.adultNpc,
          },
          { enabled: true, seed: s.seed || "nw", force, adultNpc: s.adultNpc }
        );
        setAiBeat(beat);
      } finally {
        setAiLoading(false);
      }
    },
    [s.aiLife, s.adultNpc, s.district, s.heat, s.level, s.name, s.seed, s.logs]
  );

  useEffect(() => {
    void refreshAiBeat(false);
  }, [refreshAiBeat]);

  let nextUnlock = "Raise mastery or buy territory influence";
  if (s.level < 5) nextUnlock = `Heavy crimes unlock at Level 5 (now ${s.level})`;
  else if (!s.completedCourses.includes("se1")) nextUnlock = "Street Electives I unlocks warehouse/pharmacy";
  else if (!s.jobId) nextUnlock = "Apply for a job for clean income";

  const lifeFooter = s.aiLife
    ? "Procedural beats always on · AI line refreshes when Grok is available"
    : "Procedural beats — no API · refreshes with the hour";

  return (
    <div className={styles.wrap}>
      <PageHero
        title="City"
        subtitle={`${d?.name ?? "Unknown"} — pick a loop and run it.`}
        tone="city"
        image="/art/city/skyline.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Lv {s.level}</span>
          <span className={hub.chip}>Heat {Math.floor(s.heat)}</span>
          <span className={hub.chip}>Inv {s.investigation}</span>
        </div>
      </PageHero>

      <div
        className={hub.districtCard}
        style={{ minHeight: 120, marginBottom: 12 }}
      >
        <div className={hub.districtBg} style={{ backgroundImage: `url(${art})` }} />
        <div className={hub.districtShade} />
        <div className={hub.districtBody} style={{ minHeight: 120 }}>
          <div className={hub.districtName}>{d?.name}</div>
          <p className={hub.sub} style={{ color: "rgba(220,220,220,0.8)" }}>
            Risk: {d?.risk} · Shop: {d?.shopStyle}
          </p>
          <div className={hub.chipRow}>
            <span className={hub.chip}>
              Clean <strong className="tabular money-pos">{formatMoney(s.clean)}</strong>
            </span>
            <span className={hub.chip}>
              Street <strong className="tabular money-pos">{formatMoney(s.street)}</strong>
            </span>
          </div>
        </div>
      </div>

      <Module title="City life" footer={lifeFooter}>
        <div className={hub.grid2}>
          <div className={hub.panel}>
            <h3 className={hub.panelTitle}>{life.day.title}</h3>
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
        {life.npcs.length ? (
          <div className={hub.chipRow}>
            {life.npcs.map((n) => (
              <span key={n.id} className={hub.chip} title={n.body}>
                {n.title}
              </span>
            ))}
          </div>
        ) : null}
        {s.aiLife ? (
          <div className={hub.panel} style={{ marginTop: 10, padding: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <h3 className={hub.panelTitle} style={{ margin: 0 }}>
                Wire beat
              </h3>
              <GameButton variant="secondary" disabled={aiLoading} onClick={() => void refreshAiBeat(true)}>
                {aiLoading ? "Listening…" : "Refresh"}
              </GameButton>
            </div>
            <p className={hub.sub} style={{ marginBottom: 0 }}>
              {aiBeat?.text ?? (aiLoading ? "Tuning the wire…" : life.ambient.body)}
            </p>
            {aiBeat ? (
              <div className={hub.chipRow} style={{ marginTop: 6 }}>
                <span className={hub.chip}>{aiBeat.source === "ai" ? "Grok" : "Fallback"}</span>
              </div>
            ) : null}
          </div>
        ) : null}
        <p className={styles.hint} style={{ marginTop: 10 }}>
          <Link href="/advisor">Advisor</Link> · <Link href="/planner">Planner</Link> ·{" "}
          <Link href="/events">Events wire</Link>
        </p>
      </Module>

      <Module footer="N attempt · R repeat · / search">
        <div className={styles.status}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Next unlock</h2>
            <p className={styles.unlock}>{nextUnlock}</p>
            {s.directorEvent ? (
              <p className={styles.event}>Director: {s.directorEvent.label}</p>
            ) : (
              <p className={styles.meta}>No active director event.</p>
            )}
          </section>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>District strip</h2>
            <div className={hub.chipRow}>
              {DISTRICTS.map((dist) => (
                <Link key={dist.id} href="/travel" className={hub.chip} style={{ textDecoration: "none" }}>
                  {dist.name}
                  {dist.id === s.district ? " ●" : ""}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.actions}>
          {ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className={styles.tile}>
              <span className={styles.tileName}>
                <NavIcon href={a.href} />
                {a.name}
              </span>
              <span className={styles.tileDesc}>{a.desc}</span>
            </Link>
          ))}
        </div>

        <p className={styles.hint}>
          Legal EV: jobs + gigs + scholarships. Street EV: crimes. Hybrid wins the city.
        </p>
      </Module>
    </div>
  );
}
