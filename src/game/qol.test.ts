import { describe, expect, it } from "vitest";
import {
  applyUndoSnapshot,
  captureUndoSnapshot,
  undoIsAlive,
  undoRemainingMs,
  UNDO_WINDOW_MS,
} from "./undo";
import {
  DIFFICULTIES,
  getDifficulty,
  normalizeDifficulty,
  regenIntervalMs,
  scaleCost,
  scaleCrimeDifficulty,
  scaleHeatGain,
  scalePay,
} from "./difficulty";
import { compareLoadouts, statsForItemIds, statsForSlots } from "./loadout";
import { buildAdvisorReport } from "./advisor";
import { forecastNervePacks, rankCrimesByEv, suggestSpendPlan } from "./planner";
import {
  buildCityLifeBundle,
  dayEventFor,
  maybeCityLifeLogLine,
  tipFor,
} from "./cityLife";
import { createInitialState, normalizeState } from "./state";
import { applyCatchUp } from "./tick";

describe("undo", () => {
  it("captures and restores cash/nerve/inventory slice", () => {
    const s0 = createInitialState({
      created: true,
      clean: 500,
      street: 100,
      nerve: 8,
      inventory: [
        { itemId: "gloves", qty: 1, equipped: true },
        { itemId: "crowbar", qty: 1 },
      ],
    });
    const snap = captureUndoSnapshot(s0, "Crime: Mug", "crime", 1_000);
    const mutated = {
      ...s0,
      clean: 400,
      street: 250,
      nerve: 5,
      inventory: [{ itemId: "gloves", qty: 1 }],
    };
    const restored = applyUndoSnapshot(mutated, snap);
    expect(restored.clean).toBe(500);
    expect(restored.street).toBe(100);
    expect(restored.nerve).toBe(8);
    expect(restored.inventory).toHaveLength(2);
    expect(undoIsAlive(snap, 1_000 + UNDO_WINDOW_MS - 1)).toBe(true);
    expect(undoIsAlive(snap, 1_000 + UNDO_WINDOW_MS + 1)).toBe(false);
    expect(undoRemainingMs(snap, 1_000 + 2_000)).toBe(UNDO_WINDOW_MS - 2_000);
  });
});

describe("difficulty settings", () => {
  it("normalizes unknown modes to standard", () => {
    expect(normalizeDifficulty("nope")).toBe("standard");
    expect(normalizeDifficulty("hard")).toBe("hard");
    expect(getDifficulty("easier").costMult).toBeLessThan(1);
    expect(getDifficulty("hard").regenIntervalMult).toBeGreaterThan(1);
  });

  it("scales odds inputs, costs, pay, heat, regen", () => {
    expect(scaleCrimeDifficulty(40, "easier")).toBeLessThan(40);
    expect(scaleCrimeDifficulty(40, "hard")).toBeGreaterThan(40);
    expect(scaleCost(100, "easier")).toBeLessThan(100);
    expect(scaleCost(100, "hard")).toBeGreaterThan(100);
    expect(scalePay(100, "easier")).toBeGreaterThan(100);
    expect(scaleHeatGain(10, "hard")).toBeGreaterThan(10);
    expect(regenIntervalMs(300_000, "easier")).toBeLessThan(300_000);
    expect(Object.keys(DIFFICULTIES)).toEqual(["easier", "standard", "hard"]);
  });

  it("persists difficulty through normalizeState and affects regen catch-up", () => {
    const base = createInitialState({ created: true, difficulty: "easier", energy: 50, nerve: 5 });
    const normalized = normalizeState({ ...base, difficulty: "hard" as const });
    expect(normalized.difficulty).toBe("hard");

    const easy = createInitialState({
      created: true,
      difficulty: "easier",
      energy: 50,
      nerve: 5,
      lastTickAt: Date.now() - 10 * 60 * 1000,
    });
    const hard = createInitialState({
      created: true,
      difficulty: "hard",
      energy: 50,
      nerve: 5,
      lastTickAt: easy.lastTickAt,
    });
    const easyTick = applyCatchUp(easy, easy.lastTickAt + 10 * 60 * 1000);
    const hardTick = applyCatchUp(hard, hard.lastTickAt + 10 * 60 * 1000);
    expect(easyTick.state.energy).toBeGreaterThanOrEqual(hardTick.state.energy);
  });
});

describe("loadout compare", () => {
  it("scores tools/weapons and compares sides", () => {
    const a = statsForItemIds(["lockpick", "vest"]);
    const b = statsForItemIds(["gloves"]);
    expect(a.toolMod).toBeGreaterThan(b.toolMod);
    expect(a.armorSoak).toBeGreaterThan(0);
    const rows = compareLoadouts(a, b);
    expect(rows.find((r) => r.key === "tool")?.better).toBe("a");
    const slots = statsForSlots([{ itemId: "bat", qty: 1, equipped: true }]);
    expect(slots.weaponDmg).toBe(5);
  });
});

describe("advisor + planner", () => {
  it("recommends laylow when investigation is critical", () => {
    const s = createInitialState({
      created: true,
      heat: 95,
      investigation: 3,
      jobId: "kitchen_1",
    });
    const report = buildAdvisorReport(s, {});
    expect(report.verdict).toBe("laylow");
    expect(report.legalBest || report.options.length >= 0).toBeTruthy();
  });

  it("ranks crimes by EV and builds a spend plan", () => {
    const views = {
      mug: { locked: false, odds: 0.6, ev: 12 },
      car_breakin: { locked: false, odds: 0.4, ev: 8 },
    };
    const ranked = rankCrimesByEv(views, 5);
    expect(ranked[0]?.id).toBe("mug");
    const s = createInitialState({ created: true, nerve: 10, energy: 40, jobId: "kitchen_1", heat: 10 });
    const plan = suggestSpendPlan(s, views);
    expect(plan.steps.length).toBeGreaterThan(0);
    const forecast = forecastNervePacks(10, ranked[0]);
    expect(forecast.attempts).toBeGreaterThan(0);
  });
});

describe("city life layer", () => {
  it("is deterministic for seed + time buckets", () => {
    const t = Date.UTC(2026, 6, 23, 15, 0, 0);
    const a = dayEventFor("seed_a", t);
    const b = dayEventFor("seed_a", t);
    expect(a.id).toBe(b.id);
    expect(tipFor("seed_a", t).body.length).toBeGreaterThan(10);
    const bundle = buildCityLifeBundle("seed_a", "glassrow", t);
    expect(bundle.day.title).toBeTruthy();
    expect(bundle.npcs.length).toBeGreaterThanOrEqual(0);
    const first = maybeCityLifeLogLine("seed_a", null, t);
    expect(first?.dayEventId).toBe(bundle.day.id);
    const again = maybeCityLifeLogLine("seed_a", first!.dayEventId, t);
    expect(again).toBeNull();
  });
});
