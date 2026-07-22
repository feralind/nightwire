"use client";

import { Module } from "@/components/ui/Module";
import { PageHero } from "@/components/ui/Visuals";
import { xpToLevel } from "@/game/formulas";
import { useGame } from "@/store/gameStore";
import styles from "./stats.module.css";

function meterPct(value: number, softMax = 100) {
  return Math.max(4, Math.min(100, (value / softMax) * 100));
}

export default function Page() {
  const s = useGame();
  const need = xpToLevel(s.level);
  const xpPct = Math.min(100, (s.xp / need) * 100);
  const combatMax = Math.max(40, s.str, s.def, s.spd, s.dex, 1) * 1.15;

  const combat = [
    { name: "Strength", val: s.str, color: "var(--stat-str)" },
    { name: "Defense", val: s.def, color: "var(--stat-def)" },
    { name: "Speed", val: s.spd, color: "var(--stat-spd)" },
    { name: "Dexterity", val: s.dex, color: "var(--stat-dex)" },
  ];

  const resources = [
    { name: "Life", cur: s.life, max: s.lifeMax, color: "var(--life)" },
    { name: "Energy", cur: s.energy, max: s.energyMax, color: "var(--energy)" },
    { name: "Nerve", cur: s.nerve, max: s.nerveMax, color: "var(--nerve)" },
    { name: "Happy", cur: s.happy, max: s.happyMax, color: "var(--happy)" },
  ];

  return (
    <div className={styles.wrap}>
      <PageHero title="Stats" subtitle="Combat attributes, level progress, vitals." tone="gym" />
      <Module>
        <div className={styles.grid}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Combat</h2>
            {combat.map((c) => (
              <div key={c.name} className={styles.statRow}>
                <span className={styles.statName} style={{ color: c.color }}>
                  {c.name}
                </span>
                <div className={styles.meterTrack}>
                  <div
                    className={styles.meterFill}
                    style={{
                      width: `${meterPct(c.val, combatMax)}%`,
                      ["--fill" as string]: c.color,
                    }}
                  />
                </div>
                <span className={`tabular ${styles.statVal}`}>{c.val.toFixed(1)}</span>
              </div>
            ))}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Level & XP</h2>
            <div className={styles.levelBlock}>
              <span className={`tabular ${styles.levelNum}`}>{s.level}</span>
              <span className={styles.xpMeta}>
                Level · {Math.floor(s.xp)} / {need} XP to next
              </span>
            </div>
            <div className={styles.xpTrack} aria-label={`XP ${Math.floor(xpPct)}%`}>
              <div className={styles.xpFill} style={{ width: `${xpPct}%` }} />
            </div>
          </section>

          <section className={styles.panel} style={{ gridColumn: "1 / -1" }}>
            <h2 className={styles.panelTitle}>Vitals</h2>
            <div className={styles.resourceGrid}>
              {resources.map((r) => (
                <div key={r.name} className={styles.resCell}>
                  <div className={styles.resLabel}>{r.name}</div>
                  <div className={`tabular ${styles.resVal}`} style={{ color: r.color }}>
                    {Math.floor(r.cur)}/{r.max}
                  </div>
                  <div className={styles.meterTrack} style={{ marginTop: 6 }}>
                    <div
                      className={styles.meterFill}
                      style={{
                        width: `${meterPct(r.cur, r.max)}%`,
                        ["--fill" as string]: r.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </Module>
    </div>
  );
}
