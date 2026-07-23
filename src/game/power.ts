import type { DistrictId } from "@/game/types";
import type { GameState, PowerTracks } from "@/game/state";

/** Political bribery ladder — clean cash only; legitimacy gates pure-criminal max. */
export type PoliticalRungDef = {
  id: string;
  title: string;
  costClean: number;
  /** Min legitimacy to buy this rung (0-indexed next rung) */
  requiresLegitimacy: number;
  blurb: string;
  /** Bail cost multiplier once owned */
  bailMult: number;
  /** Heat crit-fail bonus reduction (absolute, e.g. 0.05) */
  heatCritRelief: number;
  /** Lawyer / bribe counterplay discount on clean cost */
  counterplayDiscount: number;
};

export const POLITICAL_RUNGS: PoliticalRungDef[] = [
  {
    id: "beat_cop",
    title: "Beat Cop",
    costClean: 5_000,
    requiresLegitimacy: 15,
    blurb: "A friendly face on the beat. Bail softens; lawyers listen.",
    bailMult: 0.9,
    heatCritRelief: 0.03,
    counterplayDiscount: 0.1,
  },
  {
    id: "desk_sergeant",
    title: "Desk Sergeant",
    costClean: 25_000,
    requiresLegitimacy: 30,
    blurb: "Paperwork gets lost. Bribes stick more often.",
    bailMult: 0.75,
    heatCritRelief: 0.06,
    counterplayDiscount: 0.2,
  },
  {
    id: "precinct_ally",
    title: "Precinct Ally",
    costClean: 100_000,
    requiresLegitimacy: 50,
    blurb: "Cases cool slower to warrant. Heat bites less.",
    bailMult: 0.6,
    heatCritRelief: 0.1,
    counterplayDiscount: 0.3,
  },
  {
    id: "mayors_circle",
    title: "Mayor's Circle",
    costClean: 500_000,
    requiresLegitimacy: 70,
    blurb: "Late-game civic cover. Pure street never buys this chair.",
    bailMult: 0.45,
    heatCritRelief: 0.15,
    counterplayDiscount: 0.4,
  },
];

/** Street respect flex spends — street cash buys 2× respect (half price). */
export type RespectFlexDef = {
  id: string;
  name: string;
  /** Clean-cash list price; street pays half for same respect */
  costClean: number;
  respect: number;
  blurb: string;
};

export const RESPECT_FLEX: RespectFlexDef[] = [
  {
    id: "basic_threads",
    name: "Basic threads",
    costClean: 2_000,
    respect: 25,
    blurb: "Look the part on the block.",
  },
  {
    id: "custom_suit",
    name: "Custom suit",
    costClean: 15_000,
    respect: 50,
    blurb: "Doors open a little faster.",
  },
  {
    id: "night_ride",
    name: "Night ride flex",
    costClean: 40_000,
    respect: 80,
    blurb: "Arrive loud. Street cash stretches twice as far.",
  },
  {
    id: "block_party",
    name: "Block party drop",
    costClean: 100_000,
    respect: 150,
    blurb: "Buy the neighborhood's memory for a week.",
  },
];

/** Business empire fronts — passive clean income + cheaper laundry + territory mult. */
export type BusinessTierDef = {
  tier: 1 | 2 | 3 | 4;
  id: string;
  name: string;
  costClean: number;
  requiresLegitimacy: number;
  requiresLevel: number;
  /** Optional commerce course id */
  requiresCourse?: string;
  weeklyCleanIncome: number;
  /** Street→clean laundry fee rate (base bank laundry is 0.20) */
  laundryFee: number;
  /** Multiplier on weekly income from average territory % */
  territoryIncomeMult: number;
  blurb: string;
};

export const BUSINESS_TIERS: BusinessTierDef[] = [
  {
    tier: 1,
    id: "corner_laundry",
    name: "Corner Laundromat",
    costClean: 10_000,
    requiresLegitimacy: 12,
    requiresLevel: 3,
    weeklyCleanIncome: 200,
    laundryFee: 0.15,
    territoryIncomeMult: 0.1,
    blurb: "Wash shirts by day, wash cash by night.",
  },
  {
    tier: 2,
    id: "courier_front",
    name: "Courier Front",
    costClean: 50_000,
    requiresLegitimacy: 25,
    requiresLevel: 5,
    requiresCourse: "cf1",
    weeklyCleanIncome: 800,
    laundryFee: 0.12,
    territoryIncomeMult: 0.2,
    blurb: "Legitimate invoices. Soft territory lift.",
  },
  {
    tier: 3,
    id: "pawn_consortium",
    name: "Pawn Consortium",
    costClean: 200_000,
    requiresLegitimacy: 40,
    requiresLevel: 8,
    requiresCourse: "cf2",
    weeklyCleanIncome: 2_500,
    laundryFee: 0.1,
    territoryIncomeMult: 0.35,
    blurb: "Fences with ledgers. Respect still has to be bought on the street.",
  },
  {
    tier: 4,
    id: "holding_co",
    name: "Holding Company",
    costClean: 1_000_000,
    requiresLegitimacy: 60,
    requiresLevel: 12,
    requiresCourse: "cf2",
    weeklyCleanIncome: 8_000,
    laundryFee: 0.08,
    territoryIncomeMult: 0.5,
    blurb: "Late empire. Hybrid players print clean while street flex stays separate.",
  },
];

export function emptyPowerTracks(
  districts: DistrictId[] = [
    "glassrow",
    "millstone",
    "docksreach",
    "ashcourt",
    "spireyard",
    "oldcommons",
  ]
): PowerTracks {
  const territory = {} as Record<DistrictId, number>;
  for (const d of districts) territory[d] = 0;
  return { territory, politicalRung: 0, respect: 0, businessTierOwned: 0 };
}

/** Cost to buy the next +5% territory block in a district. */
export function territoryInvestCost(currentPct: number): number {
  const pct = Math.max(0, Math.min(95, currentPct));
  return Math.round(5_000 * Math.pow(1.55, pct / 10));
}

/**
 * Home-field odds bump from territory % in current district.
 * Linear 0 → +8% at 100% (not a cliff at max).
 */
export function territoryOddsBonus(pct: number): number {
  return Math.min(0.08, Math.max(0, pct) / 100 * 0.08);
}

export function averageTerritory(power: PowerTracks): number {
  const vals = Object.values(power.territory);
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function ownedPolitical(rung: number): PoliticalRungDef | null {
  if (rung <= 0) return null;
  return POLITICAL_RUNGS[Math.min(rung, POLITICAL_RUNGS.length) - 1] ?? null;
}

export function nextPoliticalRung(rung: number): PoliticalRungDef | null {
  if (rung >= POLITICAL_RUNGS.length) return null;
  return POLITICAL_RUNGS[rung] ?? null;
}

export function politicalBuyReasons(s: GameState): { label: string; href?: string }[] {
  const next = nextPoliticalRung(s.power.politicalRung);
  if (!next) return [{ label: "Mayor's Circle already held" }];
  const reasons: { label: string; href?: string }[] = [];
  if (s.legitimacy < next.requiresLegitimacy) {
    reasons.push({
      label: `Legitimacy ≥${next.requiresLegitimacy} (have ${Math.floor(s.legitimacy)}) — jobs/gigs/courses`,
      href: "/jobs",
    });
  }
  if (s.clean < next.costClean) {
    reasons.push({ label: `Need ${next.costClean.toLocaleString("en-US")} clean cash`, href: "/bank" });
  }
  return reasons;
}

export function canBuyPolitical(s: GameState): boolean {
  return politicalBuyReasons(s).length === 0 && nextPoliticalRung(s.power.politicalRung) !== null;
}

/** Effective bail after political discounts. */
export function politicalBailMult(rung: number): number {
  const owned = ownedPolitical(rung);
  return owned?.bailMult ?? 1;
}

export function politicalHeatCritRelief(rung: number): number {
  return ownedPolitical(rung)?.heatCritRelief ?? 0;
}

export function politicalCounterplayDiscount(rung: number): number {
  return ownedPolitical(rung)?.counterplayDiscount ?? 0;
}

/**
 * Street respect soft odds on street-tier crimes.
 * Caps at +5% at 250 respect.
 */
export function respectStreetOddsBonus(respect: number): number {
  return Math.min(0.05, Math.max(0, respect) / 250 * 0.05);
}

/** Attack loot mult from respect (1 → 1.12 at 200+). */
export function respectLootMult(respect: number): number {
  return 1 + Math.min(0.12, Math.max(0, respect) / 200 * 0.12);
}

export function respectTitle(respect: number): string | null {
  if (respect >= 400) return "Legend of the Block";
  if (respect >= 200) return "Feared";
  if (respect >= 100) return "Known Face";
  if (respect >= 50) return "Connected";
  if (respect >= 25) return "Looked At";
  return null;
}

export function respectFlexPay(flex: RespectFlexDef, useStreet: boolean): number {
  return useStreet ? Math.round(flex.costClean / 2) : flex.costClean;
}

export function ownedBusiness(tierOwned: number): BusinessTierDef | null {
  if (tierOwned <= 0) return null;
  return BUSINESS_TIERS[Math.min(tierOwned, BUSINESS_TIERS.length) - 1] ?? null;
}

export function nextBusinessTier(tierOwned: number): BusinessTierDef | null {
  if (tierOwned >= BUSINESS_TIERS.length) return null;
  return BUSINESS_TIERS[tierOwned] ?? null;
}

export function businessBuyReasons(s: GameState): { label: string; href?: string }[] {
  const next = nextBusinessTier(s.power.businessTierOwned);
  if (!next) return [{ label: "Holding Company already owned" }];
  const reasons: { label: string; href?: string }[] = [];
  if (s.level < next.requiresLevel) {
    reasons.push({ label: `Level ≥${next.requiresLevel}`, href: "/profile" });
  }
  if (s.legitimacy < next.requiresLegitimacy) {
    reasons.push({
      label: `Legitimacy ≥${next.requiresLegitimacy} (have ${Math.floor(s.legitimacy)})`,
      href: "/jobs",
    });
  }
  if (next.requiresCourse && !s.completedCourses.includes(next.requiresCourse)) {
    reasons.push({ label: `Course ${next.requiresCourse}`, href: "/education" });
  }
  if (s.clean < next.costClean) {
    reasons.push({ label: `Need ${next.costClean.toLocaleString("en-US")} clean`, href: "/bank" });
  }
  return reasons;
}

export function canBuyBusiness(s: GameState): boolean {
  return businessBuyReasons(s).length === 0 && nextBusinessTier(s.power.businessTierOwned) !== null;
}

/** Laundry fee rate — business fronts beat the base 20% bank laundry. */
export function laundryFeeRate(businessTierOwned: number): number {
  const biz = ownedBusiness(businessTierOwned);
  return biz?.laundryFee ?? 0.2;
}

/**
 * Weekly clean income from business, scaled by hours and territory footprint.
 * territoryIncomeMult applies as bonus from average district influence.
 */
export function businessIncomeForHours(
  power: PowerTracks,
  hours: number
): { income: number; label: string } {
  const biz = ownedBusiness(power.businessTierOwned);
  if (!biz || hours < 1) return { income: 0, label: "" };
  const avg = averageTerritory(power);
  const terrBonus = 1 + biz.territoryIncomeMult * (avg / 100);
  const income = Math.floor(biz.weeklyCleanIncome * terrBonus * (hours / 168));
  return {
    income,
    label: income > 0 ? `${biz.name} revenue +$${income}` : "",
  };
}

/** Snapshot meters for UI / hybrid progress. */
export function powerMeters(s: GameState): {
  territoryAvg: number;
  political: number;
  respect: number;
  business: number;
  hybridHint: string;
} {
  const territoryAvg = averageTerritory(s.power);
  const political = (s.power.politicalRung / POLITICAL_RUNGS.length) * 100;
  const respect = Math.min(100, (s.power.respect / 400) * 100);
  const business = (s.power.businessTierOwned / BUSINESS_TIERS.length) * 100;
  let hybridHint = "Hybrid path: clean legitimacy for politics + street flex for respect.";
  if (political >= 50 && respect < 25) {
    hybridHint = "Legal-heavy — street flex needed to raise Respect.";
  } else if (respect >= 50 && political < 25) {
    hybridHint = "Street-heavy — earn legitimacy (jobs/gigs) to climb Political.";
  } else if (political >= 50 && respect >= 50) {
    hybridHint = "Hybrid online — Business + Territory compound clean power.";
  }
  return { territoryAvg, political, respect, business, hybridHint };
}
