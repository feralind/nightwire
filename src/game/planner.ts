import { CRIMES, GIGS, getJob } from "@/content/catalog";
import { expectedValue } from "@/game/formulas";
import type { GameState } from "@/game/state";
import type { CrimeDef, GigDef, JobDef } from "@/game/types";

export type PlannerCrimeRow = {
  id: string;
  name: string;
  family: string;
  nerve: number;
  odds: number;
  ev: number;
  heat: number;
  locked: boolean;
};

export type PlannerSpendPlan = {
  title: string;
  summary: string;
  nerveSpend: number;
  energySpend: number;
  expectedStreet: number;
  expectedClean: number;
  expectedHeat: number;
  steps: string[];
  crimeIds: string[];
  preferJob: boolean;
  preferGigId: string | null;
};

export type BuildMixSuggestion = {
  id: string;
  label: string;
  focus: "street" | "legal" | "hybrid" | "train";
  blurb: string;
  nerveBudget: number;
  energyBudget: number;
  crimeIds: string[];
  workShifts: number;
  gigIds: string[];
  gymHint: string | null;
};

type OddsView = {
  locked: boolean;
  odds: number;
  ev: number;
};

/** Rank open crimes by EV for the planner board. */
export function rankCrimesByEv(
  views: Record<string, OddsView>,
  limit = 8
): PlannerCrimeRow[] {
  const rows: PlannerCrimeRow[] = [];
  for (const crime of CRIMES) {
    const v = views[crime.id];
    if (!v) continue;
    rows.push({
      id: crime.id,
      name: crime.name,
      family: crime.family,
      nerve: crime.nerve,
      odds: v.odds,
      ev: v.ev,
      heat: crime.heat,
      locked: v.locked,
    });
  }
  return rows
    .filter((r) => !r.locked && r.nerve > 0)
    .sort((a, b) => b.ev - a.ev)
    .slice(0, limit);
}

function avgJobPay(job: JobDef): number {
  // Standard quality baseline (matches workShift Standard mult = 1)
  return job.basePay;
}

function avgGigPay(gig: GigDef): number {
  return gig.basePay;
}

/** Suggest how to spend current nerve/energy for EV. */
export function suggestSpendPlan(
  s: GameState,
  views: Record<string, OddsView>
): PlannerSpendPlan {
  const ranked = rankCrimesByEv(views, 12);
  const job = s.jobId ? getJob(s.jobId) : undefined;
  const openGigs = GIGS.filter((g) => {
    if (g.requiresLevel && s.level < g.requiresLevel) return false;
    if (g.maxHeat != null && s.heat > g.maxHeat) return false;
    if (g.requiresCourse && !s.completedCourses.includes(g.requiresCourse)) return false;
    return true;
  });

  const heatHot = s.heat >= 60 || s.investigation >= 2;
  const steps: string[] = [];
  const crimeIds: string[] = [];
  let nerveSpend = 0;
  let energySpend = 0;
  let expectedStreet = 0;
  let expectedClean = 0;
  let expectedHeat = 0;
  let preferJob = false;
  let preferGigId: string | null = null;

  let nerveLeft = Math.floor(s.nerve);
  let energyLeft = Math.floor(s.energy);

  if (heatHot) {
    // Cool path: legal income + light street if EV still strong
    if (job && energyLeft >= job.energy && s.shiftsThisWeek < 40) {
      const shifts = Math.min(3, Math.floor(energyLeft / job.energy));
      preferJob = true;
      energySpend += shifts * job.energy;
      energyLeft -= shifts * job.energy;
      expectedClean += shifts * avgJobPay(job);
      steps.push(`Work ${shifts}× ${job.title} (cool heat, clean cash)`);
    }
    const gig = openGigs.sort((a, b) => b.basePay / Math.max(1, a.energy) - a.basePay / Math.max(1, b.energy))[0];
    if (gig && energyLeft >= gig.energy) {
      preferGigId = gig.id;
      energySpend += gig.energy;
      energyLeft -= gig.energy;
      expectedClean += avgGigPay(gig);
      steps.push(`Gig: ${gig.name}`);
    }
    const safe = ranked.filter((r) => r.heat <= 6 && r.odds >= 0.35).slice(0, 3);
    for (const row of safe) {
      if (nerveLeft < row.nerve) continue;
      nerveLeft -= row.nerve;
      nerveSpend += row.nerve;
      crimeIds.push(row.id);
      expectedStreet += row.ev * row.nerve;
      expectedHeat += row.heat * 0.6;
      steps.push(`Light street: ${row.name} (EV ${row.ev.toFixed(1)}/nerve)`);
      if (crimeIds.length >= 2) break;
    }
    if (!steps.length) {
      steps.push("Heat is hot — lay low, hospital, or take a clean shift before grinding street.");
    }
    return {
      title: "Cool-down mix",
      summary: "Investigation/heat elevated — bias legal income, sip soft crimes only.",
      nerveSpend,
      energySpend,
      expectedStreet: Math.round(expectedStreet),
      expectedClean: Math.round(expectedClean),
      expectedHeat: Math.round(expectedHeat),
      steps,
      crimeIds,
      preferJob,
      preferGigId,
    };
  }

  // Aggressive EV path: fill nerve with top EV crimes, leftover energy to job/gym
  for (const row of ranked) {
    while (nerveLeft >= row.nerve && crimeIds.filter((id) => id === row.id).length < 4) {
      nerveLeft -= row.nerve;
      nerveSpend += row.nerve;
      crimeIds.push(row.id);
      expectedStreet += row.ev * row.nerve;
      expectedHeat += row.heat;
      steps.push(`${row.name} · EV ${row.ev.toFixed(1)}/n · ${(row.odds * 100).toFixed(0)}%`);
      if (nerveSpend >= Math.floor(s.nerve) || steps.length >= 6) break;
    }
    if (nerveSpend >= Math.floor(s.nerve) * 0.85 || steps.length >= 6) break;
  }

  if (job && energyLeft >= job.energy && s.shiftsThisWeek < 40) {
    const shifts = Math.min(2, Math.floor(energyLeft / job.energy));
    if (shifts > 0) {
      preferJob = true;
      energySpend += shifts * job.energy;
      expectedClean += shifts * avgJobPay(job);
      steps.push(`Park ${shifts} energy on ${job.title}`);
    }
  } else if (energyLeft >= 10) {
    steps.push(`Gym leftover energy (${energyLeft}) — bulk/tech for odds`);
  }

  if (!steps.length) {
    steps.push("No open EV plays — unlock courses, equip tools, or wait for nerve.");
  }

  return {
    title: "EV spend plan",
    summary: "Burn nerve on highest EV open crimes; park spare energy on clean work.",
    nerveSpend,
    energySpend,
    expectedStreet: Math.round(expectedStreet),
    expectedClean: Math.round(expectedClean),
    expectedHeat: Math.round(expectedHeat),
    steps,
    crimeIds,
    preferJob,
    preferGigId,
  };
}

export function buildMixSuggestions(s: GameState, views: Record<string, OddsView>): BuildMixSuggestion[] {
  const ranked = rankCrimesByEv(views, 6);
  const top = ranked.slice(0, 3).map((r) => r.id);
  const soft = ranked.filter((r) => r.heat <= 5).slice(0, 2).map((r) => r.id);
  const job = s.jobId ? getJob(s.jobId) : undefined;
  const gig = GIGS.find((g) => !g.requiresLevel || s.level >= g.requiresLevel);

  return [
    {
      id: "street_grind",
      label: "Street grind",
      focus: "street",
      blurb: "Dump nerve into top EV crimes. Accept heat.",
      nerveBudget: Math.floor(s.nerve),
      energyBudget: 0,
      crimeIds: top,
      workShifts: 0,
      gigIds: [],
      gymHint: null,
    },
    {
      id: "legal_ladder",
      label: "Legal ladder",
      focus: "legal",
      blurb: "Shifts + gigs for clean cash and legitimacy. Soft street only.",
      nerveBudget: Math.min(4, Math.floor(s.nerve)),
      energyBudget: Math.floor(s.energy),
      crimeIds: soft,
      workShifts: job ? Math.min(4, Math.floor(s.energy / Math.max(1, job.energy))) : 0,
      gigIds: gig ? [gig.id] : [],
      gymHint: null,
    },
    {
      id: "hybrid_loop",
      label: "Hybrid loop",
      focus: "hybrid",
      blurb: "Classic city win — street EV then clean cover shifts.",
      nerveBudget: Math.floor(s.nerve * 0.7),
      energyBudget: Math.floor(s.energy * 0.5),
      crimeIds: top.slice(0, 2),
      workShifts: job ? 2 : 0,
      gigIds: [],
      gymHint: null,
    },
    {
      id: "stat_prep",
      label: "Stat prep",
      focus: "train",
      blurb: "Gym + light crime — raise DEX/SPD before heavier boards.",
      nerveBudget: Math.min(6, Math.floor(s.nerve)),
      energyBudget: Math.floor(s.energy),
      crimeIds: soft.slice(0, 1),
      workShifts: 0,
      gigIds: [],
      gymHint: "Train tech (DEX) or speed — both feed crime odds.",
    },
  ];
}

/** Simple forecast: nerve packs × top crime EV. */
export function forecastNervePacks(
  nerve: number,
  top: PlannerCrimeRow | undefined
): { attempts: number; expectedCash: number; expectedHeat: number } {
  if (!top || top.nerve <= 0) return { attempts: 0, expectedCash: 0, expectedHeat: 0 };
  const attempts = Math.floor(nerve / top.nerve);
  return {
    attempts,
    expectedCash: Math.round(attempts * top.ev * top.nerve),
    expectedHeat: Math.round(attempts * top.heat * 0.85),
  };
}

export function crimeFallbackEv(crime: CrimeDef, odds = 0.45): number {
  return expectedValue(odds, crime.cashMin, crime.cashMax, crime.nerve);
}
