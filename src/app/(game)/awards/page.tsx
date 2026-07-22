"use client";

import { useMemo, useState } from "react";
import { awardProgressList, awardsCompletePct } from "@/game/awards";
import type { AwardCategory } from "@/game/types";
import { Module } from "@/components/ui/Module";
import { AWARD_CAT_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";
import board from "./awards.module.css";

const CATS: { id: AwardCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "crime", label: "Crime" },
  { id: "work", label: "Work" },
  { id: "money", label: "Money" },
  { id: "body", label: "Body" },
  { id: "city", label: "City" },
  { id: "story", label: "Story" },
];

export default function AwardsPage() {
  const s = useGame();
  const [cat, setCat] = useState<AwardCategory | "all">("all");
  const list = useMemo(() => awardProgressList(s), [s]);
  const filtered = cat === "all" ? list : list.filter((a) => a.award.category === cat);
  const pct = awardsCompletePct(s);
  const unlocked = list.filter((a) => a.unlocked).length;

  return (
    <div>
      <PageHero
        title="Nightwire Awards"
        subtitle="Original city marks — earned from crimes, shifts, gym, travel, combat, and the bank."
        tone="city"
        image="/art/awards/hero.webp"
        tall
      />

      <Module title="Collection" footer={`${unlocked}/${list.length} unlocked · ${pct}%`}>
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
        <div className={board.grid}>
          {filtered.map(({ award, unlocked: on, hint }) => {
            const badge = AWARD_CAT_ART[award.category] ?? "/art/awards/hero.webp";
            return (
              <div
                key={award.id}
                className={[board.card, on ? board.unlocked : board.locked].join(" ")}
              >
                <div className={board.art}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={badge} alt="" className={board.thumb} />
                  <div className={board.artShade} />
                </div>
                <div className={board.body}>
                  <div className={board.cat}>
                    {award.category}
                    {on ? " · unlocked" : " · locked"}
                  </div>
                  <strong>{on ? award.name : "??????"}</strong>
                  <p className={board.blurb}>{on ? award.blurb : hint}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
