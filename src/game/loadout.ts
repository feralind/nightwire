import { getItem } from "@/content/catalog";
import type { InventorySlot } from "@/game/state";
import type { ItemDef } from "@/game/types";

export type LoadoutStats = {
  toolMod: number;
  weaponDmg: number;
  armorSoak: number;
  stealth: number;
  value: number;
  itemIds: string[];
  labels: string[];
};

/** Mirror store loadoutMods + tool mods for pure compare. */
export function statsForSlots(slots: InventorySlot[]): LoadoutStats {
  let toolMod = 0;
  let weaponDmg = 0;
  let armorSoak = 0;
  let stealth = 0;
  let value = 0;
  const itemIds: string[] = [];
  const labels: string[] = [];

  for (const slot of slots) {
    const item = getItem(slot.itemId);
    if (!item || slot.qty <= 0) continue;
    itemIds.push(item.id);
    labels.push(item.name);
    value += item.baseValue * slot.qty;
    if (item.toolMod) toolMod += item.toolMod;
    if (item.kind === "weapon") {
      if (item.id === "bat") weaponDmg += 5;
      else if (item.id === "knife") weaponDmg += 3;
      else weaponDmg += 2;
    }
    if (item.kind === "armor") armorSoak += item.id === "vest" ? 8 : 4;
    if (item.id === "gloves" || item.id === "shim_kit") stealth += 2;
    if (item.id === "radio") stealth += 1;
  }

  return { toolMod, weaponDmg, armorSoak, stealth, value, itemIds, labels };
}

export function statsForItemIds(ids: string[]): LoadoutStats {
  return statsForSlots(ids.filter(Boolean).map((itemId) => ({ itemId, qty: 1, equipped: true })));
}

export type CompareRow = {
  key: string;
  label: string;
  a: number | string;
  b: number | string;
  delta: number | null;
  better: "a" | "b" | "tie";
};

export function compareLoadouts(a: LoadoutStats, b: LoadoutStats): CompareRow[] {
  const rows: { key: string; label: string; av: number; bv: number; higherBetter: boolean }[] = [
    { key: "tool", label: "Tool mod", av: a.toolMod, bv: b.toolMod, higherBetter: true },
    { key: "weapon", label: "Weapon dmg", av: a.weaponDmg, bv: b.weaponDmg, higherBetter: true },
    { key: "armor", label: "Armor soak", av: a.armorSoak, bv: b.armorSoak, higherBetter: true },
    { key: "stealth", label: "Stealth", av: a.stealth, bv: b.stealth, higherBetter: true },
    { key: "value", label: "Fence value", av: a.value, bv: b.value, higherBetter: true },
  ];

  return rows.map((r) => {
    const delta = r.bv - r.av;
    let better: "a" | "b" | "tie" = "tie";
    if (delta !== 0) {
      if (r.higherBetter) better = delta > 0 ? "b" : "a";
      else better = delta < 0 ? "b" : "a";
    }
    return {
      key: r.key,
      label: r.label,
      a: r.av,
      b: r.bv,
      delta,
      better,
    };
  });
}

export function itemCompareBlurb(item: ItemDef | undefined): string {
  if (!item) return "Unknown gear";
  const bits: string[] = [item.kind];
  if (item.toolMod) bits.push(`tool +${item.toolMod}`);
  bits.push(`$${item.baseValue}`);
  return bits.join(" · ");
}

/** Build a virtual loadout from up to N selected owned item ids (qty ignored for stats). */
export function pickOwnedSlots(inventory: InventorySlot[], selectedIds: string[]): InventorySlot[] {
  return selectedIds
    .map((id) => inventory.find((s) => s.itemId === id))
    .filter((s): s is InventorySlot => Boolean(s));
}
