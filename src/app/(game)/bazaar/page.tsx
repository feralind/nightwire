"use client";

import { getItem } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import { sellPrice } from "@/game/bazaar";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { GameButton } from "@/components/ui/GameButton";
import { InfoRow } from "@/components/ui/InfoRow";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function BazaarPage() {
  const s = useGame();
  const listings = s.bazaar.listings;
  const affordable = listings.filter((l) => s.clean >= l.price).length;
  const directorNote = s.directorEvent
    ? `Director: ${s.directorEvent.label} (prices nudged)`
    : "No director event — baseline stalls";

  return (
    <div className={hub.wrap}>
      <PageHero
        title="NPC Bazaar"
        subtitle="Fifteen stalls · daily restock · fence your kit at 50–70%."
        tone="city"
        image="/art/city/skyline.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
          <span className={hub.chip}>
            Can buy {affordable}/{listings.length || 15}
          </span>
          <span className={hub.chip}>{directorNote}</span>
        </div>
      </PageHero>

      <CollapsiblePanel
        title={`Stalls · ${listings.length} listings`}
        footer="Buy with clean cash · sellers rotate daily with the city seed"
      >
        {listings.length === 0 ? (
          <p className={hub.sub} style={{ padding: "8px 0" }}>
            Stalls empty — wait for the daily restock.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Seller</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l, i) => {
                const item = getItem(l.itemId);
                const canBuy = s.clean >= l.price;
                return (
                  <tr key={`${l.itemId}-${i}`}>
                    <td>
                      {item?.name ?? l.itemId}
                      {item?.kind ? (
                        <span style={{ color: "var(--text-dim)", marginLeft: 6 }}>{item.kind}</span>
                      ) : null}
                    </td>
                    <td style={{ textAlign: "left", color: "var(--text-dim)" }}>{l.seller ?? "—"}</td>
                    <td className="tabular">{formatMoney(l.price)}</td>
                    <td>
                      <GameButton disabled={!canBuy} onClick={() => s.bazaarBuy(i)}>
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

      <CollapsiblePanel title="Fence inventory" footer="Sell rolls 50–70% of base value into street cash" defaultOpen>
        {s.inventory.length === 0 ? (
          <p className={hub.sub} style={{ padding: "8px 0" }}>
            Nothing to fence.
          </p>
        ) : (
          <div>
            {s.inventory.map((i) => {
              const item = getItem(i.itemId);
              const preview = item ? sellPrice(item.baseValue, s.seed, s.actionIndex + 1) : 0;
              const pct = item ? Math.round((preview / Math.max(1, item.baseValue)) * 100) : 0;
              return (
                <div key={i.itemId} style={{ marginBottom: 6 }}>
                  <InfoRow
                    label={`${item?.name ?? i.itemId} ×${i.qty}`}
                    value={`${formatMoney(preview)} · ~${pct}%`}
                    tone="pos"
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <GameButton variant="secondary" onClick={() => s.bazaarSell(i.itemId)}>
                      Sell one
                    </GameButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsiblePanel>
    </div>
  );
}
