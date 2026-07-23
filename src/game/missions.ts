import { getCourse, getItem } from "@/content/catalog";
import { getMission, MISSIONS, type MissionDef, type MissionObjective } from "@/content/missions";
import type { DistrictId } from "@/game/types";
import type { GameState } from "@/game/state";

export const MISSIONS_ACTIVE_CAP = 2;

export type MissionSnapshot = {
  crimesSucceeded: number;
  gigsDone: number;
  street: number;
  clean: number;
  gymSessions: number;
  attacksWon: number;
  shiftsWorked: number;
  districtsVisited: DistrictId[];
};

export type ActiveMission = {
  missionId: string;
  acceptedAt: number;
  deadlineAt: number | null;
  snapshot: MissionSnapshot;
};

export type MissionsState = {
  active: ActiveMission[];
  completedIds: string[];
  failedIds: string[];
  log: { missionId: string; outcome: "complete" | "fail" | "abandon"; at: number; payout: number }[];
};

export function emptyMissions(): MissionsState {
  return { active: [], completedIds: [], failedIds: [], log: [] };
}

export function ensureMissionsState(s: GameState): GameState {
  const cur = s.missions;
  if (cur?.active) {
    return {
      ...s,
      missions: {
        active: cur.active ?? [],
        completedIds: cur.completedIds ?? [],
        failedIds: cur.failedIds ?? [],
        log: cur.log ?? [],
      },
    };
  }
  return { ...s, missions: emptyMissions() };
}

export function snapshotFrom(s: GameState): MissionSnapshot {
  return {
    crimesSucceeded: s.lifetime.crimesSucceeded,
    gigsDone: s.lifetime.gigsDone,
    street: s.street,
    clean: s.clean,
    gymSessions: s.lifetime.gymSessions,
    attacksWon: s.lifetime.attacksWon,
    shiftsWorked: s.lifetime.shiftsWorked,
    districtsVisited: [...(s.lifetime.districtsVisited ?? [])],
  };
}

export function objectiveLabel(obj: MissionObjective): string {
  switch (obj.type) {
    case "visit_district":
      return `Visit ${obj.district}`;
    case "crimes_ok":
      return `Succeed ${obj.count} crime${obj.count === 1 ? "" : "s"}`;
    case "gigs_done":
      return `Complete ${obj.count} gig${obj.count === 1 ? "" : "s"}`;
    case "earn_street":
      return `Net +$${obj.amount} street since accept`;
    case "earn_clean":
      return `Net +$${obj.amount} clean since accept`;
    case "have_item":
      return `Hold ${getItem(obj.itemId)?.name ?? obj.itemId}${obj.qty && obj.qty > 1 ? ` ×${obj.qty}` : ""}`;
    case "reach_level":
      return `Reach level ${obj.level}`;
    case "heat_below":
      return `Heat ≤ ${obj.heat}`;
    case "gym_sessions":
      return `Train ${obj.count} gym session${obj.count === 1 ? "" : "s"}`;
    case "attacks_won":
      return `Win ${obj.count} attack${obj.count === 1 ? "" : "s"}`;
    case "shifts_worked":
      return `Work ${obj.count} shift${obj.count === 1 ? "" : "s"}`;
    case "bank_balance":
      return `Bank ≥ $${obj.amount}`;
    default:
      return "Objective";
  }
}

export function objectiveMet(obj: MissionObjective, s: GameState, snap: MissionSnapshot): boolean {
  switch (obj.type) {
    case "visit_district":
      if (s.district === obj.district) return true;
      return (
        (s.lifetime.districtsVisited ?? []).includes(obj.district) &&
        !snap.districtsVisited.includes(obj.district)
      );
    case "crimes_ok":
      return s.lifetime.crimesSucceeded - snap.crimesSucceeded >= obj.count;
    case "gigs_done":
      return s.lifetime.gigsDone - snap.gigsDone >= obj.count;
    case "earn_street":
      return s.street - snap.street >= obj.amount;
    case "earn_clean":
      return s.clean - snap.clean >= obj.amount;
    case "have_item": {
      const qty = obj.qty ?? 1;
      const held = s.inventory.find((i) => i.itemId === obj.itemId)?.qty ?? 0;
      return held >= qty;
    }
    case "reach_level":
      return s.level >= obj.level;
    case "heat_below":
      return s.heat <= obj.heat;
    case "gym_sessions":
      return s.lifetime.gymSessions - snap.gymSessions >= obj.count;
    case "attacks_won":
      return s.lifetime.attacksWon - snap.attacksWon >= obj.count;
    case "shifts_worked":
      return s.lifetime.shiftsWorked - snap.shiftsWorked >= obj.count;
    case "bank_balance":
      return s.bank >= obj.amount;
    default:
      return false;
  }
}

export function missionProgress(mission: MissionDef, s: GameState, snap: MissionSnapshot) {
  const checks = mission.objectives.map((o) => ({
    label: objectiveLabel(o),
    done: objectiveMet(o, s, snap),
  }));
  const done = checks.filter((c) => c.done).length;
  return { checks, done, total: checks.length, complete: done === checks.length };
}

export function missionAcceptReasons(
  mission: MissionDef,
  s: GameState
): { label: string; href?: string }[] {
  const reasons: { label: string; href?: string }[] = [];
  const now = Date.now();
  const board = ensureMissionsState(s).missions!;
  if (s.hospitalUntil && s.hospitalUntil > now) reasons.push({ label: "Hospitalized", href: "/hospital" });
  if (s.jailUntil && s.jailUntil > now) reasons.push({ label: "Jailed", href: "/jail" });
  if (s.travelUntil && s.travelUntil > now) reasons.push({ label: "Traveling", href: "/travel" });
  if (s.laylowUntil && s.laylowUntil > now) reasons.push({ label: "Laying low", href: "/travel" });
  if (board.active.some((a) => a.missionId === mission.id)) {
    reasons.push({ label: "Already accepted" });
  }
  if (board.completedIds.includes(mission.id)) {
    reasons.push({ label: "Already completed" });
  }
  if (board.active.length >= MISSIONS_ACTIVE_CAP) {
    reasons.push({ label: `Active cap ${MISSIONS_ACTIVE_CAP}` });
  }
  if (mission.requiresLevel && s.level < mission.requiresLevel) {
    reasons.push({ label: `Level ${mission.requiresLevel}`, href: "/profile" });
  }
  if (mission.requiresCourse && !s.completedCourses.includes(mission.requiresCourse)) {
    const c = getCourse(mission.requiresCourse);
    reasons.push({ label: `Course: ${c?.name ?? mission.requiresCourse}`, href: "/education" });
  }
  if (mission.maxHeat != null && s.heat > mission.maxHeat) {
    reasons.push({ label: `Heat ≤ ${mission.maxHeat}`, href: "/jobs" });
  }
  if (mission.minLegitimacy != null && s.legitimacy < mission.minLegitimacy) {
    reasons.push({ label: `Legitimacy ≥ ${mission.minLegitimacy}`, href: "/gigs" });
  }
  if (mission.energyCost && s.energy < mission.energyCost) {
    reasons.push({ label: `Need ${mission.energyCost} energy` });
  }
  if (mission.nerveCost && s.nerve < mission.nerveCost) {
    reasons.push({ label: `Need ${mission.nerveCost} nerve` });
  }
  return reasons;
}

export function availableMissions(s: GameState): MissionDef[] {
  const board = ensureMissionsState(s).missions!;
  return MISSIONS.filter(
    (m) => !board.completedIds.includes(m.id) && !board.active.some((a) => a.missionId === m.id)
  );
}

export function expireMissions(s: GameState, now = Date.now()): { state: GameState; expired: string[] } {
  let board = ensureMissionsState(s).missions!;
  const keep: ActiveMission[] = [];
  const expired: string[] = [];
  let next: GameState = { ...s, missions: board };

  for (const active of board.active) {
    if (active.deadlineAt && now >= active.deadlineAt) {
      expired.push(active.missionId);
      const mission = getMission(active.missionId);
      if (mission?.failPenalty) {
        if (mission.failPenalty.heat) next.heat = Math.min(120, next.heat + mission.failPenalty.heat);
        if (mission.failPenalty.street) next.street = Math.max(0, next.street - mission.failPenalty.street);
        if (mission.failPenalty.clean) next.clean = Math.max(0, next.clean - mission.failPenalty.clean);
      }
      board = {
        ...board,
        failedIds: Array.from(new Set([...board.failedIds, active.missionId])),
        log: [
          { missionId: active.missionId, outcome: "fail" as const, at: now, payout: 0 },
          ...board.log,
        ].slice(0, 24),
      };
    } else {
      keep.push(active);
    }
  }

  board = { ...board, active: keep };
  next = { ...next, missions: board };
  return { state: next, expired };
}
