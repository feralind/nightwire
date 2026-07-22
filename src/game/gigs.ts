import { getCourse } from "@/content/catalog";
import type { ReqReason } from "@/game/careers";
import type { GigDef } from "@/game/types";

export const GIGS_WEEKLY_CAP = 24;

export function gigPayBonusPct(completedCourseIds: string[]): number {
  return completedCourseIds.reduce((a, id) => a + (getCourse(id)?.gigPayBonus ?? 0), 0);
}

export function gigDoReasons(
  gig: GigDef,
  s: {
    level: number;
    completedCourses: string[];
    activeCourseId: string | null;
    heat: number;
    energy: number;
    gigsThisWeek: number;
    hospitalUntil: number | null;
    jailUntil: number | null;
    travelUntil: number | null;
  }
): ReqReason[] {
  const reasons: ReqReason[] = [];
  const now = Date.now();
  if (s.hospitalUntil && s.hospitalUntil > now) {
    reasons.push({ label: "Hospitalized", href: "/hospital" });
  }
  if (s.jailUntil && s.jailUntil > now) {
    reasons.push({ label: "Jailed", href: "/jail" });
  }
  if (s.travelUntil && s.travelUntil > now) {
    reasons.push({ label: "Traveling", href: "/travel" });
  }
  if (s.energy < gig.energy) {
    reasons.push({ label: `Need ${gig.energy} energy` });
  }
  if (s.gigsThisWeek >= GIGS_WEEKLY_CAP) {
    reasons.push({ label: `Weekly gig cap ${GIGS_WEEKLY_CAP}` });
  }
  if (gig.requiresLevel && s.level < gig.requiresLevel) {
    reasons.push({ label: `Level ${gig.requiresLevel}`, href: "/profile" });
  }
  if (gig.requiresCourse && !s.completedCourses.includes(gig.requiresCourse)) {
    const c = getCourse(gig.requiresCourse);
    reasons.push({ label: `Course: ${c?.name ?? gig.requiresCourse}`, href: "/education" });
  }
  if (gig.requiresStudy && !s.activeCourseId && s.completedCourses.length === 0) {
    reasons.push({ label: "Enroll or finish a course", href: "/education" });
  }
  if (gig.maxHeat != null && s.heat > gig.maxHeat) {
    reasons.push({
      label: `Heat ≤ ${gig.maxHeat} (now ${Math.floor(s.heat)})`,
      href: "/jobs",
    });
  }
  return reasons;
}

export function canDoGig(
  gig: GigDef,
  s: {
    level: number;
    completedCourses: string[];
    activeCourseId: string | null;
    heat: number;
    energy: number;
    gigsThisWeek: number;
    hospitalUntil: number | null;
    jailUntil: number | null;
    travelUntil: number | null;
  }
): boolean {
  return gigDoReasons(gig, s).length === 0;
}

export function computeGigPay(
  gig: GigDef,
  opts: {
    quality: "Poor" | "Standard" | "Good" | "Excellent";
    district: string;
    completedCourses: string[];
    happy: number;
  }
): number {
  const mult = { Poor: 0.65, Standard: 1, Good: 1.2, Excellent: 1.45 }[opts.quality];
  const districtBonus = gig.districtBias.includes(opts.district as (typeof gig.districtBias)[number])
    ? 1.1
    : 1;
  const courseBonus = 1 + gigPayBonusPct(opts.completedCourses) / 100;
  const happyPen = opts.happy < 200 ? 0.9 : opts.happy < 400 ? 0.95 : 1;
  return Math.round(gig.basePay * mult * districtBonus * courseBonus * happyPen);
}
