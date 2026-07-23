/** Body layer — stress bands, wound slots, leisure / relief (tasteful, soft pressure). */

import { normalizeSafehouseRooms, roomLevel, type SafehouseRooms } from "@/game/safehouse";
import type { DistrictId } from "@/game/types";

export type WoundSlot = "arm" | "leg";
export type Wounds = { arm: number; leg: number };

export const WOUND_MAX = 2;
export const EMPTY_WOUNDS: Wounds = { arm: 0, leg: 0 };

export type StressBandId = "steady" | "wired" | "frayed" | "breaking";

export type StressBand = {
  id: StressBandId;
  label: string;
  min: number;
  max: number;
  /** Soft pressure copy for UI */
  effect: string;
};

export type LeisureId = "dive_bar" | "cafe_sit" | "clinic_chair" | "therapy" | "cot_rest";

export type ReqReason = { label: string; href?: string };

export type LeisureDef = {
  id: LeisureId;
  name: string;
  blurb: string;
  /** Clean cost (0 = none) */
  clean: number;
  /** Street cost (0 = none) */
  street: number;
  stressRelief: number;
  happyGain: number;
  lifeGain?: number;
  /** Ease each wound slot by this many notches */
  woundEase?: number;
  /** Cooldown after action (ms) */
  cooldownMs: number;
  /** Needs owned property + cot ≥ 1 */
  needsCot?: boolean;
  /** Outpatient only — blocked while hospitalized */
  outpatient?: boolean;
};

export const LEISURE_ACTIONS: LeisureDef[] = [
  {
    id: "dive_bar",
    name: "Dive booth",
    blurb: "Sticky table, cheap pour, city noise turned down one notch.",
    clean: 0,
    street: 80,
    stressRelief: 8,
    happyGain: 18,
    cooldownMs: 75 * 60 * 1000,
  },
  {
    id: "cafe_sit",
    name: "Cafe sit",
    blurb: "Clean cup, soft chairs, nobody asking what you did last night.",
    clean: 120,
    street: 0,
    stressRelief: 10,
    happyGain: 28,
    cooldownMs: 75 * 60 * 1000,
  },
  {
    id: "clinic_chair",
    name: "Clinic chair",
    blurb: "Outpatient patch — life up, one wound notch down, nerves quieter.",
    clean: 180,
    street: 0,
    stressRelief: 6,
    happyGain: 5,
    lifeGain: 18,
    woundEase: 1,
    cooldownMs: 45 * 60 * 1000,
    outpatient: true,
  },
  {
    id: "therapy",
    name: "Talk session",
    blurb: "Legal hour with someone who bills clean and doesn’t ask for street names.",
    clean: 420,
    street: 0,
    stressRelief: 22,
    happyGain: 45,
    cooldownMs: 3 * 60 * 60 * 1000,
    outpatient: true,
  },
  {
    id: "cot_rest",
    name: "Cot rest",
    blurb: "Safehouse mattress. Eyes shut. Stress leaves the room first.",
    clean: 0,
    street: 0,
    stressRelief: 14,
    happyGain: 35,
    lifeGain: 12,
    cooldownMs: 2 * 60 * 60 * 1000,
    needsCot: true,
  },
];

export function getLeisure(id: LeisureId): LeisureDef | undefined {
  return LEISURE_ACTIONS.find((a) => a.id === id);
}

export function normalizeWounds(w?: Partial<Wounds> | null): Wounds {
  return {
    arm: Math.max(0, Math.min(WOUND_MAX, Math.floor(w?.arm ?? 0))),
    leg: Math.max(0, Math.min(WOUND_MAX, Math.floor(w?.leg ?? 0))),
  };
}

export function applyWound(wounds: Wounds, slot: WoundSlot, amount = 1): Wounds {
  const next = normalizeWounds(wounds);
  next[slot] = Math.min(WOUND_MAX, next[slot] + Math.max(0, amount));
  return next;
}

export function easeWounds(wounds: Wounds, amount = 1): Wounds {
  const next = normalizeWounds(wounds);
  return {
    arm: Math.max(0, next.arm - amount),
    leg: Math.max(0, next.leg - amount),
  };
}

export function stressBand(stress: number): StressBand {
  if (stress <= 30) {
    return {
      id: "steady",
      label: "Steady",
      min: 0,
      max: 30,
      effect: "No odds hit. Sleep still works.",
    };
  }
  if (stress <= 50) {
    return {
      id: "wired",
      label: "Wired",
      min: 31,
      max: 50,
      effect: "Soft −5 crime odds. Study still fine.",
    };
  }
  if (stress <= 70) {
    return {
      id: "frayed",
      label: "Frayed",
      min: 51,
      max: 70,
      effect: "−10 crime odds. Happy regen feels thin.",
    };
  }
  return {
    id: "breaking",
    label: "Breaking",
    min: 71,
    max: 100,
    effect: "−25 crime odds. Courses crawl. Leisure first.",
  };
}

export function woundSlotLabel(slot: WoundSlot, level: number): string {
  if (level <= 0) return "Clear";
  if (slot === "arm") {
    return level >= 2 ? "Arm — heavy (hit chance soft)" : "Arm — bruised (hit chance soft)";
  }
  return level >= 2 ? "Leg — heavy (approach/flee soft)" : "Leg — bruised (approach/flee soft)";
}

export function woundEffectLines(wounds: Wounds): string[] {
  const w = normalizeWounds(wounds);
  const lines: string[] = [];
  if (w.arm > 0) lines.push(woundSlotLabel("arm", w.arm));
  if (w.leg > 0) lines.push(woundSlotLabel("leg", w.leg));
  if (!lines.length) lines.push("No open wounds");
  return lines;
}

/** Additive crime odds penalty in percentage points (same units as tip bonus). */
export function woundCrimeOddsPenalty(wounds: Wounds): number {
  const w = normalizeWounds(wounds);
  let pts = 0;
  if (w.arm > 0) pts += 2 + (w.arm >= 2 ? 2 : 0);
  if (w.leg > 0) pts += 1 + (w.leg >= 2 ? 1 : 0);
  return pts;
}

/** Combat soft debuffs — scales lightly with notch depth. */
export function woundArmHitPenalty(wounds: Wounds): number {
  const a = normalizeWounds(wounds).arm;
  if (a <= 0) return 0;
  return a >= 2 ? 0.16 : 0.12;
}

export function woundLegMovePenalty(wounds: Wounds): number {
  const l = normalizeWounds(wounds).leg;
  if (l <= 0) return 0;
  return l >= 2 ? 0.14 : 0.1;
}

/**
 * Crit-fail / fail wound roll. Hospitalized always proc one slot.
 * Returns null when no wound applied.
 */
export function rollCrimeFailWound(r01: number, hospitalized: boolean): WoundSlot | null {
  if (hospitalized) return r01 >= 0.5 ? "arm" : "leg";
  if (r01 > 0.9) return "arm";
  if (r01 > 0.82) return "leg";
  return null;
}

/** Gym: overtrain when 4th+ daily hit on a track, or already past soft cap. */
export function gymOvertrainStressGain(dailyCount: number, overSoftCap: boolean): number {
  if (dailyCount >= 3 || overSoftCap) return 7;
  return 0;
}

/** Stress accrued while locked up (per hour of catch-up). */
export function jailStressPerHour(): number {
  return 2.5;
}

export function cotRestStressRelief(rooms: SafehouseRooms): number {
  const lvl = roomLevel(normalizeSafehouseRooms(rooms), "cot");
  return 14 + lvl * 4;
}

export function cotRestHappyGain(rooms: SafehouseRooms): number {
  const lvl = roomLevel(normalizeSafehouseRooms(rooms), "cot");
  return 35 + lvl * 10;
}

export function leisureReasons(
  id: LeisureId,
  s: {
    clean: number;
    street: number;
    ownedProperties: string[];
    safehouseRooms?: SafehouseRooms;
    leisureUntil: number | null;
    hospitalUntil: number | null;
    jailUntil: number | null;
    travelUntil: number | null;
    laylowUntil: number | null;
    stress: number;
    happy: number;
    happyMax: number;
    life: number;
    lifeMax: number;
    wounds: Wounds;
    district?: DistrictId;
  },
  now = Date.now()
): ReqReason[] {
  const def = getLeisure(id);
  const reasons: ReqReason[] = [];
  if (!def) {
    reasons.push({ label: "Unknown leisure" });
    return reasons;
  }
  if (s.jailUntil && now < s.jailUntil) {
    reasons.push({ label: "Jailed", href: "/jail" });
  }
  if (s.travelUntil && now < s.travelUntil) {
    reasons.push({ label: "In transit", href: "/travel" });
  }
  if (s.laylowUntil && now < s.laylowUntil) {
    reasons.push({ label: "Laying low", href: "/profile" });
  }
  if (def.outpatient && s.hospitalUntil && now < s.hospitalUntil) {
    reasons.push({ label: "Already on the ward — pay medical or wait", href: "/hospital" });
  }
  if (!def.outpatient && s.hospitalUntil && now < s.hospitalUntil) {
    reasons.push({ label: "Hospitalized", href: "/hospital" });
  }
  if (s.leisureUntil && now < s.leisureUntil) {
    reasons.push({ label: "Body still cooling — leisure on cooldown", href: "/body" });
  }
  if (def.needsCot) {
    if (!s.ownedProperties.length) {
      reasons.push({ label: "Own a property first", href: "/properties" });
    }
    const rooms = normalizeSafehouseRooms(s.safehouseRooms);
    if (roomLevel(rooms, "cot") < 1) {
      reasons.push({ label: "Build Cot first", href: "/safehouse" });
    }
  }
  if (def.clean > 0 && s.clean < def.clean) {
    reasons.push({ label: `Need $${def.clean} clean`, href: "/jobs" });
  }
  if (def.street > 0 && s.street < def.street) {
    reasons.push({ label: `Need $${def.street} street`, href: "/crimes" });
  }
  // Nothing to gain — still allow if stressed/unhappy/hurt, else soft block cot when full
  if (id === "cot_rest") {
    const fine =
      s.stress <= 5 && s.happy >= s.happyMax - 5 && s.life >= s.lifeMax - 2;
    if (fine) reasons.push({ label: "Already rested — nothing to bleed off" });
  }
  if (id === "clinic_chair") {
    const fine =
      s.life >= s.lifeMax &&
      s.wounds.arm <= 0 &&
      s.wounds.leg <= 0 &&
      s.stress <= 10;
    if (fine) reasons.push({ label: "Clinic has nothing to patch" });
  }
  return reasons;
}

export function canDoLeisure(
  id: LeisureId,
  s: Parameters<typeof leisureReasons>[1],
  now = Date.now()
): boolean {
  return leisureReasons(id, s, now).length === 0;
}
