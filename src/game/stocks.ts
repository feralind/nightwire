import { STOCKS, getStock, type StockDef } from "@/content/stocks";
import { clamp } from "@/game/formulas";
import { unit01 } from "@/game/rng";
import type { GameState } from "@/game/state";

export type StockPosition = {
  stockId: string;
  shares: number;
  avgCost: number;
};

export type StocksState = {
  prices: Record<string, number>;
  lastTickHour: number;
  positions: StockPosition[];
  dividendsEarned: number;
};

export function emptyStocks(): StocksState {
  const prices: Record<string, number> = {};
  for (const s of STOCKS) prices[s.id] = s.basePrice;
  return { prices, lastTickHour: 0, positions: [], dividendsEarned: 0 };
}

export function ensureStocksState(s: GameState): GameState {
  const cur = s.stocks;
  if (cur?.prices && Object.keys(cur.prices).length >= STOCKS.length) {
    const prices = { ...cur.prices };
    for (const def of STOCKS) {
      if (prices[def.id] == null) prices[def.id] = def.basePrice;
    }
    return {
      ...s,
      stocks: {
        prices,
        lastTickHour: cur.lastTickHour ?? 0,
        positions: cur.positions ?? [],
        dividendsEarned: cur.dividendsEarned ?? 0,
      },
    };
  }
  return { ...s, stocks: emptyStocks() };
}

/** Commerce courses soften adverse swings and unlock slightly better quotes. */
export function stocksCourseEdge(completedCourses: string[]): number {
  let edge = 0;
  if (completedCourses.includes("cf1")) edge += 0.01;
  if (completedCourses.includes("cf2")) edge += 0.015;
  if (completedCourses.includes("cf3")) edge += 0.02;
  return edge;
}

export function priceOf(stocks: StocksState, stockId: string): number {
  return stocks.prices[stockId] ?? getStock(stockId)?.basePrice ?? 100;
}

export function positionOf(stocks: StocksState, stockId: string): StockPosition | undefined {
  return stocks.positions.find((p) => p.stockId === stockId);
}

export function portfolioValue(stocks: StocksState): number {
  return stocks.positions.reduce((a, p) => a + p.shares * priceOf(stocks, p.stockId), 0);
}

export function stocksBuyReasons(
  def: StockDef,
  shares: number,
  s: GameState
): { label: string; href?: string }[] {
  const reasons: { label: string; href?: string }[] = [];
  const now = Date.now();
  if (s.hospitalUntil && s.hospitalUntil > now) reasons.push({ label: "Hospitalized", href: "/hospital" });
  if (s.jailUntil && s.jailUntil > now) reasons.push({ label: "Jailed", href: "/jail" });
  if (shares < 1) reasons.push({ label: "Buy at least 1 share" });
  if (shares > 50) reasons.push({ label: "Max 50 shares per order" });
  const stocks = s.stocks ?? emptyStocks();
  const px = priceOf(stocks, def.id);
  const cost = Math.round(px * shares);
  if (s.clean < cost) reasons.push({ label: `Need ${cost} clean`, href: "/bank" });
  if (s.heat >= 90) reasons.push({ label: "Heat blocks the paper desk", href: "/jobs" });
  return reasons;
}

export function stocksSellReasons(
  stockId: string,
  shares: number,
  s: GameState
): { label: string; href?: string }[] {
  const reasons: { label: string; href?: string }[] = [];
  const pos = positionOf(s.stocks ?? emptyStocks(), stockId);
  if (!pos || pos.shares < shares) reasons.push({ label: "Not enough shares" });
  if (shares < 1) reasons.push({ label: "Sell at least 1" });
  return reasons;
}

/**
 * Hourly drift: seeded walk + director / heat shocks.
 * Returns updated stocks + optional city log lines.
 */
export function tickStocks(
  s: GameState,
  hours: number,
  now = Date.now()
): { state: GameState; lines: string[] } {
  let stocks = ensureStocksState(s).stocks!;
  const hourBucket = Math.floor(now / 3600000);
  const hoursToApply = Math.max(0, Math.min(48, Math.floor(hours)));
  if (hoursToApply < 1 && stocks.lastTickHour === hourBucket) {
    return { state: { ...s, stocks }, lines: [] };
  }

  const lines: string[] = [];
  const edge = stocksCourseEdge(s.completedCourses);
  let prices = { ...stocks.prices };

  const steps = hoursToApply >= 1 ? hoursToApply : stocks.lastTickHour === hourBucket ? 0 : 1;
  for (let h = 0; h < steps; h++) {
    const bucket = hourBucket - (steps - 1 - h);
    for (const def of STOCKS) {
      const cur = prices[def.id] ?? def.basePrice;
      const u = unit01(s.seed, "stk_drift", bucket * 17 + STOCKS.indexOf(def));
      let delta = (u - 0.48) * 2 * def.volatility;
      // Mean-reversion toward base
      delta += ((def.basePrice - cur) / def.basePrice) * 0.02;
      if (s.directorEvent?.id === "festival" && def.district === "glassrow") delta += 0.04;
      if (s.directorEvent?.id === "strike" && def.district === "docksreach") delta -= 0.08;
      if (s.directorEvent?.id === "sweep") delta -= 0.03 + (s.heat > 50 ? 0.02 : 0);
      if (s.directorEvent?.id === "outage" && def.district === "glassrow") delta -= 0.025;
      // High city heat softens speculative paper
      if (s.heat >= 60) delta -= 0.015;
      // Course edge clips downside a bit
      if (delta < 0) delta *= 1 - edge;
      else delta *= 1 + edge * 0.5;

      // Rare crash / spike
      const shock = unit01(s.seed, "stk_shock", bucket * 31 + STOCKS.indexOf(def));
      if (shock < 0.012) {
        delta -= 0.12 + def.volatility;
        if (h === steps - 1) lines.push(`${def.ticker} dipped hard`);
      } else if (shock > 0.988) {
        delta += 0.1 + def.volatility * 0.5;
        if (h === steps - 1) lines.push(`${def.ticker} spiked`);
      }

      const next = clamp(Math.round(cur * (1 + delta)), Math.floor(def.basePrice * 0.35), Math.floor(def.basePrice * 2.8));
      prices[def.id] = next;
    }
  }

  // Weekly dividends scaled by hours
  let dividendsEarned = stocks.dividendsEarned;
  let clean = s.clean;
  if (hours >= 1 && stocks.positions.length) {
    let div = 0;
    for (const pos of stocks.positions) {
      const def = getStock(pos.stockId);
      if (!def || pos.shares <= 0) continue;
      div += Math.floor(def.dividendPerShare * pos.shares * (hours / 168));
    }
    if (div > 0) {
      clean += div;
      dividendsEarned += div;
      lines.push(`Paper dividends +$${div}`);
    }
  }

  stocks = {
    ...stocks,
    prices,
    lastTickHour: hourBucket,
    dividendsEarned,
  };

  return { state: { ...s, clean, stocks }, lines };
}

export function applyBuyShares(
  s: GameState,
  stockId: string,
  shares: number
): { state: GameState; cost: number } | null {
  const def = getStock(stockId);
  if (!def) return null;
  const stocks = ensureStocksState(s).stocks!;
  if (stocksBuyReasons(def, shares, { ...s, stocks }).length) return null;
  const px = priceOf(stocks, stockId);
  const cost = Math.round(px * shares);
  const existing = positionOf(stocks, stockId);
  let positions: StockPosition[];
  if (existing) {
    const totalShares = existing.shares + shares;
    const avgCost = (existing.avgCost * existing.shares + px * shares) / totalShares;
    positions = stocks.positions.map((p) =>
      p.stockId === stockId ? { stockId, shares: totalShares, avgCost } : p
    );
  } else {
    positions = [...stocks.positions, { stockId, shares, avgCost: px }];
  }
  return {
    state: {
      ...s,
      clean: s.clean - cost,
      stocks: { ...stocks, positions },
      actionIndex: s.actionIndex + 1,
    },
    cost,
  };
}

export function applySellShares(
  s: GameState,
  stockId: string,
  shares: number
): { state: GameState; proceeds: number; pnl: number } | null {
  const stocks = ensureStocksState(s).stocks!;
  if (stocksSellReasons(stockId, shares, { ...s, stocks }).length) return null;
  const pos = positionOf(stocks, stockId)!;
  const px = priceOf(stocks, stockId);
  const proceeds = Math.round(px * shares);
  const pnl = Math.round((px - pos.avgCost) * shares);
  const left = pos.shares - shares;
  const positions =
    left <= 0
      ? stocks.positions.filter((p) => p.stockId !== stockId)
      : stocks.positions.map((p) => (p.stockId === stockId ? { ...p, shares: left } : p));
  return {
    state: {
      ...s,
      clean: s.clean + proceeds,
      stocks: { ...stocks, positions },
      actionIndex: s.actionIndex + 1,
    },
    proceeds,
    pnl,
  };
}
