import { describe, expect, it } from "vitest";
import {
  armorSoakAmount,
  attackDamage,
  attackHitChance,
  bailCost,
  clamp,
  computeCrimeOdds,
  medicalCost,
  playerCombatPower,
  powerBandLabel,
  sigmoid,
  xpToLevel,
} from "./formulas";
import { hash32, rollD10000 } from "./rng";
import { applyCatchUp } from "./tick";
import { createInitialState } from "./state";
import { NPCS, getNpc, npcsInDistrict } from "@/content/catalog";

describe("rng", () => {
  it("is deterministic", () => {
    expect(rollD10000("seed", "crime", 1)).toBe(rollD10000("seed", "crime", 1));
    expect(hash32("a", 1)).not.toBe(hash32("a", 2));
  });
});

describe("formulas", () => {
  it("clamps and sigmoids", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(sigmoid(1)).toBeCloseTo(0.5, 1);
    expect(xpToLevel(1)).toBe(100);
  });

  it("computes crime odds in band", () => {
    const { odds } = computeCrimeOdds({
      dex: 10,
      spd: 10,
      str: 5,
      def: 5,
      level: 3,
      toolMod: 2,
      eduMod: 0,
      districtMod: 2,
      hourMod: 0,
      chainMod: 0,
      heatPenalty: 0,
      stressPenalty: 0,
      difficulty: 40,
    });
    expect(odds).toBeGreaterThanOrEqual(0.05);
    expect(odds).toBeLessThanOrEqual(0.85);
  });

  it("models attack hit/damage/soak", () => {
    expect(attackHitChance(20, 5)).toBeGreaterThan(attackHitChance(5, 20));
    expect(attackDamage(10, 3, 0.5)).toBeGreaterThan(0);
    expect(armorSoakAmount(8, 10)).toBeGreaterThan(armorSoakAmount(0, 0));
    expect(powerBandLabel(80, 40)).toBe("Favored");
    expect(powerBandLabel(20, 50)).toBe("Outmatched");
    expect(
      playerCombatPower({ str: 10, def: 10, spd: 10, dex: 10, level: 5, weaponDmg: 3, armorSoak: 8 })
    ).toBeGreaterThan(20);
  });

  it("scales medical and bail sinks", () => {
    expect(medicalCost("docksreach", 80)).toBeGreaterThan(medicalCost("glassrow", 0));
    expect(bailCost(90, 3)).toBeGreaterThan(bailCost(0, 0));
  });
});

describe("npc catalog", () => {
  it("scopes targets by district", () => {
    expect(NPCS.length).toBe(9);
    expect(npcsInDistrict("glassrow").every((n) => n.district === "glassrow")).toBe(true);
    expect(getNpc("dr_smuggler")?.name).toBe("Pier Smuggler");
  });
});

describe("tick catch-up", () => {
  it("regens resources after time away", () => {
    const base = createInitialState({
      created: true,
      energy: 10,
      nerve: 2,
      lastTickAt: Date.now() - 60 * 60 * 1000,
    });
    const { state, awaySummary } = applyCatchUp(base, Date.now());
    expect(state.energy).toBeGreaterThan(10);
    expect(state.nerve).toBeGreaterThan(2);
    expect(awaySummary).not.toBeNull();
  });

  it("clears wounds on hospital release", () => {
    const base = createInitialState({
      created: true,
      hospitalUntil: Date.now() - 1000,
      hospitalReason: "test",
      wounds: { arm: 1, leg: 1 },
      lastTickAt: Date.now() - 1000,
    });
    const { state } = applyCatchUp(base, Date.now());
    expect(state.hospitalUntil).toBeNull();
    expect(state.wounds).toEqual({ arm: 0, leg: 0 });
    expect(state.hospitalReason).toBeNull();
  });
});
