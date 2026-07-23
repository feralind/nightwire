import { describe, expect, it } from "vitest";
import { CRIMES, DISTRICTS, JOBS } from "@/content/catalog";

describe("v1 content scale", () => {
  it("ships 6 districts", () => {
    expect(DISTRICTS).toHaveLength(6);
    expect(DISTRICTS.map((d) => d.id).sort()).toEqual(
      ["ashcourt", "docksreach", "glassrow", "millstone", "oldcommons", "spireyard"].sort()
    );
  });

  it("ships 48 crimes as 16/16/16", () => {
    expect(CRIMES).toHaveLength(48);
    expect(CRIMES.filter((c) => c.tier === "petty")).toHaveLength(16);
    expect(CRIMES.filter((c) => c.tier === "street")).toHaveLength(16);
    expect(CRIMES.filter((c) => c.tier === "heavy")).toHaveLength(16);
  });

  it("keeps V0 crime ids stable", () => {
    for (const id of [
      "shoplift",
      "pickpocket",
      "vending",
      "bicycle",
      "mug",
      "car_breakin",
      "warehouse",
      "pharmacy",
      "armored",
      "casino_cage",
      "harbor",
      "courier",
    ]) {
      expect(CRIMES.some((c) => c.id === id)).toBe(true);
    }
  });

  it("ships 24 jobs as 8×3", () => {
    expect(JOBS).toHaveLength(24);
    const careers = Array.from(new Set(JOBS.map((j) => j.career)));
    expect(careers).toHaveLength(8);
    for (const career of careers) {
      expect(JOBS.filter((j) => j.career === career).map((j) => j.rank).sort()).toEqual([1, 2, 3]);
    }
  });
});
