export type FactionDef = {
  id: string;
  name: string;
  lean: string;
  blurb: string;
  /** Preferred district ids for war shading */
  districts: string[];
};

export const FACTIONS: FactionDef[] = [
  {
    id: "glass_syndicate",
    name: "Glass Syndicate",
    lean: "Glassrow retail & casino floors",
    blurb: "Polished fronts. They hate loud heat and love clean envelopes.",
    districts: ["glassrow", "spireyard"],
  },
  {
    id: "mill_iron",
    name: "Mill Iron",
    lean: "Millstone yards",
    blurb: "Tools, trucks, and grudges. Street respect opens doors.",
    districts: ["millstone", "oldcommons"],
  },
  {
    id: "dock_covenant",
    name: "Dock Covenant",
    lean: "DocksReach cranes",
    blurb: "Container math. Harbor courses and dock jobs raise your stock.",
    districts: ["docksreach", "neonpier"],
  },
  {
    id: "civic_veil",
    name: "Civic Veil",
    lean: "Ashcourt / SpireYard",
    blurb: "Quiet power. Legitimacy and political capital feed this table.",
    districts: ["ashcourt", "redclinic", "spireyard"],
  },
];

/** Rep delta helpers — clamp -100..100 at call site */
export function assistPay(rep: number) {
  return 400 + Math.max(0, rep) * 4;
}

export function warWeekBonus(rep: number) {
  return rep >= 40 ? 1.1 : 1;
}

/** Deterministic war pair from calendar week */
export function warPairForWeek(weekIndex: number): [string, string] {
  const a = FACTIONS[weekIndex % FACTIONS.length]!.id;
  let b = FACTIONS[(weekIndex + 1 + (weekIndex % 3)) % FACTIONS.length]!.id;
  if (b === a) b = FACTIONS[(weekIndex + 2) % FACTIONS.length]!.id;
  return [a, b];
}

export function isWarWeek(now = Date.now()) {
  const week = Math.floor(now / (7 * 86_400_000));
  // Every other week is a war week
  return week % 2 === 1;
}

export function currentWar(now = Date.now()) {
  if (!isWarWeek(now)) return null;
  const week = Math.floor(now / (7 * 86_400_000));
  const [a, b] = warPairForWeek(week);
  return { week, a, b };
}

export function chainMeterLabel(assistsThisWar: number) {
  if (assistsThisWar >= 5) return "Silent partner track";
  if (assistsThisWar >= 3) return "Chain hot";
  if (assistsThisWar >= 1) return "Chain started";
  return "No chain";
}

export function endgameTitle(rep: Record<string, number>): string | null {
  const entries = Object.entries(rep).sort((x, y) => y[1] - x[1]);
  const top = entries[0];
  if (!top || top[1] < 60) return null;
  const faction = FACTIONS.find((f) => f.id === top[0]);
  if (!faction) return null;
  if (top[1] >= 80) return `Street crown — ${faction.name}`;
  return `Silent partner — ${faction.name}`;
}

/** War-week only actions — heavier than peacetime Assist. */
export type FactionWarActionDef = {
  id: string;
  name: string;
  blurb: string;
  energy: number;
  costClean?: number;
  costStreet?: number;
  heat?: number;
  repGain: number;
  respectGain: number;
};

export const FACTION_WAR_ACTIONS: FactionWarActionDef[] = [
  {
    id: "run_favor",
    name: "Run a favor",
    blurb: "Move a package for the table. Street skim optional.",
    energy: 8,
    costStreet: 200,
    repGain: 12,
    respectGain: 1,
  },
  {
    id: "fund_table",
    name: "Fund the table",
    blurb: "Clean envelope keeps the chain fed.",
    energy: 4,
    costClean: 800,
    repGain: 10,
    respectGain: 2,
  },
  {
    id: "shadow_run",
    name: "Shadow run",
    blurb: "Quiet field work. Heat rises; the table notices.",
    energy: 10,
    heat: 4,
    repGain: 15,
    respectGain: 2,
  },
];

export function getFactionWarAction(id: string): FactionWarActionDef | undefined {
  return FACTION_WAR_ACTIONS.find((a) => a.id === id);
}
