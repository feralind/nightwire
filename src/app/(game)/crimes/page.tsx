"use client";

import { useMemo, useState } from "react";
import { CRIMES } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import { masteryStars, masteryTitleFor } from "@/game/mastery";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { OddsBreakdown } from "@/components/ui/OddsBreakdown";
import { CrimeArt, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "./crimes.module.css";

export default function CrimesPage() {
  const [tier, setTier] = useState<"petty" | "street" | "heavy">("petty");
  const [openOdds, setOpenOdds] = useState<string | null>(null);
  const attemptCrime = useGame((s) => s.attemptCrime);
  const getCrimeOddsView = useGame((s) => s.getCrimeOddsView);
  const mastery = useGame((s) => s.mastery);
  const nerve = useGame((s) => s.nerve);
  const list = useMemo(() => CRIMES.filter((c) => c.tier === tier), [tier]);

  return (
    <div className={styles.wrap}>
      <PageHero
        title="Crimes"
        subtitle="Pick a mark. Spend nerve. Cash or consequences."
        tone="crime"
        image="/art/crimes/mug.webp"
        tall
      />
      <Module
        tabs={
          <div className={styles.tabs}>
            {(["petty", "street", "heavy"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={tier === t ? styles.tabActive : styles.tab}
                onClick={() => setTier(t)}
              >
                {t}
              </button>
            ))}
          </div>
        }
        footer="Expand Odds for lever breakdown · Attempt shows the same ritual after the roll"
      >
        <p className={styles.sub}>Nerve available: {Math.floor(nerve)}</p>
        <div className={styles.grid}>
          {list.map((c) => {
            const view = getCrimeOddsView(c.id);
            const mastLevel = mastery[c.family]?.level ?? 0;
            const title = masteryTitleFor(c.family, mastLevel);
            const expanded = openOdds === c.id;
            return (
              <article
                key={c.id}
                className={[styles.card, view.locked ? styles.cardLocked : ""].filter(Boolean).join(" ")}
              >
                <CrimeArt crimeId={c.id} locked={view.locked} />
                <div className={styles.nameBar}>
                  <span>
                    {c.name}
                    {title ? (
                      <span style={{ color: "var(--text-dim)", marginLeft: 6, fontWeight: 400 }}>{title}</span>
                    ) : null}
                  </span>
                  <span className="tabular">{masteryStars(mastLevel)}</span>
                </div>
                <div className={styles.meta}>
                  <div className={styles.metaRow}>
                    <span>Nerve</span>
                    <strong className="tabular">{c.nerve}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Odds</span>
                    <strong className="tabular">{(view.odds * 100).toFixed(0)}%</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Avg $</span>
                    <strong className="tabular money-pos">{formatMoney((c.cashMin + c.cashMax) / 2)}</strong>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Heat</span>
                    <strong className="tabular">{c.heat}</strong>
                  </div>
                </div>
                <div className={styles.actions}>
                  {view.locked && <RequirementsBox reasons={view.reasons} />}
                  <button
                    type="button"
                    className={styles.oddsToggle}
                    aria-expanded={expanded}
                    onClick={() => setOpenOdds(expanded ? null : c.id)}
                  >
                    {expanded ? "Hide odds" : `Odds ${(view.odds * 100).toFixed(0)}% · EV ${view.ev.toFixed(0)}`}
                  </button>
                  {expanded && (
                    <OddsBreakdown odds={view.odds} ev={view.ev} modifiers={view.modifiers} compact />
                  )}
                  <GameButton
                    disabled={view.locked || nerve < c.nerve}
                    onClick={() => attemptCrime(c.id)}
                    title={`EV ${view.ev.toFixed(0)} · ${(view.odds * 100).toFixed(1)}%`}
                  >
                    Attempt
                  </GameButton>
                </div>
              </article>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
