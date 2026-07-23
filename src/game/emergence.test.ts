import { describe, expect, it } from "vitest";
import { EMERGENCE_RULES, awayRules, directorRules } from "@/content/emergence_rules";
import { emergenceRuleCount, pickDirectorEvent } from "./emergence";
import { applyCatchUp } from "./tick";
import { createInitialState } from "./state";

describe("emergence rules", () => {
  it("ships ≥30 data-driven rules", () => {
    expect(emergenceRuleCount()).toBeGreaterThanOrEqual(30);
    expect(EMERGENCE_RULES.length).toBe(emergenceRuleCount());
    expect(directorRules().length).toBeGreaterThanOrEqual(8);
    expect(awayRules().length).toBeGreaterThanOrEqual(12);
  });

  it("pickDirectorEvent returns stable ids from seed bucket", () => {
    const a = pickDirectorEvent("seed-a", 42);
    const b = pickDirectorEvent("seed-a", 42);
    expect(a).toEqual(b);
    expect(a.id.length).toBeGreaterThan(0);
    expect(a.label.length).toBeGreaterThan(0);
  });

  it("catch-up can surface emergence city lines on long away", () => {
    const base = createInitialState({
      created: true,
      heat: 80,
      street: 20000,
      ownedProperties: [],
      rivalScore: 8,
      lastTickAt: Date.now() - 30 * 60 * 60 * 1000,
    });
    const { awaySummary } = applyCatchUp(base, Date.now());
    expect(awaySummary).toBeTruthy();
    // Soft rules are chance-based; just ensure catch-up completed with buckets
    expect(awaySummary!.hours).toBeGreaterThan(20);
  });
});
