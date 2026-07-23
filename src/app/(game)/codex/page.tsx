"use client";

import { useMemo, useState } from "react";
import type { CodexCategory } from "@/content/lore";
import { DISTRICTS } from "@/content/catalog";
import { codexByCategory, codexCompletePct } from "@/game/lore";
import { Module } from "@/components/ui/Module";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero, DISTRICT_ART } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";
import loreStyles from "./lore.module.css";

const CATS: { id: CodexCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "district", label: "Districts" },
  { id: "system", label: "Systems" },
  { id: "school", label: "Schools" },
  { id: "story", label: "Story" },
];

export default function CodexPage() {
  const s = useGame();
  const [cat, setCat] = useState<CodexCategory | "all">("all");
  const list = useMemo(() => codexByCategory(s, cat), [s, cat]);
  const pct = codexCompletePct(s);
  const unlocked = list.filter((x) => x.unlocked).length;

  return (
    <div>
      <PageHero
        title="Nightwire Codex"
        subtitle="District pages, system pillars, and story beats the city unlocks as you play."
        tone="city"
        image="/art/codex/hero.webp"
        tall
      />

      <Module title="Field guide" footer={`${unlocked} shown · ${pct}% of codex unlocked`}>
        <div
          style={{
            height: 8,
            background: "var(--bg-panel-2)",
            border: "1px solid var(--border)",
            borderRadius: 2,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent-rail)" }} />
        </div>
        <div className={styles.tabs} style={{ marginBottom: 10 }}>
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cat === c.id ? styles.tabActive : styles.tab}
              onClick={() => setCat(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className={loreStyles.grid}>
          {list.map(({ entry, unlocked: on }) => {
            const districtId = entry.id.startsWith("dist_")
              ? entry.id.replace("dist_", "")
              : null;
            const art =
              (districtId && DISTRICT_ART[districtId]) ||
              "/art/codex/hero.webp";
            return (
              <article
                key={entry.id}
                className={[loreStyles.card, on ? "" : loreStyles.locked].filter(Boolean).join(" ")}
              >
                <div className={loreStyles.art}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art} alt="" className={loreStyles.thumb} />
                  <div className={loreStyles.artShade} />
                  {!on && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/art/ui/locked.webp" alt="" className={loreStyles.lockIcon} />
                  )}
                  <div className={loreStyles.artTitle}>
                    <strong>{on ? entry.title : "••••"}</strong>
                    <span>{entry.category}</span>
                  </div>
                </div>
                <div className={loreStyles.body}>
                  {on ? (
                    <p className={loreStyles.copy}>{entry.body}</p>
                  ) : (
                    <RequirementsBox reasons={[{ label: entry.hint }]} />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Module>

      <Module title="District stamps" footer="Visited districts feed the codex">
        <ul className={loreStyles.stampList}>
          {DISTRICTS.map((d) => {
            const visited = (s.lifetime.districtsVisited ?? []).includes(d.id) || s.district === d.id;
            return (
              <li key={d.id} className={visited ? undefined : loreStyles.dim}>
                <strong>{d.name}</strong> — {visited ? d.risk : "Unstamped"}
              </li>
            );
          })}
        </ul>
      </Module>
    </div>
  );
}
