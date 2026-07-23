import { CONTACTS, NPCS, getContact, getNpc } from "@/content/catalog";
import type { ContactDef, NpcDef, PersonGender, PersonPersona } from "@/game/types";

/** Rival dossier — female nightlife antagonist; slutty voice is settings-gated. */
export const VEX_DEF = {
  id: "vex",
  name: "Vex",
  gender: "female" as const satisfies PersonGender,
  persona: "slutty" as const satisfies PersonPersona,
  blurb: "Rival ink and chalk marks. Watches your windows.",
  blurbSlutty:
    "Rival ink with a wink — she leaves calling cards like invitations, not threats.",
};

export type PersonaSubject = {
  gender?: PersonGender;
  persona?: PersonPersona;
};

/** Slutty voice is active only for explicitly female + slutty-tagged + adultNpc on. */
export function isSluttyActive(
  subject: PersonaSubject | null | undefined,
  adultNpc: boolean
): boolean {
  if (!adultNpc || !subject) return false;
  return subject.gender === "female" && subject.persona === "slutty";
}

export function effectivePersona(
  subject: PersonaSubject | null | undefined,
  adultNpc: boolean
): PersonPersona {
  return isSluttyActive(subject, adultNpc) ? "slutty" : "noir";
}

export function contactSubject(contactId?: string): ContactDef | undefined {
  if (!contactId) return undefined;
  return getContact(contactId);
}

export function npcSubject(npcId?: string): NpcDef | undefined {
  if (!npcId) return undefined;
  return getNpc(npcId);
}

export function contactBlurb(def: ContactDef, adultNpc: boolean): string {
  if (isSluttyActive(def, adultNpc) && def.blurbSlutty) return def.blurbSlutty;
  return def.blurb;
}

export function npcFlavor(def: NpcDef, adultNpc: boolean): string {
  if (isSluttyActive(def, adultNpc) && def.flavorSlutty) return def.flavorSlutty;
  return def.flavor;
}

/** Catalog integrity: slutty never on male/unknown. */
export function assertPersonaCatalogSafe(): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  for (const c of CONTACTS) {
    if (c.persona === "slutty" && c.gender !== "female") {
      errors.push(`contact ${c.id}: slutty requires gender female (got ${c.gender})`);
    }
  }
  for (const n of NPCS) {
    if (n.persona === "slutty" && n.gender !== "female") {
      errors.push(`npc ${n.id}: slutty requires gender female (got ${n.gender ?? "undefined"})`);
    }
  }
  if (VEX_DEF.persona === "slutty" && VEX_DEF.gender !== "female") {
    errors.push("vex: slutty requires gender female");
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}
