import { describe, expect, it } from "vitest";
import {
  CODEX_ENTRIES,
  CRIME_RESULT_COPY,
  HEADLINES,
  HEIST_RESULT_COPY,
  REACTIVE_HEADLINES,
} from "@/content/lore";
import {
  buildNewspaperEdition,
  codexCompletePct,
  isCodexUnlocked,
  listCodex,
  listTimeline,
  pickCrimeResultLine,
  pickHeistResultLine,
  pickSeededLine,
  syncTimeline,
} from "@/game/lore";
import { createInitialState, normalizeState } from "@/game/state";
import type { DistrictId } from "@/game/types";

describe("lore content floors", () => {
  it("ships expanded headlines and reactive flags", () => {
    expect(HEADLINES.length).toBeGreaterThanOrEqual(40);
    expect(Object.keys(REACTIVE_HEADLINES).length).toBeGreaterThanOrEqual(12);
  });

  it("ships codex entries across districts, systems, schools, story", () => {
    expect(CODEX_ENTRIES.length).toBeGreaterThanOrEqual(28);
    expect(CODEX_ENTRIES.filter((e) => e.category === "district")).toHaveLength(8);
    expect(CODEX_ENTRIES.some((e) => e.category === "system")).toBe(true);
    expect(CODEX_ENTRIES.some((e) => e.category === "story")).toBe(true);
    expect(CODEX_ENTRIES.some((e) => e.category === "school")).toBe(true);
  });

  it("ships crime result banks for each family × outcome", () => {
    for (const family of ["petty", "street", "heavy"] as const) {
      for (const outcome of ["SUCCESS", "MIXED", "FAILED", "JAILED", "HOSPITALIZED"] as const) {
        expect(CRIME_RESULT_COPY[family][outcome].length).toBeGreaterThanOrEqual(4);
      }
    }
    expect(HEIST_RESULT_COPY.SUCCESS.length).toBeGreaterThanOrEqual(4);
  });
});

describe("seeded result copy", () => {
  it("is deterministic for the same seed key index", () => {
    const a = pickCrimeResultLine("petty", "SUCCESS", "seed_a", "shoplift", 3);
    const b = pickCrimeResultLine("petty", "SUCCESS", "seed_a", "shoplift", 3);
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("varies across action index without touching odds math", () => {
    const lines = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((i) => pickCrimeResultLine("street", "FAILED", "seed_b", "mug", i))
    );
    expect(lines.size).toBeGreaterThan(1);
  });

  it("picks heist flavor deterministically", () => {
    expect(pickHeistResultLine("SUCCESS", "s", "tram_skim", 1)).toBe(
      pickHeistResultLine("SUCCESS", "s", "tram_skim", 1)
    );
    expect(pickSeededLine(["a", "b"], "s", "k", 0).length).toBe(1);
  });
});

describe("codex unlocks", () => {
  it("unlocks arrival + glassrow for a fresh character", () => {
    const s = createInitialState({ created: true, name: "Test", district: "glassrow" });
    const arrival = CODEX_ENTRIES.find((e) => e.id === "story_arrival")!;
    const glass = CODEX_ENTRIES.find((e) => e.id === "dist_glassrow")!;
    expect(isCodexUnlocked(arrival, s)).toBe(true);
    expect(isCodexUnlocked(glass, s)).toBe(true);
    expect(codexCompletePct(s)).toBeGreaterThan(0);
    expect(listCodex(s).some((x) => !x.unlocked)).toBe(true);
  });

  it("unlocks millstone after visit", () => {
    const locked = createInitialState({ created: true });
    const mill = CODEX_ENTRIES.find((e) => e.id === "dist_millstone")!;
    expect(isCodexUnlocked(mill, locked)).toBe(false);
    const visited = {
      ...locked,
      lifetime: {
        ...locked.lifetime,
        districtsVisited: ["glassrow", "millstone"] as DistrictId[],
      },
    };
    expect(isCodexUnlocked(mill, visited)).toBe(true);
  });
});

describe("newspaper + timeline", () => {
  it("builds front/city/wire columns from state", () => {
    const s = createInitialState({
      created: true,
      name: "Rook",
      heat: 70,
      lifetime: {
        ...createInitialState().lifetime,
        crimesSucceeded: 2,
        timesJailed: 1,
        heistsCompleted: 1,
      },
      logs: [{ id: 1, ts: 1, text: "Level up → 2", kind: "diegetic" }],
    });
    const edition = buildNewspaperEdition(s, 1_700_000_000_000);
    expect(edition.some((a) => a.column === "front")).toBe(true);
    expect(edition.filter((a) => a.column === "city").length).toBe(8);
    expect(edition.some((a) => a.column === "wire")).toBe(true);
    expect(edition.some((a) => a.hed.includes("Rook") || a.hed.includes("jail") || a.hed.includes("Heat"))).toBe(
      true
    );
  });

  it("backfills timeline on normalize via sync", () => {
    const legacy = createInitialState({
      created: true,
      name: "Legacy",
      level: 3,
      rankIndex: 2,
      lifetime: {
        ...createInitialState().lifetime,
        crimesSucceeded: 1,
        shiftsWorked: 1,
        heistsCompleted: 1,
      },
      unlockedAwards: { neon_scratch: 1000 },
    });
    // strip timeline as old saves would
    const raw = { ...legacy, timeline: undefined } as unknown as ReturnType<typeof createInitialState>;
    const n = normalizeState(raw);
    expect(n.timeline).toEqual([]);
    const synced = syncTimeline(n);
    expect(synced.timeline.some((t) => t.id === "arrival")).toBe(true);
    expect(synced.timeline.some((t) => t.id === "first_score")).toBe(true);
    expect(synced.timeline.some((t) => t.id === "level:3")).toBe(true);
    expect(synced.timeline.some((t) => t.id === "award:neon_scratch")).toBe(true);
    expect(listTimeline(synced).length).toBeGreaterThan(3);
  });

  it("dedupes timeline ids on repeated sync", () => {
    const s = createInitialState({ created: true, name: "Dup", level: 2 });
    const once = syncTimeline(s);
    const twice = syncTimeline(once);
    expect(twice.timeline.filter((t) => t.id === "arrival")).toHaveLength(1);
    expect(twice.timeline.filter((t) => t.id === "level:2")).toHaveLength(1);
  });
});
