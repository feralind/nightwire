"use client";

import { DISTRICTS, getCourse, getDistrict } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import {
  BUSINESS_TIERS,
  POLITICAL_RUNGS,
  RESPECT_FLEX,
  averageTerritory,
  businessBuyReasons,
  canBuyBusiness,
  canBuyPolitical,
  laundryFeeRate,
  nextBusinessTier,
  nextPoliticalRung,
  ownedBusiness,
  ownedPolitical,
  politicalBailMult,
  politicalBuyReasons,
  powerMeters,
  respectFlexPay,
  respectLootMult,
  respectStreetOddsBonus,
  respectTitle,
  territoryInvestCost,
  territoryOddsBonus,
} from "@/game/power";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function PowerPage() {
  const s = useGame();
  const meters = powerMeters(s);
  const nextPol = nextPoliticalRung(s.power.politicalRung);
  const ownedPol = ownedPolitical(s.power.politicalRung);
  const nextBiz = nextBusinessTier(s.power.businessTierOwned);
  const ownedBiz = ownedBusiness(s.power.businessTierOwned);
  const polOk = canBuyPolitical(s);
  const bizOk = canBuyBusiness(s);
  const laundryPct = Math.round(laundryFeeRate(s.power.businessTierOwned) * 100);
  const streetOdds = Math.round(respectStreetOddsBonus(s.power.respect) * 1000) / 10;
  const lootMult = respectLootMult(s.power.respect);
  const bailMult = politicalBailMult(s.power.politicalRung);
  const cred = respectTitle(s.power.respect);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Power Tracks"
        subtitle="Money becomes power. Pure criminal can't max Political; pure legal can't max Respect."
        tone="city"
        image="/art/city/skyline.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Territory avg {Math.floor(meters.territoryAvg)}%</span>
          <span className={hub.chip}>
            Political {s.power.politicalRung}/{POLITICAL_RUNGS.length}
          </span>
          <span className={hub.chip}>Respect {s.power.respect}</span>
          <span className={hub.chip}>
            Empire {s.power.businessTierOwned}/{BUSINESS_TIERS.length}
          </span>
        </div>
        <p className={hub.sub} style={{ marginTop: 8 }}>
          {meters.hybridHint}
        </p>
      </PageHero>

      <CollapsiblePanel
        title="Territory Influence"
        footer="Home-field crime odds · +5% blocks · scales cost · feeds business revenue"
        defaultOpen
      >
        <p className={styles.sub}>
          Average influence {Math.floor(averageTerritory(s.power))}%. Current district home-field{" "}
          <span className="tabular">
            +{(territoryOddsBonus(s.power.territory[s.district] ?? 0) * 100).toFixed(1)}%
          </span>{" "}
          odds.
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>District</th>
              <th>Influence</th>
              <th>Home-field</th>
              <th>Next +5%</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {DISTRICTS.map((d) => {
              const pct = s.power.territory[d.id] ?? 0;
              const cost = territoryInvestCost(pct);
              const can = pct < 100 && s.clean + s.street >= cost;
              return (
                <tr key={d.id}>
                  <td>
                    {d.name}
                    {d.id === s.district ? (
                      <span style={{ color: "var(--text-dim)", marginLeft: 6 }}>here</span>
                    ) : null}
                  </td>
                  <td className="tabular">{pct}%</td>
                  <td className="tabular">+{(territoryOddsBonus(pct) * 100).toFixed(1)}%</td>
                  <td className="tabular">{pct >= 100 ? "—" : formatMoney(cost)}</td>
                  <td>
                    <GameButton
                      variant="secondary"
                      disabled={!can}
                      onClick={() => s.investTerritory(d.id)}
                    >
                      Invest
                    </GameButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Political Capital"
        footer="Clean cash only · legitimacy gates · bail / lawyer / heat relief"
        defaultOpen
      >
        <p className={styles.sub}>
          Held: {ownedPol?.title ?? "None"}. Bail ×{bailMult.toFixed(2)}
          {ownedPol ? ` · lawyer −${Math.round((ownedPol.counterplayDiscount ?? 0) * 100)}%` : ""}.
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Rung</th>
              <th>Cost</th>
              <th>Legitimacy</th>
              <th>Effect</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {POLITICAL_RUNGS.map((rung, i) => {
              const held = s.power.politicalRung > i;
              const isNext = nextPol?.id === rung.id;
              return (
                <tr key={rung.id} style={held ? { color: "var(--text-dim)" } : undefined}>
                  <td>
                    {rung.title}
                    {held ? " ✓" : ""}
                  </td>
                  <td className="tabular">{formatMoney(rung.costClean)}</td>
                  <td className="tabular">≥{rung.requiresLegitimacy}</td>
                  <td style={{ textAlign: "left" }}>{rung.blurb}</td>
                  <td>
                    {isNext ? (
                      <>
                        {!polOk && <RequirementsBox reasons={politicalBuyReasons(s)} />}
                        <GameButton disabled={!polOk} onClick={() => s.buyPoliticalRung()}>
                          Buy
                        </GameButton>
                      </>
                    ) : held ? (
                      "Held"
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className={styles.sub}>Your legitimacy {Math.floor(s.legitimacy)} · clean {formatMoney(s.clean)}</p>
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Street Respect"
        footer="Street cash buys 2× respect · soft street-crime odds + attack loot"
        defaultOpen
      >
        <p className={styles.sub}>
          Respect {s.power.respect}
          {cred ? ` · ${cred}` : ""} · street odds +{streetOdds}% · loot ×{lootMult.toFixed(2)}
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Flex</th>
              <th>Respect</th>
              <th>Street price</th>
              <th>Clean price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {RESPECT_FLEX.map((flex) => {
              const streetPay = respectFlexPay(flex, true);
              const cleanPay = respectFlexPay(flex, false);
              return (
                <tr key={flex.id}>
                  <td>
                    {flex.name}
                    <div style={{ color: "var(--text-dim)", fontSize: 11 }}>{flex.blurb}</div>
                  </td>
                  <td className="tabular">+{flex.respect}</td>
                  <td className="tabular">{formatMoney(streetPay)}</td>
                  <td className="tabular">{formatMoney(cleanPay)}</td>
                  <td>
                    <GameButton
                      disabled={s.street < streetPay}
                      onClick={() => s.buyRespectFlex(flex.id, true)}
                    >
                      Street
                    </GameButton>{" "}
                    <GameButton
                      variant="secondary"
                      disabled={s.clean < cleanPay}
                      onClick={() => s.buyRespectFlex(flex.id, false)}
                    >
                      Clean
                    </GameButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Business Empire"
        footer="Passive clean income · cheaper laundry · territory multiplies revenue"
        defaultOpen
      >
        <p className={styles.sub}>
          Front: {ownedBiz?.name ?? "None"} · laundry fee {laundryPct}%
          {ownedBiz
            ? ` · ~${formatMoney(ownedBiz.weeklyCleanIncome)}/wk base (+territory)`
            : " · bank laundry stays 20% until you own a front"}
        </p>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Front</th>
              <th>Cost</th>
              <th>Income/wk</th>
              <th>Laundry</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {BUSINESS_TIERS.map((tier) => {
              const held = s.power.businessTierOwned >= tier.tier;
              const isNext = nextBiz?.id === tier.id;
              const course = tier.requiresCourse ? getCourse(tier.requiresCourse) : null;
              return (
                <tr key={tier.id} style={held ? { color: "var(--text-dim)" } : undefined}>
                  <td>
                    {tier.name}
                    {held ? " ✓" : ""}
                    <div style={{ color: "var(--text-dim)", fontSize: 11 }}>
                      Lv{tier.requiresLevel}+ · Legit ≥{tier.requiresLegitimacy}
                      {course ? ` · ${course.name}` : ""}
                    </div>
                  </td>
                  <td className="tabular">{formatMoney(tier.costClean)}</td>
                  <td className="tabular">{formatMoney(tier.weeklyCleanIncome)}</td>
                  <td className="tabular">{Math.round(tier.laundryFee * 100)}%</td>
                  <td>
                    {isNext ? (
                      <>
                        {!bizOk && <RequirementsBox reasons={businessBuyReasons(s)} />}
                        <GameButton disabled={!bizOk} onClick={() => s.buyBusinessTier()}>
                          Buy
                        </GameButton>
                      </>
                    ) : held ? (
                      "Owned"
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className={styles.sub}>
          You are in {getDistrict(s.district)?.name ?? s.district}. Travel to deepen influence where you
          play.
        </p>
      </CollapsiblePanel>
    </div>
  );
}
