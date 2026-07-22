import { CONTACTS, getContact } from "@/content/catalog";
import type { ContactProgress, ContactTip, GameState } from "@/game/state";
import type { ContactActionId, ContactDef } from "@/game/types";

export type ContactReqReason = { label: string; href?: string };

const FAVOR_MAX = 5;
const TIP_MS = {
  kilo: 4 * 3600 * 1000,
  nix_street: 3 * 3600 * 1000,
  nix_petty: 2 * 3600 * 1000,
};

export function contactProgress(s: GameState, id: string): ContactProgress {
  return s.contacts[id] ?? { favor: 0, uses: 0, lastAt: null };
}

export function isContactUnlocked(def: ContactDef, s: GameState): boolean {
  switch (def.id) {
    case "reed":
      return true;
    case "mara":
      return s.lifetime.timesJailed >= 1 || s.investigation >= 1 || s.level >= 2;
    case "kilo":
      return s.lifetime.districtsVisited.includes("docksreach") || s.district === "docksreach";
    case "ivy":
      return Boolean(s.activeCourseId) || s.completedCourses.length >= 1;
    case "nix":
      return s.lifetime.crimesAttempted >= 5;
    case "soot":
      return s.lifetime.gymSessions >= 3;
    default:
      return false;
  }
}

export function contactUnlockReasons(def: ContactDef, s: GameState): ContactReqReason[] {
  if (isContactUnlocked(def, s)) return [];
  switch (def.id) {
    case "mara":
      return [{ label: "Jail, investigation, or level 2", href: "/profile" }];
    case "kilo":
      return [{ label: "Travel to DocksReach", href: "/travel" }];
    case "ivy":
      return [{ label: "Enroll or finish a course", href: "/education" }];
    case "nix":
      return [{ label: "Attempt 5 crimes", href: "/crimes" }];
    case "soot":
      return [{ label: "Train at gym 3 times", href: "/gym" }];
    default:
      return [{ label: def.unlockHint }];
  }
}

export function pruneExpiredTips(tips: ContactTip[], now = Date.now()): ContactTip[] {
  return tips.filter((t) => t.until > now);
}

/** Soft odds points added into crime odds pipeline */
export function contactTipOddsBonus(
  tips: ContactTip[],
  crime: { id: string; family: string },
  now = Date.now()
): number {
  let bonus = 0;
  for (const t of pruneExpiredTips(tips, now)) {
    if (t.crimeIds?.length) {
      if (t.crimeIds.includes(crime.id)) bonus += t.oddsBonus;
      continue;
    }
    if (t.family && t.family === crime.family) bonus += t.oddsBonus;
  }
  return bonus;
}

export function activeTipSummary(tips: ContactTip[], now = Date.now()): string[] {
  return pruneExpiredTips(tips, now).map((t) => {
    const mins = Math.max(1, Math.ceil((t.until - now) / 60000));
    return `${t.label} (~${mins}m)`;
  });
}

export function actionReasons(
  def: ContactDef,
  actionId: ContactActionId,
  s: GameState
): ContactReqReason[] {
  const action = def.actions.find((a) => a.id === actionId);
  if (!action) return [{ label: "Unknown action" }];
  if (!isContactUnlocked(def, s)) return contactUnlockReasons(def, s);

  const prog = contactProgress(s, def.id);
  const reasons: ContactReqReason[] = [];
  const favorCost = action.favorCost ?? 0;
  if (favorCost > 0 && prog.favor < favorCost) {
    reasons.push({ label: `Need favor ${favorCost} (have ${prog.favor})` });
  }
  if (action.cleanCost && s.clean < action.cleanCost) {
    reasons.push({ label: `Need $${action.cleanCost} clean`, href: "/jobs" });
  }
  if (action.streetCost && s.street < action.streetCost) {
    reasons.push({ label: `Need $${action.streetCost} street`, href: "/crimes" });
  }
  if (actionId === "retain" || actionId === "cool_case") {
    if (s.investigation <= 0) reasons.push({ label: "No open investigation" });
  }
  if (prog.lastAt && Date.now() - prog.lastAt < 20_000) {
    reasons.push({ label: "Give them a minute" });
  }
  return reasons;
}

export function canContactAction(def: ContactDef, actionId: ContactActionId, s: GameState): boolean {
  return actionReasons(def, actionId, s).length === 0;
}

export type ContactActionResult = {
  state: GameState;
  lines: string[];
  cashDelta: number;
  title: "SUCCESS" | "MIXED" | "FAILED";
};

function bumpContact(
  s: GameState,
  id: string,
  delta: { favor?: number; use?: boolean },
  now: number
): GameState {
  const cur = contactProgress(s, id);
  const favor = Math.max(0, Math.min(FAVOR_MAX, cur.favor + (delta.favor ?? 0)));
  const uses = cur.uses + (delta.use ? 1 : 0);
  return {
    ...s,
    contacts: {
      ...s.contacts,
      [id]: { favor, uses, lastAt: now },
    },
    lifetime: {
      ...s.lifetime,
      contactUses: s.lifetime.contactUses + (delta.use ? 1 : 0),
      favorSpent: s.lifetime.favorSpent + (delta.favor && delta.favor < 0 ? -delta.favor : 0),
    },
  };
}

function addTip(s: GameState, tip: ContactTip): GameState {
  const tips = pruneExpiredTips(s.contactTips).filter(
    (t) => !(t.contactId === tip.contactId && t.family === tip.family)
  );
  return {
    ...s,
    contactTips: [...tips, tip],
    lifetime: { ...s.lifetime, tipsBought: s.lifetime.tipsBought + 1 },
  };
}

/** Apply a contact action. Caller must pre-check canContactAction. */
export function applyContactAction(
  s: GameState,
  contactId: string,
  actionId: ContactActionId,
  now = Date.now()
): ContactActionResult | null {
  const def = getContact(contactId);
  if (!def) return null;
  if (!canContactAction(def, actionId, s)) return null;
  const action = def.actions.find((a) => a.id === actionId);
  if (!action) return null;

  let next: GameState = {
    ...s,
    contactTips: pruneExpiredTips(s.contactTips, now),
    actionIndex: s.actionIndex + 1,
  };
  const lines: string[] = [];
  let cashDelta = 0;
  let title: ContactActionResult["title"] = "SUCCESS";

  if (action.cleanCost) {
    next = { ...next, clean: next.clean - action.cleanCost };
    cashDelta -= action.cleanCost;
  }
  if (action.streetCost) {
    next = { ...next, street: next.street - action.streetCost };
    cashDelta -= action.streetCost;
  }
  const favorCost = action.favorCost ?? 0;
  if (favorCost > 0) {
    next = bumpContact(next, contactId, { favor: -favorCost, use: true }, now);
  } else {
    next = bumpContact(next, contactId, { use: true }, now);
  }

  switch (`${contactId}:${actionId}`) {
    case "reed:ping": {
      next = {
        ...next,
        happy: Math.min(next.happyMax, next.happy + 25),
        stress: Math.max(0, next.stress - 6),
      };
      next = bumpContact(next, "reed", { favor: 1 }, now);
      lines.push("Reed: “Still breathing. Good. Don’t make me write a eulogy.”");
      lines.push("+25 happy · −6 stress · favor +1");
      break;
    }
    case "reed:ask_favor": {
      next = { ...next, xp: next.xp + 12 };
      lines.push("Reed burns a marker. You feel the ladder move.");
      lines.push("+12 XP");
      break;
    }
    case "mara:retain": {
      next = {
        ...next,
        investigation: Math.max(0, next.investigation - 1) as GameState["investigation"],
      };
      next = bumpContact(next, "mara", { favor: 1 }, now);
      lines.push("Mara: “Paperwork is a weapon. You’re welcome.”");
      lines.push("Investigation −1 · favor +1");
      break;
    }
    case "mara:cool_case": {
      next = {
        ...next,
        investigation: Math.max(0, next.investigation - 2) as GameState["investigation"],
        stress: Math.max(0, next.stress - 4),
      };
      lines.push("Mara cools the file. Two stages melt.");
      lines.push("Investigation −2 · −4 stress");
      break;
    }
    case "kilo:tip": {
      next = addTip(next, {
        contactId: "kilo",
        family: "heavy",
        crimeIds: ["harbor", "courier"],
        oddsBonus: 8,
        until: now + TIP_MS.kilo,
        label: "Kilo pier tip (heavy)",
      });
      next = bumpContact(next, "kilo", { favor: 1 }, now);
      lines.push("Kilo: “Bay seven goes dark in a window. Don’t be late.”");
      lines.push("+8 heavy tip odds · 4h · favor +1");
      break;
    }
    case "kilo:ping": {
      const near = next.district === "docksreach";
      if (near) {
        next = { ...next, heat: Math.max(0, next.heat - 8) };
        lines.push("Radio hush on the pier. Heat bleeds (−8).");
      } else {
        next = {
          ...next,
          stress: Math.max(0, next.stress - 3),
          happy: Math.min(next.happyMax, next.happy + 8),
        };
        lines.push("Kilo’s static: “Come to the water if you want real quiet.”");
        lines.push("−3 stress · +8 happy");
      }
      next = bumpContact(next, "kilo", { favor: near ? 1 : 0 }, now);
      break;
    }
    case "ivy:office_hours": {
      next = {
        ...next,
        stress: Math.max(0, next.stress - 10),
        happy: Math.min(next.happyMax, next.happy + 30),
      };
      next = bumpContact(next, "ivy", { favor: 1 }, now);
      lines.push("Ivy: “Your transcript isn’t a confession. Breathe.”");
      lines.push("−10 stress · +30 happy · favor +1");
      break;
    }
    case "ivy:ping": {
      if (next.heat >= 40) {
        next = {
          ...next,
          heat: Math.max(0, next.heat - 10),
          stress: Math.max(0, next.stress - 4),
        };
        lines.push("Ivy warns probation. You dial back (−10 heat).");
      } else {
        next = {
          ...next,
          happy: Math.min(next.happyMax, next.happy + 15),
        };
        lines.push("Ivy: “Campus is quiet. Keep it that way.”");
        lines.push("+15 happy");
      }
      next = bumpContact(next, "ivy", { favor: 1 }, now);
      break;
    }
    case "nix:tip": {
      next = addTip(next, {
        contactId: "nix",
        family: "street",
        oddsBonus: 6,
        until: now + TIP_MS.nix_street,
        label: "Nix street tip",
      });
      next = bumpContact(next, "nix", { favor: 1 }, now);
      lines.push("Nix slides a timing scrap. Street work gets cleaner for a while.");
      lines.push("+6 street odds · 3h · favor +1");
      break;
    }
    case "nix:ask_favor": {
      next = addTip(next, {
        contactId: "nix",
        family: "petty",
        oddsBonus: 5,
        until: now + TIP_MS.nix_petty,
        label: "Nix petty marker",
      });
      lines.push("Nix calls a marker. Petty windows open.");
      lines.push("+5 petty odds · 2h");
      break;
    }
    case "soot:walk_off": {
      next = {
        ...next,
        stress: Math.max(0, next.stress - 12),
        happy: Math.min(next.happyMax, next.happy + 35),
      };
      next = bumpContact(next, "soot", { favor: 1 }, now);
      lines.push("Soot: “Form first. Ego later.” Stress bleeds out.");
      lines.push("−12 stress · +35 happy · favor +1");
      break;
    }
    case "soot:ping": {
      if (next.stress > 60) {
        title = "MIXED";
        lines.push("Soot: “You’re fried. Walk it off first.”");
        next = { ...next, stress: Math.max(0, next.stress - 2) };
      } else {
        next = bumpContact(next, "soot", { favor: 1 }, now);
        next = {
          ...next,
          happy: Math.min(next.happyMax, next.happy + 12),
        };
        lines.push("Soot nods. Favor +1 · +12 happy");
      }
      break;
    }
    default:
      return null;
  }

  return { state: next, lines, cashDelta, title };
}

export function unlockedContacts(s: GameState): ContactDef[] {
  return CONTACTS.filter((c) => isContactUnlocked(c, s));
}

export function lockedContacts(s: GameState): ContactDef[] {
  return CONTACTS.filter((c) => !isContactUnlocked(c, s));
}
