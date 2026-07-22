export type DistrictId = "glassrow" | "millstone" | "docksreach";

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
  rank: 1 | 2;
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
  /** Job XP needed on prior rank before promote (rank 2) */
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
  requiresLevel?: number;
  requiresCourse?: string;
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
  shopStyle: "elite" | "tools" | "black";
  risk: string;
};

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
  /** Prefer this district for “nearby” flavor */
  homeDistrict?: DistrictId;
  unlockHint: string;
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
