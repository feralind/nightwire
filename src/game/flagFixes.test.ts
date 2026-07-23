import { describe, expect, it } from "vitest";
import { happyStudyFactor } from "./formulas";
import { planStreetShopBuy, STREET_SHOP_VISIT_CAP } from "./shops";
import { applyCatchUp } from "./tick";
import { createInitialState } from "./state";

describe("street shop visit cap", () => {
  it("blocks elite street buys", () => {
    const r = planStreetShopBuy({
      district: "glassrow",
      shopStyle: "elite",
      street: 99999,
      streetSpendVisit: 0,
      shopSpendDistrict: null,
      price: 100,
    });
    expect(r.ok).toBe(false);
  });

  it("accumulates spend and enforces $5000 visit cap", () => {
    const first = planStreetShopBuy({
      district: "millstone",
      shopStyle: "tools",
      street: 10000,
      streetSpendVisit: 0,
      shopSpendDistrict: null,
      price: 3000,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.streetSpendVisit).toBe(3000);
    expect(first.remaining).toBe(2000);

    const second = planStreetShopBuy({
      district: "millstone",
      shopStyle: "tools",
      street: 7000,
      streetSpendVisit: first.streetSpendVisit,
      shopSpendDistrict: "millstone",
      price: 2500,
    });
    expect(second.ok).toBe(false);

    const ok2 = planStreetShopBuy({
      district: "millstone",
      shopStyle: "tools",
      street: 7000,
      streetSpendVisit: first.streetSpendVisit,
      shopSpendDistrict: "millstone",
      price: 2000,
    });
    expect(ok2.ok).toBe(true);
    if (!ok2.ok) return;
    expect(ok2.streetSpendVisit).toBe(STREET_SHOP_VISIT_CAP);
  });

  it("resets when district changes", () => {
    const r = planStreetShopBuy({
      district: "docksreach",
      shopStyle: "black",
      street: 8000,
      streetSpendVisit: 5000,
      shopSpendDistrict: "millstone",
      price: 4000,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.streetSpendVisit).toBe(4000);
  });
});

describe("happy study factor", () => {
  it("slows study when happy is low", () => {
    expect(happyStudyFactor(700)).toBe(1);
    expect(happyStudyFactor(400)).toBe(0.9);
    expect(happyStudyFactor(50)).toBe(0.6);
  });
});

describe("catch-up 8h / 24h / 72h", () => {
  const hour = 60 * 60 * 1000;

  it("8h: regen, heat decay, stress soft drop, away modal", () => {
    const now = Date.now();
    const base = createInitialState({
      created: true,
      energy: 20,
      nerve: 2,
      heat: 40,
      stress: 30,
      bank: 10000,
      lastTickAt: now - 8 * hour,
    });
    const { state, awaySummary } = applyCatchUp(base, now);
    expect(awaySummary).not.toBeNull();
    expect(awaySummary!.hours).toBeCloseTo(8, 0);
    expect(state.energy).toBeGreaterThan(20);
    expect(state.nerve).toBeGreaterThan(2);
    expect(state.heat).toBeLessThan(40);
    expect(state.stress).toBeLessThan(30);
    expect(state.bank).toBeGreaterThanOrEqual(10000);
    expect(state.lifetime.interestEarned).toBeGreaterThanOrEqual(0);
  });

  it("24h: bank interest + investigation cool one stage + course progress", () => {
    const now = Date.now();
    const base = createInitialState({
      created: true,
      bank: 16800,
      heat: 10,
      investigation: 2,
      activeCourseId: "cf2",
      courseProgressHours: 0,
      happy: 700,
      stress: 0,
      lastTickAt: now - 24 * hour,
    });
    const { state, awaySummary } = applyCatchUp(base, now);
    expect(awaySummary).not.toBeNull();
    expect(awaySummary!.hours).toBeCloseTo(24, 0);
    expect(state.lifetime.interestEarned).toBeGreaterThan(0);
    expect(state.bank).toBeGreaterThan(16800);
    expect(state.investigation).toBe(1);
    // cf2 is 48h — 24h away should leave ~24h progress (not complete yet)
    expect(state.courseProgressHours).toBeGreaterThan(20);
    expect(state.activeCourseId).toBe("cf2");
  });

  it("72h: larger stress relief + property rent/upkeep + away modal sections", () => {
    const now = Date.now();
    const base = createInitialState({
      created: true,
      stress: 50,
      clean: 5000,
      ownedProperties: ["gr_walkup"],
      completedCourses: [],
      lastTickAt: now - 72 * hour,
    });
    const { state, awaySummary } = applyCatchUp(base, now);
    expect(awaySummary).not.toBeNull();
    expect(awaySummary!.hours).toBeCloseTo(72, 0);
    expect(state.stress).toBeLessThanOrEqual(30);
    expect(awaySummary!.legal.length + awaySummary!.progress.length).toBeGreaterThan(0);
  });

  it("low happy slows course progress vs high happy", () => {
    const now = Date.now();
    const low = applyCatchUp(
      createInitialState({
        created: true,
        activeCourseId: "se1",
        courseProgressHours: 0,
        happy: 50,
        stress: 0,
        lastTickAt: now - 10 * hour,
      }),
      now
    ).state.courseProgressHours;
    const high = applyCatchUp(
      createInitialState({
        created: true,
        activeCourseId: "se1",
        courseProgressHours: 0,
        happy: 800,
        stress: 0,
        lastTickAt: now - 10 * hour,
      }),
      now
    ).state.courseProgressHours;
    expect(high).toBeGreaterThan(low);
  });
});
