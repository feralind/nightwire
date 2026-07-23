import { ITEMS } from "@/content/catalog";
import { unit01 } from "@/game/rng";
import type { GameState } from "@/game/state";

const SELLERS = [
  "Nix",
  "Mara",
  "Kilo",
  "Soot",
  "Reed",
  "Ivy",
  "Vex's runner",
  "Dock ghost",
  "Glassrow fence",
  "Millstone pawn",
  "Harbor mule",
  "Quiet broker",
  "Night clerk",
  "Alley vendor",
  "Corner tipster",
];

export type BazaarListing = {
  itemId: string;
  price: number;
  seller: string;
};

/** Director events nudge bazaar prices lightly */
export function directorPriceMult(directorId: string | undefined): number {
  if (!directorId) return 1;
  if (directorId === "festival") return 1.12;
  if (directorId === "sweep") return 1.08;
  if (directorId === "strike") return 0.94;
  if (directorId === "outage") return 0.97;
  return 1;
}

export function buildBazaarListings(
  seed: string,
  day: number,
  directorId?: string
): BazaarListing[] {
  const pool = [...ITEMS].sort((a, b) => a.id.localeCompare(b.id));
  const picks: typeof ITEMS = [];
  // Deterministic 15 picks from full catalog
  for (let i = 0; i < 15; i++) {
    const idx = hashPick(seed, day, i, pool.length);
    picks.push(pool[idx]);
  }
  const mult = directorPriceMult(directorId);
  return picks.map((item, i) => {
    const jitter = 0.75 + unit01(seed, "bazaar_px", day * 100 + i) * 0.55;
    const price = Math.max(10, Math.round(item.baseValue * jitter * mult));
    const seller = SELLERS[hashPick(seed, day, i + 50, SELLERS.length)];
    return { itemId: item.id, price, seller };
  });
}

function hashPick(seed: string, day: number, salt: number, mod: number): number {
  return Math.floor(unit01(seed, "bazaar_pick", day * 97 + salt) * mod) % mod;
}

export function sellPrice(baseValue: number, seed: string, actionIndex: number): number {
  const pct = 0.5 + unit01(seed, "bazaar_sell", actionIndex) * 0.2; // 50–70%
  return Math.max(1, Math.round(baseValue * pct));
}

export function refreshBazaarState(s: GameState, force = false): GameState {
  const day = Math.floor(Date.now() / 86400000);
  if (!force && s.bazaar.day === day && s.bazaar.listings.length === 15) {
    // Keep sellers if already rich shape
    const first = s.bazaar.listings[0] as BazaarListing;
    if (first && "seller" in first && first.seller) return s;
  }
  return {
    ...s,
    bazaar: {
      day,
      listings: buildBazaarListings(s.seed, day, s.directorEvent?.id),
    },
  };
}
