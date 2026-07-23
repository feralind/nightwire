"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DISTRICTS, getItem } from "@/content/catalog";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero } from "@/components/ui/Visuals";
import {
  listingFee,
  marketBuyReasons,
  marketFeeRate,
  marketListReasons,
  MARKET_PLAYER_LISTING_CAP,
} from "@/game/market";
import { formatMoney } from "@/game/formulas";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function MarketPage() {
  const s = useGame();
  const [askByItem, setAskByItem] = useState<Record<string, number>>({});
  const feeRate = marketFeeRate(s);
  const feePct = Math.round(feeRate * 100);

  useEffect(() => {
    if (s.created) s.refreshMarket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.created]);

  const npc = s.market?.npcListings ?? [];
  const player = s.market?.playerListings ?? [];
  const districtName = DISTRICTS.find((d) => d.id === s.district)?.name ?? s.district;

  const listable = useMemo(
    () => s.inventory.filter((i) => (getItem(i.itemId)?.baseValue ?? 0) > 0),
    [s.inventory]
  );

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Nightwire Market"
        subtitle="Peer board — NPC brokers + your listings. Fees climb with heat; respect shaves a little."
        tone="city"
        image="/art/city/skyline.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
          <span className={hub.chip}>Street {formatMoney(s.street)}</span>
          <span className={hub.chip}>Sale fee ~{feePct}%</span>
          <span className={hub.chip}>
            Your listings {player.length}/{MARKET_PLAYER_LISTING_CAP}
          </span>
          <span className={hub.chip}>{districtName}</span>
        </div>
      </PageHero>

      <p className={styles.sub}>
        Prefer instant fence stalls?{" "}
        <Link href="/bazaar">Open the NPC Bazaar</Link>
        {" · "}
        <Link href="/shops">District shops</Link>
        {" · "}
        <Link href="/inventory">Inventory</Link>
      </p>

      <CollapsiblePanel
        title={`Broker board · ${npc.length} stalls`}
        footer="Street ledgers preferred when heat is manageable · high heat locks hot stalls"
      >
        {npc.length === 0 ? (
          <p className={styles.sub}>Board empty — wait for the daily restock.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Broker</th>
                <th>Ledger</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {npc.map((l) => {
                const item = getItem(l.itemId);
                const reasons = marketBuyReasons(l, s);
                const locked = reasons.length > 0;
                return (
                  <tr key={l.id}>
                    <td>
                      {item?.name ?? l.itemId}
                      {item?.kind ? (
                        <span style={{ color: "var(--text-dim)", marginLeft: 6 }}>{item.kind}</span>
                      ) : null}
                    </td>
                    <td style={{ textAlign: "left", color: "var(--text-dim)" }}>{l.seller}</td>
                    <td>{l.ledger}</td>
                    <td className="tabular">{formatMoney(l.price)}</td>
                    <td>
                      {locked ? <RequirementsBox reasons={reasons} /> : null}
                      <GameButton disabled={locked} onClick={() => s.marketBuyNpc(l.id)}>
                        Buy
                      </GameButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel
        title={`Your listings · ${player.length}`}
        footer="NPC buyers fill underpriced asks over time · cancel returns the item"
        defaultOpen
      >
        {player.length === 0 ? (
          <p className={styles.sub}>No active listings. Post kit below.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Ask</th>
                <th>Est. net</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {player.map((l) => {
                const item = getItem(l.itemId);
                const net = l.ask - Math.max(1, Math.round(l.ask * feeRate));
                return (
                  <tr key={l.id}>
                    <td>{item?.name ?? l.itemId}</td>
                    <td className="tabular">{formatMoney(l.ask)}</td>
                    <td className="tabular money-pos">{formatMoney(net)}</td>
                    <td>
                      <GameButton variant="secondary" onClick={() => s.marketCancelListing(l.id)}>
                        Cancel
                      </GameButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel title="List from inventory" footer={`Listing fee ${Math.round(0.05 * 100)}% of ask (min $5)`}>
        {listable.length === 0 ? (
          <p className={styles.sub}>Nothing listable.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Base</th>
                <th>Ask</th>
                <th>Fee</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {listable.map((slot) => {
                const item = getItem(slot.itemId)!;
                const ask = askByItem[slot.itemId] ?? item.baseValue;
                const fee = listingFee(ask);
                const reasons = marketListReasons(slot.itemId, ask, s);
                const locked = reasons.length > 0;
                return (
                  <tr key={slot.itemId}>
                    <td>
                      {item.name} ×{slot.qty}
                    </td>
                    <td className="tabular">{formatMoney(item.baseValue)}</td>
                    <td>
                      <input
                        className={styles.field}
                        type="number"
                        min={1}
                        value={ask}
                        onChange={(e) =>
                          setAskByItem((m) => ({ ...m, [slot.itemId]: Number(e.target.value) }))
                        }
                        style={{ width: 90, textAlign: "right" }}
                      />
                    </td>
                    <td className="tabular">{formatMoney(fee)}</td>
                    <td>
                      {locked ? <RequirementsBox reasons={reasons} /> : null}
                      <GameButton disabled={locked} onClick={() => s.marketListItem(slot.itemId, ask)}>
                        List one
                      </GameButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CollapsiblePanel>
    </div>
  );
}
