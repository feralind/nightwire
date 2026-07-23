import type { GameState, InventorySlot } from "@/game/state";

/** Max age of a single undo snapshot (ms). */
export const UNDO_WINDOW_MS = 12_000;

/** Only one pending undo at a time (last destructive/mistaken action). */
export type UndoKind =
  | "crime"
  | "job"
  | "gig"
  | "buy"
  | "use"
  | "equip"
  | "bank"
  | "train"
  | "other";

export type UndoSnapshot = {
  at: number;
  label: string;
  kind: UndoKind;
  /** Resource slice restored on undo */
  clean: number;
  street: number;
  bank: number;
  energy: number;
  nerve: number;
  happy: number;
  life: number;
  heat: number;
  stress: number;
  inventory: InventorySlot[];
  hospitalUntil: number | null;
  jailUntil: number | null;
  hospitalReason: string | null;
  jailReason: string | null;
  wounds: { arm: number; leg: number };
  investigation: GameState["investigation"];
  investigationDeadline: number | null;
  legitimacy: number;
  actionIndex: number;
  chainFamily: string | null;
  chainLevel: number;
  mastery: GameState["mastery"];
  lifetime: GameState["lifetime"];
  jobXp: number;
  shiftsThisWeek: number;
  gigsThisWeek: number;
  lastCrimeId: string | null;
  lastJobId: string | null;
  lastGigId: string | null;
};

export type UndoState = UndoSnapshot | null;

/** Capture mutatable resources before a destructive player action. */
export function captureUndoSnapshot(
  s: GameState,
  label: string,
  kind: UndoKind,
  at = Date.now()
): UndoSnapshot {
  return {
    at,
    label,
    kind,
    clean: s.clean,
    street: s.street,
    bank: s.bank,
    energy: s.energy,
    nerve: s.nerve,
    happy: s.happy,
    life: s.life,
    heat: s.heat,
    stress: s.stress,
    inventory: s.inventory.map((slot) => ({ ...slot })),
    hospitalUntil: s.hospitalUntil,
    jailUntil: s.jailUntil,
    hospitalReason: s.hospitalReason,
    jailReason: s.jailReason,
    wounds: { ...s.wounds },
    investigation: s.investigation,
    investigationDeadline: s.investigationDeadline,
    legitimacy: s.legitimacy,
    actionIndex: s.actionIndex,
    chainFamily: s.chainFamily,
    chainLevel: s.chainLevel,
    mastery: { ...s.mastery },
    lifetime: { ...s.lifetime, districtsVisited: [...s.lifetime.districtsVisited] },
    jobXp: s.jobXp,
    shiftsThisWeek: s.shiftsThisWeek,
    gigsThisWeek: s.gigsThisWeek,
    lastCrimeId: s.lastCrimeId,
    lastJobId: s.lastJobId,
    lastGigId: s.lastGigId,
  };
}

export function undoIsAlive(snap: UndoSnapshot | null, now = Date.now()): boolean {
  if (!snap) return false;
  return now - snap.at <= UNDO_WINDOW_MS;
}

export function undoRemainingMs(snap: UndoSnapshot | null, now = Date.now()): number {
  if (!snap) return 0;
  return Math.max(0, UNDO_WINDOW_MS - (now - snap.at));
}

/** Apply snapshot fields back onto state. Does not touch awards/timeline/logs. */
export function applyUndoSnapshot(s: GameState, snap: UndoSnapshot): GameState {
  return {
    ...s,
    clean: snap.clean,
    street: snap.street,
    bank: snap.bank,
    energy: snap.energy,
    nerve: snap.nerve,
    happy: snap.happy,
    life: snap.life,
    heat: snap.heat,
    stress: snap.stress,
    inventory: snap.inventory.map((slot) => ({ ...slot })),
    hospitalUntil: snap.hospitalUntil,
    jailUntil: snap.jailUntil,
    hospitalReason: snap.hospitalReason,
    jailReason: snap.jailReason,
    wounds: { ...snap.wounds },
    investigation: snap.investigation,
    investigationDeadline: snap.investigationDeadline,
    legitimacy: snap.legitimacy,
    actionIndex: snap.actionIndex,
    chainFamily: snap.chainFamily,
    chainLevel: snap.chainLevel,
    mastery: { ...snap.mastery },
    lifetime: {
      ...snap.lifetime,
      districtsVisited: [...snap.lifetime.districtsVisited],
    },
    jobXp: snap.jobXp,
    shiftsThisWeek: snap.shiftsThisWeek,
    gigsThisWeek: snap.gigsThisWeek,
    lastCrimeId: snap.lastCrimeId,
    lastJobId: snap.lastJobId,
    lastGigId: snap.lastGigId,
  };
}

export const UNDO_LIMITS_COPY =
  "Undo reverses the last cash / nerve / energy / inventory mutation within 12s. Awards, timeline entries, and log lines stay. Only one pending undo.";
