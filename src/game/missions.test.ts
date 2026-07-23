import { describe, expect, it } from "vitest";
import { MISSIONS, getMission } from "@/content/missions";
import type { DistrictId } from "@/game/types";
import { createInitialState } from "./state";
import {
  emptyMissions,
  expireMissions,
  missionAcceptReasons,
  missionProgress,
  MISSIONS_ACTIVE_CAP,
  objectiveMet,
  snapshotFrom,
} from "./missions";

describe("missions board", () => {
  it("ships a solid starter set (12+)", () => {
    expect(MISSIONS.length).toBeGreaterThanOrEqual(12);
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    expect(MISSIONS.every((m) => m.objectives.length >= 1 && m.rewards)).toBe(true);
  });

  it("gates accept on active cap and resources", () => {
    const mission = getMission("m_glass_welcome")!;
    const s = createInitialState({
      created: true,
      energy: 100,
      missions: {
        ...emptyMissions(),
        active: [
          {
            missionId: "m_mill_scrap",
            acceptedAt: Date.now(),
            deadlineAt: null,
            snapshot: snapshotFrom(createInitialState()),
          },
          {
            missionId: "m_gym_contract",
            acceptedAt: Date.now(),
            deadlineAt: null,
            snapshot: snapshotFrom(createInitialState()),
          },
        ],
      },
    });
    expect(MISSIONS_ACTIVE_CAP).toBe(2);
    expect(missionAcceptReasons(mission, s).some((r) => r.label.includes("Active cap"))).toBe(true);

    const lowEnergy = createInitialState({ created: true, energy: 0 });
    expect(missionAcceptReasons(mission, lowEnergy).some((r) => r.label.includes("energy"))).toBe(
      true
    );
  });

  it("tracks visit + gig objectives from snapshot deltas", () => {
    const mission = getMission("m_glass_welcome")!;
    const base = createInitialState({
      created: true,
      district: "millstone",
      lifetime: {
        ...createInitialState().lifetime,
        gigsDone: 0,
        districtsVisited: ["millstone"],
      },
    });
    const snap = snapshotFrom(base);
    expect(objectiveMet(mission.objectives[0], base, snap)).toBe(false);

    const progressed = {
      ...base,
      district: "glassrow" as const,
      lifetime: {
        ...base.lifetime,
        gigsDone: 1,
        districtsVisited: ["millstone", "glassrow"] as DistrictId[],
      },
    };
    const prog = missionProgress(mission, progressed, snap);
    expect(prog.complete).toBe(true);
  });

  it("expires overdue missions with fail penalty", () => {
    const mission = getMission("m_dock_eyes")!;
    const now = Date.now();
    const s = createInitialState({
      created: true,
      heat: 10,
      street: 500,
      missions: {
        ...emptyMissions(),
        active: [
          {
            missionId: mission.id,
            acceptedAt: now - 50 * 3600_000,
            deadlineAt: now - 1000,
            snapshot: snapshotFrom(createInitialState()),
          },
        ],
      },
    });
    const { state, expired } = expireMissions(s, now);
    expect(expired).toContain(mission.id);
    expect(state.missions.active).toHaveLength(0);
    expect(state.missions.failedIds).toContain(mission.id);
    expect(state.heat).toBeGreaterThan(10);
  });
});
