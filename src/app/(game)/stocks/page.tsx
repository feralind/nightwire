"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DISTRICTS } from "@/content/catalog";
import { STOCKS } from "@/content/stocks";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero } from "@/components/ui/Visuals";
import { formatMoney } from "@/game/formulas";
import {
  emptyStocks,
  portfolioValue,
  positionOf,
  priceOf,
  stocksBuyReasons,
  stocksCourseEdge,
  stocksSellReasons,
} from "@/game/stocks";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function StocksPage() {
  const s = useGame();
  const stocks = s.stocks ?? emptyStocks();
  const [qty, setQty] = useState(1);
  const edge = stocksCourseEdge(s.completedCourses);
  const edgePct = Math.round(edge * 1000) / 10;
  const value = portfolioValue(stocks);

  const rows = useMemo(() => {
    return STOCKS.map((def) => {
      const px = priceOf(stocks, def.id);
      const delta = ((px - def.basePrice) / def.basePrice) * 100;
      const pos = positionOf(stocks, def.id);
      return { def, px, delta, pos };
    });
  }, [stocks]);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="City Paper Desk"
        subtitle="District speculative shares — prices tick with the hour, director events, and heat. Clean cash only."
        tone="city"
        image="/art/bank/hero.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
          <span className={hub.chip}>Portfolio {formatMoney(value)}</span>
          <span className={hub.chip}>Dividends life {formatMoney(stocks.dividendsEarned)}</span>
          <span className={hub.chip}>
            Commerce edge {edgePct > 0 ? `−${edgePct}% downside` : "none (take cf1+)"}
          </span>
        </div>
      </PageHero>

      <p className={styles.sub}>
        Wash street first at the <Link href="/bank">bank</Link>
        {" · "}
        <Link href="/market">item market</Link>
        {" · "}
        <Link href="/bazaar">bazaar</Link>
        {" · "}
        <Link href="/education">Commerce courses</Link> improve tape reading.
      </p>

      <Module title="Order ticket" footer="Max 50 shares per order · heat ≥90 blocks the desk">
        <label className={styles.sub} style={{ display: "block", marginBottom: 4 }}>
          Shares
        </label>
        <input
          className={styles.field}
          type="number"
          min={1}
          max={50}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
        />
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {[1, 5, 10, 25].map((n) => (
            <GameButton key={n} variant="secondary" onClick={() => setQty(n)}>
              {n}
            </GameButton>
          ))}
        </div>
      </Module>

      <Module title="Tickers" footer="Hourly drift in the world tick · dividends scale with hours held">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Paper</th>
              <th>District</th>
              <th>Price</th>
              <th>Δ base</th>
              <th>Held</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ def, px, delta, pos }) => {
              const buyReasons = stocksBuyReasons(def, qty, s);
              const sellReasons = stocksSellReasons(def.id, Math.min(qty, pos?.shares ?? 0) || qty, s);
              const canSell = (pos?.shares ?? 0) >= 1;
              const district = DISTRICTS.find((d) => d.id === def.district)?.name ?? def.district;
              return (
                <tr key={def.id}>
                  <td>
                    <strong>{def.ticker}</strong> {def.name}
                    <div className={styles.sub} style={{ margin: 0 }}>
                      {def.blurb}
                    </div>
                  </td>
                  <td style={{ textAlign: "left" }}>{district}</td>
                  <td className="tabular">{formatMoney(px)}</td>
                  <td className={`tabular ${delta >= 0 ? "money-pos" : "money-neg"}`}>
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(1)}%
                  </td>
                  <td className="tabular">
                    {pos ? (
                      <>
                        {pos.shares}
                        <div className={styles.sub} style={{ margin: 0 }}>
                          avg {formatMoney(Math.round(pos.avgCost))}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {buyReasons.length ? <RequirementsBox reasons={buyReasons} /> : null}
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <GameButton disabled={buyReasons.length > 0} onClick={() => s.stocksBuy(def.id, qty)}>
                        Buy
                      </GameButton>
                      <GameButton
                        variant="secondary"
                        disabled={!canSell || sellReasons.length > 0}
                        onClick={() => s.stocksSell(def.id, Math.min(qty, pos?.shares ?? 0))}
                      >
                        Sell
                      </GameButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Module>

      {s.directorEvent && (
        <Module title="Tape note">
          <p className={styles.sub} style={{ margin: 0 }}>
            Director: {s.directorEvent.label} — expect district papers to swing until it clears.
          </p>
        </Module>
      )}
    </div>
  );
}
