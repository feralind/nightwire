import { COURSES, CRIMES, JOBS, getCourse, getCrime, getJob } from "@/content/catalog";
import {
  licenseBankInterestBonus,
  licenseForCourse,
  licenseHospitalTimeReduction,
  licenseOddsMod,
} from "@/game/licenses";
import type { CourseDef, JobDef } from "@/game/types";

export type ReqReason = { label: string; href?: string };

export const DEFAULT_PROMOTE_XP = 300;

export function careers(): string[] {
  return Array.from(new Set(JOBS.map((j) => j.career)));
}

export function jobsInCareer(career: string): JobDef[] {
  return JOBS.filter((j) => j.career === career).sort((a, b) => a.rank - b.rank);
}

export function priorRankJob(job: JobDef): JobDef | undefined {
  if (job.rank <= 1) return undefined;
  return JOBS.find((j) => j.career === job.career && j.rank === job.rank - 1);
}

export function nextRankJob(job: JobDef): JobDef | undefined {
  return JOBS.find((j) => j.career === job.career && j.rank === job.rank + 1);
}

export function promoteXpNeeded(next: JobDef): number {
  return next.promoteXp ?? DEFAULT_PROMOTE_XP;
}

/** Reasons why a rank-1 job cannot be applied to right now. Higher ranks promote only. */
export function jobApplyReasons(
  job: JobDef,
  s: { level: number; completedCourses: string[]; jobId: string | null }
): ReqReason[] {
  const reasons: ReqReason[] = [];
  if (job.rank > 1) {
    reasons.push({ label: "Promote from prior rank (work shifts)", href: "/jobs" });
    return reasons;
  }
  if (s.jobId === job.id) {
    reasons.push({ label: "Already employed here" });
  }
  if (job.requiresLevel && s.level < job.requiresLevel) {
    reasons.push({ label: `Level ${job.requiresLevel}`, href: "/profile" });
  }
  if (job.requiresCourse && !s.completedCourses.includes(job.requiresCourse)) {
    const c = getCourse(job.requiresCourse);
    reasons.push({ label: `Course: ${c?.name ?? job.requiresCourse}`, href: "/education" });
  }
  return reasons;
}

export function canApplyJob(
  job: JobDef,
  s: { level: number; completedCourses: string[]; jobId: string | null }
): boolean {
  return jobApplyReasons(job, s).length === 0;
}

/** Promotion eligibility while holding the prior-rank job. */
export function jobPromoteReasons(
  next: JobDef,
  s: { jobId: string | null; jobXp: number; completedCourses: string[]; level: number }
): ReqReason[] {
  const reasons: ReqReason[] = [];
  const prior = priorRankJob(next);
  if (!prior) {
    reasons.push({ label: "No prior rank" });
    return reasons;
  }
  if (s.jobId !== prior.id) {
    reasons.push({ label: `Hold ${prior.title} first`, href: "/jobs" });
  }
  const need = promoteXpNeeded(next);
  if (s.jobXp < need) {
    reasons.push({ label: `Job XP ${s.jobXp}/${need}` });
  }
  if (next.promoteCourse && !s.completedCourses.includes(next.promoteCourse)) {
    const c = getCourse(next.promoteCourse);
    reasons.push({ label: `Exam: ${c?.name ?? next.promoteCourse}`, href: "/education" });
  }
  if (next.requiresLevel && s.level < next.requiresLevel) {
    reasons.push({ label: `Level ${next.requiresLevel}`, href: "/profile" });
  }
  return reasons;
}

export function canPromote(
  next: JobDef,
  s: { jobId: string | null; jobXp: number; completedCourses: string[]; level: number }
): boolean {
  return jobPromoteReasons(next, s).length === 0;
}

export function courseEnrollReasons(
  course: CourseDef,
  s: {
    level: number;
    completedCourses: string[];
    activeCourseId: string | null;
    clean: number;
    street: number;
  },
  useStreet: boolean
): ReqReason[] {
  const reasons: ReqReason[] = [];
  if (s.completedCourses.includes(course.id)) {
    reasons.push({ label: "Already completed" });
  }
  if (s.activeCourseId) {
    reasons.push({ label: "Study focus full (1 course)" });
  }
  if (course.requiresLevel && s.level < course.requiresLevel) {
    reasons.push({ label: `Level ${course.requiresLevel}`, href: "/profile" });
  }
  if (course.requiresCourse && !s.completedCourses.includes(course.requiresCourse)) {
    const prereq = getCourse(course.requiresCourse);
    reasons.push({ label: `Prereq: ${prereq?.name ?? course.requiresCourse}`, href: "/education" });
  }
  const fee = useStreet ? Math.round(course.fee * 1.2) : course.fee;
  if (useStreet) {
    if (s.street < fee) reasons.push({ label: `Need ${fee} street (+20%)`, href: "/crimes" });
  } else if (s.clean < fee) {
    reasons.push({ label: `Need $${fee} clean`, href: "/jobs" });
  }
  return reasons;
}

export function canEnrollCourse(
  course: CourseDef,
  s: {
    level: number;
    completedCourses: string[];
    activeCourseId: string | null;
    clean: number;
    street: number;
  },
  useStreet: boolean
): boolean {
  return courseEnrollReasons(course, s, useStreet).length === 0;
}

export function courseUnlockLabels(course: CourseDef): string[] {
  if (!course.unlocks?.length) return [];
  return course.unlocks.map((id) => getCrime(id)?.name ?? id);
}

export function coursePerkLabels(course: CourseDef): string[] {
  const perks: string[] = [];
  if (course.oddsBonus) {
    const fam = course.oddsFamilies?.join("/") ?? "crime";
    perks.push(`+${course.oddsBonus}% ${fam} odds`);
  }
  if (course.jobPayBonus) perks.push(`+${course.jobPayBonus}% job pay`);
  if (course.gigPayBonus) perks.push(`+${course.gigPayBonus}% gig pay`);
  if (course.softCapBonus) perks.push(`+${course.softCapBonus} gym soft cap`);
  if (course.bankInterestBonus) perks.push(`+${course.bankInterestBonus}% bank interest`);
  if (course.hospitalTimeReduction) perks.push(`−${course.hospitalTimeReduction}% hospital time`);
  if (course.unlocks?.length) {
    perks.push(`Unlocks: ${courseUnlockLabels(course).join(", ")}`);
  }
  const lic = licenseForCourse(course.id);
  if (lic) perks.push(`License: ${lic.name}`);
  return perks;
}

export function transcriptPerkSum(completedCourseIds: string[]): {
  jobPayBonus: number;
  gigPayBonus: number;
  oddsBonus: number;
  softCapBonus: number;
  bankInterestBonus: number;
  hospitalTimeReduction: number;
  unlockedCrimeIds: string[];
} {
  let jobPayBonus = 0;
  let gigPayBonus = 0;
  let oddsBonus = 0;
  let softCapBonus = 0;
  let bankInterestBonus = 0;
  let hospitalTimeReduction = 0;
  const unlockedCrimeIds: string[] = [];
  for (const id of completedCourseIds) {
    const c = getCourse(id);
    if (!c) continue;
    jobPayBonus += c.jobPayBonus ?? 0;
    gigPayBonus += c.gigPayBonus ?? 0;
    oddsBonus += c.oddsBonus ?? 0;
    softCapBonus += c.softCapBonus ?? 0;
    bankInterestBonus += c.bankInterestBonus ?? 0;
    hospitalTimeReduction += c.hospitalTimeReduction ?? 0;
    if (c.unlocks) unlockedCrimeIds.push(...c.unlocks);
  }
  return {
    jobPayBonus,
    gigPayBonus,
    oddsBonus,
    softCapBonus,
    bankInterestBonus,
    hospitalTimeReduction,
    unlockedCrimeIds: Array.from(new Set(unlockedCrimeIds)),
  };
}

/** Stacked hospital stay cut from courses + licenses, soft-capped at 50%. */
export function hospitalTimeCutPct(
  completedCourseIds: string[],
  licenseIds: string[] = []
): number {
  const fromCourses = transcriptPerkSum(completedCourseIds).hospitalTimeReduction;
  const fromLicenses = licenseHospitalTimeReduction(licenseIds);
  return Math.min(50, fromCourses + fromLicenses);
}

/** Apply education/license hospital cut to a base duration in ms. */
export function applyHospitalDuration(
  baseMs: number,
  completedCourseIds: string[],
  licenseIds: string[] = []
): number {
  const cut = hospitalTimeCutPct(completedCourseIds, licenseIds);
  return Math.max(60_000, Math.round(baseMs * (1 - cut / 100)));
}

export function educationOddsMod(
  completedCourseIds: string[],
  crimeFamily: "petty" | "street" | "heavy",
  licenseIds: string[] = []
): number {
  let mod = 0;
  for (const id of completedCourseIds) {
    const c = getCourse(id);
    if (!c?.oddsBonus) continue;
    if (!c.oddsFamilies || c.oddsFamilies.includes(crimeFamily)) {
      mod += c.oddsBonus;
    }
  }
  return mod + licenseOddsMod(licenseIds, crimeFamily);
}

export function jobSpecialtyOddsMod(jobId: string | null, crimeId: string): number {
  if (!jobId) return 0;
  const job = getJob(jobId);
  if (!job) return 0;
  const crime = getCrime(crimeId);
  if (!crime) return 0;
  let mod = 0;
  if (job.specialtyCrimeIds?.includes(crimeId)) mod += 4;
  if (job.specialtyFamilies?.includes(crime.family)) mod += 2;
  return mod;
}

export function bankInterestRate(completedCourseIds: string[], licenseIds: string[] = []): number {
  const base = 0.02;
  const courseBonus = completedCourseIds.reduce(
    (a, id) => a + (getCourse(id)?.bankInterestBonus ?? 0),
    0
  );
  const licenseBonus = licenseBankInterestBonus(licenseIds);
  return base + (courseBonus + licenseBonus) / 100;
}

export function schools(): string[] {
  return Array.from(new Set(COURSES.map((c) => c.school)));
}

export function crimesUnlockedByCourses(completed: string[]): Set<string> {
  const set = new Set<string>();
  for (const id of completed) {
    const c = getCourse(id);
    c?.unlocks?.forEach((u) => set.add(u));
  }
  // Default unlocked: no requiresCourse
  for (const crime of CRIMES) {
    if (!crime.requiresCourse) set.add(crime.id);
  }
  return set;
}
