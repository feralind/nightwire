"use client";

import Link from "next/link";
import { RANK_TITLES } from "@/content/catalog";
import { formatMmSs, formatMoney } from "@/game/formulas";
import { masteryStars, masteryTitleFor } from "@/game/mastery";
import { politicalCounterplayDiscount } from "@/game/power";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";

export default function ProfilePage() {
  const s = useGame();
  const masteryEntries = Object.entries(s.mastery).sort((a, b) => b[1].level - a[1].level);
  const now = Date.now();
  const layingLow = Boolean(s.laylowUntil && now < s.laylowUntil);
  const lawyerCost = Math.round(2000 * (1 - politicalCounterplayDiscount(s.power.politicalRung)));

  return (
    <div>
      <PageHero
        title="Profile"
        subtitle="Identity, networth, counterplay."
        tone="city"
        image="/art/profile/hero.webp"
        tall
      />
      <Module>
        <div className={styles.grid2}>
          <div className={styles.card}>
            <div style={{ color: "var(--text-dim)", fontSize: 10, letterSpacing: "0.06em" }}>ID CARD</div>
            <strong>{s.name}</strong> [{s.playerId}]
            <div>{RANK_TITLES[s.rankIndex]}</div>
            <div style={{ color: "var(--text-dim)" }}>{s.identitySubtitle}</div>
            <div>District: {s.district}</div>
            <div>Courses completed: {s.completedCourses.length}</div>
          </div>
          <div className={styles.card}>
            <div>Networth {formatMoney(s.clean + s.street + s.bank)}</div>
            <div>
              STR {s.str.toFixed(1)} · DEF {s.def.toFixed(1)} · SPD {s.spd.toFixed(1)} · DEX {s.dex.toFixed(1)}
            </div>
            <div>
              Heat {s.heat.toFixed(0)} · Stress {s.stress.toFixed(0)} · Happy {s.happy.toFixed(0)} · Inv{" "}
              {s.investigation}
            </div>
            {layingLow && (
              <div style={{ color: "var(--text-warn)", marginTop: 6 }}>
                Laying low — {formatMmSs(((s.laylowUntil as number) - now) / 1000)} left
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <div style={{ color: "var(--text-dim)", fontSize: 10, textTransform: "uppercase" }}>Mastery</div>
              {masteryEntries.length ? (
                <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                  {masteryEntries.map(([k, v]) => {
                    const title = masteryTitleFor(k, v.level);
                    return (
                      <li key={k}>
                        {k} {masteryStars(v.level)}
                        {title ? ` · ${title}` : ""}
                        {v.level >= 5 ? " (+3% odds)" : ""}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{ color: "var(--text-dim)" }}>None yet — commit crimes to build it.</div>
              )}
            </div>
          </div>
        </div>
        <h3>Investigation counterplay</h3>
        <p style={{ color: "var(--text-dim)", fontSize: 12 }}>
          Stage {s.investigation}/4. Leave district: arrive elsewhere to shed one stage. Lay low: 4h timer, then −1.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <GameButton disabled={s.investigation <= 0} onClick={() => s.investigationCounterplay("lawyer")}>
            Lawyer ({formatMoney(lawyerCost)})
          </GameButton>
          <GameButton disabled={s.investigation <= 0} onClick={() => s.investigationCounterplay("burn")}>
            Burn evidence
          </GameButton>
          <GameButton disabled={s.investigation <= 0 || layingLow} onClick={() => s.investigationCounterplay("laylow")}>
            Lay low (4h)
          </GameButton>
          <GameButton variant="danger" disabled={s.investigation <= 0} onClick={() => s.investigationCounterplay("bribe")}>
            Risky bribe
          </GameButton>
          <Link href="/travel">
            <GameButton disabled={s.investigation <= 0} variant="secondary" onClick={() => s.investigationCounterplay("leave")}>
              Leave district → Travel
            </GameButton>
          </Link>
        </div>
      </Module>
    </div>
  );
}
