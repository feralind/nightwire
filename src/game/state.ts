import { normalizeColorblindPack, type ColorblindPackId } from "@/game/accessibility";
import { normalizeDifficulty, type DifficultyId } from "@/game/difficulty";
import { syncLicenses } from "@/game/licenses";
import { emptyMarket, type MarketState } from "@/game/market";
import { emptyMissions, type MissionsState } from "@/game/missions";
import {
  EMPTY_SAFEHOUSE_ROOMS,
  normalizeSafehouseRooms,
  type SafehouseRooms,
} from "@/game/safehouse";
import { emptyStocks, type StocksState } from "@/game/stocks";
import type { DistrictId, HeistExecutePhase, HeistRank } from "@/game/types";

export type InvestigationStage = 0 | 1 | 2 | 3 | 4;

/** Per-board progress for organized heist prep */
export type PrepBoardState = {
  completedStageIds: string[];
  stagedItems: { itemId: string; qty: number }[];
  sunkStreet: number;
  sunkClean: number;
  /** Window stage landed during night hours */
  windowNight: boolean;
  /** Live multi-roll execute phase, or null when not executing */
  executePhase: HeistExecutePhase | null;
  cooldownUntil: number | null;
  completions: number;
  bestRank: HeistRank | null;
};

export type LogEntry = {
  id: number;
  ts: number;
  text: string;
  kind: "system" | "diegetic" | "result";
};

export type TimelineKind =
  | "arrival"
  | "level"
  | "rank"
  | "award"
  | "crime"
  | "work"
  | "heist"
  | "rival"
  | "city"
  | "story";

export type TimelineEntry = {
  id: string;
  kind: TimelineKind;
  title: string;
  detail: string;
  ts: number;
};

export type OddsModifier = { label: string; value: number };

/** Presentational Attempt ritual payload — does not change roll math */
export type AttemptRitualBreakdown = {
  /** Deterministic roll input: seed + actionKey + actionIndex → rollD10000 */
  seed: string;
  actionKey: string;
  actionIndex: number;
  /** Raw 0..9999 roll from rollD10000 */
  roll: number;
  /** Final odds that applied (0..1) */
  odds: number;
  /** EV at attempt time */
  ev: number;
  /** Skill levers from getCrimeOddsView / computeCrimeOdds */
  modifiers: OddsModifier[];
};

export type ResultModalState = {
  title: "SUCCESS" | "FAILED" | "JAILED" | "HOSPITALIZED" | "MIXED";
  lines: string[];
  cashDelta: number;
  repeatable?: { type: "crime" | "job" | "gig"; id: string };
  ritual?: AttemptRitualBreakdown;
} | null;

export type AwayModalState = {
  hours: number;
  legal: string[];
  street: string[];
  city: string[];
  progress: string[];
} | null;

export type InventorySlot = {
  itemId: string;
  qty: number;
  equipped?: boolean;
};

export type MasteryState = Record<string, { attempts: number; cash: number; level: number; streak: number }>;

export type PowerTracks = {
  territory: Record<DistrictId, number>;
  politicalRung: number;
  respect: number;
  businessTierOwned: number;
  /** 0 = closed books, 1 = aggressive accounting (more clean/hr, inspection risk) */
  businessRisk: 0 | 1;
  /** Hired clerks on the front (0–2) — wages + soft laundry/income lift */
  businessStaff: number;
};

export type LifetimeStats = {
  crimesAttempted: number;
  crimesSucceeded: number;
  shiftsWorked: number;
  gigsDone: number;
  promotions: number;
  gymSessions: number;
  travels: number;
  attacksWon: number;
  attacksLost: number;
  bankDeposits: number;
  interestEarned: number;
  rentCollected: number;
  timesJailed: number;
  peakHeat: number;
  peakBank: number;
  peakNetworth: number;
  districtsVisited: DistrictId[];
  contactUses: number;
  favorSpent: number;
  tipsBought: number;
  heistsCompleted: number;
  missionsCompleted: number;
};

/** Per-contact dossier progress */
export type ContactProgress = {
  favor: number;
  uses: number;
  lastAt: number | null;
};

/** Temporary tip bought from a contact */
export type ContactTip = {
  contactId: string;
  /** Crime family odds bump while active */
  family?: "petty" | "street" | "heavy";
  /** Specific crime ids (optional narrower tip) */
  crimeIds?: string[];
  oddsBonus: number;
  until: number;
  label: string;
};

export type GameState = {
  version: 1;
  created: boolean;
  seed: string;
  name: string;
  playerId: number;
  district: DistrictId;
  level: number;
  xp: number;
  rankIndex: number;
  identitySubtitle: string;

  energy: number;
  energyMax: number;
  nerve: number;
  nerveMax: number;
  happy: number;
  happyMax: number;
  life: number;
  lifeMax: number;

  clean: number;
  street: number;
  bank: number;

  str: number;
  def: number;
  spd: number;
  dex: number;

  heat: number;
  stress: number;
  investigation: InvestigationStage;
  investigationDeadline: number | null;
  legitimacy: number;

  hospitalUntil: number | null;
  jailUntil: number | null;
  travelUntil: number | null;
  travelTarget: DistrictId | null;
  /** Lay-low timer — blocks street actions until expiry, then sheds investigation */
  laylowUntil: number | null;
  /** Soft combat debuffs until hospital discharge or natural decay (0–2 notches) */
  wounds: { arm: number; leg: number };
  /** Shared cooldown for leisure / cot rest / outpatient chair */
  leisureUntil: number | null;
  hospitalReason: string | null;
  jailReason: string | null;

  /** Cumulative street $ spent at shops this district visit */
  streetSpendVisit: number;
  shopSpendDistrict: DistrictId | null;

  jobId: string | null;
  jobXp: number;
  shiftsThisWeek: number;
  gigsThisWeek: number;
  weekStart: number;
  /** Recent shift outcomes for Employment UI */
  shiftLog: { quality: string; pay: number; special?: string; at: number }[];
  /** Recent gig outcomes */
  gigLog: { gigId: string; quality: string; pay: number; special?: string; at: number }[];

  activeCourseId: string | null;
  courseProgressHours: number;
  completedCourses: string[];
  /** License ids earned from completed courses */
  licenses: string[];

  inventory: InventorySlot[];
  ownedProperties: string[];
  /** Global safehouse room levels (0–3) across owned properties */
  safehouseRooms: SafehouseRooms;

  chainFamily: string | null;
  chainLevel: number;
  chainUpdatedAt: number;

  actionIndex: number;
  lastTickAt: number;
  lastAwayAt: number;

  logs: LogEntry[];
  logSeq: number;

  gymToday: Record<string, number>;
  gymDay: string;

  rivalFlags: Record<string, boolean>;
  rivalScore: number;
  rivalLast: string;
  /** Last rival pressure tick bucket (hour) to avoid spam */
  rivalPressureAt: number;

  /** Contact dossiers — unlock is derived; favor/uses persist */
  contacts: Record<string, ContactProgress>;
  /** Active intel tips from contacts */
  contactTips: ContactTip[];

  /** Organized heist prep boards — keyed by heist id */
  prepBoards: Record<string, PrepBoardState>;

  ritual: { text: string; current: number; target: number; kind: string; rewardClaimed: boolean } | null;
  /** Calendar day the current ritual was minted */
  ritualDay: number;
  /** Post-Call-it temporary bonus */
  ritualBonus: { kind: string; cashMult: number; remaining: number } | null;
  mastery: MasteryState;
  power: PowerTracks;

  bazaar: { listings: { itemId: string; price: number; seller?: string }[]; day: number };
  /** Peer trading board — NPC brokers + player listings */
  market: MarketState;
  /** District paper / speculative shares */
  stocks: StocksState;
  /** Contract / mission board */
  missions: MissionsState;
  directorEvent: { id: string; label: string; until: number } | null;

  /** Faction reputation -100..100 */
  factionRep: Record<string, number>;
  /** Assists during current war week (resets when week flips) */
  factionAssistsWar: number;
  factionWarWeek: number;
  /** Posted NPC bounties */
  bounties: { npcId: string; payout: number; postedAt: number; expiresAt: number }[];
  raceWins: number;
  /** Casino comp points → suite leisure */
  compPoints: number;
  casinoWinStreak: number;
  casinoLossStreak: number;

  lastCrimeId: string | null;
  lastJobId: string | null;
  lastGigId: string | null;

  lifetime: LifetimeStats;
  /** awardId → unlockedAt ms */
  unlockedAwards: Record<string, number>;
  /** Persisted player milestones (normalize backfills from lifetime/awards) */
  timeline: TimelineEntry[];

  density: "classic" | "comfortable";
  /** Boosted borders / text / vitals for readability */
  highContrast: boolean;
  /** Colorblind-friendly palette pack (CSS data-attribute) */
  colorblindPack: ColorblindPackId;
  /** Gameplay difficulty / mod mode */
  difficulty: DifficultyId;
  /** Optional Grok / xAI city-life flavor (server-side; falls back offline) */
  aiLife: boolean;
  /** Adult NPC banter — enables slutty-tagged female contact/NPC voice */
  adultNpc: boolean;
  /** Last procedural city-life day event id (dedupe diegetic logs) */
  cityLifeDayEventId: string | null;
};

export function emptyLifetime(district: DistrictId = "glassrow"): LifetimeStats {
  return {
    crimesAttempted: 0,
    crimesSucceeded: 0,
    shiftsWorked: 0,
    gigsDone: 0,
    promotions: 0,
    gymSessions: 0,
    travels: 0,
    attacksWon: 0,
    attacksLost: 0,
    bankDeposits: 0,
    interestEarned: 0,
    rentCollected: 0,
    timesJailed: 0,
    peakHeat: 0,
    peakBank: 0,
    peakNetworth: 0,
    districtsVisited: [district],
    contactUses: 0,
    favorSpent: 0,
    tipsBought: 0,
    heistsCompleted: 0,
    missionsCompleted: 0,
  };
}

export function createInitialState(partial?: Partial<GameState>): GameState {
  const now = Date.now();
  const district = partial?.district ?? "glassrow";
  const base: GameState = {
    version: 1,
    created: false,
    seed: `nw_${Math.floor(Math.random() * 1e9)}`,
    name: "",
    playerId: 100000 + Math.floor(Math.random() * 899999),
    district,
    level: 1,
    xp: 0,
    rankIndex: 0,
    identitySubtitle: "Nobody · Fresh",
    energy: 100,
    energyMax: 100,
    nerve: 10,
    nerveMax: 10,
    happy: 700,
    happyMax: 1000,
    life: 100,
    lifeMax: 100,
    clean: 500,
    street: 0,
    bank: 0,
    str: 5,
    def: 5,
    spd: 5,
    dex: 5,
    heat: 0,
    stress: 10,
    investigation: 0,
    investigationDeadline: null,
    legitimacy: 10,
    hospitalUntil: null,
    jailUntil: null,
    travelUntil: null,
    travelTarget: null,
    laylowUntil: null,
    wounds: { arm: 0, leg: 0 },
    leisureUntil: null,
    hospitalReason: null,
    jailReason: null,
    streetSpendVisit: 0,
    shopSpendDistrict: null,
    jobId: null,
    jobXp: 0,
    shiftsThisWeek: 0,
    gigsThisWeek: 0,
    weekStart: now,
    shiftLog: [],
    gigLog: [],
    activeCourseId: null,
    courseProgressHours: 0,
    completedCourses: [],
    licenses: [],
    inventory: [{ itemId: "gloves", qty: 1 }],
    ownedProperties: [],
    safehouseRooms: { ...EMPTY_SAFEHOUSE_ROOMS },
    chainFamily: null,
    chainLevel: 0,
    chainUpdatedAt: now,
    actionIndex: 0,
    lastTickAt: now,
    lastAwayAt: now,
    logs: [],
    logSeq: 0,
    gymToday: {},
    gymDay: new Date().toISOString().slice(0, 10),
    rivalFlags: {},
    rivalScore: 0,
    rivalLast: "Quiet… for now.",
    rivalPressureAt: 0,
    contacts: {},
    contactTips: [],
    prepBoards: {},
    ritual: null,
    ritualDay: 0,
    ritualBonus: null,
    mastery: {},
    power: {
      territory: {
        glassrow: 0,
        millstone: 0,
        docksreach: 0,
        ashcourt: 0,
        spireyard: 0,
        oldcommons: 0,
        neonpier: 0,
        redclinic: 0,
      },
      politicalRung: 0,
      respect: 0,
      businessTierOwned: 0,
      businessRisk: 0,
      businessStaff: 0,
    },
    bazaar: { listings: [], day: 0 },
    market: emptyMarket(),
    stocks: emptyStocks(),
    missions: emptyMissions(),
    directorEvent: null,
    factionRep: {
      glass_syndicate: 0,
      mill_iron: 0,
      dock_covenant: 0,
      civic_veil: 0,
    },
    factionAssistsWar: 0,
    factionWarWeek: 0,
    bounties: [],
    raceWins: 0,
    compPoints: 0,
    casinoWinStreak: 0,
    casinoLossStreak: 0,
    lastCrimeId: null,
    lastJobId: null,
    lastGigId: null,
    lifetime: emptyLifetime(district),
    unlockedAwards: {},
    timeline: [],
    density: "classic",
    highContrast: false,
    colorblindPack: "none",
    difficulty: "standard",
    aiLife: false,
    adultNpc: false,
    cityLifeDayEventId: null,
  };
  const merged = { ...base, ...partial };
  return {
    ...merged,
    power: {
      ...base.power,
      ...(partial?.power ?? {}),
      territory: {
        ...base.power.territory,
        ...(partial?.power?.territory ?? {}),
      },
      businessRisk: partial?.power?.businessRisk === 1 ? 1 : 0,
      businessStaff: Math.max(0, Math.min(2, Math.floor(partial?.power?.businessStaff ?? 0))),
    },
    lifetime: partial?.lifetime ?? emptyLifetime(merged.district),
    unlockedAwards: partial?.unlockedAwards ?? {},
    licenses: syncLicenses(merged.completedCourses ?? [], merged.licenses ?? []),
  };
}

/** Backfill fields added after early saves. */
export function normalizeState(s: GameState): GameState {
  const lifetime = {
    ...emptyLifetime(s.district),
    ...(s.lifetime ?? {}),
    districtsVisited: Array.from(
      new Set([...(s.lifetime?.districtsVisited ?? []), s.district])
    ) as DistrictId[],
    contactUses: s.lifetime?.contactUses ?? 0,
    favorSpent: s.lifetime?.favorSpent ?? 0,
    tipsBought: s.lifetime?.tipsBought ?? 0,
    gigsDone: s.lifetime?.gigsDone ?? 0,
    heistsCompleted: s.lifetime?.heistsCompleted ?? 0,
    missionsCompleted: s.lifetime?.missionsCompleted ?? 0,
  };
  // Drop legacy stub property ids that aren't in the catalog
  const ownedProperties = (s.ownedProperties ?? []).filter((id) => !id.startsWith("prop_"));
  const licenses = syncLicenses(s.completedCourses ?? [], s.licenses ?? []);
  const safehouseRooms = normalizeSafehouseRooms(s.safehouseRooms);
  return {
    ...s,
    wounds: {
      arm: Math.max(0, Math.min(2, Math.floor(s.wounds?.arm ?? 0))),
      leg: Math.max(0, Math.min(2, Math.floor(s.wounds?.leg ?? 0))),
    },
    leisureUntil: s.leisureUntil ?? null,
    hospitalReason: s.hospitalReason ?? null,
    jailReason: s.jailReason ?? null,
    laylowUntil: s.laylowUntil ?? null,
    streetSpendVisit: s.streetSpendVisit ?? 0,
    shopSpendDistrict: s.shopSpendDistrict ?? null,
    shiftLog: s.shiftLog ?? [],
    gigLog: s.gigLog ?? [],
    gigsThisWeek: s.gigsThisWeek ?? 0,
    lastGigId: s.lastGigId ?? null,
    completedCourses: s.completedCourses ?? [],
    licenses,
    lifetime,
    unlockedAwards: s.unlockedAwards ?? {},
    timeline: s.timeline ?? [],
    ownedProperties,
    safehouseRooms,
    ritualDay: s.ritualDay ?? 0,
    ritualBonus: s.ritualBonus ?? null,
    rivalPressureAt: s.rivalPressureAt ?? 0,
    contacts: s.contacts ?? {},
    contactTips: s.contactTips ?? [],
    prepBoards: s.prepBoards ?? {},
    market: s.market
      ? {
          day: s.market.day ?? 0,
          npcListings: s.market.npcListings ?? [],
          playerListings: s.market.playerListings ?? [],
        }
      : emptyMarket(),
    stocks: s.stocks
      ? {
          prices: s.stocks.prices ?? emptyStocks().prices,
          lastTickHour: s.stocks.lastTickHour ?? 0,
          positions: s.stocks.positions ?? [],
          dividendsEarned: s.stocks.dividendsEarned ?? 0,
        }
      : emptyStocks(),
    missions: s.missions
      ? {
          active: s.missions.active ?? [],
          completedIds: s.missions.completedIds ?? [],
          failedIds: s.missions.failedIds ?? [],
          log: s.missions.log ?? [],
        }
      : emptyMissions(),
    power: {
      territory: {
        glassrow: s.power?.territory?.glassrow ?? 0,
        millstone: s.power?.territory?.millstone ?? 0,
        docksreach: s.power?.territory?.docksreach ?? 0,
        ashcourt: s.power?.territory?.ashcourt ?? 0,
        spireyard: s.power?.territory?.spireyard ?? 0,
        oldcommons: s.power?.territory?.oldcommons ?? 0,
        neonpier: s.power?.territory?.neonpier ?? 0,
        redclinic: s.power?.territory?.redclinic ?? 0,
      },
      politicalRung: s.power?.politicalRung ?? 0,
      respect: s.power?.respect ?? 0,
      businessTierOwned: s.power?.businessTierOwned ?? 0,
      businessRisk: s.power?.businessRisk === 1 ? 1 : 0,
      businessStaff: Math.max(0, Math.min(2, Math.floor(s.power?.businessStaff ?? 0))),
    },
    factionRep: {
      glass_syndicate: s.factionRep?.glass_syndicate ?? 0,
      mill_iron: s.factionRep?.mill_iron ?? 0,
      dock_covenant: s.factionRep?.dock_covenant ?? 0,
      civic_veil: s.factionRep?.civic_veil ?? 0,
    },
    factionAssistsWar: s.factionAssistsWar ?? 0,
    factionWarWeek: s.factionWarWeek ?? 0,
    bounties: s.bounties ?? [],
    raceWins: s.raceWins ?? 0,
    compPoints: s.compPoints ?? 0,
    casinoWinStreak: s.casinoWinStreak ?? 0,
    casinoLossStreak: s.casinoLossStreak ?? 0,
    density: s.density === "comfortable" ? "comfortable" : "classic",
    highContrast: s.highContrast === true,
    colorblindPack: normalizeColorblindPack(s.colorblindPack),
    difficulty: normalizeDifficulty(s.difficulty),
    aiLife: s.aiLife === true,
    adultNpc: s.adultNpc === true,
    cityLifeDayEventId: s.cityLifeDayEventId ?? null,
  };
}
