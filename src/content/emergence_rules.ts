/**
 * Data-driven emergence rules (≥30).
 * Consumed by tick catch-up (`away` / `pressure`) and the director ticker (`director`).
 */

export type EmergenceKind = "director" | "away" | "pressure";

export type EmergenceRule = {
  id: string;
  name: string;
  kind: EmergenceKind;
  /** Player-facing ticker / log label */
  label: string;
  /** Relative pick weight for director (default 1) */
  weight?: number;
  /** Min hours away before this away/pressure rule can fire */
  minHours?: number;
  /** Heat floor */
  minHeat?: number;
  /** Street cash floor */
  minStreet?: number;
  /** Require owned property */
  requireProperty?: boolean;
  /** Require business front */
  requireBusiness?: boolean;
  /** Require investigation stage ≥ n */
  minInvestigation?: number;
  /** Require rival score ≥ n */
  minRivalScore?: number;
  /** Soft chance 0–1 when conditions met (away/pressure) */
  chance?: number;
  /** Effect tags interpreted by emergence engine */
  effect:
    | "director_spawn"
    | "property_raid"
    | "street_seize"
    | "heat_bleed"
    | "stress_spike"
    | "happy_dip"
    | "audit_nudge"
    | "rival_whisper"
    | "market_jitter"
    | "comp_sting"
    | "ward_siren"
    | "harbor_fog"
    | "festival_spill"
    | "blackout_glitch"
    | "strike_slow"
    | "sweep_pressure"
    | "laundry_tip"
    | "gym_echo"
    | "bank_notice"
    | "contact_ping";
};

export const EMERGENCE_RULES: EmergenceRule[] = [
  // —— Director (city ticker) ——
  {
    id: "dir_outage",
    name: "Glassrow outage",
    kind: "director",
    label: "Power outage in Glassrow",
    weight: 1,
    effect: "blackout_glitch",
  },
  {
    id: "dir_strike",
    name: "Harbor strike",
    kind: "director",
    label: "Harbor strike in DocksReach",
    weight: 1,
    effect: "strike_slow",
  },
  {
    id: "dir_festival",
    name: "Glassrow festival",
    kind: "director",
    label: "Festival crowds in Glassrow",
    weight: 1,
    effect: "festival_spill",
  },
  {
    id: "dir_sweep",
    name: "Police sweep",
    kind: "director",
    label: "Police sweep",
    weight: 1.2,
    effect: "sweep_pressure",
  },
  {
    id: "dir_fog",
    name: "Harbor fog bank",
    kind: "director",
    label: "Fog bank swallows DocksReach cameras",
    weight: 0.9,
    effect: "harbor_fog",
  },
  {
    id: "dir_siren",
    name: "Ward siren drill",
    kind: "director",
    label: "Red Clinic siren drill — traffic snarls",
    weight: 0.8,
    effect: "ward_siren",
  },
  {
    id: "dir_neon",
    name: "Pier brownout",
    kind: "director",
    label: "Neon Pier brownout — tourist wallets loud",
    weight: 0.85,
    effect: "festival_spill",
  },
  {
    id: "dir_mill",
    name: "Yard inspection",
    kind: "director",
    label: "Millstone yard inspection — tools get scarce",
    weight: 0.85,
    effect: "market_jitter",
  },
  {
    id: "dir_spire",
    name: "Spire lobby lock",
    kind: "director",
    label: "SpireYard lobby lockdown — elite doors stiff",
    weight: 0.7,
    effect: "sweep_pressure",
  },
  {
    id: "dir_commons",
    name: "Commons blackout party",
    kind: "director",
    label: "OldCommons blackout party — soft heat bleed",
    weight: 0.75,
    effect: "blackout_glitch",
  },
  {
    id: "dir_ash",
    name: "Civic audit week",
    kind: "director",
    label: "Ashcourt civic audit week — paper bites",
    weight: 0.8,
    effect: "audit_nudge",
  },
  {
    id: "dir_race",
    name: "Ghost field meet",
    kind: "director",
    label: "Illegal ghost-field meet advertised on chalk",
    weight: 0.7,
    effect: "market_jitter",
  },

  // —— Away recipes (catch-up hours) ——
  {
    id: "away_raid",
    name: "Property raid pressure",
    kind: "away",
    label: "Raid pressure on owned property",
    minHours: 8,
    minHeat: 70,
    requireProperty: true,
    chance: 0.35,
    effect: "property_raid",
  },
  {
    id: "away_seize",
    name: "Street cash seizure",
    kind: "away",
    label: "Street cash seizure risk",
    minHours: 1,
    minHeat: 50,
    minStreet: 10000,
    chance: 0.05,
    effect: "street_seize",
  },
  {
    id: "away_heat_bleed",
    name: "Quiet night bleed",
    kind: "away",
    label: "Quiet nights cool the wires",
    minHours: 12,
    minHeat: 20,
    chance: 0.4,
    effect: "heat_bleed",
  },
  {
    id: "away_stress",
    name: "Away anxiety",
    kind: "away",
    label: "Long absence spikes stress",
    minHours: 24,
    chance: 0.25,
    effect: "stress_spike",
  },
  {
    id: "away_happy",
    name: "Cabin fever",
    kind: "away",
    label: "Cabin fever dips happy",
    minHours: 36,
    chance: 0.3,
    effect: "happy_dip",
  },
  {
    id: "away_audit",
    name: "Front audit whisper",
    kind: "away",
    label: "Aggressive books draw an audit whisper",
    minHours: 8,
    requireBusiness: true,
    chance: 0.12,
    effect: "audit_nudge",
  },
  {
    id: "away_rival",
    name: "Rival chalk while away",
    kind: "away",
    label: "Vex leaves chalk while you're gone",
    minHours: 8,
    minRivalScore: 5,
    chance: 0.2,
    effect: "rival_whisper",
  },
  {
    id: "away_market",
    name: "Listing dust",
    kind: "away",
    label: "Market listings gather dust / jitter",
    minHours: 6,
    chance: 0.15,
    effect: "market_jitter",
  },
  {
    id: "away_comp",
    name: "Comp expire sting",
    kind: "away",
    label: "Casino comps feel colder after long away",
    minHours: 48,
    chance: 0.1,
    effect: "comp_sting",
  },
  {
    id: "away_laundry",
    name: "Laundry tip",
    kind: "away",
    label: "A clerk tips you about quieter wash windows",
    minHours: 10,
    requireBusiness: true,
    chance: 0.18,
    effect: "laundry_tip",
  },
  {
    id: "away_bank",
    name: "Bank notice",
    kind: "away",
    label: "Bank clerk leaves a polite notice",
    minHours: 16,
    chance: 0.12,
    effect: "bank_notice",
  },
  {
    id: "away_contact",
    kind: "away",
    name: "Contact ping",
    label: "A contact pings the wire while you're away",
    minHours: 8,
    chance: 0.14,
    effect: "contact_ping",
  },
  {
    id: "away_gym",
    name: "Gym echo",
    kind: "away",
    label: "Missed gym echoes in the joints",
    minHours: 20,
    chance: 0.16,
    effect: "gym_echo",
  },
  {
    id: "away_inv",
    name: "Case cool whisper",
    kind: "away",
    label: "Investigation cools if you stay scarce",
    minHours: 24,
    minInvestigation: 1,
    chance: 0.22,
    effect: "heat_bleed",
  },

  // —— Soft pressure (shorter / ambient) ——
  {
    id: "press_heat",
    name: "Ambient heat pressure",
    kind: "pressure",
    label: "Ambient heat presses the ledger",
    minHours: 2,
    minHeat: 55,
    chance: 0.2,
    effect: "stress_spike",
  },
  {
    id: "press_street",
    name: "Loud street wallet",
    kind: "pressure",
    label: "Unbanked street cash feels loud",
    minHours: 3,
    minStreet: 5000,
    minHeat: 40,
    chance: 0.18,
    effect: "street_seize",
  },
  {
    id: "press_sweep",
    name: "Soft sweep rumor",
    kind: "pressure",
    label: "Sweep rumor raises shoulders",
    minHours: 1,
    minHeat: 45,
    chance: 0.15,
    effect: "sweep_pressure",
  },
  {
    id: "press_rival",
    name: "Rival rumor",
    kind: "pressure",
    label: "Someone says Vex asked about you",
    minHours: 4,
    minRivalScore: 1,
    chance: 0.12,
    effect: "rival_whisper",
  },
  {
    id: "press_happy",
    name: "Grey weather",
    kind: "pressure",
    label: "Grey weather dips the mood",
    minHours: 5,
    chance: 0.1,
    effect: "happy_dip",
  },
  {
    id: "press_fog",
    name: "Morning fog",
    kind: "pressure",
    label: "Morning fog softens camera eyes",
    minHours: 2,
    chance: 0.12,
    effect: "harbor_fog",
  },
];

export function directorRules(): EmergenceRule[] {
  return EMERGENCE_RULES.filter((r) => r.kind === "director");
}

export function awayRules(): EmergenceRule[] {
  return EMERGENCE_RULES.filter((r) => r.kind === "away" || r.kind === "pressure");
}

export function getEmergenceRule(id: string): EmergenceRule | undefined {
  return EMERGENCE_RULES.find((r) => r.id === id);
}
