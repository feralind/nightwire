import { describe, expect, it } from "vitest";
import {
  applyWound,
  canDoLeisure,
  cotRestHappyGain,
  cotRestStressRelief,
  easeWounds,
  gymOvertrainStressGain,
  leisureReasons,
  normalizeWounds,
  rollCrimeFailWound,
  stressBand,
  woundArmHitPenalty,
  woundCrimeOddsPenalty,
  woundLegMovePenalty,
} from "./body";
import { applyCatchUp } from "./tick";
import { createInitialState, normalizeState } from "./state";

describe("body stress bands", () => {
  it("maps stress into Steady → Breaking", () => {
    expect(stressBand(10).id).toBe("steady");
    expect(stressBand(40).id).toBe("wired");
    expect(stressBand(60).id).toBe("frayed");
    expect(stressBand(90).id).toBe("breaking");
  });
});

describe("wounds", () => {
  it("clamps notches and eases both slots", () => {
    expect(normalizeWounds({ arm: 9, leg: -1 })).toEqual({ arm: 2, leg: 0 });
    expect(applyWound({ arm: 1, leg: 0 }, "arm")).toEqual({ arm: 2, leg: 0 });
    expect(easeWounds({ arm: 2, leg: 1 }, 1)).toEqual({ arm: 1, leg: 0 });
  });

  it("applies additive crime odds penalty without touching base formula", () => {
    expect(woundCrimeOddsPenalty({ arm: 0, leg: 0 })).toBe(0);
    expect(woundCrimeOddsPenalty({ arm: 1, leg: 0 })).toBe(2);
    expect(woundCrimeOddsPenalty({ arm: 2, leg: 2 })).toBeGreaterThan(4);
  });

  it("scales combat soft debuffs with notch depth", () => {
    expect(woundArmHitPenalty({ arm: 1, leg: 0 })).toBe(0.12);
    expect(woundArmHitPenalty({ arm: 2, leg: 0 })).toBe(0.16);
    expect(woundLegMovePenalty({ arm: 0, leg: 2 })).toBe(0.14);
  });

  it("rolls crime-fail wounds; hospital always procs", () => {
    expect(rollCrimeFailWound(0.1, true)).not.toBeNull();
    expect(rollCrimeFailWound(0.95, false)).toBe("arm");
    expect(rollCrimeFailWound(0.85, false)).toBe("leg");
    expect(rollCrimeFailWound(0.1, false)).toBeNull();
  });
});

describe("gym overtrain + jail stress", () => {
  it("spikes stress on 4th daily train or past soft cap", () => {
    expect(gymOvertrainStressGain(0, false)).toBe(0);
    expect(gymOvertrainStressGain(3, false)).toBe(7);
    expect(gymOvertrainStressGain(0, true)).toBe(7);
  });

  it("raises stress while jailed across catch-up", () => {
    const now = Date.now();
    const base = createInitialState({
      created: true,
      stress: 20,
      jailUntil: now + 8 * 3600 * 1000,
      jailReason: "Test",
      lastTickAt: now - 4 * 3600 * 1000,
    });
    const { state, awaySummary } = applyCatchUp(base, now);
    expect(state.stress).toBeGreaterThan(base.stress);
    expect(awaySummary?.city.some((l) => l.includes("Jail stress"))).toBe(true);
  });
});

describe("leisure / cot rest", () => {
  it("scales cot rest with room level", () => {
    expect(cotRestStressRelief({ vault: 0, cot: 2, study: 0, armory: 0, garage: 0 })).toBeGreaterThan(
      cotRestStressRelief({ vault: 0, cot: 1, study: 0, armory: 0, garage: 0 })
    );
    expect(cotRestHappyGain({ vault: 0, cot: 3, study: 0, armory: 0, garage: 0 })).toBeGreaterThan(35);
  });

  it("gates dive booth on street cash and cooldown", () => {
    const base = createInitialState({
      created: true,
      street: 20,
      leisureUntil: null,
    });
    expect(leisureReasons("dive_bar", base).some((r) => r.label.includes("street"))).toBe(true);
    const rich = { ...base, street: 200 };
    expect(canDoLeisure("dive_bar", rich)).toBe(true);
  });

  it("requires cot + property for cot rest", () => {
    const bare = createInitialState({ created: true, ownedProperties: [], stress: 40 });
    expect(canDoLeisure("cot_rest", bare)).toBe(false);
    const ready = createInitialState({
      created: true,
      ownedProperties: ["dr_cot"],
      safehouseRooms: { vault: 0, cot: 1, study: 0, armory: 0, garage: 0 },
      stress: 40,
      happy: 400,
    });
    expect(canDoLeisure("cot_rest", ready)).toBe(true);
  });

  it("backfills leisureUntil on normalize", () => {
    const raw = createInitialState({ created: true });
    delete (raw as { leisureUntil?: number | null }).leisureUntil;
    const next = normalizeState(raw as ReturnType<typeof createInitialState>);
    expect(next.leisureUntil).toBeNull();
    expect(next.wounds).toEqual({ arm: 0, leg: 0 });
  });
});
