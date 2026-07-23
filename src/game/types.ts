export type DistrictId =
  | "glassrow"
  | "millstone"
  | "docksreach"
  | "ashcourt"
  | "spireyard"
  | "oldcommons"
  | "neonpier"
  | "redclinic";

export type CrimeTier = "petty" | "street" | "heavy";

export type CrimeDef = {
  id: string;
  name: string;
  tier: CrimeTier;
  nerve: number;
  difficulty: number;
  cashMin: number;
  cashMax: number;
  xp: number;
  heat: number;
  failDamage: number;
  requiresTool?: string;
  requiresLevel?: number;
  requiresCourse?: string;
  favoredDistricts: DistrictId[];
  family: "petty" | "street" | "heavy";
};

export type JobDef = {
  id: string;
  career: string;
  rank: 1 | 2 | 3 | 4;
  title: string;
  basePay: number;
  energy: number;
  districtBias: DistrictId[];
  special: string;
  blurb: string;
  /** Min player level to apply (rank 1) */
  requiresLevel?: number;
  /** Course required to apply (rank 1) or to unlock apply path */
  requiresCourse?: string;
  /** Job XP needed on prior rank before promote */
  promoteXp?: number;
  /** Exam course required to promote into this rank */
  promoteCourse?: string;
  /** Soft crime odds bump for these families while employed */
  specialtyFamilies?: Array<"petty" | "street" | "heavy">;
  /** Soft crime odds bump for specific crimes while employed */
  specialtyCrimeIds?: string[];
};

export type CourseDef = {
  id: string;
  school: string;
  name: string;
  hours: number;
  fee: number;
  stipendPerHour: number;
  blurb: string;
  unlocks?: string[];
  oddsBonus?: number;
  /** Which crime families get oddsBonus */
  oddsFamilies?: Array<"petty" | "street" | "heavy">;
  jobPayBonus?: number;
  gigPayBonus?: number;
  softCapBonus?: number;
  bankInterestBonus?: number;
  /** Percent cut on new hospital stays (caps stacked elsewhere) */
  hospitalTimeReduction?: number;
  requiresLevel?: number;
  requiresCourse?: string;
};

/** Permanent cert granted when its course completes — legal economy multipliers */
export type LicenseDef = {
  id: string;
  name: string;
  /** Course that grants this license on completion */
  courseId: string;
  blurb: string;
  jobPayBonus?: number;
  bankInterestBonus?: number;
  oddsBonus?: number;
  oddsFamilies?: Array<"petty" | "street" | "heavy">;
  /** Percent cut on new hospital stays */
  hospitalTimeReduction?: number;
  /** Clean $/week while holding (scaled by hours in tick) */
  weeklyStipend?: number;
  /** One-shot legitimacy when first earned (not on backfill) */
  legitimacyGain?: number;
};

/** Short legal contracts — available unemployed; clean cash faucet */
export type GigDef = {
  id: string;
  name: string;
  blurb: string;
  basePay: number;
  energy: number;
  districtBias: DistrictId[];
  /** Soft civic gate — heat above this blocks the gig */
  maxHeat?: number;
  requiresLevel?: number;
  requiresCourse?: string;
  /** Must be enrolled or have finished any course */
  requiresStudy?: boolean;
  legitimacyGain?: number;
  /** Optional happy bump (leisure-leaning gigs) */
  happyGain?: number;
  special?: string;
};

export type ItemDef = {
  id: string;
  name: string;
  kind: "tool" | "weapon" | "armor" | "consumable" | "misc" | "flex";
  baseValue: number;
  toolMod?: number;
  description: string;
};

export type DistrictDef = {
  id: DistrictId;
  name: string;
  crimeBias: Partial<Record<CrimeTier, number>>;
  travelCost: number;
  travelSeconds: number;
  shopStyle: "elite" | "tools" | "black" | "medical";
  risk: string;
};

/** Explicit presentation for adult-banter filters (never infer slutty from unknown). */
export type PersonGender = "female" | "male" | "unknown";

/** Diegetic voice — `slutty` only applies when gender is female + settings allow. */
export type PersonPersona = "noir" | "slutty";

export type NpcDef = {
  id: string;
  name: string;
  title: string;
  district: DistrictId;
  /** Aggregate combat power used for fairness UI + rolls */
  power: number;
  str: number;
  def: number;
  spd: number;
  dex: number;
  life: number;
  lootMin: number;
  lootMax: number;
  heatOnWin: number;
  heatOnLose: number;
  energyCost: number;
  flavor: string;
  /** Optional sultry flavor when adultNpc is on (female + slutty only). */
  flavorSlutty?: string;
  gender?: PersonGender;
  persona?: PersonPersona;
};

export type PropertyDef = {
  id: string;
  name: string;
  district: DistrictId;
  cost: number;
  /** Clean rent per week */
  weeklyIncome: number;
  /** Clean upkeep per week (always due while owned) */
  weeklyUpkeep: number;
  blurb: string;
  /** Soft heat pressure multiplier when raided (1 = normal) */
  raidRisk?: number;
};

/** Safehouse room upgrades — global levels across owned properties */
export type SafehouseRoomId = "vault" | "cot" | "study" | "armory" | "garage";

export type SafehouseRoomDef = {
  id: SafehouseRoomId;
  name: string;
  blurb: string;
  maxLevel: 3;
  /** Cost to reach level 1 / 2 / 3 */
  cleanCosts: [number, number, number];
  streetCosts: [number, number, number];
};

export type AwardCategory = "crime" | "work" | "body" | "city" | "money" | "story";

export type AwardDef = {
  id: string;
  name: string;
  blurb: string;
  category: AwardCategory;
};

/** Nightwire people layer — tips, favors, soft pressure hooks (not Torn copy) */
export type ContactActionId =
  | "ping"
  | "tip"
  | "retain"
  | "cool_case"
  | "office_hours"
  | "walk_off"
  | "ask_favor";

export type ContactDef = {
  id: string;
  name: string;
  role: string;
  district?: DistrictId;
  blurb: string;
  /** Adult-setting alternate dossier line (female + slutty only). */
  blurbSlutty?: string;
  /** Prefer this district for “nearby” flavor */
  homeDistrict?: DistrictId;
  unlockHint: string;
  /** Explicit gender for persona filters */
  gender: PersonGender;
  /** Default noir; slutty only honored for female + adultNpc */
  persona?: PersonPersona;
  actions: {
    id: ContactActionId;
    label: string;
    blurb: string;
    /** Favor required to use (0 = none) */
    favorCost?: number;
    /** Clean or street cash cost */
    cleanCost?: number;
    streetCost?: number;
  }[];
};

/** Organized crime prep board — multi-step, not a single Attempt */
export type HeistStageKind = "intel" | "crew" | "kit" | "window" | "execute";

export type HeistRisk = "moderate" | "high" | "extreme";

export type HeistStageDef = {
  id: string;
  kind: HeistStageKind;
  name: string;
  blurb: string;
  energy?: number;
  nerve?: number;
  streetCost?: number;
  cleanCost?: number;
  /** Consumed from inventory into staged prep (can be lost on fail) */
  requireItems?: { itemId: string; qty: number }[];
  /** Prep-step success chance (0–1). Execute uses phase rolls instead. */
  successChance?: number;
  heatOnFail?: number;
};

export type HeistDef = {
  id: string;
  name: string;
  blurb: string;
  district: DistrictId;
  risk: HeistRisk;
  requiresLevel?: number;
  requiresCourse?: string;
  /** Soft-house / staging property gate */
  requiresProperty?: string;
  /** Exact job or same career at equal/higher rank */
  requiresJob?: string;
  /** Must have visited this district at least once */
  requiresVisitedDistrict?: DistrictId;
  payoutMin: number;
  payoutMax: number;
  xp: number;
  heatOnSuccess: number;
  heatOnFail: number;
  /** Hours before the board can be run again after completion or hard fail */
  cooldownHours: number;
  stages: HeistStageDef[];
};

export type HeistExecutePhase = "approach" | "breach" | "extract";
export type HeistExecuteChoice = "push" | "abort" | "sacrifice";
export type HeistRank = "C" | "B" | "A" | "S";
