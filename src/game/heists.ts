import { getCourse, getDistrict, getItem, getJob, getProperty } from "@/content/catalog";
import { getHeist, HEISTS } from "@/content/heists";
import { applyHospitalDuration } from "@/game/careers";
import { clamp, formatMoney } from "@/game/formulas";
import { rollD10000, unit01 } from "@/game/rng";
import type {
  GameState,
  InventorySlot,
  PrepBoardState,
  ResultModalState,
} from "@/game/state";
import type {
  HeistDef,
  HeistExecuteChoice,
  HeistExecutePhase,
  HeistRank,
  HeistStageDef,
} from "@/game/types";

export type HeistReqReason = { label: string; href?: string };

export type HeistActionOutcome = {
  state: GameState;
  title: NonNullable<ResultModalState>["title"];
  lines: string[];
  cashDelta: number;
  ritual?: {
    seed: string;
    actionKey: string;
    actionIndex: number;
    roll: number;
    odds: number;
    ev: number;
    modifiers: { label: string; value: number }[];
  };
};

const PREP_ORDER: HeistStageDef["kind"][] = ["intel", "crew", "kit", "window", "execute"];
const EXECUTE_ORDER: HeistExecutePhase[] = ["approach", "breach", "extract"];
const ITEM_LOSS_CHANCE = 0.45;
const EXECUTE_BASE: Record<HeistExecutePhase, number> = {
  approach: 0.72,
  breach: 0.65,
  extract: 0.6,
};

export function emptyPrepBoard(): PrepBoardState {
  return {
    completedStageIds: [],
    stagedItems: [],
    sunkStreet: 0,
    sunkClean: 0,
    windowNight: false,
    executePhase: null,
    cooldownUntil: null,
    completions: 0,
    bestRank: null,
  };
}

export function getPrepBoard(s: GameState, heistId: string): PrepBoardState {
  return s.prepBoards[heistId] ?? emptyPrepBoard();
}

export function withPrepBoard(s: GameState, heistId: string, board: PrepBoardState): GameState {
  return { ...s, prepBoards: { ...s.prepBoards, [heistId]: board } };
}

function hasItem(s: GameState, itemId: string, qty = 1): boolean {
  const slot = s.inventory.find((i) => i.itemId === itemId);
  return (slot?.qty ?? 0) >= qty;
}

function removeItem(s: GameState, itemId: string, qty: number): GameState {
  const inventory = s.inventory
    .map((slot) => {
      if (slot.itemId !== itemId) return slot;
      return { ...slot, qty: slot.qty - qty };
    })
    .filter((slot) => slot.qty > 0);
  return { ...s, inventory };
}

function addStaged(
  staged: { itemId: string; qty: number }[],
  itemId: string,
  qty: number
): { itemId: string; qty: number }[] {
  const next = staged.map((x) => ({ ...x }));
  const hit = next.find((x) => x.itemId === itemId);
  if (hit) hit.qty += qty;
  else next.push({ itemId, qty });
  return next;
}

function removeStaged(
  staged: { itemId: string; qty: number }[],
  itemId: string,
  qty: number
): { itemId: string; qty: number }[] {
  return staged
    .map((x) => (x.itemId === itemId ? { ...x, qty: x.qty - qty } : x))
    .filter((x) => x.qty > 0);
}

function returnStagedToInventory(s: GameState, staged: { itemId: string; qty: number }[]): GameState {
  const inventory: InventorySlot[] = s.inventory.map((x) => ({ ...x }));
  for (const item of staged) {
    const hit = inventory.find((i) => i.itemId === item.itemId);
    if (hit) hit.qty += item.qty;
    else inventory.push({ itemId: item.itemId, qty: item.qty });
  }
  return { ...s, inventory };
}

function maybeLoseStagedItems(
  s: GameState,
  board: PrepBoardState,
  seedKey: string,
  chance = ITEM_LOSS_CHANCE
): { state: GameState; board: PrepBoardState; lost: string[] } {
  if (board.stagedItems.length === 0) return { state: s, board, lost: [] };
  const lost: string[] = [];
  let staged = board.stagedItems.map((x) => ({ ...x }));
  for (let i = 0; i < staged.length; i++) {
    const roll = unit01(s.seed, `${seedKey}:lose:${staged[i].itemId}`, s.actionIndex);
    if (roll < chance) {
      const name = getItem(staged[i].itemId)?.name ?? staged[i].itemId;
      lost.push(name);
      staged[i] = { ...staged[i], qty: 0 };
    }
  }
  staged = staged.filter((x) => x.qty > 0);
  return { state: s, board: { ...board, stagedItems: staged }, lost };
}

function jobMeetsRequirement(requiredJobId: string, currentJobId: string | null): boolean {
  if (!currentJobId) return false;
  if (currentJobId === requiredJobId) return true;
  const required = getJob(requiredJobId);
  const current = getJob(currentJobId);
  if (!required || !current) return false;
  return current.career === required.career && current.rank >= required.rank;
}

export function heistUnlockReasons(heist: HeistDef, s: GameState): HeistReqReason[] {
  const reasons: HeistReqReason[] = [];
  if (heist.requiresLevel && s.level < heist.requiresLevel) {
    reasons.push({ label: `Level ${heist.requiresLevel}`, href: "/profile" });
  }
  if (heist.requiresCourse && !s.completedCourses.includes(heist.requiresCourse)) {
    const c = getCourse(heist.requiresCourse);
    reasons.push({ label: `Course: ${c?.name ?? heist.requiresCourse}`, href: "/education" });
  }
  if (heist.requiresProperty && !s.ownedProperties.includes(heist.requiresProperty)) {
    const p = getProperty(heist.requiresProperty);
    reasons.push({ label: `Own ${p?.name ?? heist.requiresProperty}`, href: "/properties" });
  }
  if (heist.requiresJob && !jobMeetsRequirement(heist.requiresJob, s.jobId)) {
    const job = getJob(heist.requiresJob);
    reasons.push({
      label: `Job: ${job?.title ?? heist.requiresJob}+`,
      href: "/jobs",
    });
  }
  if (heist.requiresVisitedDistrict) {
    const visited =
      s.district === heist.requiresVisitedDistrict ||
      (s.lifetime.districtsVisited ?? []).includes(heist.requiresVisitedDistrict);
    if (!visited) {
      const d = getDistrict(heist.requiresVisitedDistrict);
      reasons.push({
        label: `Visit ${d?.name ?? heist.requiresVisitedDistrict}`,
        href: "/city",
      });
    }
  }
  return reasons;
}

export function isHeistUnlocked(heist: HeistDef, s: GameState): boolean {
  return heistUnlockReasons(heist, s).length === 0;
}

export function nextPrepStage(heist: HeistDef, board: PrepBoardState): HeistStageDef | null {
  for (const kind of PREP_ORDER) {
    const stage = heist.stages.find((st) => st.kind === kind);
    if (!stage) continue;
    if (kind === "execute") {
      const prepDone = heist.stages
        .filter((st) => st.kind !== "execute")
        .every((st) => board.completedStageIds.includes(st.id));
      if (!prepDone) return null;
      return stage;
    }
    if (!board.completedStageIds.includes(stage.id)) return stage;
  }
  return null;
}

export function prepReady(heist: HeistDef, board: PrepBoardState): boolean {
  return heist.stages
    .filter((st) => st.kind !== "execute")
    .every((st) => board.completedStageIds.includes(st.id));
}

export function boardOnCooldown(board: PrepBoardState, now = Date.now()): boolean {
  return Boolean(board.cooldownUntil && board.cooldownUntil > now);
}

export function stageRunReasons(
  heist: HeistDef,
  stage: HeistStageDef,
  s: GameState,
  now = Date.now()
): HeistReqReason[] {
  const board = getPrepBoard(s, heist.id);
  const reasons: HeistReqReason[] = [];
  if (!s.created) reasons.push({ label: "Create a character", href: "/create" });
  if (s.hospitalUntil && s.hospitalUntil > now) reasons.push({ label: "Hospitalized", href: "/hospital" });
  if (s.jailUntil && s.jailUntil > now) reasons.push({ label: "Jailed", href: "/jail" });
  if (s.travelUntil && s.travelUntil > now) reasons.push({ label: "Traveling", href: "/travel" });
  if (s.laylowUntil && s.laylowUntil > now) reasons.push({ label: "Laying low", href: "/city" });
  for (const r of heistUnlockReasons(heist, s)) reasons.push(r);
  if (boardOnCooldown(board, now)) {
    const mins = Math.max(1, Math.ceil(((board.cooldownUntil ?? now) - now) / 60000));
    reasons.push({ label: `Cooldown ~${mins}m` });
  }
  if (board.executePhase) {
    reasons.push({ label: "Finish or abort the live execute" });
  }
  const next = nextPrepStage(heist, board);
  if (!next || next.id !== stage.id) {
    reasons.push({ label: "Complete prior prep stages first" });
  }
  if (stage.energy && s.energy < stage.energy) {
    reasons.push({ label: `Need ${stage.energy} energy` });
  }
  if (stage.nerve && s.nerve < stage.nerve) {
    reasons.push({ label: `Need ${stage.nerve} nerve` });
  }
  if (stage.streetCost && s.street < stage.streetCost) {
    reasons.push({ label: `Need ${formatMoney(stage.streetCost)} street` });
  }
  if (stage.cleanCost && s.clean < stage.cleanCost) {
    reasons.push({ label: `Need ${formatMoney(stage.cleanCost)} clean` });
  }
  for (const req of stage.requireItems ?? []) {
    if (!hasItem(s, req.itemId, req.qty)) {
      const item = getItem(req.itemId);
      reasons.push({
        label: `Need ${req.qty}× ${item?.name ?? req.itemId}`,
        href: "/shops",
      });
    }
  }
  if (stage.kind === "window" && s.district !== heist.district) {
    const d = getDistrict(heist.district);
    reasons.push({ label: `Travel to ${d?.name ?? heist.district}`, href: "/travel" });
  }
  return reasons;
}

export function canRunStage(heist: HeistDef, stage: HeistStageDef, s: GameState, now = Date.now()): boolean {
  return stageRunReasons(heist, stage, s, now).length === 0;
}

export function executeChoiceReasons(
  heist: HeistDef,
  choice: HeistExecuteChoice,
  s: GameState,
  now = Date.now()
): HeistReqReason[] {
  const board = getPrepBoard(s, heist.id);
  const reasons: HeistReqReason[] = [];
  if (!s.created) reasons.push({ label: "Create a character", href: "/create" });
  if (s.hospitalUntil && s.hospitalUntil > now) reasons.push({ label: "Hospitalized", href: "/hospital" });
  if (s.jailUntil && s.jailUntil > now) reasons.push({ label: "Jailed", href: "/jail" });
  if (s.travelUntil && s.travelUntil > now) reasons.push({ label: "Traveling", href: "/travel" });
  if (s.laylowUntil && s.laylowUntil > now) reasons.push({ label: "Laying low", href: "/city" });
  if (!prepReady(heist, board) && !board.executePhase) {
    reasons.push({ label: "Finish prep stages first" });
  }
  if (boardOnCooldown(board, now) && !board.executePhase) {
    reasons.push({ label: "Board on cooldown" });
  }
  if (s.district !== heist.district) {
    const d = getDistrict(heist.district);
    reasons.push({ label: `Be in ${d?.name ?? heist.district}`, href: "/travel" });
  }
  const exec = heist.stages.find((st) => st.kind === "execute");
  if (!board.executePhase && exec?.nerve && s.nerve < exec.nerve) {
    reasons.push({ label: `Need ${exec.nerve} nerve to start` });
  }
  if (choice === "sacrifice" && board.stagedItems.length === 0) {
    reasons.push({ label: "No staged items to sacrifice" });
  }
  if (choice === "abort" && !board.executePhase) {
    reasons.push({ label: "Nothing to abort yet" });
  }
  return reasons;
}

export function canExecuteChoice(
  heist: HeistDef,
  choice: HeistExecuteChoice,
  s: GameState,
  now = Date.now()
): boolean {
  return executeChoiceReasons(heist, choice, s, now).length === 0;
}

function isNightHour(hour: number): boolean {
  return hour >= 20 || hour < 5;
}

function phaseOdds(
  heist: HeistDef,
  phase: HeistExecutePhase,
  board: PrepBoardState,
  sacrificed: boolean
): { odds: number; modifiers: { label: string; value: number }[] } {
  let odds = EXECUTE_BASE[phase];
  const modifiers: { label: string; value: number }[] = [{ label: "Base", value: odds }];
  if (board.windowNight) {
    odds += 0.06;
    modifiers.push({ label: "Night window", value: 0.06 });
  }
  if (board.stagedItems.length > 0) {
    const kit = Math.min(0.08, board.stagedItems.length * 0.03);
    odds += kit;
    modifiers.push({ label: "Staged kit", value: kit });
  }
  if (sacrificed) {
    odds += 0.12;
    modifiers.push({ label: "Sacrifice", value: 0.12 });
  }
  if (heist.risk === "high") {
    odds -= 0.04;
    modifiers.push({ label: "High risk", value: -0.04 });
  }
  if (heist.risk === "extreme") {
    odds -= 0.08;
    modifiers.push({ label: "Extreme risk", value: -0.08 });
  }
  odds = clamp(odds, 0.2, 0.9);
  return { odds, modifiers };
}

function rankForRun(phasesOk: number, sacrificed: boolean, aborted: boolean): HeistRank {
  if (aborted) return "C";
  if (phasesOk >= 3 && !sacrificed) return "S";
  if (phasesOk >= 3) return "A";
  if (phasesOk >= 2) return "B";
  return "C";
}

function addXp(s: GameState, xp: number): GameState {
  let { level, xp: cur } = s;
  let left = xp;
  while (left > 0) {
    const need = Math.floor(100 * Math.pow(level, 1.45));
    const room = need - cur;
    if (left >= room) {
      left -= room;
      level += 1;
      cur = 0;
    } else {
      cur += left;
      left = 0;
    }
  }
  return { ...s, level, xp: cur };
}

function startCooldown(board: PrepBoardState, heist: HeistDef, now: number): PrepBoardState {
  return {
    ...board,
    cooldownUntil: now + heist.cooldownHours * 3600 * 1000,
    executePhase: null,
  };
}

function resetPrepKeepCooldown(board: PrepBoardState): PrepBoardState {
  return {
    ...board,
    completedStageIds: [],
    stagedItems: [],
    sunkStreet: 0,
    sunkClean: 0,
    windowNight: false,
    executePhase: null,
  };
}

/** Run the next prep stage (intel/crew/kit/window). */
export function applyPrepStage(s0: GameState, heistId: string, now = Date.now()): HeistActionOutcome | null {
  const heist = getHeist(heistId);
  if (!heist) return null;
  let s = { ...s0 };
  let board = getPrepBoard(s, heistId);
  const stage = nextPrepStage(heist, board);
  if (!stage || stage.kind === "execute") return null;
  if (!canRunStage(heist, stage, s, now)) return null;

  s = { ...s, actionIndex: s.actionIndex + 1 };
  if (stage.energy) s.energy = Math.max(0, s.energy - stage.energy);
  if (stage.nerve) s.nerve = Math.max(0, s.nerve - stage.nerve);
  if (stage.streetCost) {
    s.street -= stage.streetCost;
    board = { ...board, sunkStreet: board.sunkStreet + stage.streetCost };
  }
  if (stage.cleanCost) {
    s.clean -= stage.cleanCost;
    board = { ...board, sunkClean: board.sunkClean + stage.cleanCost };
  }
  for (const req of stage.requireItems ?? []) {
    s = removeItem(s, req.itemId, req.qty);
    board = {
      ...board,
      stagedItems: addStaged(board.stagedItems, req.itemId, req.qty),
    };
  }

  const chance = stage.successChance ?? 0.8;
  const actionKey = `heist:${heistId}:${stage.id}`;
  const roll = rollD10000(s.seed, actionKey, s.actionIndex);
  const ok = roll < Math.floor(chance * 10000);
  const lines: string[] = [];
  let title: HeistActionOutcome["title"] = "SUCCESS";
  const cashDelta = -((stage.streetCost ?? 0) + (stage.cleanCost ?? 0));

  if (ok) {
    board = {
      ...board,
      completedStageIds: [...board.completedStageIds, stage.id],
      windowNight: stage.kind === "window" ? isNightHour(new Date(now).getHours()) : board.windowNight,
    };
    lines.push(`${stage.name} locked in.`);
    if (stage.kind === "window") {
      lines.push(board.windowNight ? "Night window — execute odds up." : "Day window — workable, thinner.");
    }
    if (stage.requireItems?.length) {
      lines.push(`Staged: ${stage.requireItems.map((r) => getItem(r.itemId)?.name ?? r.itemId).join(", ")}`);
    }
  } else {
    title = "FAILED";
    s.heat = Math.min(120, s.heat + (stage.heatOnFail ?? 5));
    s.stress = Math.min(100, s.stress + 6);
    s.happy = Math.max(0, s.happy - 4);
    lines.push(`${stage.name} went sideways.`);
    const loss = maybeLoseStagedItems(s, board, `prepfail:${heistId}:${stage.id}`);
    s = loss.state;
    board = loss.board;
    if (loss.lost.length) lines.push(`Lost prep: ${loss.lost.join(", ")}`);
    else if (board.stagedItems.length) lines.push("Prep kit held — this time.");
    lines.push(`Heat +${stage.heatOnFail ?? 5}`);
  }

  s = withPrepBoard(s, heistId, board);
  const avgPayout = (heist.payoutMin + heist.payoutMax) / 2;
  return {
    state: s,
    title,
    lines,
    cashDelta,
    ritual: {
      seed: s.seed,
      actionKey,
      actionIndex: s.actionIndex,
      roll,
      odds: chance,
      ev: ok ? avgPayout / 20 : 0,
      modifiers: [{ label: "Prep chance", value: chance }],
    },
  };
}

/** Mid-heist execute: push / abort / sacrifice. */
export function applyExecuteChoice(
  s0: GameState,
  heistId: string,
  choice: HeistExecuteChoice,
  now = Date.now()
): HeistActionOutcome | null {
  const heist = getHeist(heistId);
  if (!heist) return null;
  if (!canExecuteChoice(heist, choice, s0, now)) return null;

  let s = { ...s0 };
  let board = getPrepBoard(s, heistId);
  const exec = heist.stages.find((st) => st.kind === "execute");
  if (!exec) return null;

  const lines: string[] = [];
  let title: HeistActionOutcome["title"] = "SUCCESS";
  let cashDelta = 0;
  let sacrificed = false;

  if (choice === "abort") {
    const salvageCash = Math.round(board.sunkStreet * 0.25);
    s.street += salvageCash;
    cashDelta = salvageCash;
    s = returnStagedToInventory(s, board.stagedItems);
    board = startCooldown(resetPrepKeepCooldown({ ...board, stagedItems: [] }), heist, now);
    s.stress = Math.min(100, s.stress + 4);
    s = withPrepBoard(s, heistId, board);
    lines.push("Aborted mid-run. Partial salvage.");
    if (salvageCash > 0) lines.push(`Recovered ${formatMoney(salvageCash)} street of crew float.`);
    lines.push("Staged kit returned. Board cooling down.");
    return { state: s, title: "MIXED", lines, cashDelta };
  }

  // Start execute: spend nerve once
  if (!board.executePhase) {
    if (exec.nerve) s.nerve = Math.max(0, s.nerve - exec.nerve);
    board = { ...board, executePhase: "approach" };
  }

  if (choice === "sacrifice") {
    const victim = board.stagedItems[0];
    if (!victim) return null;
    board = { ...board, stagedItems: removeStaged(board.stagedItems, victim.itemId, 1) };
    sacrificed = true;
    lines.push(`Sacrificed ${getItem(victim.itemId)?.name ?? victim.itemId} for the phase.`);
  }

  const phase = board.executePhase ?? "approach";
  s = { ...s, actionIndex: s.actionIndex + 1 };
  const { odds, modifiers } = phaseOdds(heist, phase, board, sacrificed);
  const actionKey = `heist:${heistId}:exec:${phase}`;
  const roll = rollD10000(s.seed, actionKey, s.actionIndex);
  const ok = roll < Math.floor(odds * 10000);
  const ritual: HeistActionOutcome["ritual"] = {
    seed: s.seed,
    actionKey,
    actionIndex: s.actionIndex,
    roll,
    odds,
    ev: (heist.payoutMin + heist.payoutMax) / 2 / 3,
    modifiers,
  };

  if (!ok) {
    title = "FAILED";
    s.heat = Math.min(120, s.heat + heist.heatOnFail);
    s.stress = Math.min(100, s.stress + 12);
    s.happy = Math.max(0, s.happy - 8);
    lines.push(`${phase} failed on ${heist.name}.`);
    const loss = maybeLoseStagedItems(s, board, `execfail:${heistId}:${phase}`, 0.7);
    s = loss.state;
    board = loss.board;
    if (loss.lost.length) lines.push(`Lost prep: ${loss.lost.join(", ")}`);
    // Remaining staged items are gone with the board reset (burned / seized)
    board = { ...board, stagedItems: [] };
    if (unit01(s.seed, `heistjail:${heistId}`, s.actionIndex) < 0.35) {
      title = "JAILED";
      s.jailUntil = now + (3 + Math.floor(s.heat / 25)) * 60 * 60 * 1000;
      s.jailReason = `Organized fail: ${heist.name}`;
      s.lifetime = { ...s.lifetime, timesJailed: s.lifetime.timesJailed + 1 };
      lines.push("Uniforms closed the window.");
    } else if (unit01(s.seed, `heisthosp:${heistId}`, s.actionIndex) < 0.4) {
      title = "HOSPITALIZED";
      s.hospitalUntil =
        now + applyHospitalDuration(25 * 60 * 1000, s.completedCourses, s.licenses);
      s.hospitalReason = `Heist fail: ${heist.name}`;
      s.life = Math.max(1, s.life - 20);
      lines.push("Bad breach. Lights out.");
    }
    board = startCooldown(resetPrepKeepCooldown(board), heist, now);
    s = withPrepBoard(s, heistId, board);
    lines.push(`Heat +${heist.heatOnFail}`);
    return { state: s, title, lines, cashDelta: 0, ritual };
  }

  lines.push(`${phase} clear.`);
  const idx = EXECUTE_ORDER.indexOf(phase);
  if (idx < EXECUTE_ORDER.length - 1) {
    board = { ...board, executePhase: EXECUTE_ORDER[idx + 1] };
    s = withPrepBoard(s, heistId, board);
    lines.push(`Next: ${board.executePhase}. Push, sacrifice, or abort.`);
    return { state: s, title: "SUCCESS", lines, cashDelta: 0, ritual };
  }

  // Full extract success — staged kit is spent with the take
  const prev = getPrepBoard(s0, heistId);
  const payout = Math.round(
    heist.payoutMin + unit01(s.seed, `heistpay:${heistId}`, s.actionIndex) * (heist.payoutMax - heist.payoutMin)
  );
  const nightBonus = board.windowNight ? Math.round(payout * 0.08) : 0;
  const cash = payout + nightBonus;
  s.street += cash;
  cashDelta = cash;
  s = addXp(s, heist.xp);
  s.heat = Math.min(120, s.heat + heist.heatOnSuccess);
  s.happy = Math.min(s.happyMax, s.happy + 8);
  s.lifetime = {
    ...s.lifetime,
    heistsCompleted: (s.lifetime.heistsCompleted ?? 0) + 1,
  };
  const rank = rankForRun(3, sacrificed, false);
  board = {
    ...emptyPrepBoard(),
    completions: prev.completions + 1,
    bestRank: betterRank(prev.bestRank, rank),
    cooldownUntil: now + heist.cooldownHours * 3600 * 1000,
  };
  s = withPrepBoard(s, heistId, board);
  lines.push(`Extract clean — ${heist.name}.`);
  lines.push(`Rank ${rank}`);
  if (nightBonus) lines.push(`Night bonus ${formatMoney(nightBonus)}`);
  lines.push(`+${formatMoney(cash)} street · Heat +${heist.heatOnSuccess}`);
  title = "SUCCESS";
  return { state: s, title, lines, cashDelta, ritual };
}

function betterRank(a: HeistRank | null, b: HeistRank): HeistRank {
  const order: HeistRank[] = ["C", "B", "A", "S"];
  if (!a) return b;
  return order.indexOf(b) > order.indexOf(a) ? b : a;
}

export function heistBoardSummary(heist: HeistDef, board: PrepBoardState, now = Date.now()): string {
  if (boardOnCooldown(board, now)) {
    const mins = Math.max(1, Math.ceil(((board.cooldownUntil ?? now) - now) / 60000));
    return `Cooldown ~${mins}m · Best ${board.bestRank ?? "—"} · ×${board.completions}`;
  }
  if (board.executePhase) return `LIVE · ${board.executePhase}`;
  const done = heist.stages.filter((st) => st.kind !== "execute" && board.completedStageIds.includes(st.id)).length;
  const total = heist.stages.filter((st) => st.kind !== "execute").length;
  return `Prep ${done}/${total} · Best ${board.bestRank ?? "—"} · ×${board.completions}`;
}

export { HEISTS, getHeist };
