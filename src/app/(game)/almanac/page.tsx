"use client";

import Link from "next/link";
import { useState } from "react";
import { emergenceRuleCount } from "@/game/emergence";
import {
  heatBand,
  heatCritFailBonus,
  happyStudyFactor,
  stressOddsPenalty,
  xpToLevel,
} from "@/game/formulas";
import { STREET_SHOP_VISIT_CAP } from "@/game/shops";
import { Module } from "@/components/ui/Module";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function AlmanacPage() {
  const s = useGame();
  const [advanced, setAdvanced] = useState(false);
  const rules = emergenceRuleCount();

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Nightwire Field Guide"
        subtitle="Diegetic almanac — how the city scores odds, heat, laundry, and away pressure."
        tone="city"
        image="/art/codex/hero.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Lv {s.level}</span>
          <span className={hub.chip}>Heat {heatBand(s.heat)}</span>
          <span className={hub.chip}>{rules} emergence rules</span>
        </div>
      </PageHero>

      <p className={hub.sub}>
        Deep lore: <Link href="/codex">Codex</Link>
        {" · "}
        Synergies: <Link href="/combos">Combos</Link>
        {" · "}
        Rival: <Link href="/rival">Vex</Link>
      </p>

      <Module
        title="Reading mode"
        footer="Simple keeps the street talk; advanced shows the math the tick uses"
      >
        <div className={styles.tabs}>
          <button
            type="button"
            className={!advanced ? styles.tabActive : styles.tab}
            onClick={() => setAdvanced(false)}
          >
            Simple
          </button>
          <button
            type="button"
            className={advanced ? styles.tabActive : styles.tab}
            onClick={() => setAdvanced(true)}
          >
            Advanced
          </button>
        </div>
      </Module>

      <Module title="Crime odds" footer="Sigmoid clamp keeps attempts between 5% and 85%">
        {!advanced ? (
          <p className={hub.sub}>
            Dex and speed carry most of the weight. Tools, courses, district bias, hour, and chain help.
            Heat and stress push you down. Soft caps stop gym from solving everything.
          </p>
        ) : (
          <ul className={hub.sub} style={{ margin: 0, paddingLeft: 16 }}>
            <li>
              skill = 0.35·DEX + 0.25·SPD + 0.15·STR + 0.1·DEF + 0.2·level + tools + edu + district +
              hour + chain − heat − stress
            </li>
            <li>odds = clamp(sigmoid(skill / difficulty, k=1.2), 0.05, 0.85)</li>
            <li>
              Your heat band <strong>{heatBand(s.heat)}</strong> → crit-fail bonus{" "}
              {(heatCritFailBonus(s.heat) * 100).toFixed(0)}%
            </li>
            <li>Stress odds penalty now: {stressOddsPenalty(s.stress)}</li>
          </ul>
        )}
      </Module>

      <Module title="Resources & XP" footer="Bars regen on the tick; XP curve steepens">
        {!advanced ? (
          <p className={hub.sub}>
            Energy and nerve refill about every five minutes (difficulty scales). Happy softens study
            and crime feel. Next level needs more XP than the last.
          </p>
        ) : (
          <ul className={hub.sub} style={{ margin: 0, paddingLeft: 16 }}>
            <li>
              XP to next level ≈ floor(100 · level^1.45) — at Lv {s.level}: {xpToLevel(s.level)}
            </li>
            <li>Study speed × happyStudyFactor({Math.floor(s.happy)}) = {happyStudyFactor(s.happy).toFixed(2)}</li>
            <li>Bank interest and laundry fees live on Bank / Cleaning / Business.</li>
          </ul>
        )}
      </Module>

      <Module title="Money identity" footer="Street spends loud; clean opens elite doors">
        <ul className={hub.sub} style={{ margin: 0, paddingLeft: 16 }}>
          <li>Street cash from crime; clean from jobs, gigs, laundry, bank withdraw.</li>
          <li>
            Shop street visit cap ${STREET_SHOP_VISIT_CAP} per district visit — elite counters refuse
            street entirely.
          </li>
          <li>
            Laundry fee drops with empire fronts (see <Link href="/cleaning">Cleaning</Link>); bank
            cage stays 20% without a front.
          </li>
        </ul>
      </Module>

      <Module title="City writeback" footer={`${rules} data-driven emergence rules in tick + director`}>
        {!advanced ? (
          <p className={hub.sub}>
            Leave the city alone and it still moves — raids, seizures, rival chalk, fog, audits. The
            director ticker can spawn short city events that reprice bazaar and stocks.
          </p>
        ) : (
          <ul className={hub.sub} style={{ margin: 0, paddingLeft: 16 }}>
            <li>Away / pressure rules roll once per catch-up when hours and floors match.</li>
            <li>Director pick is weighted from seed + 10-minute bucket (~2% spawn chance).</li>
            <li>
              Full list lives in content — {rules} rules wired through applyEmergenceAway /
              pickDirectorEvent.
            </li>
          </ul>
        )}
      </Module>
    </div>
  );
}
