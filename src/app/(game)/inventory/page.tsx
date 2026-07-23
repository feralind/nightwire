"use client";

import { useMemo, useState } from "react";
import { getItem } from "@/content/catalog";
import { stashCapacity, normalizeSafehouseRooms } from "@/game/safehouse";
import { compareLoadouts, pickOwnedSlots, statsForSlots } from "@/game/loadout";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { GameButton } from "@/components/ui/GameButton";
import { InfoRow, InfoRowBlock } from "@/components/ui/InfoRow";
import { Module } from "@/components/ui/Module";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "./inventory.module.css";

export default function InventoryPage() {
  const s = useGame();
  const equipped = s.inventory.filter((i) => i.equipped);
  const packs = s.inventory;
  const cap = stashCapacity(normalizeSafehouseRooms(s.safehouseRooms));
  const [slotA, setSlotA] = useState<string>("");
  const [slotB, setSlotB] = useState<string>("");
  const [kitA, setKitA] = useState<string[]>([]);
  const [kitB, setKitB] = useState<string[]>([]);

  const itemOptions = packs.map((p) => p.itemId);

  const itemCompare = useMemo(() => {
    if (!slotA || !slotB) return null;
    const a = statsForSlots([{ itemId: slotA, qty: 1 }]);
    const b = statsForSlots([{ itemId: slotB, qty: 1 }]);
    return { rows: compareLoadouts(a, b), a, b };
  }, [slotA, slotB]);

  const kitCompare = useMemo(() => {
    const a = statsForSlots(pickOwnedSlots(packs, kitA.length ? kitA : equipped.map((e) => e.itemId)));
    const b = statsForSlots(pickOwnedSlots(packs, kitB));
    if (!kitB.length && !kitA.length) return null;
    return { rows: compareLoadouts(a, b), a, b };
  }, [packs, kitA, kitB, equipped]);

  function toggleKit(side: "a" | "b", id: string) {
    const set = side === "a" ? setKitA : setKitB;
    const cur = side === "a" ? kitA : kitB;
    set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(0, 6));
  }

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Inventory"
        subtitle="Tools, weapons, consumables — equip before the attempt. Compare kits side by side."
        tone="default"
        image="/art/city/skyline.webp"
      />

      <CollapsiblePanel
        title={`Kit · ${packs.length}/${cap} stacks`}
        footer="Equip changes crime tool mods and attack loadout · Vault raises cap"
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
              <InfoRow
                label="Equipped"
                value={equipped.length ? equipped.map((e) => getItem(e.itemId)?.name ?? e.itemId).join(", ") : "—"}
              />
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

      <Module title="Item compare" footer="Pick two owned items · tool / weapon / armor / stealth / fence value">
        {itemOptions.length < 2 ? (
          <p className={hub.sub}>Need at least two items in stash to compare.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
              <label className={hub.sub}>
                A{" "}
                <select
                  value={slotA}
                  onChange={(e) => setSlotA(e.target.value)}
                  style={{
                    background: "var(--bg-inset)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    height: 28,
                  }}
                >
                  <option value="">—</option>
                  {itemOptions.map((id) => (
                    <option key={id} value={id}>
                      {getItem(id)?.name ?? id}
                    </option>
                  ))}
                </select>
              </label>
              <label className={hub.sub}>
                B{" "}
                <select
                  value={slotB}
                  onChange={(e) => setSlotB(e.target.value)}
                  style={{
                    background: "var(--bg-inset)",
                    color: "var(--text)",
                    border: "1px solid var(--border)",
                    height: 28,
                  }}
                >
                  <option value="">—</option>
                  {itemOptions.map((id) => (
                    <option key={id} value={id}>
                      {getItem(id)?.name ?? id}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {itemCompare ? (
              <div className={hub.grid2}>
                <div className={hub.panel}>
                  <h3 className={hub.panelTitle}>{getItem(slotA)?.name}</h3>
                  <p className={hub.sub}>{getItem(slotA)?.description}</p>
                </div>
                <div className={hub.panel}>
                  <h3 className={hub.panelTitle}>{getItem(slotB)?.name}</h3>
                  <p className={hub.sub}>{getItem(slotB)?.description}</p>
                </div>
              </div>
            ) : null}
            {itemCompare ? (
              <InfoRowBlock>
                {itemCompare.rows.map((r) => (
                  <InfoRow
                    key={r.key}
                    label={r.label}
                    value={`A ${r.a} · B ${r.b}${r.better !== "tie" ? ` · edge ${r.better.toUpperCase()}` : ""}`}
                    tone={r.better === "a" ? "pos" : r.better === "b" ? "warn" : undefined}
                  />
                ))}
              </InfoRowBlock>
            ) : (
              <p className={hub.sub}>Select two items.</p>
            )}
          </>
        )}
      </Module>

      <Module
        title="Loadout compare"
        footer="A defaults to currently equipped · click kit glyphs to build B (max 6)"
      >
        <div className={hub.grid2}>
          <div className={hub.panel}>
            <h3 className={hub.panelTitle}>Loadout A</h3>
            <p className={hub.sub}>
              {(kitA.length ? kitA : equipped.map((e) => e.itemId))
                .map((id) => getItem(id)?.name ?? id)
                .join(", ") || "Empty"}
            </p>
            <div className={styles.kitGrid}>
              {packs.map((i) => (
                <button
                  key={`a-${i.itemId}`}
                  type="button"
                  className={[styles.kitCell, kitA.includes(i.itemId) ? styles.kitOn : ""].filter(Boolean).join(" ")}
                  onClick={() => toggleKit("a", i.itemId)}
                >
                  <span className={styles.kitGlyph}>{(getItem(i.itemId)?.name ?? "?").slice(0, 1)}</span>
                </button>
              ))}
            </div>
            <GameButton variant="ghost" onClick={() => setKitA(equipped.map((e) => e.itemId))}>
              Use equipped
            </GameButton>
          </div>
          <div className={hub.panel}>
            <h3 className={hub.panelTitle}>Loadout B</h3>
            <p className={hub.sub}>
              {kitB.map((id) => getItem(id)?.name ?? id).join(", ") || "Pick items"}
            </p>
            <div className={styles.kitGrid}>
              {packs.map((i) => (
                <button
                  key={`b-${i.itemId}`}
                  type="button"
                  className={[styles.kitCell, kitB.includes(i.itemId) ? styles.kitOn : ""].filter(Boolean).join(" ")}
                  onClick={() => toggleKit("b", i.itemId)}
                >
                  <span className={styles.kitGlyph}>{(getItem(i.itemId)?.name ?? "?").slice(0, 1)}</span>
                </button>
              ))}
            </div>
            <GameButton variant="ghost" onClick={() => setKitB([])}>
              Clear B
            </GameButton>
          </div>
        </div>
        {kitCompare && kitB.length > 0 ? (
          <InfoRowBlock>
            {kitCompare.rows.map((r) => (
              <InfoRow
                key={r.key}
                label={r.label}
                value={`A ${r.a} · B ${r.b}${r.delta ? ` · Δ ${r.delta > 0 ? "+" : ""}${r.delta}` : ""}`}
              />
            ))}
          </InfoRowBlock>
        ) : (
          <p className={hub.sub} style={{ marginTop: 10 }}>
            Build loadout B to see deltas vs A.
          </p>
        )}
      </Module>
    </div>
  );
}
