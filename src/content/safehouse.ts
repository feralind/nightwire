import type { SafehouseRoomDef, SafehouseRoomId } from "@/game/types";

export const SAFEHOUSE_ROOMS: SafehouseRoomDef[] = [
  {
    id: "vault",
    name: "Vault",
    blurb: "Hard case and false panel. More stash stacks; heat sheds quieter; raids cost less.",
    maxLevel: 3,
    cleanCosts: [2500, 6000, 14000],
    streetCosts: [0, 0, 0],
  },
  {
    id: "cot",
    name: "Cot",
    blurb: "A real mattress. Offline life and happy climb faster; stress bleeds off while you sleep.",
    maxLevel: 3,
    cleanCosts: [1200, 3200, 7500],
    streetCosts: [400, 800, 1500],
  },
  {
    id: "study",
    name: "Study desk",
    blurb: "Lamp, corkboard, quiet. Courses chew hours faster while you run the city.",
    maxLevel: 3,
    cleanCosts: [1800, 4500, 10000],
    streetCosts: [0, 0, 0],
  },
  {
    id: "armory",
    name: "Armory rack",
    blurb: "Bench and oil. Craft tools on-site; higher racks sharpen equipped kit.",
    maxLevel: 3,
    cleanCosts: [500, 1200, 2800],
    streetCosts: [2000, 5000, 11000],
  },
  {
    id: "garage",
    name: "Garage",
    blurb: "Bay light and a floor jack. Shorter travel; energy ticks harder; bench can patch wounds.",
    maxLevel: 3,
    cleanCosts: [2000, 4800, 11000],
    streetCosts: [1500, 3500, 8000],
  },
];

export function getSafehouseRoom(id: SafehouseRoomId): SafehouseRoomDef | undefined {
  return SAFEHOUSE_ROOMS.find((r) => r.id === id);
}

/** Armory craft recipes — street cost before level discount */
export const ARMORY_RECIPES: {
  itemId: string;
  streetCost: number;
  /** Minimum armory level to unlock */
  minLevel: number;
}[] = [
  { itemId: "gloves", streetCost: 60, minLevel: 1 },
  { itemId: "crowbar", streetCost: 85, minLevel: 1 },
  { itemId: "shim_kit", streetCost: 130, minLevel: 2 },
  { itemId: "radio", streetCost: 380, minLevel: 2 },
  { itemId: "lockpick", streetCost: 340, minLevel: 3 },
];
