import { describe, expect, it } from "vitest";
import { COURSES, LICENSES } from "@/content/catalog";
import {
  bankInterestRate,
  educationOddsMod,
} from "./careers";
import {
  grantLicenseOnCourseComplete,
  licenseForCourse,
  licenseJobPayBonus,
  licenseOddsMod,
  licensePerkSum,
  licenseWeeklyStipend,
  syncLicenses,
} from "./licenses";
import { applyCatchUp } from "./tick";
import { createInitialState, normalizeState } from "./state";

describe("license catalog", () => {
  it("maps one license per campus course", () => {
    expect(LICENSES).toHaveLength(15);
    expect(COURSES).toHaveLength(15);
    for (const course of COURSES) {
      const lic = licenseForCourse(course.id);
      expect(lic, `missing license for ${course.id}`).toBeDefined();
      expect(lic!.courseId).toBe(course.id);
    }
  });
});

describe("license effects", () => {
  it("stacks job pay, bank interest, harbor/street odds, and weekly stipend", () => {
    const ids = ["commerce_cert", "harbor_safety", "nav_permit"];
    const sum = licensePerkSum(ids);
    expect(sum.jobPayBonus).toBe(3 + 4);
    expect(sum.bankInterestBonus).toBe(0.5);
    expect(sum.weeklyStipend).toBe(40 + 35 + 15);
    expect(licenseOddsMod(ids, "street")).toBe(2);
    expect(licenseOddsMod(ids, "heavy")).toBe(3);
    expect(licenseOddsMod(ids, "petty")).toBe(0);
    expect(licenseJobPayBonus(ids)).toBe(7);
  });

  it("feeds bank interest and education odds helpers", () => {
    expect(bankInterestRate(["cf1"], ["commerce_cert"])).toBeGreaterThan(bankInterestRate(["cf1"]));
    expect(educationOddsMod(["se1"], "street", ["nav_permit"])).toBe(7);
    expect(educationOddsMod(["hl1"], "heavy", ["harbor_safety"])).toBe(8);
  });
});

describe("license grant + backfill", () => {
  it("grants license + legitimacy once on course complete", () => {
    const first = grantLicenseOnCourseComplete([], "cf1");
    expect(first.license?.id).toBe("commerce_cert");
    expect(first.legitimacyGain).toBe(4);
    expect(first.licenses).toEqual(["commerce_cert"]);

    const again = grantLicenseOnCourseComplete(first.licenses, "cf1");
    expect(again.license).toBeNull();
    expect(again.legitimacyGain).toBe(0);
  });

  it("backfills licenses from completed courses without re-applying legitimacy", () => {
    const raw = createInitialState({
      created: true,
      completedCourses: ["se1", "hl1"],
    });
    delete (raw as { licenses?: string[] }).licenses;
    const n = normalizeState(raw);
    expect(n.licenses).toEqual(expect.arrayContaining(["nav_permit", "harbor_safety"]));
    expect(n.legitimacy).toBe(raw.legitimacy);
  });

  it("syncLicenses merges owned + course-implied", () => {
    expect(syncLicenses(["cf1"], ["business_license"])).toEqual(
      expect.arrayContaining(["commerce_cert", "business_license"])
    );
  });

  it("completing a course offline grants its license and bumps legitimacy", () => {
    const base = createInitialState({
      created: true,
      activeCourseId: "se1",
      courseProgressHours: 11,
      clean: 100,
      legitimacy: 10,
      lastTickAt: Date.now() - 2 * 60 * 60 * 1000,
    });
    const { state, awaySummary } = applyCatchUp(base, Date.now());
    expect(state.completedCourses).toContain("se1");
    expect(state.licenses).toContain("nav_permit");
    expect(state.legitimacy).toBeGreaterThan(10);
    expect(awaySummary?.progress.some((p) => p.includes("License earned"))).toBe(true);
  });

  it("pays weekly license stipend on catch-up", () => {
    const weekly = licenseWeeklyStipend(["commerce_cert"]);
    expect(weekly).toBe(40);
    const base = createInitialState({
      created: true,
      licenses: ["commerce_cert"],
      clean: 0,
      lastTickAt: Date.now() - 168 * 60 * 60 * 1000,
    });
    const { state, awaySummary } = applyCatchUp(base, Date.now());
    expect(state.clean).toBeGreaterThanOrEqual(40);
    expect(awaySummary?.legal.some((l) => l.includes("License stipend"))).toBe(true);
  });
});
