"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getCourse } from "@/content/catalog";
import {
  BUSINESS_STAFF_HIRE_CLEAN,
  BUSINESS_STAFF_MAX,
  BUSINESS_STAFF_WAGE_WEEKLY,
  BUSINESS_TIERS,
  businessBuyReasons,
  businessStaffHireReasons,
  businessWeeklyPnL,
  canBuyBusiness,
  canHireBusinessStaff,
  laundryFeeRate,
  nextBusinessTier,
  ownedFronts,
} from "@/game/power";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero, BUSINESS_FRONT_ART, BUSINESS_HERO } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";
import board from "./business.module.css";

export default function BusinessPage() {
  const s = useGame();
  const [amt, setAmt] = useState(500);
  const fronts = ownedFronts(s.power.businessTierOwned);
  const next = nextBusinessTier(s.power.businessTierOwned);
  const pnl = businessWeeklyPnL(s.power);
  const laundryRate = laundryFeeRate(s.power);
  const cleanFee = Math.round(Math.max(0, amt) * laundryRate);
  const cleanNet = Math.max(0, amt) - cleanFee;
  const bankCageFee = Math.round(Math.max(0, amt) * 0.2);
  const bizOk = canBuyBusiness(s);
  const staffOk = canHireBusinessStaff(s);
  const staffReasons = businessStaffHireReasons(s);
  const buyReasons = businessBuyReasons(s);
  const presets = useMemo(() => [100, 500, 1000, 5000], []);
  const eligibleFirst = s.power.businessTierOwned > 0 || buyReasons.length === 0;

  return (
    <div>
      <PageHero
        title="Business"
        subtitle="Fronts print clean. Laundry beats the bank cage. Aggressive books pay more — and invite audits."
        tone="city"
        image={BUSINESS_HERO}
        tall
      />

      {s.power.businessTierOwned <= 0 ? (
        <Module title="No front on the books">
          {!eligibleFirst ? <RequirementsBox reasons={buyReasons} /> : null}
          <p className={styles.sub} style={{ marginTop: eligibleFirst ? 0 : 8 }}>
            Commerce capital unlocks the empire ladder on{" "}
            <Link href="/power">Power Tracks</Link>. First desk is the Corner Laundromat — street→clean
            laundry and a thin weekly P&amp;L.
          </p>
          {eligibleFirst && next ? (
            <div style={{ marginTop: 8 }}>
              <GameButton disabled={!bizOk} onClick={() => s.buyBusinessTier()}>
                Buy {next.name} ({formatMoney(next.costClean)} clean)
              </GameButton>
            </div>
          ) : null}
        </Module>
      ) : null}

      {s.power.businessTierOwned > 0 ? (
        <Module
          title="P&L — this week"
          footer={`${pnl.riskLabel} books · staff ${pnl.staff}/${BUSINESS_STAFF_MAX} · laundry ${Math.round(pnl.laundryFee * 100)}%`}
        >
          <div className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.sub}>Flagship</div>
              <div style={{ fontSize: 18 }}>{pnl.front?.name ?? "—"}</div>
              <p className={styles.sub} style={{ marginTop: 6 }}>
                {pnl.front?.special}
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.sub}>Weekly books</div>
              <div>
                Revenue <span className="tabular money-pos">{formatMoney(pnl.revenue)}</span>
              </div>
              <div>
                Upkeep <span className="tabular money-neg">{formatMoney(pnl.upkeep)}</span>
                {pnl.staffWages > 0 ? (
                  <>
                    {" "}
                    · Wages <span className="tabular money-neg">{formatMoney(pnl.staffWages)}</span>
                  </>
                ) : null}
              </div>
              <div style={{ marginTop: 4 }}>
                Net{" "}
                <span className={`tabular ${pnl.net >= 0 ? "money-pos" : "money-neg"}`}>
                  {formatMoney(pnl.net)}
                </span>
              </div>
            </div>
          </div>
        </Module>
      ) : null}

      <Module
        title="Owned fronts"
        footer="Empire is one ladder — each buy upgrades the flagship; prior desks stay on the chain."
      >
        {fronts.length === 0 ? (
          <p className={styles.sub}>Nothing held yet.</p>
        ) : (
          <div className={board.grid}>
            {fronts.map((f) => {
              const isFlagship = f.tier === s.power.businessTierOwned;
              return (
                <article
                  key={f.id}
                  className={[board.card, isFlagship ? board.flagship : ""].filter(Boolean).join(" ")}
                >
                  <div
                    className={board.art}
                    style={{
                      backgroundImage: `linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.78)), url(${BUSINESS_FRONT_ART[f.id] ?? BUSINESS_HERO})`,
                    }}
                  />
                  <div className={board.body}>
                    <div className={board.head}>
                      <strong>{f.name}</strong>
                      <span className="tabular">T{f.tier}</span>
                    </div>
                    <p className={board.blurb}>{f.blurb}</p>
                    <div className={board.meta}>
                      <span>
                        Base <strong className="tabular">{formatMoney(f.weeklyCleanIncome)}</strong>/wk
                      </span>
                      <span>
                        Upkeep <strong className="tabular">{formatMoney(f.weeklyUpkeep)}</strong>
                      </span>
                      <span>
                        Laundry <strong className="tabular">{Math.round(f.laundryFee * 100)}%</strong>
                      </span>
                      <span>{isFlagship ? "Flagship" : "Chain"}</span>
                    </div>
                    <p className={styles.sub} style={{ margin: 0 }}>
                      {f.special}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Module>

      {next ? (
        <Module title="Expand empire" footer="Same ladder as Power Tracks — one empire, not a parallel buy list.">
          {!bizOk && <RequirementsBox reasons={buyReasons} />}
          <p className={styles.sub}>
            Next: <strong>{next.name}</strong> · {formatMoney(next.costClean)} clean · Lv
            {next.requiresLevel}+ · Legit ≥{next.requiresLegitimacy}
            {next.requiresCourse
              ? ` · ${getCourse(next.requiresCourse)?.name ?? next.requiresCourse}`
              : ""}
          </p>
          <GameButton disabled={!bizOk} onClick={() => s.buyBusinessTier()}>
            Buy {next.name}
          </GameButton>
        </Module>
      ) : s.power.businessTierOwned > 0 ? (
        <Module title="Empire maxed">
          <p className={styles.sub}>Holding Company is the top of the ladder.</p>
        </Module>
      ) : null}

      {s.power.businessTierOwned > 0 ? (
        <Module
          title="Ops — risk & staff"
          footer="Aggressive +22% revenue and −2pp laundry; audits can fine you while away. Staff +12% revenue each, −1pp laundry, wage due weekly."
        >
          <div className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.sub}>Accounting risk</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                <GameButton
                  variant={s.power.businessRisk === 0 ? "primary" : "secondary"}
                  onClick={() => s.setBusinessRisk(0)}
                >
                  Conservative
                </GameButton>
                <GameButton
                  variant={s.power.businessRisk === 1 ? "primary" : "secondary"}
                  onClick={() => s.setBusinessRisk(1)}
                >
                  Aggressive
                </GameButton>
              </div>
              <p className={styles.sub} style={{ marginTop: 8 }}>
                Now: {pnl.riskLabel}
              </p>
            </div>
            <div className={styles.card}>
              <div className={styles.sub}>
                Staff desk {s.power.businessStaff}/{BUSINESS_STAFF_MAX}
              </div>
              <p className={styles.sub}>
                Hire {formatMoney(BUSINESS_STAFF_HIRE_CLEAN)} clean · wage{" "}
                {formatMoney(BUSINESS_STAFF_WAGE_WEEKLY)}/wk each
              </p>
              {!staffOk && staffReasons.length > 0 ? <RequirementsBox reasons={staffReasons} /> : null}
              <GameButton disabled={!staffOk} onClick={() => s.hireBusinessStaff()}>
                Hire clerk
              </GameButton>
            </div>
          </div>
        </Module>
      ) : null}

      <Module
        title="Laundry desk"
        footer={
          s.power.businessTierOwned > 0
            ? `Empire fee ${Math.round(laundryRate * 100)}% · bank cage stays 20% without a front`
            : "No front — cleaning uses the bank cage at 20%. Buy a laundromat to cut the skim."
        }
      >
        <p className={styles.sub}>
          Street on hand <span className="tabular">{formatMoney(s.street)}</span>
          {amt > 0 ? (
            <>
              {" "}
              · This wash −{formatMoney(cleanFee)} fee →{" "}
              <span className="money-pos">{formatMoney(cleanNet)} clean</span>
              {s.power.businessTierOwned > 0 && cleanFee < bankCageFee ? (
                <> (saves {formatMoney(bankCageFee - cleanFee)} vs bank cage)</>
              ) : null}
            </>
          ) : null}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {presets.map((p) => (
            <GameButton key={p} variant="secondary" onClick={() => setAmt(p)}>
              {formatMoney(p)}
            </GameButton>
          ))}
          <GameButton variant="secondary" onClick={() => setAmt(s.street)} disabled={s.street <= 0}>
            All street
          </GameButton>
        </div>
        <label className={styles.sub} style={{ display: "block", marginBottom: 4 }}>
          Amount
        </label>
        <input
          className={styles.field}
          type="number"
          min={0}
          value={amt}
          onChange={(e) => setAmt(Number(e.target.value))}
        />
        <GameButton disabled={amt <= 0 || s.street < amt} onClick={() => s.cleanMoney(amt)}>
          Wash street→clean (−{formatMoney(cleanFee)} / {Math.round(laundryRate * 100)}%)
        </GameButton>
        <p className={styles.sub} style={{ marginTop: 8 }}>
          Dedicated wash desk: <Link href="/cleaning">Cleaning</Link>
          {" · "}
          Also at the <Link href="/bank">Bank</Link> cage — same empire fee once you own a front.
        </p>
      </Module>

      {s.power.businessTierOwned <= 0 ? (
        <Module title="Ladder preview">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Front</th>
                <th>Cost</th>
                <th>Income</th>
                <th>Upkeep</th>
                <th>Laundry</th>
              </tr>
            </thead>
            <tbody>
              {BUSINESS_TIERS.map((t) => (
                <tr key={t.id}>
                  <td>
                    {t.name}
                    <div style={{ color: "var(--text-dim)", fontSize: 11 }}>{t.special}</div>
                  </td>
                  <td className="tabular">{formatMoney(t.costClean)}</td>
                  <td className="tabular">{formatMoney(t.weeklyCleanIncome)}</td>
                  <td className="tabular">{formatMoney(t.weeklyUpkeep)}</td>
                  <td className="tabular">{Math.round(t.laundryFee * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Module>
      ) : null}
    </div>
  );
}
