/** Local named save slots (A/B/C) — separate from the live Zustand persist key. */

export type SaveSlotId = "a" | "b" | "c";

export const SAVE_SLOT_IDS: SaveSlotId[] = ["a", "b", "c"];

export const SAVE_SLOT_LABELS: Record<SaveSlotId, string> = {
  a: "Slot A",
  b: "Slot B",
  c: "Slot C",
};

const SLOT_KEY_PREFIX = "nightwire-slot-";
const ACTIVE_SLOT_KEY = "nightwire-active-slot";

export type SaveSlotBlob = {
  savedAt: number;
  /** Exported game JSON (same shape as exportSave) */
  save: string;
};

export type SaveSlotMeta = {
  id: SaveSlotId;
  label: string;
  empty: boolean;
  savedAt: number | null;
  name: string | null;
  level: number | null;
  district: string | null;
};

function slotKey(id: SaveSlotId): string {
  return `${SLOT_KEY_PREFIX}${id}`;
}

export function isSaveSlotId(v: unknown): v is SaveSlotId {
  return v === "a" || v === "b" || v === "c";
}

export function getActiveSaveSlot(): SaveSlotId | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ACTIVE_SLOT_KEY);
  return isSaveSlotId(raw) ? raw : null;
}

export function setActiveSaveSlot(id: SaveSlotId | null): void {
  if (typeof window === "undefined") return;
  if (id == null) {
    window.localStorage.removeItem(ACTIVE_SLOT_KEY);
    return;
  }
  window.localStorage.setItem(ACTIVE_SLOT_KEY, id);
}

function parseBlob(raw: string | null): SaveSlotBlob | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<SaveSlotBlob> & Record<string, unknown>;
    if (typeof data.save === "string" && typeof data.savedAt === "number") {
      return { savedAt: data.savedAt, save: data.save };
    }
    // Legacy / raw export dumped directly into the slot key
    if (typeof data.name === "string" || data.created === true || data.created === false) {
      return { savedAt: Date.now(), save: raw };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function peekSaveFields(saveJson: string): {
  name: string | null;
  level: number | null;
  district: string | null;
} {
  try {
    const data = JSON.parse(saveJson) as {
      name?: unknown;
      level?: unknown;
      district?: unknown;
    };
    return {
      name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : null,
      level: typeof data.level === "number" && Number.isFinite(data.level) ? Math.floor(data.level) : null,
      district: typeof data.district === "string" ? data.district : null,
    };
  } catch {
    return { name: null, level: null, district: null };
  }
}

export function readSaveSlotMeta(id: SaveSlotId): SaveSlotMeta {
  const label = SAVE_SLOT_LABELS[id];
  if (typeof window === "undefined") {
    return { id, label, empty: true, savedAt: null, name: null, level: null, district: null };
  }
  const blob = parseBlob(window.localStorage.getItem(slotKey(id)));
  if (!blob) {
    return { id, label, empty: true, savedAt: null, name: null, level: null, district: null };
  }
  const fields = peekSaveFields(blob.save);
  return {
    id,
    label,
    empty: false,
    savedAt: blob.savedAt,
    name: fields.name,
    level: fields.level,
    district: fields.district,
  };
}

export function listSaveSlotMeta(): SaveSlotMeta[] {
  return SAVE_SLOT_IDS.map(readSaveSlotMeta);
}

/** Write current export JSON into a named slot. */
export function writeSaveSlot(id: SaveSlotId, exportJson: string): SaveSlotMeta {
  if (typeof window === "undefined") {
    return readSaveSlotMeta(id);
  }
  const blob: SaveSlotBlob = { savedAt: Date.now(), save: exportJson };
  window.localStorage.setItem(slotKey(id), JSON.stringify(blob));
  setActiveSaveSlot(id);
  return readSaveSlotMeta(id);
}

/** Returns the inner export JSON, or null if empty/invalid. */
export function readSaveSlotJson(id: SaveSlotId): string | null {
  if (typeof window === "undefined") return null;
  return parseBlob(window.localStorage.getItem(slotKey(id)))?.save ?? null;
}

export function clearSaveSlot(id: SaveSlotId): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(slotKey(id));
  if (getActiveSaveSlot() === id) setActiveSaveSlot(null);
}

export function formatSlotSavedAt(ts: number | null): string {
  if (ts == null) return "Empty";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "Saved";
  }
}
