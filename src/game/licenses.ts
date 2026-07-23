import { LICENSES, getCourse, getLicense } from "@/content/catalog";
import type { LicenseDef } from "@/game/types";

export function licenseForCourse(courseId: string): LicenseDef | undefined {
  return LICENSES.find((l) => l.courseId === courseId);
}

/** License ids that should exist given completed courses. */
export function licensesFromCourses(completedCourseIds: string[]): string[] {
  const ids: string[] = [];
  for (const courseId of completedCourseIds) {
    const lic = licenseForCourse(courseId);
    if (lic) ids.push(lic.id);
  }
  return ids;
}

/** Merge owned licenses with those implied by completed courses (save backfill). */
export function syncLicenses(completedCourseIds: string[], owned: string[] = []): string[] {
  return Array.from(new Set([...owned, ...licensesFromCourses(completedCourseIds)]));
}

export function licenseEffectLabels(license: LicenseDef): string[] {
  const perks: string[] = [];
  if (license.jobPayBonus) perks.push(`+${license.jobPayBonus}% job pay`);
  if (license.bankInterestBonus) perks.push(`+${license.bankInterestBonus}% bank interest`);
  if (license.oddsBonus) {
    const fam = license.oddsFamilies?.join("/") ?? "crime";
    perks.push(`+${license.oddsBonus}% ${fam} odds`);
  }
  if (license.weeklyStipend) perks.push(`$${license.weeklyStipend}/wk stipend`);
  if (license.legitimacyGain) perks.push(`+${license.legitimacyGain} legitimacy on earn`);
  return perks;
}

export function licensePerkSum(licenseIds: string[]): {
  jobPayBonus: number;
  bankInterestBonus: number;
  oddsBonus: number;
  weeklyStipend: number;
} {
  let jobPayBonus = 0;
  let bankInterestBonus = 0;
  let oddsBonus = 0;
  let weeklyStipend = 0;
  for (const id of licenseIds) {
    const l = getLicense(id);
    if (!l) continue;
    jobPayBonus += l.jobPayBonus ?? 0;
    bankInterestBonus += l.bankInterestBonus ?? 0;
    oddsBonus += l.oddsBonus ?? 0;
    weeklyStipend += l.weeklyStipend ?? 0;
  }
  return { jobPayBonus, bankInterestBonus, oddsBonus, weeklyStipend };
}

export function licenseJobPayBonus(licenseIds: string[]): number {
  return licensePerkSum(licenseIds).jobPayBonus;
}

export function licenseBankInterestBonus(licenseIds: string[]): number {
  return licensePerkSum(licenseIds).bankInterestBonus;
}

export function licenseWeeklyStipend(licenseIds: string[]): number {
  return licensePerkSum(licenseIds).weeklyStipend;
}

export function licenseOddsMod(
  licenseIds: string[],
  crimeFamily: "petty" | "street" | "heavy"
): number {
  let mod = 0;
  for (const id of licenseIds) {
    const l = getLicense(id);
    if (!l?.oddsBonus) continue;
    if (!l.oddsFamilies || l.oddsFamilies.includes(crimeFamily)) {
      mod += l.oddsBonus;
    }
  }
  return mod;
}

/** Grant a newly earned license; returns legitimacy delta applied. */
export function grantLicenseOnCourseComplete(
  licenses: string[],
  courseId: string
): { licenses: string[]; license: LicenseDef | null; legitimacyGain: number } {
  const license = licenseForCourse(courseId) ?? null;
  if (!license || licenses.includes(license.id)) {
    return { licenses, license: null, legitimacyGain: 0 };
  }
  return {
    licenses: [...licenses, license.id],
    license,
    legitimacyGain: license.legitimacyGain ?? 0,
  };
}

export function licenseCourseName(license: LicenseDef): string {
  return getCourse(license.courseId)?.name ?? license.courseId;
}
