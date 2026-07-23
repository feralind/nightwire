import { rollD10000 } from "@/game/rng";
import type { GameState } from "@/game/state";

export type RaceDef = {
  id: string;
  name: string;
  entryFee: number;
  /** Uses street if true, else clean preferred then street */
  streetOk: boolean;
  energy: number;
  blurb: string;
  payoutMin: number;
  payoutMax: number;
  requiresLevel: number;
};

export const RACES: RaceDef[] = [
  {
    id: "alley_dash",
    name: "Alley dash",
    entryFee: 200,
    streetOk: true,
    energy: 4,
    blurb: "Three sectors: launch, corner, finish. Ghost field of NPCs.",
    payoutMin: 350,
    payoutMax: 900,
    requiresLevel: 1,
  },
  {
    id: "harbor_loop",
    name: "Harbor loop",
    entryFee: 600,
    streetOk: true,
    energy: 5,
    blurb: "Wet asphalt and crane shadows. Speed + vehicle parts matter.",
    payoutMin: 900,
    payoutMax: 2200,
    requiresLevel: 3,
  },
  {
    id: "spire_invite",
    name: "Spire invite",
    entryFee: 2000,
    streetOk: false,
    energy: 6,
    blurb: "Clean entry only. Respect unlocks the paddock.",
    payoutMin: 3500,
    payoutMax: 8000,
    requiresLevel: 6,
  },
];

export function raceOdds(s: GameState, race: RaceDef) {
  const parts = s.inventory.filter((i) => i.itemId.includes("bike") || i.itemId.includes("ecu")).length;
  const skill = s.spd * 0.5 + s.dex * 0.3 + s.level * 2 + parts * 4 + (s.power.respect >= 50 ? 5 : 0);
  const difficulty = 40 + race.requiresLevel * 8;
  const odds = Math.max(0.12, Math.min(0.82, skill / (skill + difficulty)));
  return { odds, skill, difficulty };
}

export function resolveRace(s: GameState, raceId: string) {
  const race = RACES.find((r) => r.id === raceId);
  if (!race) return { ok: false as const, reason: "Unknown race" };
  if (s.level < race.requiresLevel) return { ok: false as const, reason: `Need level ${race.requiresLevel}` };
  if (s.energy < race.energy) return { ok: false as const, reason: "Not enough energy" };
  const canPay =
    race.streetOk
      ? s.street + s.clean >= race.entryFee
      : s.clean >= race.entryFee;
  if (!canPay) return { ok: false as const, reason: "Cannot afford entry" };

  const { odds } = raceOdds(s, race);
  const roll = rollD10000(s.seed, `race:${raceId}`, s.actionIndex);
  const win = roll / 10000 < odds;
  const payout = win
    ? Math.floor(race.payoutMin + (race.payoutMax - race.payoutMin) * (roll % 1000) / 1000)
    : 0;
  return { ok: true as const, race, odds, roll, win, payout };
}
