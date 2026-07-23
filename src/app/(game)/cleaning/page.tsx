"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BUSINESS_TIERS,
  laundryFeeRate,
  nextBusinessTier,
  ownedBusiness,
  ownedFronts,
} from "@/game/power";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, BUSINESS_HERO } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function CleaningPage() {
  const s = useGame();
  const [amt, setAmt] = useState(500);
  const laundryRate = laundryFeeRate(s.power);
  const cleanFee = Math.round(Math.max(0, amt) * laundryRate);
  const cleanNet = Math.max(0, amt) - cleanFee;
  const bankCageFee = Math.round(Math.max(0, amt) * 0.2);
  const front = ownedBusiness(s.power.businessTierOwned);
  const fronts = ownedFronts(s.power.businessTierOwned);
  const next = nextBusinessTier(s.power.businessTierOwned);
  const presets = useMemo(() => [100, 500, 1000, 5000], []);
  const empirePct = Math.round(laundryRate * 100);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Cleaning"
        subtitle="Street cash becomes clean through a front — or the bank cage at a worse skim."
        tone="city"
        image={BUSINESS_HERO}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Street {formatMoney(s.street)}</span>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
          <span className={hub.chip}>Fee {empirePct}%</span>
          <span className={hub.chip}>{front ? front.name : "Bank cage"}</span>
        </div>
      </PageHero>

      <p className={hub.sub}>
        Empire desk: <Link href="/business">Business</Link>
        {" · "}
        Cage also at <Link href="/bank">Bank</Link>
        {" · "}
        Combos tip: <Link href="/combos">Bookkeeping + laundry</Link>
      </p>

      <Module
        title="Wash desk"
        footer={
          front
            ? `Empire fee ${empirePct}% · saves vs 20% bank cage when you have a front`
            : "No front — bank cage at 20%. Buy a Corner Laundromat on Business / Power."
        }
      >
        <p className={hub.sub}>
          This wash −{formatMoney(cleanFee)} →{" "}
          <span className="money-pos">{formatMoney(cleanNet)} clean</span>
          {front && cleanFee < bankCageFee ? (
            <> (saves {formatMoney(bankCageFee - cleanFee)} vs cage)</>
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
        <div style={{ marginTop: 8 }}>
          <GameButton disabled={amt <= 0 || s.street < amt} onClick={() => s.cleanMoney(amt)}>
            Wash street→clean (−{formatMoney(cleanFee)} / {empirePct}%)
          </GameButton>
        </div>
      </Module>

      <Module title="Why fee changes" footer="Staff + aggressive books nudge the skim (see Business P&L)">
        <div className={hub.statRow}>
          <span>Current path</span>
          <strong>{front ? `${front.name} laundry` : "Bank cage"}</strong>
        </div>
        <div className={hub.statRow}>
          <span>Fronts owned</span>
          <strong>{fronts.length ? fronts.map((f) => f.name).join(", ") : "None"}</strong>
        </div>
        <div className={hub.statRow}>
          <span>Next rung</span>
          <strong>
            {next ? `${next.name} (${formatMoney(next.costClean)})` : "Empire maxed"}
          </strong>
        </div>
        <table className={styles.table} style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Front</th>
              <th>Base laundry</th>
            </tr>
          </thead>
          <tbody>
            {BUSINESS_TIERS.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td className="tabular">{Math.round(t.laundryFee * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Module>
    </div>
  );
}
