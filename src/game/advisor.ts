import { CRIMES, GIGS, getJob } from "@/content/catalog";
import { expectedValue, heatBand } from "@/game/formulas";
import type { GameState } from "@/game/state";

export type AdvisorVerdict = "legal" | "street" | "hybrid" | "laylow";

export type IncomeOption = {
  id: string;
  lane: "legal" | "street";
  name: string;
  /** Expected $/resource unit (energy or nerve) */
  evPerResource: number;
  resource: "energy" | "nerve";
  cost: number;
  expectedCash: number;
  heatDelta: number;
  notes: string;
  href: string;
};

export type AdvisorReport = {
  verdict: AdvisorVerdict;
  headline: string;
  detail: string;
  heatBand: string;
  heat: number;
  investigation: number;
  legalBest: IncomeOption | null;
  streetBest: IncomeOption | null;
  options: IncomeOption[];
  reasons: string[];
};

type OddsView = { locked: boolean; odds: number; ev: number };

function legalOptions(s: GameState): IncomeOption[] {
  const out: IncomeOption[] = [];
  const job = s.jobId ? getJob(s.jobId) : undefined;
  if (job && s.shiftsThisWeek < 40) {
    const pay = job.basePay; // Standard quality baseline
    out.push({
      id: `job:${job.id}`,
      lane: "legal",
      name: `Shift · ${job.title}`,
      evPerResource: pay / Math.max(1, job.energy),
      resource: "energy",
      cost: job.energy,
      expectedCash: pay,
      heatDelta: 0,
      notes: "Clean cash · +legitimacy · weekly shift cap",
      href: "/jobs",
    });
  }
  for (const gig of GIGS) {
    if (gig.requiresLevel && s.level < gig.requiresLevel) continue;
    if (gig.maxHeat != null && s.heat > gig.maxHeat) continue;
    if (gig.requiresCourse && !s.completedCourses.includes(gig.requiresCourse)) continue;
    if (gig.requiresStudy && !s.activeCourseId && s.completedCourses.length === 0) continue;
    out.push({
      id: `gig:${gig.id}`,
      lane: "legal",
      name: `Gig · ${gig.name}`,
      evPerResource: gig.basePay / Math.max(1, gig.energy),
      resource: "energy",
      cost: gig.energy,
      expectedCash: gig.basePay,
      heatDelta: 0,
      notes: gig.special ?? "Short clean contract",
      href: "/gigs",
    });
  }
  return out.sort((a, b) => b.evPerResource - a.evPerResource);
}

function streetOptions(s: GameState, views: Record<string, OddsView>): IncomeOption[] {
  const out: IncomeOption[] = [];
  for (const crime of CRIMES) {
    const v = views[crime.id];
    if (!v || v.locked) continue;
    const ev = v.ev || expectedValue(v.odds, crime.cashMin, crime.cashMax, crime.nerve);
    out.push({
      id: `crime:${crime.id}`,
      lane: "street",
      name: crime.name,
      evPerResource: ev,
      resource: "nerve",
      cost: crime.nerve,
      expectedCash: Math.round(ev * crime.nerve),
      heatDelta: crime.heat,
      notes: `${(v.odds * 100).toFixed(0)}% · ${crime.family} · heat +${crime.heat}`,
      href: "/crimes",
    });
  }
  return out.sort((a, b) => b.evPerResource - a.evPerResource);
}

/**
 * Recommend safer legal income vs crime given heat/level/cash needs.
 * Pure — pass odds views from the store.
 */
export function buildAdvisorReport(
  s: GameState,
  views: Record<string, OddsView>,
  cashNeed = 0
): AdvisorReport {
  const legal = legalOptions(s);
  const street = streetOptions(s, views);
  const legalBest = legal[0] ?? null;
  const streetBest = street[0] ?? null;
  const band = heatBand(s.heat);
  const reasons: string[] = [];
  const needCash = cashNeed > 0 || s.clean + s.street < 200;

  if (s.investigation >= 3 || s.heat >= 90) {
    reasons.push("Investigation/manhunt risk — street EV is poisoned by jail/hospital sinks.");
    return {
      verdict: "laylow",
      headline: "Lay low — legal only",
      detail:
        "Heat or investigation is critical. Prefer jobs/gigs, burn kits, lawyer, or /wanted counterplay before another crime.",
      heatBand: band,
      heat: s.heat,
      investigation: s.investigation,
      legalBest,
      streetBest,
      options: [...legal.slice(0, 4), ...street.slice(0, 2)],
      reasons,
    };
  }

  if (s.heat >= 60 || s.investigation >= 2) {
    reasons.push(`Heat band ${band} — fail mass and crit-fail rise.`);
    if (legalBest) reasons.push(`Best legal: ${legalBest.name} (~$${Math.round(legalBest.evPerResource)}/energy).`);
    if (streetBest && streetBest.heatDelta <= 5 && streetBest.evPerResource > (legalBest?.evPerResource ?? 0) * 1.4) {
      reasons.push("A soft street line still beats legal EV — sip, don't dump nerve.");
      return {
        verdict: "hybrid",
        headline: "Hybrid — legal cover + soft street",
        detail: "Keep legitimacy climbing while cherry-picking low-heat crimes.",
        heatBand: band,
        heat: s.heat,
        investigation: s.investigation,
        legalBest,
        streetBest,
        options: [...legal.slice(0, 3), ...street.filter((o) => o.heatDelta <= 6).slice(0, 3)],
        reasons,
      };
    }
    return {
      verdict: "legal",
      headline: "Prefer legal income",
      detail: "Safer path while heat cools. Street is optional only for low-heat soft work.",
      heatBand: band,
      heat: s.heat,
      investigation: s.investigation,
      legalBest,
      streetBest,
      options: [...legal.slice(0, 4), ...street.filter((o) => o.heatDelta <= 5).slice(0, 2)],
      reasons,
    };
  }

  // Low heat — compare EV, cash need, level
  if (!streetBest && legalBest) {
    reasons.push("No open street lines — unlock courses/level or equip tools.");
    return {
      verdict: "legal",
      headline: "Legal is the only open lane",
      detail: "Run shifts/gigs until a crime unlocks.",
      heatBand: band,
      heat: s.heat,
      investigation: s.investigation,
      legalBest,
      streetBest: null,
      options: legal.slice(0, 5),
      reasons,
    };
  }

  if (streetBest && legalBest) {
    const ratio = streetBest.evPerResource / Math.max(0.01, legalBest.evPerResource);
    if (needCash && ratio >= 1.15) {
      reasons.push("Cash is tight and street EV leads — take the board, watch heat.");
      return {
        verdict: "street",
        headline: "Street leads on EV",
        detail: `${streetBest.name} beats ${legalBest.name} on $/resource. Clean up with a shift after.`,
        heatBand: band,
        heat: s.heat,
        investigation: s.investigation,
        legalBest,
        streetBest,
        options: [...street.slice(0, 4), ...legal.slice(0, 2)],
        reasons,
      };
    }
    if (ratio < 0.9) {
      reasons.push("Legal EV is competitive or better — no need to burn heat.");
      return {
        verdict: "legal",
        headline: "Legal wins the math",
        detail: "Jobs/gigs match or beat street without investigation risk.",
        heatBand: band,
        heat: s.heat,
        investigation: s.investigation,
        legalBest,
        streetBest,
        options: [...legal.slice(0, 4), ...street.slice(0, 2)],
        reasons,
      };
    }
    reasons.push("Both lanes pay — hybrid loop is the city meta.");
    return {
      verdict: "hybrid",
      headline: "Hybrid loop",
      detail: "Spend nerve on top street EV, then cover with clean shifts for legitimacy.",
      heatBand: band,
      heat: s.heat,
      investigation: s.investigation,
      legalBest,
      streetBest,
      options: [...street.slice(0, 3), ...legal.slice(0, 3)],
      reasons,
    };
  }

  if (streetBest) {
    reasons.push("No job/gig open — street is the available income.");
    return {
      verdict: "street",
      headline: "Street by necessity",
      detail: "Apply for a job when you can to unlock the legal half of the loop.",
      heatBand: band,
      heat: s.heat,
      investigation: s.investigation,
      legalBest: null,
      streetBest,
      options: street.slice(0, 5),
      reasons,
    };
  }

  return {
    verdict: "laylow",
    headline: "No strong plays",
    detail: "Recover energy/nerve, unlock content, or check hospital/jail blocks.",
    heatBand: band,
    heat: s.heat,
    investigation: s.investigation,
    legalBest: null,
    streetBest: null,
    options: [],
    reasons: ["Blocked or empty boards."],
  };
}
