import { describe, expect, it } from "vitest";
import { raceOdds, resolveRace, RACES } from "@/game/raceway";
import { createInitialState } from "@/game/state";
import { FACTIONS } from "@/game/faction";
import { refreshBounties } from "@/game/bounties";

describe("depth-late leisure systems", () => {
  it("resolves a race with seeded outcome", () => {
    const s = createInitialState({
      created: true,
      seed: "test_race",
      energy: 100,
      clean: 5000,
      street: 5000,
      level: 10,
    });
    const r = resolveRace(s, "alley_dash");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.race.id).toBe("alley_dash");
      expect(raceOdds(s, r.race).odds).toBeGreaterThan(0.1);
    }
    expect(RACES.length).toBeGreaterThanOrEqual(3);
  });

  it("lists four factions", () => {
    expect(FACTIONS).toHaveLength(4);
  });

  it("refreshes bounty board", () => {
    const s = createInitialState({ created: true, seed: "bounty_seed", district: "glassrow" });
    const list = refreshBounties(s);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].payout).toBeGreaterThan(0);
  });
});
