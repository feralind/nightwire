import { NextResponse } from "next/server";
import {
  buildLifeSystemPrompt,
  buildLifeUserPrompt,
  proceduralLifeFallback,
  resolveLifePersona,
  type LifeBeatResponse,
  type LifeContext,
  type LifeKind,
} from "@/game/lifeAi";
import type { PersonPersona } from "@/game/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const XAI_URL = "https://api.x.ai/v1/chat/completions";
/** Prefer grok-3 for short flavor; override with XAI_MODEL if needed. */
const MODEL = process.env.XAI_MODEL?.trim() || "grok-3";
const UPSTREAM_TIMEOUT_MS = 7500;

const KINDS: LifeKind[] = ["city", "contact", "rival", "tip"];
const PERSONAS: PersonPersona[] = ["noir", "slutty"];

function parseBody(raw: unknown): LifeContext | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.kind !== "string" || !KINDS.includes(o.kind as LifeKind)) return null;
  const lastEvents = Array.isArray(o.lastEvents)
    ? o.lastEvents.filter((x): x is string => typeof x === "string").slice(0, 6)
    : undefined;
  const adultNpc = o.adultNpc === true;
  const claimed =
    typeof o.persona === "string" && PERSONAS.includes(o.persona as PersonPersona)
      ? (o.persona as PersonPersona)
      : undefined;
  const base: LifeContext = {
    kind: o.kind as LifeKind,
    district: typeof o.district === "string" ? o.district.slice(0, 40) : undefined,
    contactId: typeof o.contactId === "string" ? o.contactId.slice(0, 40) : undefined,
    heat: typeof o.heat === "number" && Number.isFinite(o.heat) ? o.heat : undefined,
    level: typeof o.level === "number" && Number.isFinite(o.level) ? o.level : undefined,
    lastEvents,
    playerName: typeof o.playerName === "string" ? o.playerName.slice(0, 48) : undefined,
    adultNpc,
  };
  // Re-resolve from catalog + adultNpc — never trust client slutty alone
  const persona = resolveLifePersona(base);
  return { ...base, persona: claimed === "noir" ? "noir" : persona };
}

function ok(text: string, source: LifeBeatResponse["source"]) {
  return NextResponse.json({ text: text.trim().slice(0, 480), source } satisfies LifeBeatResponse);
}

export async function POST(req: Request) {
  let ctx: LifeContext | null = null;
  try {
    const raw = await req.json();
    ctx = parseBody(raw);
  } catch {
    ctx = null;
  }
  if (!ctx) {
    return ok(proceduralLifeFallback({ kind: "city" }), "fallback");
  }

  const fallbackText = proceduralLifeFallback(ctx);
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    return ok(fallbackText, "fallback");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const res = await fetch(XAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        temperature: 0.9,
        max_tokens: 160,
        messages: [
          { role: "system", content: buildLifeSystemPrompt(ctx) },
          { role: "user", content: buildLifeUserPrompt(ctx) },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return ok(fallbackText, "fallback");
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return ok(fallbackText, "fallback");
    }
    return ok(text, "ai");
  } catch {
    return ok(fallbackText, "fallback");
  } finally {
    clearTimeout(timer);
  }
}
