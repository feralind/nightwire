import type { DistrictId } from "@/game/types";
import { MISSIONS_EXTRA } from "@/content/density/missionsExtra";

export type MissionObjective =
  | { type: "visit_district"; district: DistrictId }
  | { type: "crimes_ok"; count: number }
  | { type: "gigs_done"; count: number }
  | { type: "earn_street"; amount: number }
  | { type: "earn_clean"; amount: number }
  | { type: "have_item"; itemId: string; qty?: number }
  | { type: "reach_level"; level: number }
  | { type: "heat_below"; heat: number }
  | { type: "gym_sessions"; count: number }
  | { type: "attacks_won"; count: number }
  | { type: "shifts_worked"; count: number }
  | { type: "bank_balance"; amount: number };

export type MissionDef = {
  id: string;
  name: string;
  blurb: string;
  tier: "street" | "civic" | "shadow";
  /** Energy spent on accept (contract briefing) */
  energyCost?: number;
  nerveCost?: number;
  requiresLevel?: number;
  maxHeat?: number;
  minLegitimacy?: number;
  requiresCourse?: string;
  districtHint?: DistrictId;
  objectives: MissionObjective[];
  rewards: {
    clean?: number;
    street?: number;
    xp?: number;
    itemId?: string;
    respect?: number;
    legitimacy?: number;
  };
  failPenalty?: { heat?: number; street?: number; clean?: number };
  /** Hours after accept before auto-fail */
  deadlineHours?: number;
};

export const MISSIONS_CORE: MissionDef[] = [
  {
    id: "m_glass_welcome",
    name: "Glassrow footwork",
    blurb: "Show the board you can cross town without getting lost. Tourist paper wants eyes in Glassrow.",
    tier: "civic",
    energyCost: 2,
    districtHint: "glassrow",
    objectives: [{ type: "visit_district", district: "glassrow" }, { type: "gigs_done", count: 1 }],
    rewards: { clean: 400, xp: 25, legitimacy: 1 },
    deadlineHours: 48,
  },
  {
    id: "m_mill_scrap",
    name: "Millstone scrap run",
    blurb: "Fence a little street cash and walk Millstone. Brokers pay for proof of motion.",
    tier: "street",
    energyCost: 3,
    districtHint: "millstone",
    objectives: [
      { type: "visit_district", district: "millstone" },
      { type: "earn_street", amount: 200 },
    ],
    rewards: { street: 350, xp: 30 },
    failPenalty: { heat: 4 },
    deadlineHours: 36,
  },
  {
    id: "m_dock_eyes",
    name: "Harbor eyes",
    blurb: "DocksReach wants a quiet look. Keep heat low while you clock the cranes.",
    tier: "shadow",
    energyCost: 4,
    maxHeat: 50,
    districtHint: "docksreach",
    objectives: [
      { type: "visit_district", district: "docksreach" },
      { type: "heat_below", heat: 45 },
      { type: "crimes_ok", count: 1 },
    ],
    rewards: { street: 600, xp: 40, respect: 1 },
    failPenalty: { heat: 8, street: 100 },
    deadlineHours: 24,
  },
  {
    id: "m_ash_clipboard",
    name: "Ashcourt clipboard",
    blurb: "Civic clients hate dirty files. Do clean gigs and bank a little legitimacy.",
    tier: "civic",
    energyCost: 3,
    maxHeat: 40,
    minLegitimacy: 8,
    districtHint: "ashcourt",
    objectives: [
      { type: "visit_district", district: "ashcourt" },
      { type: "gigs_done", count: 2 },
      { type: "earn_clean", amount: 500 },
    ],
    rewards: { clean: 750, xp: 35, legitimacy: 2 },
    deadlineHours: 72,
  },
  {
    id: "m_spire_intro",
    name: "Spireyard soft open",
    blurb: "Wear the district. Bookkeeping grads get preferred — bring a clean balance.",
    tier: "civic",
    energyCost: 4,
    requiresLevel: 3,
    requiresCourse: "cf1",
    districtHint: "spireyard",
    objectives: [
      { type: "visit_district", district: "spireyard" },
      { type: "bank_balance", amount: 200 },
    ],
    rewards: { clean: 900, xp: 45, legitimacy: 2 },
    deadlineHours: 60,
  },
  {
    id: "m_commons_brawl",
    name: "Commons pressure test",
    blurb: "Old Commons respects scars. Win a fight and leave with street paper.",
    tier: "street",
    energyCost: 5,
    nerveCost: 2,
    requiresLevel: 2,
    districtHint: "oldcommons",
    objectives: [
      { type: "visit_district", district: "oldcommons" },
      { type: "attacks_won", count: 1 },
    ],
    rewards: { street: 500, xp: 40, respect: 2 },
    failPenalty: { heat: 6 },
    deadlineHours: 36,
  },
  {
    id: "m_pier_chips",
    name: "Pier chip float",
    blurb: "Neon Pier wants someone who can grind clean cash then flash the boardwalk.",
    tier: "street",
    energyCost: 4,
    districtHint: "neonpier",
    objectives: [
      { type: "visit_district", district: "neonpier" },
      { type: "earn_clean", amount: 400 },
      { type: "gigs_done", count: 1 },
    ],
    rewards: { clean: 550, street: 150, xp: 35 },
    deadlineHours: 48,
  },
  {
    id: "m_clinic_quiet",
    name: "Ward quiet hours",
    blurb: "Red Clinic needs a cool head. Drop heat, visit the ward, maybe carry meds.",
    tier: "civic",
    energyCost: 3,
    maxHeat: 55,
    districtHint: "redclinic",
    objectives: [
      { type: "visit_district", district: "redclinic" },
      { type: "heat_below", heat: 35 },
      { type: "have_item", itemId: "street_meds", qty: 1 },
    ],
    rewards: { clean: 650, xp: 30, itemId: "painkillers", legitimacy: 1 },
    deadlineHours: 40,
  },
  {
    id: "m_gym_contract",
    name: "Bulk receipt",
    blurb: "A trainer wants proof you hit the floor. Three sessions, any track.",
    tier: "street",
    energyCost: 2,
    objectives: [{ type: "gym_sessions", count: 3 }],
    rewards: { clean: 300, xp: 20, respect: 1 },
    deadlineHours: 48,
  },
  {
    id: "m_shift_cover",
    name: "Shift cover slip",
    blurb: "Someone called out. Clock two honest shifts and the board pays the difference.",
    tier: "civic",
    energyCost: 2,
    requiresLevel: 2,
    objectives: [{ type: "shifts_worked", count: 2 }],
    rewards: { clean: 700, xp: 30, legitimacy: 1 },
    failPenalty: { clean: 50 },
    deadlineHours: 72,
  },
  {
    id: "m_street_streak",
    name: "Three-mark streak",
    blurb: "Shadow brokers want three successful crimes on the ledger. Heat is your problem.",
    tier: "shadow",
    energyCost: 5,
    nerveCost: 3,
    requiresLevel: 3,
    objectives: [{ type: "crimes_ok", count: 3 }],
    rewards: { street: 1200, xp: 60, respect: 3 },
    failPenalty: { heat: 12 },
    deadlineHours: 30,
  },
  {
    id: "m_tool_proof",
    name: "Crowbar credential",
    blurb: "Prove you own entry kit and can work Millstone. Board stamps the receipt.",
    tier: "street",
    energyCost: 3,
    districtHint: "millstone",
    objectives: [
      { type: "have_item", itemId: "crowbar", qty: 1 },
      { type: "visit_district", district: "millstone" },
      { type: "crimes_ok", count: 1 },
    ],
    rewards: { street: 450, xp: 35, itemId: "gloves" },
    deadlineHours: 48,
  },
  {
    id: "m_level_upshot",
    name: "Level receipt",
    blurb: "Climb to level 4 while holding a bank float. Spire paper loves climbers.",
    tier: "civic",
    energyCost: 4,
    requiresLevel: 2,
    objectives: [
      { type: "reach_level", level: 4 },
      { type: "bank_balance", amount: 500 },
    ],
    rewards: { clean: 1500, xp: 80, legitimacy: 3 },
    deadlineHours: 120,
  },
  {
    id: "m_shadow_drop",
    name: "Black-bag drop",
    blurb: "Earn street, hold a burn kit, keep nerve. Fail and the heat sticks.",
    tier: "shadow",
    energyCost: 6,
    nerveCost: 4,
    requiresLevel: 4,
    maxHeat: 70,
    objectives: [
      { type: "earn_street", amount: 800 },
      { type: "have_item", itemId: "evidence_burn", qty: 1 },
      { type: "crimes_ok", count: 2 },
    ],
    rewards: { street: 2000, xp: 90, respect: 4 },
    failPenalty: { heat: 15, street: 200 },
    deadlineHours: 36,
  },
];

export const MISSIONS: MissionDef[] = [...MISSIONS_CORE, ...MISSIONS_EXTRA];

export function getMission(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}
