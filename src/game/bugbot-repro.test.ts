import { describe, it, expect } from "vitest";
import { directorPriceMult, refreshBazaarState } from "@/game/bazaar";
import { ensureDailyRitual } from "@/game/ritual";
import { createInitialState } from "@/game/state";
import { applyCatchUp } from "@/game/tick";

describe("bugbot gate fixes", () => {
  it("daily ritual/bazaar mutations are detectable for persistence", () => {
    let s = createInitialState();
    s = { ...s, created: true, seed: "repro-seed", ritualDay: 0, ritual: null, bazaar: { day: 0, listings: [] } };
    const prev = s;
    const after = ensureDailyRitual(refreshBazaarState(s, true));
    const dailyMutated =
      after.ritualDay !== prev.ritualDay || after.bazaar.day !== prev.bazaar.day;
    expect(dailyMutated).toBe(true);
    expect(after.bazaar.listings).toHaveLength(15);
  });

  it("listing index selects the clicked stall price", () => {
    const listings = [
      { itemId: "crowbar", price: 100, seller: "A" },
      { itemId: "crowbar", price: 250, seller: "B" },
    ];
    expect(listings[1].price).toBe(250);
  });

  it("forcing bazaar refresh after director changes prices", () => {
    let s = createInitialState();
    s = { ...s, seed: "repro-seed", directorEvent: null, bazaar: { day: 0, listings: [] } };
    s = refreshBazaarState(s, true);
    const priceBefore = s.bazaar.listings[0]?.price;
    s = {
      ...s,
      directorEvent: { id: "festival", label: "Festival", until: Date.now() + 1e9 },
    };
    s = refreshBazaarState(s, true);
    expect(directorPriceMult("festival")).toBe(1.12);
    expect(s.bazaar.listings[0]?.price).not.toBe(priceBefore);
  });

  it("lay-low applies bonus heat decay on short online ticks", () => {
    const now = Date.now();
    const hours = 1000 / 3600000;
    let s = createInitialState();
    s = {
      ...s,
      created: true,
      seed: "repro-seed",
      lastTickAt: now - 1000,
      heat: 50,
      energy: 50,
      laylowUntil: now + 4 * 3600 * 1000,
    };
    const { state } = applyCatchUp(s, now);
    const expected = Math.max(0, 50 - hours * 0.5 - hours * 1.5);
    expect(state.heat).toBeCloseTo(expected, 10);
  });
});
