import { ARMORY_RECIPES, SAFEHOUSE_ROOMS, getSafehouseRoom } from "@/content/safehouse";
import type { SafehouseRoomId } from "@/game/types";

export type SafehouseRooms = Record<SafehouseRoomId, number>;

export const EMPTY_SAFEHOUSE_ROOMS: SafehouseRooms = {
  vault: 0,
  cot: 0,
  study: 0,
  armory: 0,
  garage: 0,
};

const BASE_STASH_STACKS = 8;
const VAULT_STACKS_PER_LEVEL = 4;

export function normalizeSafehouseRooms(
  raw?: Partial<SafehouseRooms> | null
): SafehouseRooms {
  const out = { ...EMPTY_SAFEHOUSE_ROOMS };
  if (!raw) return out;
  for (const room of SAFEHOUSE_ROOMS) {
    const v = raw[room.id];
    out[room.id] = clampLevel(typeof v === "number" ? v : 0, room.maxLevel);
  }
  return out;
}

function clampLevel(n: number, max: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, Math.floor(n));
}

export function roomLevel(rooms: SafehouseRooms, id: SafehouseRoomId): number {
  return rooms[id] ?? 0;
}

export function totalRoomLevels(rooms: SafehouseRooms): number {
  return SAFEHOUSE_ROOMS.reduce((a, r) => a + roomLevel(rooms, r.id), 0);
}

export function stashCapacity(rooms: SafehouseRooms): number {
  return BASE_STASH_STACKS + roomLevel(rooms, "vault") * VAULT_STACKS_PER_LEVEL;
}

export function canAddInventoryStack(
  rooms: SafehouseRooms,
  currentStacks: number,
  alreadyHasItem: boolean
): boolean {
  if (alreadyHasItem) return true;
  return currentStacks < stashCapacity(rooms);
}

/** Extra heat shed per hour from vault shielding */
export function vaultHeatDecayBonus(rooms: SafehouseRooms): number {
  return roomLevel(rooms, "vault") * 0.25;
}

/** Multiplier on property raid bribe / loss (lower = better) */
export function vaultRaidCostMult(rooms: SafehouseRooms): number {
  return Math.max(0.55, 1 - roomLevel(rooms, "vault") * 0.12);
}

export function cotLifePerHour(rooms: SafehouseRooms): number {
  return 2 + roomLevel(rooms, "cot") * 1.5;
}

export function cotHappyPerHour(rooms: SafehouseRooms): number {
  return 3 + roomLevel(rooms, "cot") * 2;
}

export function cotStressDecayPerHour(rooms: SafehouseRooms): number {
  return roomLevel(rooms, "cot") * 0.6;
}

/** Study progress multiplier from desk */
export function studySpeedMult(rooms: SafehouseRooms): number {
  return 1 + roomLevel(rooms, "study") * 0.1;
}

/** Soft tool mod crumbs from armory rack */
export function armoryToolModBonus(rooms: SafehouseRooms): number {
  const lvl = roomLevel(rooms, "armory");
  if (lvl <= 0) return 0;
  return Math.floor((lvl + 1) / 2);
}

export function garageTravelMult(rooms: SafehouseRooms): number {
  return Math.max(0.55, 1 - roomLevel(rooms, "garage") * 0.12);
}

/** Extra energy points per catch-up hour from garage bay */
export function garageEnergyPerHour(rooms: SafehouseRooms): number {
  return roomLevel(rooms, "garage") * 0.4;
}

export type ReqReason = { label: string; href?: string };

export function upgradeRoomReasons(
  roomId: SafehouseRoomId,
  s: {
    ownedProperties: string[];
    clean: number;
    street: number;
    safehouseRooms: SafehouseRooms;
  }
): ReqReason[] {
  const def = getSafehouseRoom(roomId);
  const reasons: ReqReason[] = [];
  if (!def) {
    reasons.push({ label: "Unknown room" });
    return reasons;
  }
  if (!s.ownedProperties.length) {
    reasons.push({ label: "Own a property first", href: "/properties" });
  }
  const lvl = roomLevel(s.safehouseRooms, roomId);
  if (lvl >= def.maxLevel) {
    reasons.push({ label: "Already maxed" });
    return reasons;
  }
  const cleanNeed = def.cleanCosts[lvl] ?? 0;
  const streetNeed = def.streetCosts[lvl] ?? 0;
  if (s.clean < cleanNeed) {
    reasons.push({ label: `Need $${cleanNeed} clean`, href: "/jobs" });
  }
  if (s.street < streetNeed) {
    reasons.push({ label: `Need $${streetNeed} street`, href: "/crimes" });
  }
  return reasons;
}

export function canUpgradeRoom(
  roomId: SafehouseRoomId,
  s: {
    ownedProperties: string[];
    clean: number;
    street: number;
    safehouseRooms: SafehouseRooms;
  }
): boolean {
  return upgradeRoomReasons(roomId, s).length === 0;
}

export function nextUpgradeCost(
  roomId: SafehouseRoomId,
  currentLevel: number
): { clean: number; street: number } | null {
  const def = getSafehouseRoom(roomId);
  if (!def || currentLevel >= def.maxLevel) return null;
  return {
    clean: def.cleanCosts[currentLevel] ?? 0,
    street: def.streetCosts[currentLevel] ?? 0,
  };
}

export function craftRecipeReasons(
  itemId: string,
  s: {
    ownedProperties: string[];
    street: number;
    safehouseRooms: SafehouseRooms;
    inventoryStacks: number;
    hasItem: boolean;
  }
): ReqReason[] {
  const reasons: ReqReason[] = [];
  if (!s.ownedProperties.length) {
    reasons.push({ label: "Own a property first", href: "/properties" });
  }
  const recipe = ARMORY_RECIPES.find((r) => r.itemId === itemId);
  if (!recipe) {
    reasons.push({ label: "Unknown recipe" });
    return reasons;
  }
  const armory = roomLevel(s.safehouseRooms, "armory");
  if (armory < recipe.minLevel) {
    reasons.push({ label: `Armory level ${recipe.minLevel}+`, href: "/safehouse" });
  }
  const cost = armoryCraftCost(itemId, armory);
  if (cost != null && s.street < cost) {
    reasons.push({ label: `Need $${cost} street`, href: "/crimes" });
  }
  if (!canAddInventoryStack(s.safehouseRooms, s.inventoryStacks, s.hasItem)) {
    reasons.push({ label: "Stash full — upgrade Vault", href: "/safehouse" });
  }
  return reasons;
}

export function armoryCraftCost(itemId: string, armoryLevel: number): number | null {
  const recipe = ARMORY_RECIPES.find((r) => r.itemId === itemId);
  if (!recipe || armoryLevel < recipe.minLevel) return null;
  const discount = 1 - armoryLevel * 0.12;
  return Math.max(10, Math.round(recipe.streetCost * discount));
}

export function garageRepairCost(rooms: SafehouseRooms): number {
  const lvl = Math.max(1, roomLevel(rooms, "garage"));
  return Math.max(80, 220 - lvl * 40);
}

export function garageRepairReasons(s: {
  ownedProperties: string[];
  street: number;
  safehouseRooms: SafehouseRooms;
  life: number;
  lifeMax: number;
  wounds: { arm: number; leg: number };
}): ReqReason[] {
  const reasons: ReqReason[] = [];
  if (!s.ownedProperties.length) {
    reasons.push({ label: "Own a property first", href: "/properties" });
  }
  if (roomLevel(s.safehouseRooms, "garage") < 1) {
    reasons.push({ label: "Build Garage first", href: "/safehouse" });
  }
  const needsRepair =
    s.life < s.lifeMax || s.wounds.arm > 0 || s.wounds.leg > 0;
  if (!needsRepair) {
    reasons.push({ label: "Nothing to patch" });
  }
  const cost = garageRepairCost(s.safehouseRooms);
  if (s.street < cost) {
    reasons.push({ label: `Need $${cost} street`, href: "/crimes" });
  }
  return reasons;
}

export function roomEffectLabels(roomId: SafehouseRoomId, level: number): string[] {
  if (level <= 0) return ["Not built"];
  switch (roomId) {
    case "vault":
      return [
        `Stash ${BASE_STASH_STACKS + level * VAULT_STACKS_PER_LEVEL} stacks`,
        `Heat decay +${(level * 0.25).toFixed(2)}/hr`,
        `Raid costs −${level * 12}%`,
      ];
    case "cot":
      return [
        `Life regen ${cotLifePerHour({ ...EMPTY_SAFEHOUSE_ROOMS, cot: level }).toFixed(1)}/hr`,
        `Happy regen ${cotHappyPerHour({ ...EMPTY_SAFEHOUSE_ROOMS, cot: level })}/hr`,
        `Stress −${cotStressDecayPerHour({ ...EMPTY_SAFEHOUSE_ROOMS, cot: level }).toFixed(1)}/hr`,
      ];
    case "study":
      return [`Course speed +${level * 10}%`];
    case "armory":
      return [
        `Craft bench (L${level} recipes)`,
        armoryToolModBonus({ ...EMPTY_SAFEHOUSE_ROOMS, armory: level })
          ? `Equipped tools +${armoryToolModBonus({ ...EMPTY_SAFEHOUSE_ROOMS, armory: level })}`
          : "Craft gloves / crowbar",
      ];
    case "garage":
      return [
        `Travel time −${level * 12}%`,
        `Energy +${garageEnergyPerHour({ ...EMPTY_SAFEHOUSE_ROOMS, garage: level }).toFixed(1)}/hr`,
        "Bench repair (life / wounds)",
      ];
    default:
      return [];
  }
}

export function activeBonusSummary(rooms: SafehouseRooms): string[] {
  const lines: string[] = [];
  if (roomLevel(rooms, "vault") > 0) {
    lines.push(`Stash ${stashCapacity(rooms)} stacks · vault heat shield`);
  } else {
    lines.push(`Stash ${stashCapacity(rooms)} stacks (base)`);
  }
  if (roomLevel(rooms, "cot") > 0) lines.push(`Cot rest L${roomLevel(rooms, "cot")}`);
  if (roomLevel(rooms, "study") > 0) {
    lines.push(`Study desk +${roomLevel(rooms, "study") * 10}% course speed`);
  }
  if (roomLevel(rooms, "armory") > 0) {
    lines.push(`Armory L${roomLevel(rooms, "armory")} craft / kit bonus`);
  }
  if (roomLevel(rooms, "garage") > 0) {
    lines.push(`Garage L${roomLevel(rooms, "garage")} travel / energy`);
  }
  return lines;
}
