import { describe, expect, it } from "vitest";
import { CRIMES, DISTRICTS, JOBS } from "@/content/catalog";

describe("v1 content scale", () => {
  it("ships 8 districts", () => {
    expect(DISTRICTS).toHaveLength(8);
    expect(DISTRICTS.map((d) => d.id).sort()).toEqual(
      [
        "ashcourt",
        "docksreach",
        "glassrow",
        "millstone",
        "neonpier",
        "oldcommons",
        "redclinic",
        "spireyard",
      ].sort()
    );
  });

  it("ships 144 crimes as 48/48/48", () => {
    expect(CRIMES).toHaveLength(144);
    expect(CRIMES.filter((c) => c.tier === "petty")).toHaveLength(48);
    expect(CRIMES.filter((c) => c.tier === "street")).toHaveLength(48);
    expect(CRIMES.filter((c) => c.tier === "heavy")).toHaveLength(48);
    const ids = CRIMES.map((c) => c.id);
    expect(new Set(ids).size).toBe(144);
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

  it("ships 64 jobs across 16 careers × ranks 1–4", () => {
    expect(JOBS).toHaveLength(64);
    const careers = Array.from(new Set(JOBS.map((j) => j.career)));
    expect(careers).toHaveLength(16);
    for (const career of careers) {
      expect(JOBS.filter((j) => j.career === career).map((j) => j.rank).sort((a, b) => a - b)).toEqual([
        1, 2, 3, 4,
      ]);
    }
  });
});
