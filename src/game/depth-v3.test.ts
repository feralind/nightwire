import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";
import { RACES, raceOdds, resolveRace } from "./raceway";
import { FACTIONS, assistPay, currentWar, endgameTitle, warPairForWeek } from "./faction";
import { activeBounties, refreshBounties } from "./bounties";

describe("raceway", () => {
  it("ships a playable race slate", () => {
    expect(RACES.length).toBeGreaterThanOrEqual(5);
    expect(RACES.some((r) => !r.streetOk)).toBe(true);
    expect(RACES.some((r) => r.streetOk && (r.heatOnEnter ?? 0) > 0)).toBe(true);
  });

  it("resolves three sectors and gates affordability", () => {
    const broke = createInitialState({ created: true, clean: 0, street: 0, energy: 20, level: 1 });
    expect(resolveRace(broke, "alley_dash").ok).toBe(false);

    const ready = createInitialState({
      created: true,
      clean: 5000,
      street: 5000,
      energy: 20,
      level: 6,
      spd: 40,
      dex: 30,
      seed: "race_test",
      actionIndex: 1,
    });
    const result = resolveRace(ready, "alley_dash");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sectors).toHaveLength(3);
      expect(result.sectorWins).toBeGreaterThanOrEqual(0);
      expect(result.sectorWins).toBeLessThanOrEqual(3);
      expect(result.win).toBe(result.sectorWins >= 2);
    }
    const odds = raceOdds(ready, RACES[0]!);
    expect(odds.odds).toBeGreaterThan(0.1);
    expect(odds.odds).toBeLessThan(0.9);
  });
});

describe("faction sim", () => {
  it("has four NPC factions with district lean", () => {
    expect(FACTIONS).toHaveLength(4);
    expect(FACTIONS.every((f) => f.districts.length >= 1)).toBe(true);
  });

  it("scales assist pay with rep and picks war pairs", () => {
    expect(assistPay(0)).toBe(400);
    expect(assistPay(50)).toBeGreaterThan(assistPay(0));
    const [a, b] = warPairForWeek(12);
    expect(a).not.toBe(b);
    expect(FACTIONS.some((f) => f.id === a)).toBe(true);
    const war = currentWar(7 * 86_400_000 + 1000); // odd week
    expect(war === null || Boolean(war?.a && war?.b)).toBe(true);
  });

  it("titles endgame partners", () => {
    expect(endgameTitle({ glass_syndicate: 10 })).toBeNull();
    expect(endgameTitle({ glass_syndicate: 65, mill_iron: 10 })).toContain("Silent partner");
    expect(endgameTitle({ mill_iron: 85 })).toContain("Street crown");
  });
});

describe("bounties", () => {
  it("refreshes a daily board", () => {
    const s = createInitialState({ created: true, district: "glassrow", seed: "bounty_test" });
    const list = refreshBounties(s, Date.now());
    expect(list.length).toBeGreaterThan(0);
    expect(activeBounties(list, Date.now() + 2 * 86_400_000)).toHaveLength(0);
  });
});
