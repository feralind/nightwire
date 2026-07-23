/** Difficulty / mod modes — persist on GameState, affect odds / costs / regen. */

export type DifficultyId = "easier" | "standard" | "hard";

export type DifficultyDef = {
  id: DifficultyId;
  label: string;
  blurb: string;
  /** Multiplier on crime difficulty divisor (lower = easier odds) */
  crimeDifficultyMult: number;
  /** Extra flat odds after sigmoid clamp (before 0.05–0.85) — applied as skill bonus */
  oddsSkillBonus: number;
  /** Shop / course / medical / bail cost multiplier */
  costMult: number;
  /** Regen interval multiplier (<1 = faster regen) */
  regenIntervalMult: number;
  /** Heat gain multiplier on crime outcomes */
  heatMult: number;
  /** Job/gig pay multiplier */
  payMult: number;
};

export const DIFFICULTIES: Record<DifficultyId, DifficultyDef> = {
  easier: {
    id: "easier",
    label: "Easier",
    blurb: "Softer odds, faster regen, cheaper sinks, less heat.",
    crimeDifficultyMult: 0.88,
    oddsSkillBonus: 4,
    costMult: 0.85,
    regenIntervalMult: 0.75,
    heatMult: 0.75,
    payMult: 1.1,
  },
  standard: {
    id: "standard",
    label: "Standard",
    blurb: "Default Nightwire balance.",
    crimeDifficultyMult: 1,
    oddsSkillBonus: 0,
    costMult: 1,
    regenIntervalMult: 1,
    heatMult: 1,
    payMult: 1,
  },
  hard: {
    id: "hard",
    label: "Hard",
    blurb: "Tighter odds, slower regen, pricier sinks, meaner heat.",
    crimeDifficultyMult: 1.12,
    oddsSkillBonus: -3,
    costMult: 1.15,
    regenIntervalMult: 1.25,
    heatMult: 1.25,
    payMult: 0.92,
  },
};

export function normalizeDifficulty(raw: unknown): DifficultyId {
  if (raw === "easier" || raw === "hard" || raw === "standard") return raw;
  return "standard";
}

export function getDifficulty(id: DifficultyId | undefined | null): DifficultyDef {
  return DIFFICULTIES[normalizeDifficulty(id)];
}

/** Scale catalog crime difficulty for odds math. */
export function scaleCrimeDifficulty(baseDifficulty: number, mode: DifficultyId): number {
  const d = getDifficulty(mode);
  return Math.max(8, baseDifficulty * d.crimeDifficultyMult);
}

export function scaleCost(amount: number, mode: DifficultyId): number {
  return Math.max(1, Math.round(amount * getDifficulty(mode).costMult));
}

export function scalePay(amount: number, mode: DifficultyId): number {
  return Math.max(0, Math.round(amount * getDifficulty(mode).payMult));
}

export function scaleHeatGain(heat: number, mode: DifficultyId): number {
  return heat * getDifficulty(mode).heatMult;
}

/** Energy/nerve tick interval ms under difficulty. */
export function regenIntervalMs(baseMs: number, mode: DifficultyId): number {
  return Math.max(60_000, Math.round(baseMs * getDifficulty(mode).regenIntervalMult));
}
