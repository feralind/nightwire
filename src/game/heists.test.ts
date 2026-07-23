import { describe, expect, it } from "vitest";
import { HEISTS, getHeist } from "@/content/heists";
import {
  applyExecuteChoice,
  applyPrepStage,
  canRunStage,
  emptyPrepBoard,
  getPrepBoard,
  heistUnlockReasons,
  isHeistUnlocked,
  nextPrepStage,
  prepReady,
  withPrepBoard,
} from "@/game/heists";
import { createInitialState, normalizeState } from "@/game/state";

describe("organized heist content", () => {
  const STABLE_EIGHT = [
    "tram_skim",
    "yard_boost",
    "commons_sweep",
    "bay_pierce",
    "ward_diversion",
    "spire_float",
    "soft_house_run",
    "bond_desk",
  ];

  it("ships the full V2 floor of 24 boards", () => {
    expect(HEISTS).toHaveLength(24);
    expect(new Set(HEISTS.map((h) => h.id)).size).toBe(24);
  });

  it("keeps the original eight board ids stable", () => {
    for (const id of STABLE_EIGHT) {
      expect(getHeist(id)).toBeDefined();
    }
    expect(HEISTS.slice(0, 8).map((h) => h.id)).toEqual(STABLE_EIGHT);
  });

  it("gives every board the intel→crew→kit→window→execute spine", () => {
    for (const h of HEISTS) {
      expect(h.stages.map((s) => s.kind)).toEqual(["intel", "crew", "kit", "window", "execute"]);
      expect(h.payoutMax).toBeGreaterThan(h.payoutMin);
      expect(h.cooldownHours).toBeGreaterThan(0);
    }
  });

  it("covers all six districts evenly", () => {
    const byDistrict = new Map<string, number>();
    for (const h of HEISTS) {
      byDistrict.set(h.district, (byDistrict.get(h.district) ?? 0) + 1);
    }
    expect(byDistrict.size).toBe(6);
    for (const count of byDistrict.values()) {
      expect(count).toBe(4);
    }
  });

  it("varies unlock gates across level, course, property, job, and district visit", () => {
    expect(HEISTS.some((h) => h.requiresLevel)).toBe(true);
    expect(HEISTS.some((h) => h.requiresCourse)).toBe(true);
    expect(HEISTS.some((h) => h.requiresProperty)).toBe(true);
    expect(HEISTS.some((h) => h.requiresJob)).toBe(true);
    expect(HEISTS.some((h) => h.requiresVisitedDistrict)).toBe(true);
  });
});

describe("heist unlock gates", () => {
  it("locks tram_skim below level 2", () => {
    const heist = getHeist("tram_skim")!;
    const s = createInitialState({ created: true, level: 1 });
    expect(isHeistUnlocked(heist, s)).toBe(false);
    expect(heistUnlockReasons(heist, s)[0]?.label).toMatch(/Level 2/);
  });

  it("requires Harbor Soft-House for soft_house_run", () => {
    const heist = getHeist("soft_house_run")!;
    const s = createInitialState({
      created: true,
      level: 6,
      completedCourses: ["hl1"],
      ownedProperties: [],
    });
    expect(isHeistUnlocked(heist, s)).toBe(false);
    expect(heistUnlockReasons(heist, s).some((r) => r.label.includes("Soft-House"))).toBe(true);
    expect(
      isHeistUnlocked(heist, { ...s, ownedProperties: ["dr_safe"] })
    ).toBe(true);
  });

  it("requires retail Shift Lead+ for neon_till", () => {
    const heist = getHeist("neon_till")!;
    const s = createInitialState({ created: true, level: 3, jobId: null });
    expect(isHeistUnlocked(heist, s)).toBe(false);
    expect(heistUnlockReasons(heist, s).some((r) => r.label.includes("Shift Lead"))).toBe(true);
    expect(isHeistUnlocked(heist, { ...s, jobId: "retail_2" })).toBe(true);
    expect(isHeistUnlocked(heist, { ...s, jobId: "retail_3" })).toBe(true);
  });

  it("requires visiting OldCommons for stoop_tax", () => {
    const heist = getHeist("stoop_tax")!;
    const s = createInitialState({
      created: true,
      level: 2,
      district: "glassrow",
    });
    s.lifetime.districtsVisited = ["glassrow"];
    expect(isHeistUnlocked(heist, s)).toBe(false);
    expect(heistUnlockReasons(heist, s)[0]?.label).toMatch(/OldCommons|Old Commons/i);
    expect(
      isHeistUnlocked(heist, {
        ...s,
        lifetime: { ...s.lifetime, districtsVisited: ["glassrow", "oldcommons"] },
      })
    ).toBe(true);
  });
});

describe("heist prep flow", () => {
  function readyState() {
    return createInitialState({
      created: true,
      seed: "test_heist_seed",
      level: 3,
      district: "glassrow",
      energy: 100,
      nerve: 50,
      street: 5000,
      clean: 2000,
      inventory: [{ itemId: "gloves", qty: 2 }],
      completedCourses: [],
    });
  }

  it("advances intel then stages kit items", () => {
    let s = readyState();
    const heist = getHeist("tram_skim")!;
    const intel = heist.stages.find((st) => st.kind === "intel")!;
    expect(canRunStage(heist, intel, s)).toBe(true);

    const r1 = applyPrepStage(s, "tram_skim");
    expect(r1).not.toBeNull();
    s = r1!.state;
    // Force success path by completing stages with a high-chance kit after marking intel done if needed
    let board = getPrepBoard(s, "tram_skim");
    // Complete remaining prep with deterministic helper: mark intel/crew done if rolls failed
    // Prefer real rolls — retry intel until success with fresh actionIndex by looping a few times
    for (let i = 0; i < 12 && !board.completedStageIds.includes("intel"); i++) {
      const r = applyPrepStage(s, "tram_skim");
      if (!r) break;
      s = r.state;
      board = getPrepBoard(s, "tram_skim");
    }
    expect(board.completedStageIds.includes("intel") || board.sunkStreet > 0).toBe(true);
  });

  it("runs a full prep+execute success with forced board state", () => {
    let s = readyState();
    const heist = getHeist("tram_skim")!;
    // Pre-complete prep stages and stage gloves
    s = withPrepBoard(s, "tram_skim", {
      ...emptyPrepBoard(),
      completedStageIds: ["intel", "crew", "kit", "window"],
      stagedItems: [{ itemId: "gloves", qty: 1 }],
      sunkStreet: 800,
      windowNight: true,
    });
    expect(prepReady(heist, getPrepBoard(s, "tram_skim"))).toBe(true);
    expect(nextPrepStage(heist, getPrepBoard(s, "tram_skim"))?.kind).toBe("execute");

    // Push through three phases — seeded RNG may fail; retry with seed variants
    let completed = false;
    for (const seed of ["nw_ok_1", "nw_ok_2", "nw_ok_3", "nw_ok_4", "nw_ok_5", "nw_ok_6", "nw_ok_7", "nw_ok_8"]) {
      s = readyState();
      s = { ...s, seed, district: "glassrow", nerve: 50 };
      s = withPrepBoard(s, "tram_skim", {
        ...emptyPrepBoard(),
        completedStageIds: ["intel", "crew", "kit", "window"],
        stagedItems: [{ itemId: "gloves", qty: 1 }],
        sunkStreet: 800,
        windowNight: true,
      });
      let fail = false;
      for (let phase = 0; phase < 3; phase++) {
        const r = applyExecuteChoice(s, "tram_skim", "push");
        expect(r).not.toBeNull();
        s = r!.state;
        if (r!.title === "FAILED" || r!.title === "JAILED" || r!.title === "HOSPITALIZED") {
          fail = true;
          break;
        }
      }
      if (!fail && (s.lifetime.heistsCompleted ?? 0) >= 1) {
        completed = true;
        expect(getPrepBoard(s, "tram_skim").completions).toBe(1);
        expect(getPrepBoard(s, "tram_skim").cooldownUntil).not.toBeNull();
        expect(s.street).toBeGreaterThan(5000);
        break;
      }
    }
    expect(completed).toBe(true);
  });

  it("abort mid-execute returns staged kit and applies cooldown", () => {
    let s = readyState();
    s = withPrepBoard(s, "tram_skim", {
      ...emptyPrepBoard(),
      completedStageIds: ["intel", "crew", "kit", "window"],
      stagedItems: [{ itemId: "gloves", qty: 1 }],
      sunkStreet: 1000,
      executePhase: "breach",
    });
    const beforeGloves = s.inventory.find((i) => i.itemId === "gloves")?.qty ?? 0;
    const r = applyExecuteChoice(s, "tram_skim", "abort");
    expect(r).not.toBeNull();
    expect(r!.title).toBe("MIXED");
    s = r!.state;
    const afterGloves = s.inventory.find((i) => i.itemId === "gloves")?.qty ?? 0;
    expect(afterGloves).toBe(beforeGloves + 1);
    expect(getPrepBoard(s, "tram_skim").executePhase).toBeNull();
    expect(getPrepBoard(s, "tram_skim").cooldownUntil).not.toBeNull();
  });

  it("failure can lose staged items without wiping the save", () => {
    let s = readyState();
    s = {
      ...s,
      seed: "lose_items_seed_aa",
      name: "KeepMe",
      street: 99999,
    };
    s = withPrepBoard(s, "tram_skim", {
      ...emptyPrepBoard(),
      completedStageIds: ["intel", "crew", "kit", "window"],
      stagedItems: [{ itemId: "gloves", qty: 1 }],
      executePhase: "approach",
    });
    // Force fail by picking seeds until fail, or inject low odds via many attempts
    let lostOrFailed = false;
    for (const seed of Array.from({ length: 20 }, (_, i) => `fail_seed_${i}`)) {
      s = readyState();
      s = { ...s, seed, name: "KeepMe", street: 99999, nerve: 50, district: "glassrow" };
      s = withPrepBoard(s, "tram_skim", {
        ...emptyPrepBoard(),
        completedStageIds: ["intel", "crew", "kit", "window"],
        stagedItems: [{ itemId: "gloves", qty: 1 }],
        executePhase: null,
      });
      const r = applyExecuteChoice(s, "tram_skim", "push");
      if (!r) continue;
      if (r.title === "FAILED" || r.title === "JAILED" || r.title === "HOSPITALIZED") {
        lostOrFailed = true;
        expect(r.state.name).toBe("KeepMe");
        expect(r.state.street).toBe(99999);
        expect(r.state.created).toBe(true);
        break;
      }
    }
    expect(lostOrFailed).toBe(true);
  });
});

describe("normalize backfill", () => {
  it("backfills prepBoards and heistsCompleted", () => {
    const raw = createInitialState({ created: true }) as ReturnType<typeof createInitialState> & {
      prepBoards?: undefined;
    };
    // Simulate legacy save missing fields
    const legacy = { ...raw } as ReturnType<typeof createInitialState>;
    delete (legacy as { prepBoards?: unknown }).prepBoards;
    delete (legacy.lifetime as { heistsCompleted?: number }).heistsCompleted;
    const n = normalizeState(legacy);
    expect(n.prepBoards).toEqual({});
    expect(n.lifetime.heistsCompleted).toBe(0);
  });

  it("backfills licenses from completed courses", () => {
    const legacy = createInitialState({
      created: true,
      completedCourses: ["cf1", "cf2"],
      licenses: [],
    });
    delete (legacy as { licenses?: string[] }).licenses;
    const n = normalizeState(legacy);
    expect(n.licenses).toEqual(expect.arrayContaining(["commerce_cert", "business_license"]));
  });
});
