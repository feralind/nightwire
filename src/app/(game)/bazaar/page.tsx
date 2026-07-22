"use client";

import { getItem } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";

export default function BazaarPage() {
  const s = useGame();
  return (
    <Module title="NPC Bazaar" footer="Daily restock · loot destination · money sink">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {s.bazaar.listings.map((l) => (
            <tr key={l.itemId}>
              <td>{getItem(l.itemId)?.name ?? l.itemId}</td>
              <td className="tabular">{formatMoney(l.price)}</td>
              <td>
                <GameButton disabled={s.clean < l.price} onClick={() => s.bazaarBuy(l.itemId)}>
                  Buy
                </GameButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Sell from inventory</h3>
      <ul>
        {s.inventory.map((i) => (
          <li key={i.itemId}>
            {getItem(i.itemId)?.name} ×{i.qty}{" "}
            <GameButton variant="ghost" onClick={() => s.bazaarSell(i.itemId)}>
              Sell
            </GameButton>
          </li>
        ))}
      </ul>
    </Module>
  );
}
