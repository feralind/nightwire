import { describe, expect, it } from "vitest";
import {
  BUSINESS_STAFF_HIRE_CLEAN,
  BUSINESS_TIERS,
  businessIncomeForHours,
  businessStaffHireReasons,
  businessWeeklyPnL,
  canHireBusinessStaff,
  laundryFeeRate,
  ownedFronts,
} from "./power";
import { createInitialState, normalizeState } from "./state";

function powerBase(partial: Partial<ReturnType<typeof createInitialState>["power"]> = {}) {
  return {
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
    businessRisk: 0 as const,
    businessStaff: 0,
    ...partial,
  };
}

describe("business ownership + cleaning", () => {
  it("lists owned chain fronts from empire tier", () => {
    expect(ownedFronts(0)).toHaveLength(0);
    expect(ownedFronts(2).map((f) => f.id)).toEqual(["corner_laundry", "courier_front"]);
    expect(BUSINESS_TIERS.every((t) => t.weeklyUpkeep > 0)).toBe(true);
  });

  it("P&L is revenue − upkeep − staff wages", () => {
    const pnl = businessWeeklyPnL(powerBase({ businessTierOwned: 1 }));
    expect(pnl.revenue).toBe(200);
    expect(pnl.upkeep).toBe(40);
    expect(pnl.staffWages).toBe(0);
    expect(pnl.net).toBe(160);
  });

  it("aggressive books raise revenue and cut laundry fee", () => {
    const calm = businessWeeklyPnL(powerBase({ businessTierOwned: 1, businessRisk: 0 }));
    const hot = businessWeeklyPnL(powerBase({ businessTierOwned: 1, businessRisk: 1 }));
    expect(hot.revenue).toBeGreaterThan(calm.revenue);
    expect(laundryFeeRate(powerBase({ businessTierOwned: 1, businessRisk: 1 }))).toBeLessThan(
      laundryFeeRate(powerBase({ businessTierOwned: 1, businessRisk: 0 }))
    );
  });

  it("staff bumps revenue and laundry; hire gated without a front", () => {
    const bare = createInitialState({ created: true, clean: 10_000, power: powerBase() });
    expect(canHireBusinessStaff(bare)).toBe(false);
    expect(businessStaffHireReasons(bare).some((r) => r.label.includes("front"))).toBe(true);

    const withFront = createInitialState({
      created: true,
      clean: BUSINESS_STAFF_HIRE_CLEAN,
      power: powerBase({ businessTierOwned: 1 }),
    });
    expect(canHireBusinessStaff(withFront)).toBe(true);

    const staffed = businessWeeklyPnL(powerBase({ businessTierOwned: 1, businessStaff: 1 }));
    const solo = businessWeeklyPnL(powerBase({ businessTierOwned: 1, businessStaff: 0 }));
    expect(staffed.revenue).toBeGreaterThan(solo.revenue);
    expect(staffed.staffWages).toBeGreaterThan(0);
    expect(laundryFeeRate(powerBase({ businessTierOwned: 1, businessStaff: 1 }))).toBeLessThan(
      laundryFeeRate(powerBase({ businessTierOwned: 1 }))
    );
  });

  it("backfills businessRisk/staff on normalize", () => {
    const legacy = createInitialState({
      created: true,
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
        businessTierOwned: 2,
      } as ReturnType<typeof createInitialState>["power"],
    });
    delete (legacy.power as { businessRisk?: unknown }).businessRisk;
    delete (legacy.power as { businessStaff?: unknown }).businessStaff;
    const n = normalizeState(legacy);
    expect(n.power.businessRisk).toBe(0);
    expect(n.power.businessStaff).toBe(0);
    expect(n.power.businessTierOwned).toBe(2);
  });

  it("tick pays revenue and deducts front upkeep", async () => {
    const { applyCatchUp } = await import("./tick");
    const now = Date.now();
    const s = createInitialState({
      created: true,
      lastTickAt: now - 168 * 3600 * 1000,
      power: powerBase({ businessTierOwned: 1 }),
      clean: 100,
    });
    const { state, awaySummary } = applyCatchUp(s, now);
    // 200 revenue − 40 upkeep = +160 net on top of starting 100
    expect(state.clean).toBe(260);
    expect(awaySummary?.legal.some((l) => l.includes("revenue"))).toBe(true);
    expect(awaySummary?.legal.some((l) => l.includes("upkeep"))).toBe(true);
  });

  it("hourly income scales with territory", () => {
    const base = businessIncomeForHours(powerBase({ businessTierOwned: 1 }), 168);
    const withTerr = businessIncomeForHours(
      powerBase({
        businessTierOwned: 1,
        territory: {
          glassrow: 100,
          millstone: 100,
          docksreach: 100,
          ashcourt: 100,
          spireyard: 100,
          oldcommons: 100,
          neonpier: 0,
          redclinic: 0,
        },
      }),
      168
    );
    expect(base.income).toBe(200);
    expect(base.upkeep).toBe(40);
    expect(withTerr.income).toBeGreaterThan(base.income);
  });

  it("accepts legacy number laundryFeeRate for tier-only lookups", () => {
    expect(laundryFeeRate(0)).toBe(0.2);
    expect(laundryFeeRate(1)).toBe(0.15);
    expect(laundryFeeRate(4)).toBe(0.08);
  });
});
