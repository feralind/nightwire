"use client";

import { useMemo, useState } from "react";
import { bankInterestRate, transcriptPerkSum } from "@/game/careers";
import { formatMoney } from "@/game/formulas";
import { laundryFeeRate, ownedBusiness } from "@/game/power";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";

export default function BankPage() {
  const s = useGame();
  const [amt, setAmt] = useState(100);
  const rate = bankInterestRate(s.completedCourses);
  const transcript = transcriptPerkSum(s.completedCourses);
  const ratePct = (rate * 100).toFixed(1);
  const streetFee = Math.round(Math.max(0, amt) * 0.15);
  const streetNet = Math.max(0, amt) - streetFee;
  const laundryRate = laundryFeeRate(s.power.businessTierOwned);
  const cleanFee = Math.round(Math.max(0, amt) * laundryRate);
  const front = ownedBusiness(s.power.businessTierOwned);

  const presets = useMemo(() => [100, 500, 1000, 5000], []);

  return (
    <div>
      <PageHero
        title="Nightwire Trust"
        subtitle="Clean deposits earn weekly interest. Street deposits convert at 15%. Unbanked street still burns when heat is high."
        tone="city"
        image="/art/bank/hero.webp"
        tall
      />

      <Module
        title="Account"
        footer={`~${ratePct}% / week on balance · Commerce courses raise the rate`}
      >
        <div className={styles.grid2}>
          <div className={styles.card}>
            <div className={styles.sub}>Bank balance</div>
            <div className="tabular" style={{ fontSize: 22 }}>
              {formatMoney(s.bank)}
            </div>
            <p className={styles.sub} style={{ marginTop: 6 }}>
              Rate {ratePct}%/wk
              {transcript.bankInterestBonus
                ? ` (+${transcript.bankInterestBonus}% from transcript)`
                : " (base 2%)"}
            </p>
            {s.lifetime.interestEarned > 0 && (
              <p className={styles.sub}>Lifetime interest {formatMoney(s.lifetime.interestEarned)}</p>
            )}
          </div>
          <div className={styles.card}>
            <div className={styles.sub}>On hand</div>
            <div>
              Clean <span className="tabular money-pos">{formatMoney(s.clean)}</span>
            </div>
            <div>
              Street <span className="tabular">{formatMoney(s.street)}</span>
            </div>
            <p className={styles.sub} style={{ marginTop: 6 }}>
              Street→bank fee 15% · Street→clean laundry {Math.round(laundryRate * 100)}%
              {front ? ` (${front.name})` : ""}
            </p>
          </div>
        </div>
      </Module>

      <Module title="Transfer">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {presets.map((p) => (
            <GameButton key={p} variant="secondary" onClick={() => setAmt(p)}>
              {formatMoney(p)}
            </GameButton>
          ))}
          <GameButton variant="secondary" onClick={() => setAmt(s.clean)} disabled={s.clean <= 0}>
            All clean
          </GameButton>
          <GameButton variant="secondary" onClick={() => setAmt(s.street)} disabled={s.street <= 0}>
            All street
          </GameButton>
          <GameButton variant="secondary" onClick={() => setAmt(s.bank)} disabled={s.bank <= 0}>
            All bank
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          <GameButton disabled={amt <= 0 || s.clean < amt} onClick={() => s.bankDeposit(amt, "clean")}>
            Deposit clean
          </GameButton>
          <GameButton disabled={amt <= 0 || s.street < amt} onClick={() => s.bankDeposit(amt, "street")}>
            Deposit street → bank (−{formatMoney(streetFee)} fee → {formatMoney(streetNet)})
          </GameButton>
          <GameButton disabled={amt <= 0 || s.bank < amt} onClick={() => s.bankWithdraw(amt)}>
            Withdraw to clean
          </GameButton>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <GameButton variant="secondary" disabled={amt <= 0 || s.street < amt} onClick={() => s.cleanMoney(amt)}>
            Laundry street→clean (−{formatMoney(cleanFee)} / {Math.round(laundryRate * 100)}%)
          </GameButton>
        </div>
      </Module>
    </div>
  );
}
