"use client";

import { getItem } from "@/content/catalog";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { GameButton } from "@/components/ui/GameButton";
import { InfoRow, InfoRowBlock } from "@/components/ui/InfoRow";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "./inventory.module.css";

export default function InventoryPage() {
  const s = useGame();
  const equipped = s.inventory.filter((i) => i.equipped);
  const packs = s.inventory;

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Inventory"
        subtitle="Tools, weapons, consumables — equip before the attempt."
        tone="default"
        image="/art/city/skyline.webp"
      />

      <CollapsiblePanel
        title={`Kit · ${packs.length} stacks`}
        footer="Equip changes crime tool mods and attack loadout"
      >
        {packs.length === 0 ? (
          <p className={hub.sub} style={{ padding: "8px 0" }}>
            Empty pockets. Hit Shops or fence a score.
          </p>
        ) : (
          <>
            <div className={styles.kitGrid} aria-label="Equipped kit">
              {packs.map((i) => {
                const item = getItem(i.itemId);
                const letter = (item?.name ?? i.itemId).slice(0, 1).toUpperCase();
                return (
                  <button
                    key={i.itemId}
                    type="button"
                    className={[styles.kitCell, i.equipped ? styles.kitOn : ""].filter(Boolean).join(" ")}
                    title={`${item?.name ?? i.itemId} ×${i.qty}`}
                    onClick={() => s.equipItem(i.itemId)}
                  >
                    <span className={styles.kitGlyph}>{letter}</span>
                    <span className={`tabular ${styles.kitQty}`}>×{i.qty}</span>
                  </button>
                );
              })}
            </div>
            <InfoRowBlock>
              <InfoRow label="Equipped" value={equipped.length ? equipped.map((e) => getItem(e.itemId)?.name ?? e.itemId).join(", ") : "—"} />
            </InfoRowBlock>
            {packs.map((i) => {
              const item = getItem(i.itemId);
              return (
                <div key={`detail-${i.itemId}`} className={styles.itemBlock}>
                  <InfoRowBlock>
                    <InfoRow
                      label={item?.name ?? i.itemId}
                      value={`×${i.qty}${i.equipped ? " · on" : ""}`}
                    />
                    <InfoRow label="Kind" value={item?.kind ?? "—"} />
                    {item?.toolMod != null && <InfoRow label="Tool mod" value={`+${item.toolMod}`} tone="pos" />}
                    <InfoRow label="Notes" value={item?.description ?? "—"} />
                  </InfoRowBlock>
                  <div className={styles.itemActions}>
                    <GameButton variant="primary" onClick={() => s.equipItem(i.itemId)}>
                      {i.equipped ? "Unequip" : "Equip"}
                    </GameButton>
                    <GameButton variant="secondary" onClick={() => s.useItem(i.itemId)}>
                      Use
                    </GameButton>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </CollapsiblePanel>
    </div>
  );
}
