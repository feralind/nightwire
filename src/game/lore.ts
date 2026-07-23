import {
  CODEX_ENTRIES,
  CRIME_RESULT_COPY,
  HEADLINES,
  HEIST_RESULT_COPY,
  REACTIVE_HEADLINES,
  type CodexCategory,
  type CodexEntry,
  type CrimeFamily,
  type ResultOutcome,
} from "@/content/lore";
import { AWARDS, RANK_TITLES } from "@/content/catalog";
import { hash32 } from "@/game/rng";
import type { GameState, LogEntry, TimelineEntry, TimelineKind } from "@/game/state";

export { HEADLINES, CODEX_ENTRIES, CRIME_RESULT_COPY, HEIST_RESULT_COPY };

/** Seeded pick from a pool — presentation only */
export function pickSeededLine(
  pool: string[],
  seed: string,
  actionKey: string,
  actionIndex: number
): string {
  if (!pool.length) return "";
  const i = hash32(seed, actionKey, actionIndex) % pool.length;
  return pool[i]!;
}

export function pickCrimeResultLine(
  family: CrimeFamily,
  outcome: ResultOutcome,
  seed: string,
  crimeId: string,
  actionIndex: number
): string {
  const pool = CRIME_RESULT_COPY[family]?.[outcome] ?? CRIME_RESULT_COPY.petty.FAILED;
  return pickSeededLine(pool, seed, `flavor:${crimeId}:${outcome}`, actionIndex);
}

export function pickHeistResultLine(
  outcome: "SUCCESS" | "MIXED" | "FAILED",
  seed: string,
  heistId: string,
  actionIndex: number
): string {
  const pool = HEIST_RESULT_COPY[outcome] ?? HEIST_RESULT_COPY.FAILED;
  return pickSeededLine(pool, seed, `heistflavor:${heistId}:${outcome}`, actionIndex);
}

export function isCodexUnlocked(entry: CodexEntry, s: GameState): boolean {
  switch (entry.id) {
    case "dist_glassrow":
      return (s.lifetime.districtsVisited ?? []).includes("glassrow") || s.district === "glassrow";
    case "dist_millstone":
      return (s.lifetime.districtsVisited ?? []).includes("millstone");
    case "dist_docksreach":
      return (s.lifetime.districtsVisited ?? []).includes("docksreach");
    case "dist_ashcourt":
      return (s.lifetime.districtsVisited ?? []).includes("ashcourt");
    case "dist_spireyard":
      return (s.lifetime.districtsVisited ?? []).includes("spireyard");
    case "dist_oldcommons":
      return (s.lifetime.districtsVisited ?? []).includes("oldcommons");
    case "sys_dual_life":
    case "story_arrival":
      return s.created;
    case "sys_heat":
      return s.lifetime.crimesAttempted >= 1 || s.heat > 0;
    case "sys_education":
      return Boolean(s.activeCourseId) || s.completedCourses.length > 0;
    case "sys_bank":
      return s.lifetime.bankDeposits >= 1 || s.bank > 0;
    case "sys_mastery":
      return Object.values(s.mastery ?? {}).some((m) => m.attempts > 0 && m.cash > 0);
    case "sys_contacts":
      return (s.lifetime.contactUses ?? 0) >= 1;
    case "sys_heists":
      return (s.lifetime.heistsCompleted ?? 0) >= 1;
    case "sys_rival":
      return Object.keys(s.rivalFlags ?? {}).length > 0 || s.rivalScore > 0;
    case "sys_safehouse":
      return s.ownedProperties.length >= 1;
    case "sys_power":
      return (
        s.level >= 3 ||
        s.power.politicalRung > 0 ||
        s.power.respect > 0 ||
        s.power.businessTierOwned > 0 ||
        Object.values(s.power.territory ?? {}).some((v) => v > 0)
      );
    case "school_street":
      return s.completedCourses.some((id) => id.startsWith("se"));
    case "school_commerce":
      return s.completedCourses.some((id) => id.startsWith("cf"));
    case "school_harbor":
      return s.completedCourses.some((id) => id.startsWith("hl"));
    case "school_med":
      return s.completedCourses.some((id) => id.startsWith("mc"));
    case "school_locks":
      return s.completedCourses.some((id) => id.startsWith("le"));
    case "story_first_score":
      return s.lifetime.crimesSucceeded >= 1;
    case "story_cuffs":
      return s.lifetime.timesJailed >= 1;
    case "story_too_loud":
      return s.lifetime.peakHeat >= 80;
    case "story_six_rails":
      return (s.lifetime.districtsVisited ?? []).length >= 6;
    case "story_boards":
      return (s.lifetime.heistsCompleted ?? 0) >= 3;
    case "story_vex_noticed":
      return Boolean(s.rivalFlags?.c10);
    case "story_nest":
      return s.bank >= 5000 || s.lifetime.peakBank >= 5000;
    case "story_hybrid":
      return Boolean(s.activeCourseId) && s.lifetime.crimesSucceeded >= 1;
    case "story_kingpin_whisper":
      return s.rankIndex >= 6;
    default:
      return s.created;
  }
}

export function codexUnlockReasons(entry: CodexEntry, s: GameState): string[] {
  if (isCodexUnlocked(entry, s)) return [];
  return [entry.hint];
}

export function listCodex(s: GameState): {
  entry: CodexEntry;
  unlocked: boolean;
}[] {
  return CODEX_ENTRIES.map((entry) => ({
    entry,
    unlocked: isCodexUnlocked(entry, s),
  }));
}

export function codexCompletePct(s: GameState): number {
  const unlocked = CODEX_ENTRIES.filter((e) => isCodexUnlocked(e, s)).length;
  return Math.round((unlocked / Math.max(1, CODEX_ENTRIES.length)) * 100);
}

export function codexByCategory(
  s: GameState,
  cat: CodexCategory | "all"
): { entry: CodexEntry; unlocked: boolean }[] {
  const list = listCodex(s);
  if (cat === "all") return list;
  return list.filter((x) => x.entry.category === cat);
}

export type NewspaperArticle = {
  id: string;
  column: "front" | "city" | "wire";
  hed: string;
  dek?: string;
  ts?: number;
};

function reactiveFlags(s: GameState): string[] {
  const flags: string[] = [];
  if (s.lifetime.crimesSucceeded >= 1) flags.push("first_crime");
  if (s.lifetime.timesJailed >= 1) flags.push("first_jail");
  if (s.heat >= 60 || s.lifetime.peakHeat >= 60) flags.push("heat_high");
  if (s.rankIndex >= 2) flags.push("rank_up");
  if ((s.lifetime.heistsCompleted ?? 0) >= 1) flags.push("heist_done");
  if (Object.keys(s.rivalFlags ?? {}).length > 0) flags.push("rival_vex");
  if (s.ownedProperties.length >= 1) flags.push("property");
  if (s.completedCourses.length >= 1) flags.push("course_done");
  if (s.activeCourseId && s.lifetime.crimesSucceeded >= 1) flags.push("hybrid");
  if (s.bank >= 5000 || s.lifetime.peakBank >= 5000) flags.push("bank_nest");
  if ((s.lifetime.contactUses ?? 0) >= 1) flags.push("contact_favor");
  if (s.lifetime.peakHeat >= 80) flags.push("too_loud");
  if ((s.lifetime.districtsVisited ?? []).length >= 6) flags.push("six_rails");
  if ((s.lifetime.heistsCompleted ?? 0) >= 3) flags.push("board_collector");
  return flags;
}

export function buildNewspaperEdition(s: GameState, now = Date.now()): NewspaperArticle[] {
  const articles: NewspaperArticle[] = [];
  const name = s.name || "a local";

  for (const flag of reactiveFlags(s)) {
    const raw = REACTIVE_HEADLINES[flag];
    if (!raw) continue;
    articles.push({
      id: `front:${flag}`,
      column: "front",
      hed: raw.replaceAll("{name}", name),
      dek: "Nightwire desk — reactive copy",
    });
  }

  const day = Math.floor(now / 86_400_000);
  for (let i = 0; i < 8; i++) {
    const idx = hash32(s.seed || "nw", "paper", day, i) % HEADLINES.length;
    articles.push({
      id: `city:${day}:${i}`,
      column: "city",
      hed: HEADLINES[idx]!,
    });
  }

  const notable = pickNotableLogs(s.logs ?? []).slice(0, 10);
  for (const log of notable) {
    articles.push({
      id: `wire:${log.id}`,
      column: "wire",
      hed: log.text,
      ts: log.ts,
    });
  }

  for (const t of (s.timeline ?? []).slice(0, 8)) {
    articles.push({
      id: `wire:tl:${t.id}`,
      column: "wire",
      hed: t.title,
      dek: t.detail,
      ts: t.ts,
    });
  }

  return articles;
}

function pickNotableLogs(logs: LogEntry[]): LogEntry[] {
  const prefer = logs.filter(
    (l) =>
      l.kind === "diegetic" ||
      /Level up|Award|Promoted|Heist|SUCCESS|JAILED|Vex|Rank|Board|Business|Political|Respect/i.test(
        l.text
      )
  );
  return prefer.length ? prefer : logs.slice(0, 8);
}

export function pushTimeline(
  s: GameState,
  entry: Omit<TimelineEntry, "ts"> & { ts?: number }
): GameState {
  const timeline = s.timeline ?? [];
  if (timeline.some((t) => t.id === entry.id)) return s;
  const next: TimelineEntry = {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    detail: entry.detail,
    ts: entry.ts ?? Date.now(),
  };
  return {
    ...s,
    timeline: [next, ...timeline].slice(0, 80),
  };
}

/** Derive milestone entries from current state (idempotent by id). */
export function syncTimeline(s: GameState): GameState {
  let next = s;
  const created = s.created ? s.lastAwayAt || Date.now() : Date.now();

  if (s.created) {
    next = pushTimeline(next, {
      id: "arrival",
      kind: "arrival",
      title: "Arrived on the wire",
      detail: `${s.name || "Operator"} lands in Nightwire City.`,
      ts: created,
    });
  }

  if (s.lifetime.crimesSucceeded >= 1) {
    next = pushTimeline(next, {
      id: "first_score",
      kind: "crime",
      title: "First score",
      detail: "The city barely notices. You do.",
      ts: created + 1,
    });
  }

  if (s.lifetime.crimesAttempted >= 1 && s.lifetime.crimesSucceeded < s.lifetime.crimesAttempted) {
    next = pushTimeline(next, {
      id: "first_fail",
      kind: "crime",
      title: "First burn",
      detail: "Empty hands teach faster than manuals.",
      ts: created + 2,
    });
  }

  if (s.lifetime.timesJailed >= 1) {
    next = pushTimeline(next, {
      id: "first_jail",
      kind: "story",
      title: "Holding cell graduate",
      detail: "Uniforms already there.",
      ts: created + 3,
    });
  }

  if (s.lifetime.shiftsWorked >= 1) {
    next = pushTimeline(next, {
      id: "first_shift",
      kind: "work",
      title: "First shift punched",
      detail: "Clean pay stub — or close enough.",
      ts: created + 4,
    });
  }

  if (s.lifetime.gigsDone >= 1) {
    next = pushTimeline(next, {
      id: "first_gig",
      kind: "work",
      title: "Side hustle logged",
      detail: "Gig circuit opens.",
      ts: created + 5,
    });
  }

  if (s.completedCourses.length >= 1) {
    next = pushTimeline(next, {
      id: "first_course",
      kind: "story",
      title: "Transcript line one",
      detail: "Campus edge acquired.",
      ts: created + 6,
    });
  }

  if (s.ownedProperties.length >= 1) {
    next = pushTimeline(next, {
      id: "first_keys",
      kind: "city",
      title: "Keys on the hook",
      detail: "An address that isn’t a rumor.",
      ts: created + 7,
    });
  }

  if ((s.lifetime.heistsCompleted ?? 0) >= 1) {
    next = pushTimeline(next, {
      id: "first_heist",
      kind: "heist",
      title: "First board closed",
      detail: "Organized noise becomes a habit.",
      ts: created + 8,
    });
  }

  if ((s.lifetime.heistsCompleted ?? 0) >= 3) {
    next = pushTimeline(next, {
      id: "heists_3",
      kind: "heist",
      title: "Board collector",
      detail: "Three boards. City starts using the name.",
      ts: created + 9,
    });
  }

  if (Object.keys(s.rivalFlags ?? {}).length > 0) {
    next = pushTimeline(next, {
      id: "rival_start",
      kind: "rival",
      title: "Vex on the wire",
      detail: s.rivalLast || "Rival pressure begins.",
      ts: created + 10,
    });
  }

  if (s.rivalFlags?.c10) {
    next = pushTimeline(next, {
      id: "rival_c10",
      kind: "rival",
      title: "Vex noticed you",
      detail: "Late-script humiliation unlocked.",
      ts: created + 11,
    });
  }

  for (let lvl = 2; lvl <= s.level; lvl++) {
    next = pushTimeline(next, {
      id: `level:${lvl}`,
      kind: "level",
      title: `Level ${lvl}`,
      detail: "Bars refill. Unlocks inch closer.",
      ts: created + 100 + lvl,
    });
  }

  for (let r = 1; r <= s.rankIndex; r++) {
    const title = RANK_TITLES[r] ?? `Rank ${r}`;
    next = pushTimeline(next, {
      id: `rank:${r}`,
      kind: "rank",
      title: `Rank — ${title}`,
      detail: "Title ladder ticks up.",
      ts: created + 200 + r,
    });
  }

  for (const [awardId, at] of Object.entries(s.unlockedAwards ?? {})) {
    const award = AWARDS.find((a) => a.id === awardId);
    next = pushTimeline(next, {
      id: `award:${awardId}`,
      kind: "award",
      title: award ? `Award: ${award.name}` : `Award: ${awardId.replaceAll("_", " ")}`,
      detail: award?.blurb ?? "City mark earned.",
      ts: at,
    });
  }

  for (const d of s.lifetime.districtsVisited ?? []) {
    next = pushTimeline(next, {
      id: `district:${d}`,
      kind: "city",
      title: `Stamped ${d}`,
      detail: "Travel ledger grows.",
      ts: created + 300 + d.length,
    });
  }

  if (s.lifetime.peakHeat >= 80) {
    next = pushTimeline(next, {
      id: "peak_heat",
      kind: "story",
      title: "Too loud",
      detail: `Peak heat ${s.lifetime.peakHeat}.`,
      ts: created + 400,
    });
  }

  if (s.bank >= 5000 || s.lifetime.peakBank >= 5000) {
    next = pushTimeline(next, {
      id: "bank_nest",
      kind: "story",
      title: "Nest under glass",
      detail: "Clean nest noticed by clerks.",
      ts: created + 401,
    });
  }

  return next;
}

export function listTimeline(s: GameState): TimelineEntry[] {
  const synced = syncTimeline(s);
  return [...(synced.timeline ?? [])].sort((a, b) => b.ts - a.ts);
}

export function timelineKindLabel(kind: TimelineKind): string {
  switch (kind) {
    case "arrival":
      return "Arrival";
    case "level":
      return "Level";
    case "rank":
      return "Rank";
    case "award":
      return "Award";
    case "crime":
      return "Crime";
    case "work":
      return "Work";
    case "heist":
      return "Heist";
    case "rival":
      return "Rival";
    case "city":
      return "City";
    case "story":
      return "Story";
    default:
      return "Milestone";
  }
}
