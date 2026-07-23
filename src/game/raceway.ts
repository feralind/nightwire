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
  /** Soft heat on illegal street races */
  heatOnEnter?: number;
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
    heatOnEnter: 2,
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
    heatOnEnter: 4,
  },
  {
    id: "commons_drift",
    name: "Commons drift",
    entryFee: 400,
    streetOk: true,
    energy: 4,
    blurb: "Brick corners and tram gaps. Illegal heat on entry.",
    payoutMin: 650,
    payoutMax: 1500,
    requiresLevel: 2,
    heatOnEnter: 3,
  },
  {
    id: "pier_sprint",
    name: "Pier sprint",
    entryFee: 900,
    streetOk: true,
    energy: 5,
    blurb: "Neon reflections on wet boards. Field of ghosts at midnight.",
    payoutMin: 1400,
    payoutMax: 3200,
    requiresLevel: 4,
    heatOnEnter: 5,
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
  {
    id: "mill_night",
    name: "Mill night trial",
    entryFee: 1200,
    streetOk: false,
    energy: 5,
    blurb: "Licensed circuit behind the yards. Clean ledger only.",
    payoutMin: 2200,
    payoutMax: 5000,
    requiresLevel: 5,
  },
];

export type RaceSector = {
  name: string;
  won: boolean;
  roll: number;
  need: number;
};

export function raceOdds(s: GameState, race: RaceDef) {
  const parts = s.inventory.filter(
    (i) => i.itemId.includes("bike") || i.itemId.includes("ecu") || i.itemId.includes("tire")
  ).length;
  const garage = s.safehouseRooms?.garage ?? 0;
  const skill =
    s.spd * 0.5 +
    s.dex * 0.3 +
    s.level * 2 +
    parts * 4 +
    garage * 3 +
    (s.power.respect >= 50 ? 5 : 0);
  const difficulty = 40 + race.requiresLevel * 8;
  const odds = Math.max(0.12, Math.min(0.82, skill / (skill + difficulty)));
  return { odds, skill, difficulty };
}

/** Three-segment race: start / corner / finish. Win if ≥2 sectors. */
export function resolveRace(s: GameState, raceId: string) {
  const race = RACES.find((r) => r.id === raceId);
  if (!race) return { ok: false as const, reason: "Unknown race" };
  if (s.level < race.requiresLevel) return { ok: false as const, reason: `Need level ${race.requiresLevel}` };
  if (s.energy < race.energy) return { ok: false as const, reason: "Not enough energy" };
  const canPay = race.streetOk ? s.street + s.clean >= race.entryFee : s.clean >= race.entryFee;
  if (!canPay) return { ok: false as const, reason: "Cannot afford entry" };

  const { odds, skill, difficulty } = raceOdds(s, race);
  const sectors: RaceSector[] = [];
  const names = ["Launch", "Corner", "Finish"] as const;
  for (let i = 0; i < 3; i++) {
    const roll = rollD10000(s.seed, `race:${raceId}:seg${i}`, s.actionIndex);
    const need = Math.floor((1 - odds) * 10000);
    const won = roll >= need;
    sectors.push({ name: names[i], won, roll, need });
  }
  const wins = sectors.filter((x) => x.won).length;
  const win = wins >= 2;
  const payout = win
    ? Math.floor(race.payoutMin + ((race.payoutMax - race.payoutMin) * (sectors[2].roll % 1000)) / 1000)
    : 0;
  const roll = sectors.reduce((a, x) => a + x.roll, 0);
  return { ok: true as const, race, odds, skill, difficulty, roll, win, payout, sectors, sectorWins: wins };
}
