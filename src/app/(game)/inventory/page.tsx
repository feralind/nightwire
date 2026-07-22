"use client";

import { getItem } from "@/content/catalog";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

export default function InventoryPage() {
  const s = useGame();

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Inventory"
        subtitle="Tools, weapons, consumables — equip before the attempt."
        tone="default"
        image="/art/city/skyline.webp"
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>{s.inventory.length} stacks</span>
          <span className={hub.chip}>
            Equipped {s.inventory.filter((i) => i.equipped).length}
          </span>
        </div>
      </PageHero>

      <Module title="Kit" footer="Equip changes crime tool mods and attack loadout">
        {s.inventory.length === 0 ? (
          <p className={hub.sub}>Empty pockets. Hit Shops or fence a score.</p>
        ) : (
          <div className={hub.grid}>
            {s.inventory.map((i) => {
              const item = getItem(i.itemId);
              return (
                <article key={i.itemId} className={hub.panel}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <strong>
                      {item?.name ?? i.itemId}
                      {i.equipped ? " · equipped" : ""}
                    </strong>
                    <span className="tabular">×{i.qty}</span>
                  </div>
                  <p className={hub.sub} style={{ marginTop: 6 }}>
                    {item?.description}
                  </p>
                  <div className={hub.statRow}>
                    <span>Kind</span>
                    <strong>{item?.kind ?? "—"}</strong>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <GameButton variant="ghost" onClick={() => s.equipItem(i.itemId)}>
                      Equip
                    </GameButton>
                    <GameButton variant="ghost" onClick={() => s.useItem(i.itemId)}>
                      Use
                    </GameButton>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Module>
    </div>
  );
}
