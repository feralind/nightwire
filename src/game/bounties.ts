import { NPCS } from "@/content/catalog";
import { rollD10000 } from "@/game/rng";
import type { GameState } from "@/game/state";

export type BountyListing = {
  npcId: string;
  payout: number;
  postedAt: number;
  expiresAt: number;
};

export function refreshBounties(s: GameState, now = Date.now()): BountyListing[] {
  const day = Math.floor(now / 86_400_000);
  const pool = NPCS.filter((n) => n.district === s.district || n.power >= 40);
  const picks: BountyListing[] = [];
  for (let i = 0; i < 5; i++) {
    const roll = rollD10000(s.seed, `bounty:${day}`, i);
    const npc = pool[roll % Math.max(1, pool.length)];
    if (!npc) continue;
    if (picks.some((p) => p.npcId === npc.id)) continue;
    picks.push({
      npcId: npc.id,
      payout: 500 + npc.power * 25 + (roll % 400),
      postedAt: now,
      expiresAt: now + 86_400_000,
    });
  }
  return picks;
}

export function activeBounties(list: BountyListing[], now = Date.now()) {
  return list.filter((b) => b.expiresAt > now);
}
