import { unit01 } from "@/game/rng";
import type { GameState } from "@/game/state";

export type RivalFlagEffect = {
  stress?: number;
  happy?: number;
  streetSteal?: number;
  heat?: number;
  score?: number;
};

/** 10 scripted Vex beats — flags fire once; pressure effects are soft. */
export function rivalEventDefs(s: GameState): { key: string; text: string; effect: RivalFlagEffect }[] {
  const crimesDone = Object.values(s.mastery).reduce((a, m) => a + m.attempts, 0);
  const events: { key: string; text: string; effect: RivalFlagEffect; when: boolean }[] = [
    {
      key: "c10",
      when: crimesDone >= 10,
      text: "Vex hits jewelry score in Glassrow — your name isn’t on it.",
      effect: { stress: 6, happy: -8, score: 4 },
    },
    {
      key: "l3",
      when: s.level >= 3,
      text: "Vex: “Heard you’re climbing. Cute.”",
      effect: { stress: 4, score: 3 },
    },
    {
      key: "hosp",
      when: Boolean(s.hospitalUntil),
      text: "Vex: “Took a spill? I’ve got a medic contact.”",
      effect: { stress: 5, happy: -5, score: 2 },
    },
    {
      key: "course",
      when: s.completedCourses.length >= 1,
      text: "Newspaper: New grad on the street. Competition?",
      effect: { stress: 3, score: 3 },
    },
    {
      key: "heat",
      when: s.heat > 60,
      text: "Vex steals a bounty you were eyeing",
      effect: { stress: 8, happy: -10, streetSteal: 200, score: 5 },
    },
    {
      key: "l5",
      when: s.level >= 5,
      text: "Rival scoreboard updates — Vex still ahead on ink.",
      effect: { stress: 4, score: 4 },
    },
    {
      key: "prop",
      when: s.ownedProperties.length > 0,
      text: "Vex: “Nice place. Shame if something happened.”",
      effect: { stress: 7, happy: -6, score: 4 },
    },
    {
      key: "jail",
      when: Boolean(s.jailUntil),
      text: "Newspaper: Amateur hour. I’ll take your corner.",
      effect: { stress: 10, happy: -12, score: 5 },
    },
    {
      key: "bank",
      when: s.lifetime.bankDeposits >= 1,
      text: "Vex: “Clean money? Pretending again.”",
      effect: { stress: 3, score: 2 },
    },
    {
      key: "rails",
      when: s.lifetime.districtsVisited.length >= 3,
      text: "Vex leaves chalk marks on all three rails.",
      effect: { stress: 5, heat: 4, score: 3 },
    },
  ];
  return events.filter((e) => e.when).map(({ key, text, effect }) => ({ key, text, effect }));
}

export function applyRivalFlag(
  s: GameState,
  key: string,
  text: string,
  effect: RivalFlagEffect,
  pushLog: (st: GameState, msg: string, kind?: "system" | "diegetic" | "result") => GameState
): GameState {
  if (s.rivalFlags[key]) return s;
  let next = pushLog(s, text, "diegetic");
  next = {
    ...next,
    rivalFlags: { ...next.rivalFlags, [key]: true },
    rivalLast: text,
    rivalScore: next.rivalScore + (effect.score ?? 3),
    stress: Math.min(100, next.stress + (effect.stress ?? 0)),
    happy: Math.max(0, next.happy + (effect.happy ?? 0)),
    heat: Math.min(120, next.heat + (effect.heat ?? 0)),
  };
  if (effect.streetSteal && next.street > 0) {
    const stolen = Math.min(next.street, effect.streetSteal);
    next = { ...next, street: next.street - stolen };
    next = pushLog(next, `Vex pressure — lost $${stolen} street`, "system");
  }
  return next;
}

export function maybeApplyRivalEvents(
  s: GameState,
  pushLog: (st: GameState, msg: string, kind?: "system" | "diegetic" | "result") => GameState
): GameState {
  let next = s;
  for (const ev of rivalEventDefs(next)) {
    next = applyRivalFlag(next, ev.key, ev.text, ev.effect, pushLog);
  }
  return next;
}

/** Soft rival pressure on longer away ticks — tied to existing score/flags */
export function applyRivalAwayPressure(
  s: GameState,
  hours: number,
  now: number,
  city: string[],
  street: string[]
): GameState {
  if (hours < 8 || s.rivalScore <= 0) return s;
  const bucket = Math.floor(now / 3600000);
  if (s.rivalPressureAt === bucket) return s;

  const chance = Math.min(0.4, 0.08 + s.rivalScore * 0.01);
  if (unit01(s.seed, "rival_away", bucket + s.rivalScore) >= chance) {
    return { ...s, rivalPressureAt: bucket };
  }

  let next: GameState = {
    ...s,
    rivalPressureAt: bucket,
    stress: Math.min(100, s.stress + 5),
    happy: Math.max(0, s.happy - 8),
    rivalLast: "Vex left a note while you were gone.",
    rivalScore: s.rivalScore + 1,
  };
  city.push("Vex pressure — stress up, mood down");

  if (next.street >= 150 && unit01(s.seed, "rival_steal", bucket) < 0.35) {
    const lost = Math.min(next.street, 100 + Math.floor(next.rivalScore * 5));
    next = { ...next, street: next.street - lost };
    street.push(`Vex skimmed $${lost} street while you were away`);
    next = {
      ...next,
      rivalLast: `Vex skimmed $${lost} while you were away.`,
    };
  }
  return next;
}

export function rivalFlagCount(s: GameState): number {
  return Object.keys(s.rivalFlags).length;
}
