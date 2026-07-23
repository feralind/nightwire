import { describe, expect, it } from "vitest";
import { COURSES, JOBS, getJob } from "@/content/catalog";
import {
  applyHospitalDuration,
  bankInterestRate,
  canApplyJob,
  canEnrollCourse,
  canPromote,
  courseEnrollReasons,
  educationOddsMod,
  hospitalTimeCutPct,
  jobApplyReasons,
  jobPromoteReasons,
  jobSpecialtyOddsMod,
  promoteXpNeeded,
  schools,
  transcriptPerkSum,
} from "./careers";
import { applyCatchUp } from "./tick";
import { createInitialState } from "./state";

describe("jobs gating", () => {
  it("allows open rank-1 apply and blocks rank-2 apply", () => {
    const s = { level: 1, completedCourses: [] as string[], jobId: null as string | null };
    expect(canApplyJob(getJob("retail_1")!, s)).toBe(true);
    expect(canApplyJob(getJob("retail_2")!, s)).toBe(false);
    expect(jobApplyReasons(getJob("retail_2")!, s)[0].label).toMatch(/Promote/);
  });

  it("gates dockhand behind level 2", () => {
    const low = { level: 1, completedCourses: [] as string[], jobId: null as string | null };
    const ok = { level: 2, completedCourses: [] as string[], jobId: null as string | null };
    expect(canApplyJob(getJob("dock_1")!, low)).toBe(false);
    expect(canApplyJob(getJob("dock_1")!, ok)).toBe(true);
  });

  it("requires job XP + exam course to promote", () => {
    const next = getJob("retail_2")!;
    const need = promoteXpNeeded(next);
    const base = {
      jobId: "retail_1",
      jobXp: need,
      completedCourses: [] as string[],
      level: 3,
    };
    expect(canPromote(next, base)).toBe(false);
    expect(jobPromoteReasons(next, base).some((r) => r.label.includes("Exam"))).toBe(true);
    expect(canPromote(next, { ...base, completedCourses: ["cf1"] })).toBe(true);
  });

  it("applies job specialty odds", () => {
    expect(jobSpecialtyOddsMod("dock_1", "harbor")).toBeGreaterThan(0);
    expect(jobSpecialtyOddsMod("retail_1", "harbor")).toBe(0);
  });
});

describe("education gating", () => {
  it("enforces course prereqs and fees", () => {
    const broke = {
      level: 5,
      completedCourses: ["se1"],
      activeCourseId: null as string | null,
      clean: 0,
      street: 0,
    };
    const se2 = COURSES.find((c) => c.id === "se2")!;
    expect(canEnrollCourse(se2, broke, false)).toBe(false);
    expect(courseEnrollReasons(se2, broke, false).some((r) => r.label.includes("clean"))).toBe(true);

    const richNoPrereq = { ...broke, clean: 9999, completedCourses: [] as string[] };
    expect(canEnrollCourse(se2, richNoPrereq, false)).toBe(false);

    const ready = { ...broke, clean: 9999 };
    expect(canEnrollCourse(se2, ready, false)).toBe(true);
  });

  it("stacks transcript perks and crime odds crumbs", () => {
    const sum = transcriptPerkSum(["cf1", "hl1"]);
    expect(sum.jobPayBonus).toBe(15);
    expect(sum.bankInterestBonus).toBe(0.5);
    expect(sum.unlockedCrimeIds).toContain("harbor");
    expect(educationOddsMod(["se1"], "street")).toBe(5);
    expect(educationOddsMod(["se1"], "heavy")).toBe(0);
    expect(bankInterestRate(["cf1"])).toBeGreaterThan(0.02);
  });

  it("med courses cut hospital time and unlock pharmacy vault", () => {
    const sum = transcriptPerkSum(["mc1", "mc2"]);
    expect(sum.hospitalTimeReduction).toBe(25);
    expect(sum.unlockedCrimeIds).toContain("hospital_vault");
    expect(hospitalTimeCutPct(["mc1"], ["med_aide"])).toBe(25);
    expect(applyHospitalDuration(100_000, ["mc1"], ["med_aide"])).toBe(75_000);
  });

  it("ships six schools on the campus", () => {
    expect(schools()).toEqual([
      "Street Electives",
      "Commerce & Finance",
      "Harbor & Logistics",
      "Med & Civic",
      "Locks & Entry",
      "Systems & Signals",
    ]);
  });

  it("gates Locks & Entry behind Street Navigation", () => {
    const le1 = COURSES.find((c) => c.id === "le1")!;
    const noSe1 = {
      level: 5,
      completedCourses: [] as string[],
      activeCourseId: null as string | null,
      clean: 9999,
      street: 0,
    };
    expect(canEnrollCourse(le1, noSe1, false)).toBe(false);
    expect(canEnrollCourse(le1, { ...noSe1, completedCourses: ["se1"] }, false)).toBe(true);
  });

  it("completes courses offline and unlocks content", () => {
    const base = createInitialState({
      created: true,
      activeCourseId: "se1",
      courseProgressHours: 11,
      clean: 100,
      lastTickAt: Date.now() - 2 * 60 * 60 * 1000,
    });
    const { state, awaySummary } = applyCatchUp(base, Date.now());
    expect(state.completedCourses).toContain("se1");
    expect(state.licenses).toContain("nav_permit");
    expect(state.activeCourseId).toBeNull();
    expect(awaySummary?.progress.some((p) => p.includes("Completed"))).toBe(true);
    expect(awaySummary?.legal.some((l) => l.includes("Scholarship"))).toBe(true);
  });

  it("pauses course progress while jailed", () => {
    const now = Date.now();
    const base = createInitialState({
      created: true,
      activeCourseId: "se1",
      courseProgressHours: 2,
      jailUntil: now + 60 * 60 * 1000,
      lastTickAt: now - 3 * 60 * 60 * 1000,
    });
    const { state } = applyCatchUp(base, now);
    expect(state.courseProgressHours).toBe(2);
    expect(state.completedCourses).not.toContain("se1");
  });
});

describe("v1 catalog floors", () => {
  it("ships 64 jobs across 16 careers × 4 ranks and 48 courses", () => {
    expect(JOBS).toHaveLength(64);
    expect(COURSES).toHaveLength(48);
    expect(JOBS.filter((j) => j.rank === 1)).toHaveLength(16);
    expect(JOBS.filter((j) => j.rank === 2)).toHaveLength(16);
    expect(JOBS.filter((j) => j.rank === 3)).toHaveLength(16);
    expect(JOBS.filter((j) => j.rank === 4)).toHaveLength(16);
  });
});
