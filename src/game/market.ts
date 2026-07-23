import { ITEMS, getItem } from "@/content/catalog";
import { unit01 } from "@/game/rng";
import type { GameState } from "@/game/state";

export const MARKET_LISTING_FEE_RATE = 0.05;
export const MARKET_SALE_FEE_RATE = 0.08;
export const MARKET_HEAT_FEE_BUMP = 0.04;
export const MARKET_NPC_COUNT = 12;
export const MARKET_PLAYER_LISTING_CAP = 5;

const BROKERS = [
  "Quiet broker",
  "Dock ghost",
  "Glassrow fence",
  "Millstone pawn",
  "Harbor mule",
  "Night clerk",
  "Alley vendor",
  "Corner tipster",
  "Spire runner",
  "Clinic mule",
  "Pier float",
  "Commons scrap",
  "Vex's runner",
  "Reed's tip",
  "Nix stall",
];

export type MarketNpcListing = {
  id: string;
  itemId: string;
  price: number;
  seller: string;
  /** Preferred settlement ledger for this stall */
  ledger: "clean" | "street";
};

export type MarketPlayerListing = {
  id: string;
  itemId: string;
  ask: number;
  listedAt: number;
};

export type MarketState = {
  day: number;
  npcListings: MarketNpcListing[];
  playerListings: MarketPlayerListing[];
};

export function emptyMarket(): MarketState {
  return { day: 0, npcListings: [], playerListings: [] };
}

/** Heat and respect nudge board fees (higher heat = worse; respect softens). */
export function marketFeeRate(s: { heat: number; power: { respect: number } }): number {
  const heatBump = s.heat >= 60 ? MARKET_HEAT_FEE_BUMP : s.heat >= 35 ? MARKET_HEAT_FEE_BUMP / 2 : 0;
  const respectCut = Math.min(0.03, (s.power.respect ?? 0) * 0.002);
  return Math.max(0.04, MARKET_SALE_FEE_RATE + heatBump - respectCut);
}

export function listingFee(ask: number, feeRate = MARKET_LISTING_FEE_RATE): number {
  return Math.max(5, Math.round(ask * feeRate));
}

export function saleFee(gross: number, feeRate: number): number {
  return Math.max(1, Math.round(gross * feeRate));
}

function hashPick(seed: string, day: number, salt: number, mod: number): number {
  return Math.floor(unit01(seed, "mkt_pick", day * 97 + salt) * mod) % mod;
}

export function fairAsk(baseValue: number, seed: string, day: number, salt: number, heat: number): number {
  const jitter = 0.85 + unit01(seed, "mkt_fair", day * 50 + salt) * 0.4;
  const heatTax = heat >= 50 ? 1.08 : heat >= 25 ? 1.03 : 1;
  return Math.max(10, Math.round(baseValue * jitter * heatTax));
}

export function buildNpcListings(
  seed: string,
  day: number,
  heat: number,
  directorId?: string
): MarketNpcListing[] {
  const pool = [...ITEMS].sort((a, b) => a.id.localeCompare(b.id));
  const listings: MarketNpcListing[] = [];
  const directorBump =
    directorId === "festival" ? 1.06 : directorId === "sweep" ? 1.1 : directorId === "strike" ? 0.95 : 1;

  for (let i = 0; i < MARKET_NPC_COUNT; i++) {
    const item = pool[hashPick(seed, day, i, pool.length)];
    const streetLean = unit01(seed, "mkt_ledger", day * 40 + i) > 0.45;
    const price = Math.round(fairAsk(item.baseValue, seed, day, i, heat) * directorBump);
    listings.push({
      id: `npc_${day}_${i}_${item.id}`,
      itemId: item.id,
      price,
      seller: BROKERS[hashPick(seed, day, i + 80, BROKERS.length)],
      ledger: streetLean ? "street" : "clean",
    });
  }
  return listings;
}

export function refreshMarketState(s: GameState, force = false): GameState {
  const day = Math.floor(Date.now() / 86400000);
  const cur = s.market ?? emptyMarket();
  if (!force && cur.day === day && cur.npcListings.length === MARKET_NPC_COUNT) {
    return { ...s, market: cur };
  }
  return {
    ...s,
    market: {
      day,
      npcListings: buildNpcListings(s.seed, day, s.heat, s.directorEvent?.id),
      playerListings: cur.playerListings ?? [],
    },
  };
}

export function marketBuyReasons(
  listing: MarketNpcListing,
  s: {
    clean: number;
    street: number;
    heat: number;
    hospitalUntil: number | null;
    jailUntil: number | null;
    travelUntil: number | null;
    laylowUntil: number | null;
  }
): { label: string; href?: string }[] {
  const reasons: { label: string; href?: string }[] = [];
  const now = Date.now();
  if (s.hospitalUntil && s.hospitalUntil > now) reasons.push({ label: "Hospitalized", href: "/hospital" });
  if (s.jailUntil && s.jailUntil > now) reasons.push({ label: "Jailed", href: "/jail" });
  if (s.travelUntil && s.travelUntil > now) reasons.push({ label: "Traveling", href: "/travel" });
  if (s.laylowUntil && s.laylowUntil > now) reasons.push({ label: "Laying low", href: "/travel" });
  if (listing.ledger === "street" && s.heat >= 80) {
    reasons.push({ label: "Heat too hot for street stalls", href: "/jobs" });
  }
  const purse = listing.ledger === "street" ? s.street : s.clean;
  if (purse < listing.price) {
    reasons.push({
      label: `Need ${listing.ledger} cash`,
      href: listing.ledger === "street" ? "/market" : "/bank",
    });
  }
  return reasons;
}

export function marketListReasons(
  itemId: string,
  ask: number,
  s: GameState
): { label: string; href?: string }[] {
  const reasons: { label: string; href?: string }[] = [];
  const item = getItem(itemId);
  if (!item) {
    reasons.push({ label: "Unknown item" });
    return reasons;
  }
  const market = s.market ?? emptyMarket();
  if (market.playerListings.length >= MARKET_PLAYER_LISTING_CAP) {
    reasons.push({ label: `Listing cap ${MARKET_PLAYER_LISTING_CAP}` });
  }
  const slot = s.inventory.find((i) => i.itemId === itemId);
  if (!slot || slot.qty < 1) reasons.push({ label: "Not in inventory", href: "/inventory" });
  if (ask < Math.floor(item.baseValue * 0.4)) reasons.push({ label: "Ask too low (min 40% base)" });
  if (ask > Math.floor(item.baseValue * 2.5)) reasons.push({ label: "Ask too high (max 250% base)" });
  const fee = listingFee(ask);
  if (s.clean + s.street < fee) reasons.push({ label: `Listing fee ${fee}`, href: "/bank" });
  return reasons;
}

/** NPC buyers fill underpriced player listings during catch-up. */
export function simulateMarketBuys(
  s: GameState,
  hours: number,
  now = Date.now()
): { state: GameState; sales: string[] } {
  if (hours < 0.25) return { state: s, sales: [] };
  let market = s.market ?? emptyMarket();
  if (!market.playerListings.length) return { state: { ...s, market }, sales: [] };

  let next = { ...s, street: s.street, clean: s.clean };
  const remaining: MarketPlayerListing[] = [];
  const sales: string[] = [];
  const feeRate = marketFeeRate(s);

  for (let i = 0; i < market.playerListings.length; i++) {
    const listing = market.playerListings[i];
    const item = getItem(listing.itemId);
    if (!item) continue;
    const fair = fairAsk(item.baseValue, s.seed, market.day, i + 3, s.heat);
    const premium = listing.ask / Math.max(1, fair);
    // Cheaper than fair → more likely to sell
    const chance = Math.min(0.85, hours * (0.12 + (premium < 1 ? 0.25 : premium > 1.3 ? -0.05 : 0.08)));
    const roll = unit01(s.seed, "mkt_buy", Math.floor(now / 3600000) + i + s.actionIndex);
    if (roll < chance && chance > 0) {
      const fee = saleFee(listing.ask, feeRate);
      const net = listing.ask - fee;
      next.street += net;
      sales.push(`Sold ${item.name} for $${net} (fee $${fee})`);
    } else {
      remaining.push(listing);
    }
  }

  market = { ...market, playerListings: remaining };
  return { state: { ...next, market }, sales };
}
