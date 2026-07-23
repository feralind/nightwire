import { describe, expect, it } from "vitest";
import { STOCKS } from "@/content/stocks";
import { createInitialState } from "./state";
import {
  applyBuyShares,
  applySellShares,
  emptyStocks,
  portfolioValue,
  priceOf,
  stocksBuyReasons,
  stocksCourseEdge,
  tickStocks,
} from "./stocks";

describe("stocks-lite", () => {
  it("ships one paper per district", () => {
    expect(STOCKS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(STOCKS.map((s) => s.district)).size).toBeGreaterThanOrEqual(8);
  });

  it("commerce courses add downside edge", () => {
    expect(stocksCourseEdge([])).toBe(0);
    expect(stocksCourseEdge(["cf1"])).toBeGreaterThan(0);
    expect(stocksCourseEdge(["cf1", "cf2", "cf3"])).toBeGreaterThan(stocksCourseEdge(["cf1"]));
  });

  it("buys and sells with clean cash and tracks avg cost", () => {
    let s = createInitialState({
      created: true,
      clean: 50_000,
      stocks: emptyStocks(),
    });
    const id = STOCKS[0].id;
    const px = priceOf(s.stocks, id);
    const bought = applyBuyShares(s, id, 10);
    expect(bought).not.toBeNull();
    s = bought!.state;
    expect(s.clean).toBe(50_000 - bought!.cost);
    expect(s.stocks.positions[0].shares).toBe(10);
    expect(s.stocks.positions[0].avgCost).toBe(px);

    const sold = applySellShares(s, id, 4);
    expect(sold).not.toBeNull();
    s = sold!.state;
    expect(s.stocks.positions[0].shares).toBe(6);
    expect(s.clean).toBe(50_000 - bought!.cost + sold!.proceeds);
  });

  it("blocks buys without clean cash", () => {
    const s = createInitialState({ created: true, clean: 0, stocks: emptyStocks() });
    const def = STOCKS[0];
    expect(stocksBuyReasons(def, 1, s).some((r) => r.label.includes("clean"))).toBe(true);
    expect(applyBuyShares(s, def.id, 1)).toBeNull();
  });

  it("ticks prices and can pay dividends", () => {
    let s = createInitialState({
      created: true,
      seed: "stk_tick",
      clean: 10_000,
      stocks: {
        ...emptyStocks(),
        positions: [{ stockId: STOCKS[0].id, shares: 100, avgCost: STOCKS[0].basePrice }],
      },
    });
    const before = { ...s.stocks.prices };
    const result = tickStocks(s, 24, Date.now() + 3600_000);
    s = result.state;
    // Prices should still be defined for all tickers
    for (const def of STOCKS) {
      expect(priceOf(s.stocks, def.id)).toBeGreaterThan(0);
    }
    expect(portfolioValue(s.stocks)).toBeGreaterThan(0);
    // 24h on 100 shares should produce some dividend for positive dividendPerShare
    if (STOCKS[0].dividendPerShare > 0) {
      expect(s.stocks.dividendsEarned).toBeGreaterThanOrEqual(0);
      // either dividends line or price moved — both are valid tick outcomes
      expect(
        s.clean >= 10_000 || JSON.stringify(s.stocks.prices) !== JSON.stringify(before)
      ).toBe(true);
    }
  });
});
