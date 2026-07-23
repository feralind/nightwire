import { describe, expect, it } from "vitest";
import { GIGS, getGig } from "@/content/catalog";
import { awardConditionMet } from "./awards";
import { transcriptPerkSum } from "./careers";
import { GIGS_WEEKLY_CAP, canDoGig, computeGigPay, gigDoReasons, gigPayBonusPct } from "./gigs";
import { createInitialState } from "./state";

describe("gigs V0", () => {
  it("ships ten short legal contracts across districts", () => {
    expect(GIGS.length).toBe(10);
    expect(new Set(GIGS.flatMap((g) => g.districtBias)).size).toBeGreaterThanOrEqual(4);
  });

  it("allows open gigs while unemployed", () => {
    const s = createInitialState({
      created: true,
      jobId: null,
      energy: 100,
      heat: 0,
      gigsThisWeek: 0,
    });
    const open = getGig("courier_drop")!;
    expect(canDoGig(open, s)).toBe(true);
  });

  it("soft-gates civic gigs on heat", () => {
    const gig = getGig("civic_clipboard")!;
    const cool = createInitialState({
      created: true,
      level: 2,
      heat: 10,
      energy: 50,
      gigsThisWeek: 0,
    });
    const hot = { ...cool, heat: 55 };
    expect(canDoGig(gig, cool)).toBe(true);
    expect(canDoGig(gig, hot)).toBe(false);
    expect(gigDoReasons(gig, hot).some((r) => r.label.includes("Heat"))).toBe(true);
  });

  it("requires study track for campus filing", () => {
    const gig = getGig("campus_filing")!;
    const raw = createInitialState({
      created: true,
      energy: 50,
      completedCourses: [],
      activeCourseId: null,
    });
    expect(canDoGig(gig, raw)).toBe(false);
    expect(canDoGig(gig, { ...raw, activeCourseId: "se1" })).toBe(true);
    expect(canDoGig(gig, { ...raw, completedCourses: ["se1"] })).toBe(true);
  });

  it("applies course gig pay bonus", () => {
    expect(gigPayBonusPct([])).toBe(0);
    expect(gigPayBonusPct(["se2"])).toBe(10);
    expect(transcriptPerkSum(["se2"]).gigPayBonus).toBe(10);
    const gig = getGig("courier_drop")!;
    const base = computeGigPay(gig, {
      quality: "Standard",
      district: "millstone",
      completedCourses: [],
      happy: 700,
    });
    const boosted = computeGigPay(gig, {
      quality: "Standard",
      district: "millstone",
      completedCourses: ["se2"],
      happy: 700,
    });
    expect(boosted).toBeGreaterThan(base);
  });

  it("enforces weekly gig cap", () => {
    const gig = getGig("data_entry")!;
    const s = createInitialState({
      created: true,
      energy: 100,
      gigsThisWeek: GIGS_WEEKLY_CAP,
    });
    expect(canDoGig(gig, s)).toBe(false);
  });

  it("unlocks side_hustle award after first gig", () => {
    const s = createInitialState({
      created: true,
      lifetime: { ...createInitialState().lifetime, gigsDone: 1 },
    });
    expect(awardConditionMet("side_hustle", s)).toBe(true);
    expect(awardConditionMet("gig_circuit", s)).toBe(false);
    expect(
      awardConditionMet("gig_circuit", {
        ...s,
        lifetime: { ...s.lifetime, gigsDone: 8 },
      })
    ).toBe(true);
  });
});
