import { describe, expect, it } from "vitest";
import {
  buildBazaarListings,
  directorPriceMult,
  refreshBazaarState,
  sellPrice,
} from "./bazaar";
import { masteryOddsBonus, masteryTitleFor } from "./mastery";
import { applyCallRitual, applyRitualCashBonus, ensureDailyRitual } from "./ritual";
import { createInitialState } from "./state";

describe("bazaar", () => {
  it("builds 15 listings with sellers and director-nudged prices", () => {
    const base = buildBazaarListings("seed-a", 20000);
    const fest = buildBazaarListings("seed-a", 20000, "festival");
    expect(base).toHaveLength(15);
    expect(base.every((l) => l.seller && l.price >= 10)).toBe(true);
    expect(directorPriceMult("festival")).toBe(1.12);
    const baseSum = base.reduce((a, l) => a + l.price, 0);
    const festSum = fest.reduce((a, l) => a + l.price, 0);
    expect(festSum).toBeGreaterThan(baseSum);
  });

  it("sellPrice stays in 50–70% of base", () => {
    for (let i = 0; i < 40; i++) {
      const p = sellPrice(100, "sell-seed", i);
      expect(p).toBeGreaterThanOrEqual(50);
      expect(p).toBeLessThanOrEqual(70);
    }
  });

  it("refreshBazaarState fills daily stalls", () => {
    const s = createInitialState({ created: true, seed: "bazaar-test" });
    const next = refreshBazaarState(s, true);
    expect(next.bazaar.listings).toHaveLength(15);
    expect(next.bazaar.day).toBe(Math.floor(Date.now() / 86400000));
  });
});

describe("ritual", () => {
  it("mints a fresh ritual on a new calendar day", () => {
    const s = createInitialState({
      created: true,
      seed: "ritual-day",
      ritualDay: 1,
      ritual: { text: "old", current: 5, target: 5, kind: "petty", rewardClaimed: true },
      ritualBonus: { kind: "petty", cashMult: 1.05, remaining: 1 },
    });
    const next = ensureDailyRitual(s);
    expect(next.ritualDay).toBe(Math.floor(Date.now() / 86400000));
    expect(next.ritual?.rewardClaimed).toBe(false);
    expect(next.ritual?.current).toBe(0);
    expect(next.ritualBonus).toBeNull();
  });

  it("Call it complete grants cash and matching cash mult charges", () => {
    const s = createInitialState({
      created: true,
      level: 3,
      clean: 100,
      nerveMax: 10,
      ritual: { text: "Tonight’s move: 5 petty crimes", current: 5, target: 5, kind: "petty", rewardClaimed: false },
    });
    const r = applyCallRitual(s);
    expect(r.title).toBe("SUCCESS");
    expect(r.cashDelta).toBe(25 + 3 * 10);
    expect(r.state.clean).toBe(100 + r.cashDelta);
    expect(r.state.ritualBonus).toEqual({ kind: "petty", cashMult: 1.05, remaining: 3 });
    expect(r.state.nerveMax).toBe(11);
    expect(r.state.ritual?.rewardClaimed).toBe(true);
  });

  it("Call it early grants happy without cash mult", () => {
    const s = createInitialState({
      created: true,
      happy: 40,
      happyMax: 100,
      ritual: { text: "x", current: 1, target: 5, kind: "job", rewardClaimed: false },
    });
    const r = applyCallRitual(s);
    expect(r.title).toBe("MIXED");
    expect(r.cashDelta).toBe(0);
    expect(r.state.ritualBonus).toBeNull();
    expect(r.state.happy).toBe(55);
  });

  it("applyRitualCashBonus multiplies and decrements remaining", () => {
    const s = createInitialState({
      created: true,
      ritualBonus: { kind: "petty", cashMult: 1.05, remaining: 2 },
    });
    const a = applyRitualCashBonus(s, "petty", 100);
    expect(a.cash).toBe(105);
    expect(a.state.ritualBonus?.remaining).toBe(1);
    const b = applyRitualCashBonus(a.state, "street", 100);
    expect(b.cash).toBe(100);
    expect(b.state.ritualBonus?.remaining).toBe(1);
    const c = applyRitualCashBonus(a.state, "petty", 200);
    expect(c.cash).toBe(210);
    expect(c.state.ritualBonus).toBeNull();
  });
});

describe("mastery cosmetics", () => {
  it("L5 grants +0.03 odds bonus (not skill points)", () => {
    expect(masteryOddsBonus(0)).toBe(0);
    expect(masteryOddsBonus(4)).toBe(0);
    expect(masteryOddsBonus(5)).toBe(0.03);
  });

  it("titles unlock at L3 / L5", () => {
    expect(masteryTitleFor("petty", 2)).toBeNull();
    expect(masteryTitleFor("petty", 3)).toBe("Slick");
    expect(masteryTitleFor("petty", 5)).toBe("Ghost Hand");
    expect(masteryTitleFor("street", 5)).toBe("Alley King");
    expect(masteryTitleFor("heavy", 5)).toBe("Mastermind");
  });
});
