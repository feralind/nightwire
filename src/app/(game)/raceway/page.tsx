"use client";

import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero } from "@/components/ui/Visuals";
import { formatMoney } from "@/game/formulas";
import { RACES, raceOdds } from "@/game/raceway";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function RacewayPage() {
  const s = useGame();
  const blocked =
    (s.hospitalUntil && Date.now() < s.hospitalUntil) ||
    (s.jailUntil && Date.now() < s.jailUntil) ||
    (s.travelUntil && Date.now() < s.travelUntil);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Raceway"
        subtitle="Ghost fields · three sectors · street heat on illegal loops · clean invites at Spire."
        tone="city"
        image="/art/city/skyline.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Wins {s.raceWins}</span>
          <span className={hub.chip}>SPD {Math.floor(s.spd)}</span>
          <span className={hub.chip}>Garage Lv {s.safehouseRooms?.garage ?? 0}</span>
        </div>
      </PageHero>

      <Module title="Paddock" footer="Entry fee · energy · win ≥2 of 3 sectors (launch / corner / finish)">
        {blocked ? <p className={styles.sub}>Blocked while hospitalized, jailed, or traveling.</p> : null}
        <div className={hub.grid}>
          {RACES.map((race) => {
            const { odds } = raceOdds(s, race);
            const canPay = race.streetOk ? s.street + s.clean >= race.entryFee : s.clean >= race.entryFee;
            const locked = s.level < race.requiresLevel || s.energy < race.energy || !canPay || blocked;
            return (
              <article key={race.id} className={hub.panel}>
                <h2 className={hub.panelTitle}>{race.name}</h2>
                <p className={hub.sub}>{race.blurb}</p>
                <div className={hub.statRow}>
                  <span>Entry</span>
                  <strong className="tabular">
                    {formatMoney(race.entryFee)} {race.streetOk ? "street/clean" : "clean"}
                  </strong>
                </div>
                <div className={hub.statRow}>
                  <span>Energy</span>
                  <strong className="tabular">{race.energy}</strong>
                </div>
                <div className={hub.statRow}>
                  <span>Payout</span>
                  <strong className="tabular">
                    {formatMoney(race.payoutMin)}–{formatMoney(race.payoutMax)}
                  </strong>
                </div>
                <div className={hub.statRow}>
                  <span>Odds</span>
                  <strong className="tabular">{(odds * 100).toFixed(0)}%</strong>
                </div>
                <div className={hub.statRow}>
                  <span>Gate</span>
                  <strong>Lv {race.requiresLevel}{race.heatOnEnter ? ` · heat +${race.heatOnEnter}` : ""}</strong>
                </div>
                <GameButton disabled={!!locked} onClick={() => s.enterRace(race.id)}>
                  Enter
                </GameButton>
              </article>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
