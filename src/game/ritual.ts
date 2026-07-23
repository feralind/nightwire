import { rollD10000 } from "@/game/rng";
import type { GameState } from "@/game/state";

export type RitualDef = {
  text: string;
  target: number;
  kind: string;
};

/** Pick a daily goal from recent play patterns */
export function pickRitual(s: GameState): RitualDef {
  const day = Math.floor(Date.now() / 86400000);
  const crimes = s.lifetime.crimesAttempted;
  const options: RitualDef[] = [
    { text: "Tonight’s move: 5 petty crimes", target: 5, kind: "petty" },
    { text: "Street heat: 3 street scores", target: 3, kind: "street" },
    { text: "Cash out: 3 job shifts", target: 3, kind: "job" },
    { text: "Side hustle: 2 gigs", target: 2, kind: "gig" },
    { text: "Study grind: put 2h into a course", target: 2, kind: "study" },
    { text: "Train the body: 3 gym sessions", target: 3, kind: "gym" },
  ];

  // Bias toward what the player already touches
  let pool = options;
  if (crimes < 3) pool = options.filter((o) => o.kind === "petty" || o.kind === "job");
  else if (s.lifetime.shiftsWorked > s.lifetime.crimesSucceeded) {
    pool = options.filter((o) => o.kind === "job" || o.kind === "gig" || o.kind === "study");
  } else if (s.level >= 5) {
    pool = options.filter((o) => o.kind !== "study" || s.activeCourseId);
  }

  const idx = rollD10000(s.seed, "ritual", day + s.actionIndex) % pool.length;
  return pool[idx];
}

export function ensureDailyRitual(s: GameState): GameState {
  const day = Math.floor(Date.now() / 86400000);
  if (s.ritual && s.ritualDay === day) return s;
  const pick = pickRitual(s);
  return {
    ...s,
    ritualDay: day,
    ritual: { ...pick, current: 0, rewardClaimed: false },
    ritualBonus: null,
  };
}

/** Call it — completion bonus or soft closure */
export function applyCallRitual(s: GameState): {
  state: GameState;
  lines: string[];
  cashDelta: number;
  title: "SUCCESS" | "MIXED";
} {
  if (!s.ritual) {
    return { state: s, lines: ["No ritual tonight."], cashDelta: 0, title: "MIXED" };
  }
  const done = s.ritual.current >= s.ritual.target;
  if (s.ritual.rewardClaimed) {
    return { state: s, lines: ["Already called it."], cashDelta: 0, title: "MIXED" };
  }

  if (done) {
    const bonusCash = 25 + s.level * 10;
    const next: GameState = {
      ...s,
      clean: s.clean + bonusCash,
      nerveMax: Math.min(20, s.nerveMax + (s.ritual.kind === "petty" || s.ritual.kind === "street" ? 1 : 0)),
      ritual: { ...s.ritual, rewardClaimed: true },
      ritualBonus: {
        kind: s.ritual.kind,
        cashMult: 1.05,
        remaining: 3,
      },
    };
    return {
      state: next,
      lines: [
        "Ritual complete. Called it.",
        `+$${bonusCash} clean`,
        "+5% cash on next 3 matching actions",
        s.ritual.kind === "petty" || s.ritual.kind === "street" ? "Nerve max +1 tonight" : "Steady hands.",
      ].filter(Boolean) as string[],
      cashDelta: bonusCash,
      title: "SUCCESS",
    };
  }

  // Psychological closure — no punishment
  return {
    state: {
      ...s,
      ritual: { ...s.ritual, rewardClaimed: true },
      happy: Math.min(s.happyMax, s.happy + 15),
    },
    lines: ["Called it early. No bonus — no shame.", "+15 happy"],
    cashDelta: 0,
    title: "MIXED",
  };
}

export function ritualKindMatches(kind: string, action: string): boolean {
  if (kind === action) return true;
  if (kind === "petty" || kind === "street" || kind === "heavy") return action === kind;
  return false;
}

/** Apply pending ritual cash mult; consume one charge */
export function applyRitualCashBonus(s: GameState, kind: string, cash: number): { state: GameState; cash: number } {
  if (!s.ritualBonus || s.ritualBonus.remaining <= 0) return { state: s, cash };
  if (!ritualKindMatches(s.ritualBonus.kind, kind)) return { state: s, cash };
  const boosted = Math.round(cash * s.ritualBonus.cashMult);
  const remaining = s.ritualBonus.remaining - 1;
  return {
    state: {
      ...s,
      ritualBonus: remaining > 0 ? { ...s.ritualBonus, remaining } : null,
    },
    cash: boosted,
  };
}
