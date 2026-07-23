import { CONTACTS, DISTRICTS } from "@/content/catalog";
import { ambientForDistrict, tipFor } from "@/game/cityLife";
import {
  VEX_DEF,
  contactSubject,
  effectivePersona,
  isSluttyActive,
} from "@/game/persona";
import type { DistrictId, PersonPersona } from "@/game/types";
import { unit01 } from "@/game/rng";

/** Compact context for Grok / procedural city-life beats. */
export type LifeKind = "city" | "contact" | "rival" | "tip";

export type LifeContext = {
  kind: LifeKind;
  district?: string;
  contactId?: string;
  heat?: number;
  level?: number;
  lastEvents?: string[];
  playerName?: string;
  /** Effective persona after adultNpc gate (client-resolved). */
  persona?: PersonPersona;
  /** Mirror of settings — server re-checks before sultry prompts. */
  adultNpc?: boolean;
};

export type LifeBeatResponse = {
  text: string;
  source: "ai" | "fallback";
};

const CACHE_PREFIX = "nw-life-ai:";
const CACHE_TTL_MS = 12 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const memoryCache = new Map<string, { text: string; source: LifeBeatResponse["source"]; at: number }>();

const RIVAL_FALLBACKS = [
  "Vex leaves a stub note: still counting your windows.",
  "Rival chatter says Vex smiled at a ledger with your initials smudged.",
  "Quiet pressure. Vex is shopping for a story that fits your heat.",
  "Someone moved a pawn two streets over. Feels like Vex’s tempo.",
  "Vex radio-clicks once — acknowledgment, not mercy.",
];

const RIVAL_SLUTTY_FALLBACKS = [
  "Vex: “Still watching your windows… and wondering when you’ll stop by.”",
  "Rival channel purrs: Vex left lipstick on a note with your initials.",
  "Vex radio-clicks twice — soft, almost intimate. Not mercy. Interest.",
  "Someone says Vex asked about you like a date, not a hit. Worse.",
  "Vex: “Cute heat trail. Buy me a drink when you’re done running.”",
];

const CITY_FALLBACKS = [
  "Sirens skim the river fog and keep going. The district holds its breath.",
  "A courier bag swaps hands under a broken streetlight. Nobody asks the brand.",
  "Meter boxes rattle; somebody already claimed the soft coins.",
  "Nightwire hums — half gossip, half threat assessment.",
  "A patrol crawler idles, then rolls past like it never saw you.",
];

const CONTACT_FALLBACKS: Record<string, string[]> = {
  reed: [
    "Reed: “Still breathing. Don’t spend your nerve on theater.”",
    "Reed: “Eat, sleep, then pick one clean loop. Heroics are expensive.”",
  ],
  mara: [
    "Mara: “Paperwork is a weapon. Don’t gift them clean signatures.”",
    "Mara: “Investigation hates patience. Be boring for forty-eight hours.”",
  ],
  kilo: [
    "Kilo: “Bay seven’s loud tonight. Walk like you belong to a clipboard.”",
    "Kilo: “Harbor window’s soft if you don’t whistle first.”",
  ],
  ivy: [
    "Ivy: “Your schedule and your heat don’t match. Fix one.”",
    "Ivy: “Office hours aren’t mercy — they’re triage.”",
  ],
  nix: [
    "Nix: “Numbers don’t care about bravado. EV does.”",
    "Nix: “If the tip costs more than the edge, hang up.”",
  ],
  wren: [
    "Wren: “Cameras love faces. Hoods love alleys. Choose.”",
    "Wren: “Soft intel: leave before the second siren.”",
  ],
  default: [
    "A thin voice on the wire: “Keep it short. The city’s listening.”",
    "Static, then: “Don’t teach the street your real name.”",
  ],
};

/** Flirty tip variants — female slutty contacts only (adultNpc gated upstream). */
const CONTACT_SLUTTY_FALLBACKS: Record<string, string[]> = {
  nix: [
    "Nix: “Timing’s my product… and I’ve got a soft window if you ask nice.”",
    "Nix: “Pay for the tip, stay for the smile. Street forgets; I don’t.”",
    "Nix: “Your odds climb when you listen close. Closer.”",
  ],
  default: [
    "A warm voice on the wire: “Keep it short… unless you’re buying more than tips.”",
    "Static, then a laugh: “Don’t teach the street your real name. Mine’s safer.”",
  ],
};

function districtName(id?: string): string {
  if (!id) return "the city";
  return DISTRICTS.find((d) => d.id === id)?.name ?? id;
}

function contactName(id?: string): string {
  if (!id) return "a contact";
  return CONTACTS.find((c) => c.id === id)?.name ?? id;
}

/** Resolve persona for a life context (contacts / Vex rival). */
export function resolveLifePersona(ctx: LifeContext): PersonPersona {
  const adult = ctx.adultNpc === true;
  if (ctx.kind === "rival") {
    return effectivePersona(VEX_DEF, adult);
  }
  if (ctx.kind === "contact" && ctx.contactId) {
    return effectivePersona(contactSubject(ctx.contactId), adult);
  }
  // City / tip stay noir unless caller already passed a gated persona
  if (ctx.persona === "slutty" && adult) return "slutty";
  return "noir";
}

/** Stable short hash for cache keys (kind + compact context). */
export function lifeContextHash(ctx: LifeContext): string {
  const persona = resolveLifePersona(ctx);
  const payload = [
    ctx.kind,
    ctx.district ?? "",
    ctx.contactId ?? "",
    Math.floor(ctx.heat ?? 0),
    Math.floor(ctx.level ?? 0),
    (ctx.lastEvents ?? []).slice(0, 3).join("|"),
    ctx.playerName ?? "",
    persona,
    ctx.adultNpc === true ? "1" : "0",
  ].join("::");
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${ctx.kind}_${(h >>> 0).toString(36)}`;
}

/** Procedural diegetic line — always available offline. */
export function proceduralLifeFallback(ctx: LifeContext, seed = "nw"): string {
  const salt = lifeContextHash(ctx);
  const roll = unit01(seed, `lifeai:${salt}`, Math.floor(Date.now() / (60 * 60 * 1000)));
  const persona = resolveLifePersona(ctx);

  if (ctx.kind === "tip") {
    return tipFor(seed).body;
  }

  if (ctx.kind === "rival") {
    const pool = persona === "slutty" ? RIVAL_SLUTTY_FALLBACKS : RIVAL_FALLBACKS;
    const i = Math.floor(roll * pool.length) % pool.length;
    return pool[i];
  }

  if (ctx.kind === "contact") {
    const id = ctx.contactId ?? "";
    const slutty =
      persona === "slutty" &&
      isSluttyActive(contactSubject(id), ctx.adultNpc === true);
    const lines = slutty
      ? CONTACT_SLUTTY_FALLBACKS[id] ?? CONTACT_SLUTTY_FALLBACKS.default
      : CONTACT_FALLBACKS[id] ?? CONTACT_FALLBACKS.default;
    const i = Math.floor(roll * lines.length) % lines.length;
    return lines[i];
  }

  // city
  const district = (ctx.district as DistrictId) || "glassrow";
  if (DISTRICTS.some((d) => d.id === district) && roll > 0.45) {
    return ambientForDistrict(district, seed).body;
  }
  const i = Math.floor(roll * CITY_FALLBACKS.length) % CITY_FALLBACKS.length;
  const heatBit =
    typeof ctx.heat === "number" && ctx.heat >= 40
      ? " Heat sits ugly on the scanners."
      : "";
  return `${CITY_FALLBACKS[i]}${heatBit}`.trim();
}

function readSessionCache(key: string): LifeBeatResponse | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { text: string; source: LifeBeatResponse["source"]; at: number };
    if (!parsed?.text || Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return { text: parsed.text, source: parsed.source };
  } catch {
    return null;
  }
}

function writeSessionCache(key: string, value: LifeBeatResponse) {
  memoryCache.set(key, { ...value, at: Date.now() });
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ...value, at: Date.now() }));
  } catch {
    /* quota / private mode */
  }
}

export type FetchLifeBeatOptions = {
  /** When false, skip network and return procedural fallback. Default true. */
  enabled?: boolean;
  seed?: string;
  /** Bypass cache and force a new request (still falls back on failure). */
  force?: boolean;
  signal?: AbortSignal;
  adultNpc?: boolean;
};

/**
 * Client helper: fetch a short AI city/NPC beat when settings allow.
 * Never throws — always returns text with source ai|fallback.
 */
export async function fetchLifeBeat(
  ctx: LifeContext,
  opts: FetchLifeBeatOptions = {}
): Promise<LifeBeatResponse> {
  const enabled = opts.enabled !== false;
  const seed = opts.seed ?? "nw";
  const adultNpc = opts.adultNpc === true || ctx.adultNpc === true;
  const enriched: LifeContext = {
    ...ctx,
    adultNpc,
    persona: resolveLifePersona({ ...ctx, adultNpc }),
  };
  const key = lifeContextHash(enriched);
  const fallback = (): LifeBeatResponse => ({
    text: proceduralLifeFallback(enriched, seed),
    source: "fallback",
  });

  if (!enabled) return fallback();

  if (!opts.force) {
    const mem = memoryCache.get(key);
    if (mem && Date.now() - mem.at < CACHE_TTL_MS) {
      return { text: mem.text, source: mem.source };
    }
    const sess = readSessionCache(key);
    if (sess) {
      memoryCache.set(key, { ...sess, at: Date.now() });
      return sess;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch("/api/life", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enriched),
      signal: controller.signal,
    });
    if (!res.ok) return fallback();
    const data = (await res.json()) as Partial<LifeBeatResponse>;
    if (typeof data.text !== "string" || !data.text.trim()) return fallback();
    const out: LifeBeatResponse = {
      text: data.text.trim().slice(0, 480),
      source: data.source === "ai" ? "ai" : "fallback",
    };
    writeSessionCache(key, out);
    return out;
  } catch {
    return fallback();
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onAbort);
  }
}

/** Build a compact user prompt for the model (server-side). */
export function buildLifeUserPrompt(ctx: LifeContext): string {
  const persona = resolveLifePersona(ctx);
  const bits = [
    `kind=${ctx.kind}`,
    ctx.district ? `district=${districtName(ctx.district)} (${ctx.district})` : null,
    ctx.contactId ? `contact=${contactName(ctx.contactId)} (${ctx.contactId})` : null,
    typeof ctx.heat === "number" ? `heat=${Math.floor(ctx.heat)}` : null,
    typeof ctx.level === "number" ? `level=${ctx.level}` : null,
    ctx.playerName ? `player=${ctx.playerName}` : null,
    ctx.lastEvents?.length ? `recent=${ctx.lastEvents.slice(0, 4).join(" · ")}` : null,
    `persona=${persona}`,
  ].filter(Boolean);

  let task: string;
  if (ctx.kind === "rival") {
    task =
      persona === "slutty"
        ? "Write one short rival-mood line from Vex — sultry, flirty crime-hub banter (fictional adult). Suggestive innuendo OK; no explicit sex acts."
        : "Write one short rival-mood line about Vex watching the player (fiction).";
  } else if (ctx.kind === "contact") {
    task =
      persona === "slutty"
        ? `Write one short in-character line from contact ${contactName(ctx.contactId)} — sultry, flirty adult banter (fictional adult). Suggestive innuendo OK; no explicit sex acts.`
        : `Write one short in-character line from contact ${contactName(ctx.contactId)}.`;
  } else if (ctx.kind === "tip") {
    task = "Write one short diegetic street tip (fiction, no how-to crime steps).";
  } else {
    task = "Write one short city-life beat for Nightwire’s fictional hub.";
  }
  return `${task}\nContext: ${bits.join(", ")}`;
}

export function buildLifeSystemPrompt(ctx: LifeContext): string {
  const persona = resolveLifePersona(ctx);
  const tone =
    persona === "slutty"
      ? `Tone for THIS beat only: sultry, flirty adult crime-hub banter (fictional adults 18+). Suggestive innuendo OK; keep it tasteful — no hardcore porn, no non-consent, no minors. Other characters in the world stay standard noir — only this tagged character uses the flirt voice.`
      : `Tone: PG-13 crime fiction by default; darker noir only if the contact or rival context already is.`;
  return `You are a diegetic narrator for Nightwire, an original crime-fiction city-sim game (fictional IP — not real cities or real gangs).
Write 1–3 short sentences of atmospheric NPC / city flavor only.
${tone}
Never give real-world crime instructions, how-to advice, tools, or actionable illegal steps.
No copyrighted characters. No lectures. Stay in-world.`;
}

export const LIFE_SYSTEM_PROMPT = buildLifeSystemPrompt({ kind: "city" });
