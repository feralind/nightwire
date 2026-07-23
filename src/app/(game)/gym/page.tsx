"use client";

import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { GYM_TRACK_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "./gym.module.css";

const TRACKS = [
  {
    id: "bulk" as const,
    name: "Strength",
    trainLabel: "Bulk",
    effect: "Raw power. Hits harder in fights and heavy jobs.",
    color: "var(--stat-str)",
    art: styles.artStr,
    artKey: "str",
    accent: "#e05050",
    get: (s: { str: number }) => s.str,
  },
  {
    id: "tank" as const,
    name: "Defense",
    trainLabel: "Tank",
    effect: "Soak damage. Stay standing longer in scrapes.",
    color: "var(--stat-def)",
    art: styles.artDef,
    artKey: "def",
    accent: "#4caf70",
    get: (s: { def: number }) => s.def,
  },
  {
    id: "speed" as const,
    name: "Speed",
    trainLabel: "Speed",
    effect: "Initiative and escape. First move wins.",
    color: "var(--stat-spd)",
    art: styles.artSpd,
    artKey: "spd",
    accent: "#4a90d9",
    get: (s: { spd: number }) => s.spd,
  },
  {
    id: "tech" as const,
    name: "Dexterity",
    trainLabel: "Tech",
    effect: "Precision work — locks, lifts, fine crime.",
    color: "var(--stat-dex)",
    art: styles.artDex,
    artKey: "dex",
    accent: "#c9a227",
    get: (s: { dex: number }) => s.dex,
  },
];

export default function GymPage() {
  const train = useGame((s) => s.train);
  const energy = useGame((s) => s.energy);
  const str = useGame((s) => s.str);
  const def = useGame((s) => s.def);
  const spd = useGame((s) => s.spd);
  const dex = useGame((s) => s.dex);
  const stats = { str, def, spd, dex };

  return (
    <div className={styles.wrap}>
      <PageHero
        title="Gym"
        subtitle="Four tracks. Energy in, muscle out."
        tone="gym"
        image="/art/gym/hero.webp"
        tall
      />
      <Module footer="4 tracks · diminishing returns after 3/day per stat">
        <p className={styles.sub}>Energy: {Math.floor(energy)} · 5 per train</p>
        <div className={styles.grid}>
          {TRACKS.map((t) => (
            <article key={t.id} className={styles.panel}>
              <div
                className={[styles.art, t.art].join(" ")}
                style={{
                  backgroundImage: `linear-gradient(180deg,transparent 20%,rgba(0,0,0,0.7)), center/cover no-repeat url(${GYM_TRACK_ART[t.artKey] ?? "/art/gym/hero.webp"})`,
                }}
              >
                <div className={styles.artGrain} />
                <div className={styles.artAccent} style={{ background: `linear-gradient(180deg,${t.accent}88,transparent)` }} />
                <span className={styles.statLabel}>{t.trainLabel}</span>
              </div>
              <div className={styles.body}>
                <div className={styles.name} style={{ color: t.color }}>
                  {t.name}
                </div>
                <div className={`tabular ${styles.value}`} style={{ color: t.color }}>
                  {t.get(stats).toFixed(1)}
                </div>
                <p className={styles.blurb}>{t.effect}</p>
                <div className={styles.cost}>Cost: 5 energy</div>
                <GameButton disabled={energy < 5} onClick={() => train(t.id)}>
                  Train
                </GameButton>
              </div>
            </article>
          ))}
        </div>
      </Module>
    </div>
  );
}
