"use client";

import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { FACTION_ART, FACTION_HERO, PageHero } from "@/components/ui/Visuals";
import { formatMoney } from "@/game/formulas";
import {
  FACTIONS,
  FACTION_WAR_ACTIONS,
  assistPay,
  chainMeterLabel,
  currentWar,
  endgameTitle,
  warWeekBonus,
} from "@/game/faction";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function FactionPage() {
  const s = useGame();
  const war = currentWar();
  const title = endgameTitle(s.factionRep);
  const week = war?.week ?? Math.floor(Date.now() / (7 * 86_400_000));
  const assists = s.factionWarWeek === week ? s.factionAssistsWar : 0;
  const blocked =
    (s.hospitalUntil && Date.now() < s.hospitalUntil) ||
    (s.jailUntil && Date.now() < s.jailUntil) ||
    (s.travelUntil && Date.now() < s.travelUntil);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Faction"
        subtitle="Four NPC tables. Assist for clean pay and rep. War weeks raise the chain."
        tone="city"
        image={FACTION_HERO}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>{war ? "War week" : "Peacetime"}</span>
          <span className={hub.chip}>{chainMeterLabel(assists)}</span>
          {title ? <span className={hub.chip}>{title}</span> : null}
        </div>
      </PageHero>

      <Module
        title="War ticker"
        footer="Territory shade is flavor on Map · assists during war raise chain + respect"
      >
        {war ? (
          <p className={styles.sub}>
            Hot conflict:{" "}
            <strong>{FACTIONS.find((f) => f.id === war.a)?.name}</strong> vs{" "}
            <strong>{FACTIONS.find((f) => f.id === war.b)?.name}</strong>. Assists this war: {assists}.
          </p>
        ) : (
          <p className={styles.sub}>No war this week. Favors still move the needle — quieter payouts.</p>
        )}
      </Module>

      <Module title="Tables" footer="5 energy · clean pay scales with rep · war sides pay more">
        {blocked ? <p className={styles.sub}>Blocked while hospitalized, jailed, or traveling.</p> : null}
        <div className={hub.grid2}>
          {FACTIONS.map((f) => {
            const rep = s.factionRep[f.id] ?? 0;
            const inWar = Boolean(war && (war.a === f.id || war.b === f.id));
            const pay = Math.round(assistPay(rep) * (inWar ? warWeekBonus(rep) * 1.25 : 1));
            return (
              <article key={f.id} className={hub.panel}>
                <div style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "stretch" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={FACTION_ART[f.id] ?? FACTION_HERO}
                    alt=""
                    style={{
                      flex: "0 0 140px",
                      width: 140,
                      height: 160,
                      objectFit: "cover",
                      objectPosition: "center top",
                      borderRadius: 4,
                      background: "#151518",
                    }}
                  />
                  <div>
                    <h2 className={hub.panelTitle} style={{ margin: 0 }}>
                      {f.name}
                      {inWar ? " · WAR" : ""}
                    </h2>
                    <p className={hub.sub} style={{ margin: "4px 0 0" }}>
                      {f.blurb}
                    </p>
                  </div>
                </div>
                <div className={hub.statRow}>
                  <span>Lean</span>
                  <strong>{f.lean}</strong>
                </div>
                <div className={hub.statRow}>
                  <span>Rep</span>
                  <strong className="tabular">{rep}</strong>
                </div>
                <div className={hub.statRow}>
                  <span>Assist pay</span>
                  <strong className="tabular">{formatMoney(pay)}</strong>
                </div>
                <div className={hub.statRow}>
                  <span>Districts</span>
                  <strong>{f.districts.join(", ")}</strong>
                </div>
                <GameButton disabled={!!blocked || s.energy < 5} onClick={() => s.assistFaction(f.id)}>
                  Assist (5 energy)
                </GameButton>
                {inWar ? (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    {FACTION_WAR_ACTIONS.map((a) => {
                      const needClean = a.costClean ?? 0;
                      const needStreet = a.costStreet ?? 0;
                      const locked =
                        blocked ||
                        s.energy < a.energy ||
                        s.clean < needClean ||
                        s.street < needStreet;
                      return (
                        <GameButton
                          key={a.id}
                          variant="secondary"
                          disabled={!!locked}
                          onClick={() => s.factionWarAction(f.id, a.id)}
                        >
                          {a.name} ({a.energy}e
                          {needClean ? ` · ${formatMoney(needClean)}c` : ""}
                          {needStreet ? ` · ${formatMoney(needStreet)}s` : ""}
                          {a.heat ? ` · heat+${a.heat}` : ""})
                        </GameButton>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
