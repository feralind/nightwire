import { describe, expect, it } from "vitest";
import {
  BUSINESS_TIERS,
  POLITICAL_RUNGS,
  RESPECT_FLEX,
  averageTerritory,
  businessBuyReasons,
  businessIncomeForHours,
  canBuyBusiness,
  canBuyPolitical,
  laundryFeeRate,
  politicalBailMult,
  politicalBuyReasons,
  politicalHeatCritRelief,
  powerMeters,
  respectFlexPay,
  respectLootMult,
  respectStreetOddsBonus,
  territoryInvestCost,
  territoryOddsBonus,
} from "./power";
import { createInitialState } from "./state";

describe("power tracks — territory", () => {
  it("odds scale linearly to +8% at 100%", () => {
    expect(territoryOddsBonus(0)).toBe(0);
    expect(territoryOddsBonus(50)).toBeCloseTo(0.04, 5);
    expect(territoryOddsBonus(100)).toBeCloseTo(0.08, 5);
    expect(territoryOddsBonus(200)).toBe(0.08);
  });

  it("invest cost rises with current %", () => {
    expect(territoryInvestCost(0)).toBe(5000);
    expect(territoryInvestCost(20)).toBeGreaterThan(territoryInvestCost(0));
    expect(territoryInvestCost(50)).toBeGreaterThan(territoryInvestCost(20));
  });
});

describe("power tracks — political", () => {
  it("defines Beat Cop → Mayor ladder (4 rungs, clean costs)", () => {
    expect(POLITICAL_RUNGS).toHaveLength(4);
    expect(POLITICAL_RUNGS[0].title).toBe("Beat Cop");
    expect(POLITICAL_RUNGS[3].title).toBe("Mayor's Circle");
    expect(POLITICAL_RUNGS[3].costClean).toBe(500_000);
  });

  it("blocks pure criminal from early rungs via legitimacy", () => {
    const s = createInitialState({
      created: true,
      clean: 50_000,
      legitimacy: 5,
      power: {
        territory: {
          glassrow: 0,
          millstone: 0,
          docksreach: 0,
          ashcourt: 0,
          spireyard: 0,
          oldcommons: 0,
          neonpier: 0,
          redclinic: 0,
        },
        politicalRung: 0,
        respect: 0,
        businessTierOwned: 0,
        businessRisk: 0,
        businessStaff: 0,
      },
    });
    const reasons = politicalBuyReasons(s);
    expect(reasons.some((r) => r.label.includes("Legitimacy"))).toBe(true);
    expect(canBuyPolitical(s)).toBe(false);
  });

  it("allows Beat Cop when legitimacy + clean met", () => {
    const s = createInitialState({
      created: true,
      clean: 5_000,
      legitimacy: 20,
    });
    expect(canBuyPolitical(s)).toBe(true);
    expect(politicalBailMult(1)).toBe(0.9);
    expect(politicalHeatCritRelief(2)).toBeGreaterThan(0);
  });
});

describe("power tracks — respect", () => {
  it("street cash pays half for same respect (2× rate)", () => {
    const flex = RESPECT_FLEX[0];
    expect(respectFlexPay(flex, true)).toBe(Math.round(flex.costClean / 2));
    expect(respectFlexPay(flex, false)).toBe(flex.costClean);
  });

  it("street odds and loot scale with respect, capped", () => {
    expect(respectStreetOddsBonus(0)).toBe(0);
    expect(respectStreetOddsBonus(250)).toBeCloseTo(0.05, 5);
    expect(respectStreetOddsBonus(999)).toBe(0.05);
    expect(respectLootMult(200)).toBeCloseTo(1.12, 5);
  });
});

describe("power tracks — business empire", () => {
  it("has 4 fronts with laundry cheaper than bank 20%", () => {
    expect(BUSINESS_TIERS).toHaveLength(4);
    expect(laundryFeeRate(0)).toBe(0.2);
    expect(laundryFeeRate(1)).toBe(0.15);
    expect(laundryFeeRate(4)).toBe(0.08);
  });

  it("gates higher tiers on legitimacy / courses", () => {
    const s = createInitialState({
      created: true,
      clean: 1_000_000,
      level: 12,
      legitimacy: 10,
      power: {
        territory: {
          glassrow: 0,
          millstone: 0,
          docksreach: 0,
          ashcourt: 0,
          spireyard: 0,
          oldcommons: 0,
          neonpier: 0,
          redclinic: 0,
        },
        politicalRung: 0,
        respect: 0,
        businessTierOwned: 0,
        businessRisk: 0,
        businessStaff: 0,
      },
    });
    expect(canBuyBusiness(s)).toBe(false);
    expect(businessBuyReasons(s).some((r) => r.label.includes("Legitimacy"))).toBe(true);
  });

  it("passive income scales with hours and territory", () => {
    const base = businessIncomeForHours(
      {
        territory: {
          glassrow: 0,
          millstone: 0,
          docksreach: 0,
          ashcourt: 0,
          spireyard: 0,
          oldcommons: 0,
          neonpier: 0,
          redclinic: 0,
        },
        politicalRung: 0,
        respect: 0,
        businessTierOwned: 1,
        businessRisk: 0,
        businessStaff: 0,
      },
      168
    );
    const withTerr = businessIncomeForHours(
      {
        territory: { glassrow: 100, millstone: 100, docksreach: 100, ashcourt: 100, spireyard: 100, oldcommons: 100, neonpier: 0, redclinic: 0 },
        politicalRung: 0,
        respect: 0,
        businessTierOwned: 1,
        businessRisk: 0,
        businessStaff: 0,
      },
      168
    );
    expect(base.income).toBe(200);
    expect(withTerr.income).toBeGreaterThan(base.income);
    expect(averageTerritory({
      territory: { glassrow: 50, millstone: 0, docksreach: 100, ashcourt: 0, spireyard: 0, oldcommons: 0, neonpier: 0, redclinic: 0 },
      politicalRung: 0,
      respect: 0,
      businessTierOwned: 0,
      businessRisk: 0,
      businessStaff: 0,
    })).toBeCloseTo(18.75, 5);
  });
});

describe("power tracks — catch-up income", () => {
  it("applyCatchUp pays business revenue into clean", async () => {
    const { applyCatchUp } = await import("./tick");
    const now = Date.now();
    const s = createInitialState({
      created: true,
      lastTickAt: now - 168 * 3600 * 1000,
      power: {
        territory: {
          glassrow: 0,
          millstone: 0,
          docksreach: 0,
          ashcourt: 0,
          spireyard: 0,
          oldcommons: 0,
          neonpier: 0,
          redclinic: 0,
        },
        politicalRung: 0,
        respect: 0,
        businessTierOwned: 1,
        businessRisk: 0,
        businessStaff: 0,
      },
      clean: 100,
    });
    const { state, awaySummary } = applyCatchUp(s, now);
    // 200 revenue − 40 upkeep netting +160 → 260
    expect(state.clean).toBeGreaterThanOrEqual(260);
    expect(awaySummary?.legal.some((l) => l.includes("Laundromat") || l.includes("revenue"))).toBe(true);
  });
});

describe("power tracks — hybrid meters", () => {
  it("hints street-heavy when respect high and political low", () => {
    const s = createInitialState({
      created: true,
      power: {
        territory: {
          glassrow: 10,
          millstone: 10,
          docksreach: 10,
          ashcourt: 10,
          spireyard: 10,
          oldcommons: 10,
          neonpier: 0,
          redclinic: 0,
        },
        politicalRung: 0,
        respect: 220,
        businessTierOwned: 0,
        businessRisk: 0,
        businessStaff: 0,
      },
    });
    const m = powerMeters(s);
    expect(m.hybridHint.toLowerCase()).toContain("street");
  });
});
