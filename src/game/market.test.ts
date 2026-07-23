import { describe, expect, it } from "vitest";
import { createInitialState } from "./state";
import {
  buildNpcListings,
  listingFee,
  marketBuyReasons,
  marketFeeRate,
  marketListReasons,
  MARKET_NPC_COUNT,
  refreshMarketState,
  simulateMarketBuys,
} from "./market";

describe("market board", () => {
  it("builds a full NPC broker sheet", () => {
    const listings = buildNpcListings("seed_a", 100, 10);
    expect(listings).toHaveLength(MARKET_NPC_COUNT);
    expect(new Set(listings.map((l) => l.id)).size).toBe(MARKET_NPC_COUNT);
    expect(listings.every((l) => l.price > 0 && (l.ledger === "clean" || l.ledger === "street"))).toBe(
      true
    );
  });

  it("raises sale fees with heat and softens with respect", () => {
    const cool = marketFeeRate({ heat: 0, power: { respect: 0 } });
    const hot = marketFeeRate({ heat: 70, power: { respect: 0 } });
    const respected = marketFeeRate({ heat: 70, power: { respect: 20 } });
    expect(hot).toBeGreaterThan(cool);
    expect(respected).toBeLessThan(hot);
  });

  it("gates street buys when heat is extreme", () => {
    const s = createInitialState({ created: true, street: 5000, heat: 85 });
    const listing = {
      id: "x",
      itemId: "crowbar",
      price: 100,
      seller: "Test",
      ledger: "street" as const,
    };
    expect(marketBuyReasons(listing, s).some((r) => r.label.includes("Heat"))).toBe(true);
    expect(marketBuyReasons(listing, { ...s, heat: 20 }).length).toBe(0);
  });

  it("charges listing fee and rejects over/under asks", () => {
    expect(listingFee(1000)).toBe(50);
    const s = refreshMarketState(
      createInitialState({
        created: true,
        clean: 500,
        inventory: [{ itemId: "crowbar", qty: 1 }],
      })
    );
    expect(marketListReasons("crowbar", 10, s).some((r) => r.label.includes("too low"))).toBe(true);
    expect(marketListReasons("crowbar", 100, s).length).toBe(0);
  });

  it("simulates NPC fills on cheap player listings", () => {
    const base = refreshMarketState(
      createInitialState({
        created: true,
        seed: "mkt_fill",
        street: 0,
        heat: 0,
      })
    );
    const withListing = {
      ...base,
      market: {
        ...base.market,
        playerListings: [
          { id: "pl1", itemId: "crowbar", ask: 40, listedAt: Date.now() },
        ],
      },
    };
    const result = simulateMarketBuys(withListing, 8, Date.now());
    // Cheap ask should often sell within 8h; allow either outcome but state must stay valid
    expect(result.state.market.playerListings.length).toBeLessThanOrEqual(1);
    if (result.sales.length) {
      expect(result.state.street).toBeGreaterThan(0);
      expect(result.state.market.playerListings).toHaveLength(0);
    }
  });
});
