import { describe, expect, it } from "vitest";
import { ARMORY_RECIPES, SAFEHOUSE_ROOMS } from "@/content/safehouse";
import {
  armoryCraftCost,
  armoryToolModBonus,
  canUpgradeRoom,
  garageTravelMult,
  normalizeSafehouseRooms,
  roomEffectLabels,
  stashCapacity,
  studySpeedMult,
  upgradeRoomReasons,
  vaultRaidCostMult,
} from "./safehouse";
import { applyCatchUp } from "./tick";
import { createInitialState, normalizeState } from "./state";
import { DISTRICTS } from "@/content/catalog";

describe("safehouse rooms", () => {
  it("ships five upgradeable rooms", () => {
    expect(SAFEHOUSE_ROOMS.map((r) => r.id)).toEqual([
      "vault",
      "cot",
      "study",
      "armory",
      "garage",
    ]);
    expect(SAFEHOUSE_ROOMS.every((r) => r.maxLevel === 3)).toBe(true);
    expect(ARMORY_RECIPES.length).toBeGreaterThanOrEqual(4);
  });

  it("requires a property before upgrades", () => {
    const rooms = normalizeSafehouseRooms();
    const broke = {
      ownedProperties: [] as string[],
      clean: 99999,
      street: 99999,
      safehouseRooms: rooms,
    };
    expect(canUpgradeRoom("vault", broke)).toBe(false);
    expect(upgradeRoomReasons("vault", broke)[0]?.href).toBe("/properties");
    expect(
      canUpgradeRoom("vault", { ...broke, ownedProperties: ["gr_walkup"] })
    ).toBe(true);
  });

  it("scales stash, study, travel, and raid shield by level", () => {
    expect(stashCapacity(normalizeSafehouseRooms())).toBe(8);
    expect(stashCapacity(normalizeSafehouseRooms({ vault: 2 }))).toBe(16);
    expect(studySpeedMult(normalizeSafehouseRooms({ study: 2 }))).toBeCloseTo(1.2);
    expect(garageTravelMult(normalizeSafehouseRooms({ garage: 2 }))).toBeCloseTo(0.76);
    expect(vaultRaidCostMult(normalizeSafehouseRooms({ vault: 2 }))).toBeCloseTo(0.76);
    expect(armoryToolModBonus(normalizeSafehouseRooms({ armory: 3 }))).toBe(2);
    expect(roomEffectLabels("study", 1)[0]).toMatch(/10%/);
  });

  it("discounts armory craft by level", () => {
    const base = ARMORY_RECIPES.find((r) => r.itemId === "crowbar")!;
    const l1 = armoryCraftCost("crowbar", 1)!;
    const l3 = armoryCraftCost("crowbar", 3)!;
    expect(l1).toBeLessThan(base.streetCost);
    expect(l3).toBeLessThan(l1);
    expect(armoryCraftCost("lockpick", 1)).toBeNull();
    expect(armoryCraftCost("lockpick", 3)).toBeGreaterThan(0);
  });

  it("backfills safehouseRooms on normalize", () => {
    const legacy = createInitialState({ created: true });
    delete (legacy as { safehouseRooms?: unknown }).safehouseRooms;
    const n = normalizeState(legacy);
    expect(n.safehouseRooms).toEqual({
      vault: 0,
      cot: 0,
      study: 0,
      armory: 0,
      garage: 0,
    });
  });

  it("applies cot / study / vault bonuses on catch-up", () => {
    const now = Date.now();
    const base = createInitialState({
      created: true,
      ownedProperties: ["gr_walkup"],
      safehouseRooms: { vault: 2, cot: 2, study: 2, armory: 0, garage: 1 },
      life: 40,
      happy: 400,
      heat: 40,
      stress: 40,
      activeCourseId: "se1",
      courseProgressHours: 0,
      clean: 5000,
      lastTickAt: now - 10 * 60 * 60 * 1000,
    });
    const plain = createInitialState({
      created: true,
      ownedProperties: ["gr_walkup"],
      safehouseRooms: { vault: 0, cot: 0, study: 0, armory: 0, garage: 0 },
      life: 40,
      happy: 400,
      heat: 40,
      stress: 40,
      activeCourseId: "se1",
      courseProgressHours: 0,
      clean: 5000,
      lastTickAt: now - 10 * 60 * 60 * 1000,
    });
    const boosted = applyCatchUp(base, now).state;
    const control = applyCatchUp(plain, now).state;
    expect(boosted.life).toBeGreaterThan(control.life);
    expect(boosted.happy).toBeGreaterThan(control.happy);
    expect(boosted.heat).toBeLessThan(control.heat);
    expect(boosted.courseProgressHours).toBeGreaterThan(control.courseProgressHours);
  });

  it("garage shortens travel seconds via mult helper", () => {
    const d = DISTRICTS[0];
    const raw = d.travelSeconds;
    const cut = Math.round(raw * garageTravelMult(normalizeSafehouseRooms({ garage: 3 })));
    expect(cut).toBeLessThan(raw);
    expect(cut).toBeGreaterThanOrEqual(Math.round(raw * 0.55));
  });
});
