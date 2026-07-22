import { describe, expect, it } from "vitest";
import { AWARDS, CONTACTS, PROPERTIES } from "@/content/catalog";
import { awardConditionMet, evaluateAwards } from "./awards";
import { applyContactAction, contactTipOddsBonus, isContactUnlocked } from "./contacts";
import { canBuyProperty, weeklyPropertyNet, landlordRentBonus } from "./properties";
import { applyRivalAwayPressure, maybeApplyRivalEvents, rivalFlagCount } from "./rival";
import { applyCatchUp } from "./tick";
import { createInitialState } from "./state";
import { bankInterestRate } from "./careers";

describe("properties", () => {
  it("ships V0 property listings across 3 districts", () => {
    expect(PROPERTIES.length).toBeGreaterThanOrEqual(6);
    expect(new Set(PROPERTIES.map((p) => p.district)).size).toBe(3);
  });

  it("requires in-district purchase with clean cash", () => {
    const prop = PROPERTIES.find((p) => p.district === "millstone")!;
    const broke = {
      district: "millstone" as const,
      clean: 0,
      ownedProperties: [] as string[],
    };
    expect(canBuyProperty(prop, broke)).toBe(false);
    expect(canBuyProperty(prop, { ...broke, clean: prop.cost, district: "glassrow" })).toBe(false);
    expect(canBuyProperty(prop, { ...broke, clean: prop.cost })).toBe(true);
  });

  it("applies landlord rent bonus from Bookkeeping", () => {
    expect(landlordRentBonus([])).toBe(0);
    expect(landlordRentBonus(["cf1"])).toBe(0.1);
    const ids = [PROPERTIES[0].id];
    const base = weeklyPropertyNet(ids, []);
    const boosted = weeklyPropertyNet(ids, ["cf1"]);
    expect(boosted.income).toBeGreaterThan(base.income);
    expect(boosted.upkeep).toBe(base.upkeep);
  });

  it("pays rent and upkeep on catch-up", () => {
    const prop = PROPERTIES[0];
    const base = createInitialState({
      created: true,
      ownedProperties: [prop.id],
      clean: 5000,
      lastTickAt: Date.now() - 168 * 60 * 60 * 1000,
    });
    const { state, awaySummary } = applyCatchUp(base, Date.now());
    expect(awaySummary?.legal.some((l) => l.includes("Property rent"))).toBe(true);
    expect(awaySummary?.legal.some((l) => l.includes("Property upkeep"))).toBe(true);
    expect(state.lifetime.rentCollected).toBeGreaterThan(0);
  });
});

describe("bank interest wiring", () => {
  it("earns interest and tracks lifetime", () => {
    const base = createInitialState({
      created: true,
      bank: 10000,
      completedCourses: ["cf1"],
      lastTickAt: Date.now() - 168 * 60 * 60 * 1000,
    });
    expect(bankInterestRate(["cf1"])).toBeGreaterThan(0.02);
    const { state, awaySummary } = applyCatchUp(base, Date.now());
    expect(state.bank).toBeGreaterThan(10000);
    expect(state.lifetime.interestEarned).toBeGreaterThan(0);
    expect(awaySummary?.legal.some((l) => l.includes("Bank interest"))).toBe(true);
  });
});

describe("awards", () => {
  it("ships original Nightwire award set", () => {
    expect(AWARDS.length).toBeGreaterThanOrEqual(20);
    expect(AWARDS.every((a) => a.name && a.blurb && a.category)).toBe(true);
  });

  it("unlocks neon_scratch on first crime success", () => {
    const s = createInitialState({
      created: true,
      lifetime: {
        ...createInitialState().lifetime,
        crimesSucceeded: 1,
        crimesAttempted: 1,
      },
    });
    expect(awardConditionMet("neon_scratch", s)).toBe(true);
    const { unlocked } = evaluateAwards(s);
    expect(unlocked.some((a) => a.id === "neon_scratch")).toBe(true);
  });

  it("does not re-unlock already claimed awards", () => {
    const s = createInitialState({
      created: true,
      unlockedAwards: { neon_scratch: Date.now() },
      lifetime: {
        ...createInitialState().lifetime,
        crimesSucceeded: 5,
        crimesAttempted: 5,
      },
    });
    const { unlocked } = evaluateAwards(s);
    expect(unlocked.some((a) => a.id === "neon_scratch")).toBe(false);
  });
});

describe("contacts", () => {
  it("ships six V0 contacts with unlock gates", () => {
    expect(CONTACTS.length).toBe(6);
    const fresh = createInitialState({ created: true });
    expect(isContactUnlocked(CONTACTS.find((c) => c.id === "reed")!, fresh)).toBe(true);
    expect(isContactUnlocked(CONTACTS.find((c) => c.id === "nix")!, fresh)).toBe(false);
    expect(
      isContactUnlocked(CONTACTS.find((c) => c.id === "nix")!, {
        ...fresh,
        lifetime: { ...fresh.lifetime, crimesAttempted: 5 },
      })
    ).toBe(true);
  });

  it("Reed check-in softens stress and raises favor", () => {
    const base = createInitialState({ created: true, stress: 40, happy: 500 });
    const result = applyContactAction(base, "reed", "ping");
    expect(result).not.toBeNull();
    expect(result!.state.stress).toBeLessThan(base.stress);
    expect(result!.state.happy).toBeGreaterThan(base.happy);
    expect(result!.state.contacts.reed.favor).toBeGreaterThanOrEqual(1);
    expect(result!.state.lifetime.contactUses).toBe(1);
  });

  it("Nix tip grants temporary street odds", () => {
    const base = createInitialState({
      created: true,
      street: 1000,
      lifetime: { ...createInitialState().lifetime, crimesAttempted: 5 },
    });
    const result = applyContactAction(base, "nix", "tip");
    expect(result).not.toBeNull();
    expect(result!.state.contactTips.length).toBe(1);
    expect(result!.state.lifetime.tipsBought).toBe(1);
    expect(contactTipOddsBonus(result!.state.contactTips, { id: "mug", family: "street" })).toBe(6);
    expect(contactTipOddsBonus(result!.state.contactTips, { id: "shoplift", family: "petty" })).toBe(0);
  });

  it("Mara retain drops investigation cheaper than generic lawyer", () => {
    const base = createInitialState({
      created: true,
      level: 2,
      investigation: 2,
      clean: 2000,
    });
    const result = applyContactAction(base, "mara", "retain");
    expect(result).not.toBeNull();
    expect(result!.state.investigation).toBe(1);
    expect(result!.state.clean).toBe(base.clean - 1200);
  });
});

describe("rival", () => {
  it("fires scripted beats with soft stress pressure", () => {
    const base = createInitialState({
      created: true,
      level: 3,
      stress: 10,
      happy: 700,
    });
    const next = maybeApplyRivalEvents(base, (st, text) => ({
      ...st,
      logs: [...st.logs, { id: st.logSeq + 1, ts: Date.now(), text, kind: "diegetic" as const }],
      logSeq: st.logSeq + 1,
    }));
    expect(next.rivalFlags.l3).toBe(true);
    expect(next.rivalScore).toBeGreaterThan(base.rivalScore);
    expect(next.stress).toBeGreaterThan(base.stress);
    expect(rivalFlagCount(next)).toBeGreaterThanOrEqual(1);
  });

  it("away pressure stamps hourly bucket when rival score exists", () => {
    const now = Date.now();
    const base = createInitialState({
      created: true,
      rivalScore: 12,
      rivalPressureAt: 0,
      street: 500,
      stress: 20,
      happy: 600,
      lastTickAt: now - 10 * 3600 * 1000,
    });
    const city: string[] = [];
    const street: string[] = [];
    const next = applyRivalAwayPressure(base, 10, now, city, street);
    expect(next.rivalPressureAt).toBe(Math.floor(now / 3600000));
  });
});
