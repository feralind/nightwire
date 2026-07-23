import { CONTACTS, getContact } from "@/content/catalog";
import type { ContactProgress, ContactTip, GameState } from "@/game/state";
import type { ContactActionId, ContactDef } from "@/game/types";

export type ContactReqReason = { label: string; href?: string };

const FAVOR_MAX = 5;
const TIP_MS = {
  kilo: 4 * 3600 * 1000,
  nix_street: 3 * 3600 * 1000,
  nix_petty: 2 * 3600 * 1000,
  wren_petty: 3 * 3600 * 1000,
};

export type MentorReplyId = "steady" | "hustle" | "quiet";

export const MENTOR_REPLIES: { id: MentorReplyId; label: string; blurb: string }[] = [
  { id: "steady", label: "Keep it steady", blurb: "Legal rails + soft nerves." },
  { id: "hustle", label: "Push harder", blurb: "XP nudge; stress climbs a little." },
  { id: "quiet", label: "Go quiet", blurb: "Heat bleed; happy soft." },
];

export function contactProgress(s: GameState, id: string): ContactProgress {
  return s.contacts[id] ?? { favor: 0, uses: 0, lastAt: null };
}

function visited(s: GameState, district: string): boolean {
  return s.lifetime.districtsVisited.includes(district as GameState["district"]) || s.district === district;
}

export function isContactUnlocked(def: ContactDef, s: GameState): boolean {
  switch (def.id) {
    case "reed":
      return true;
    case "mara":
      return s.lifetime.timesJailed >= 1 || s.investigation >= 1 || s.level >= 2;
    case "kilo":
      return visited(s, "docksreach");
    case "ivy":
      return Boolean(s.activeCourseId) || s.completedCourses.length >= 1;
    case "nix":
      return s.lifetime.crimesAttempted >= 5;
    case "soot":
      return s.lifetime.gymSessions >= 3;
    case "wren":
      return visited(s, "oldcommons");
    case "calder":
      return visited(s, "ashcourt");
    case "quill":
      return visited(s, "spireyard") || s.lifetime.bankDeposits >= 1;
    case "joss":
      return s.lifetime.shiftsWorked >= 5;
    case "haze":
      return s.lifetime.peakHeat >= 40;
    case "pike":
      return s.lifetime.timesJailed >= 1;
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
    case "wren":
      return [{ label: "Travel to OldCommons", href: "/travel" }];
    case "calder":
      return [{ label: "Travel to Ashcourt", href: "/travel" }];
    case "quill":
      return [{ label: "Visit SpireYard or deposit at bank", href: "/travel" }];
    case "joss":
      return [{ label: "Work 5 job shifts", href: "/jobs" }];
    case "haze":
      return [{ label: "Hit peak heat 40+", href: "/crimes" }];
    case "pike":
      return [{ label: "Survive a jail stay", href: "/jail" }];
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
  s: GameState,
  now = Date.now()
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
  if (def.id === "mara" && (actionId === "retain" || actionId === "cool_case")) {
    if (s.investigation <= 0) reasons.push({ label: "No open investigation" });
  }
  if (def.id === "pike" && actionId === "retain") {
    if (!s.jailUntil || now >= s.jailUntil) {
      reasons.push({ label: "Only while jailed", href: "/jail" });
    }
  }
  if (prog.lastAt && now - prog.lastAt < 20_000) {
    reasons.push({ label: "Give them a minute" });
  }
  return reasons;
}

export function canContactAction(
  def: ContactDef,
  actionId: ContactActionId,
  s: GameState,
  now = Date.now()
): boolean {
  return actionReasons(def, actionId, s, now).length === 0;
}

/** Contacts that remain usable while jailed / hospitalized */
export function contactActionBypassesBlock(
  contactId: string,
  actionId: ContactActionId
): "jail" | "hospital" | null {
  if (contactId === "pike" && actionId === "retain") return "jail";
  if (contactId === "calder" && actionId === "walk_off") return "hospital";
  return null;
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

/** Distinct contacts the player has used at least once */
export function distinctContactsUsed(s: GameState): number {
  return Object.values(s.contacts).filter((c) => c.uses > 0).length;
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
  if (!canContactAction(def, actionId, s, now)) return null;
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
    case "wren:tip": {
      next = addTip(next, {
        contactId: "wren",
        family: "petty",
        oddsBonus: 6,
        until: now + TIP_MS.wren_petty,
        label: "Wren window tip (petty)",
      });
      next = bumpContact(next, "wren", { favor: 1 }, now);
      lines.push("Wren: “Commons forgets faces in three hours. Move light.”");
      lines.push("+6 petty odds · 3h · favor +1");
      break;
    }
    case "wren:ask_favor": {
      const cleaned = 260;
      next = { ...next, clean: next.clean + cleaned };
      cashDelta += cleaned;
      lines.push("Wren counts ugly bills into clean. No receipt.");
      lines.push(`+$400 street → +$${cleaned} clean`);
      break;
    }
    case "calder:walk_off": {
      const inWard = Boolean(next.hospitalUntil && now < next.hospitalUntil);
      if (inWard && next.hospitalUntil) {
        const remaining = next.hospitalUntil - now;
        const cut = Math.floor(remaining / 2);
        next = { ...next, hospitalUntil: now + cut };
        next = bumpContact(next, "calder", { favor: 1 }, now);
        lines.push("Calder misplaces a chart. You’re out sooner.");
        lines.push(`Hospital time halved · favor +1`);
      } else {
        next = {
          ...next,
          life: Math.min(next.lifeMax, next.life + 20),
          stress: Math.max(0, next.stress - 8),
          wounds: {
            arm: Math.max(0, next.wounds.arm - 1),
            leg: Math.max(0, next.wounds.leg - 1),
          },
        };
        next = bumpContact(next, "calder", { favor: 1 }, now);
        lines.push("Calder: “Walk upright. Don’t bleed on my floor.”");
        lines.push("+20 life · −8 stress · wounds −1 · favor +1");
      }
      break;
    }
    case "calder:ping": {
      next = {
        ...next,
        stress: Math.max(0, next.stress - 5),
        life: Math.min(next.lifeMax, next.life + 8),
      };
      next = bumpContact(next, "calder", { favor: 1 }, now);
      lines.push("Calder: “Hall’s clear. Don’t make it interesting.”");
      lines.push("−5 stress · +8 life · favor +1");
      break;
    }
    case "quill:ping": {
      next = {
        ...next,
        legitimacy: Math.min(100, next.legitimacy + 3),
        happy: Math.min(next.happyMax, next.happy + 10),
      };
      next = bumpContact(next, "quill", { favor: 1 }, now);
      lines.push("Quill files a note that never existed. Legitimacy ticks up.");
      lines.push("+3 legitimacy · +10 happy · favor +1");
      break;
    }
    case "quill:ask_favor": {
      const stipend = 180;
      next = {
        ...next,
        clean: next.clean + stipend,
        legitimacy: Math.min(100, next.legitimacy + 5),
      };
      cashDelta += stipend;
      lines.push("Quill rush-stamps a voucher. Spire ink, clean cash.");
      lines.push(`+$${stipend} clean · +5 legitimacy`);
      break;
    }
    case "joss:ask_favor": {
      const pay = 220;
      next = { ...next, clean: next.clean + pay };
      cashDelta += pay;
      lines.push("Joss: “Loading dock needs a body. Don’t ask whose.”");
      lines.push(`+$${pay} clean`);
      break;
    }
    case "joss:ping": {
      const room = next.energy < next.energyMax;
      if (room) {
        next = {
          ...next,
          energy: Math.min(next.energyMax, next.energy + 15),
        };
        next = bumpContact(next, "joss", { favor: 1 }, now);
        lines.push("Joss swaps you an early out. Energy returns.");
        lines.push("+15 energy · favor +1");
      } else {
        title = "MIXED";
        next = {
          ...next,
          happy: Math.min(next.happyMax, next.happy + 10),
        };
        lines.push("Joss: “You’re topped up. Take the cash shift later.”");
        lines.push("+10 happy");
      }
      break;
    }
    case "haze:tip": {
      next = {
        ...next,
        heat: Math.max(0, next.heat - 15),
        stress: Math.max(0, next.stress - 3),
      };
      next = bumpContact(next, "haze", { favor: 1 }, now);
      lines.push("Haze sells cool air. Cameras forget a little.");
      lines.push("−15 heat · −3 stress · favor +1");
      break;
    }
    case "haze:ping": {
      const near = next.district === "docksreach";
      if (near) {
        next = { ...next, heat: Math.max(0, next.heat - 6) };
        next = bumpContact(next, "haze", { favor: 1 }, now);
        lines.push("Haze: “Smoke covers tracks.” Heat −6.");
      } else {
        next = {
          ...next,
          stress: Math.max(0, next.stress - 4),
          happy: Math.min(next.happyMax, next.happy + 8),
        };
        lines.push("Haze: “Come to the pier if you want real cool.”");
        lines.push("−4 stress · +8 happy");
      }
      break;
    }
    case "pike:retain": {
      if (!next.jailUntil || now >= next.jailUntil) return null;
      const remaining = next.jailUntil - now;
      const cut = Math.floor(remaining / 2);
      next = {
        ...next,
        jailUntil: now + cut,
        stress: Math.max(0, next.stress - 5),
      };
      next = bumpContact(next, "pike", { favor: 1 }, now);
      lines.push("Pike waves a clipboard. Half the clock vanishes.");
      lines.push("Jail time halved · −5 stress · favor +1");
      break;
    }
    case "pike:ping": {
      next = {
        ...next,
        stress: Math.max(0, next.stress - 7),
        heat: Math.max(0, next.heat - 4),
      };
      next = bumpContact(next, "pike", { favor: 1 }, now);
      lines.push("Pike: “Stay free. I bill by the hour.”");
      lines.push("−7 stress · −4 heat · favor +1");
      break;
    }
    default:
      return null;
  }

  return { state: next, lines, cashDelta, title };
}

export function mentorReplyReasons(s: GameState, now = Date.now()): ContactReqReason[] {
  const reed = getContact("reed");
  if (!reed || !isContactUnlocked(reed, s)) return [{ label: "Mentor offline" }];
  const prog = contactProgress(s, "reed");
  if (prog.lastAt && now - prog.lastAt < 20_000) {
    return [{ label: "Give them a minute" }];
  }
  return [];
}

export function canMentorReply(s: GameState, now = Date.now()): boolean {
  return mentorReplyReasons(s, now).length === 0;
}

/** Light mentor thread — 2–3 choice replies, no full dialogue system */
export function applyMentorReply(
  s: GameState,
  choice: MentorReplyId,
  now = Date.now()
): ContactActionResult | null {
  if (!canMentorReply(s, now)) return null;

  let next = bumpContact(s, "reed", { use: true, favor: 1 }, now);
  next = { ...next, actionIndex: next.actionIndex + 1 };
  const lines: string[] = [];
  const title: ContactActionResult["title"] = "SUCCESS";

  switch (choice) {
    case "steady": {
      next = {
        ...next,
        stress: Math.max(0, next.stress - 5),
        happy: Math.min(next.happyMax, next.happy + 15),
        legitimacy: Math.min(100, next.legitimacy + 1),
      };
      lines.push("You: “Keeping it steady.”");
      lines.push("Reed: “Good. Legal rails first — ego later.”");
      lines.push("−5 stress · +15 happy · +1 legitimacy · favor +1");
      break;
    }
    case "hustle": {
      next = {
        ...next,
        xp: next.xp + 8,
        stress: Math.min(100, next.stress + 4),
      };
      lines.push("You: “Pushing harder.”");
      lines.push("Reed: “Fine. Don’t confuse speed with skill.”");
      lines.push("+8 XP · +4 stress · favor +1");
      break;
    }
    case "quiet": {
      next = {
        ...next,
        heat: Math.max(0, next.heat - 6),
        happy: Math.min(next.happyMax, next.happy + 12),
      };
      lines.push("You: “Going quiet.”");
      lines.push("Reed: “Smart. Let the city forget your face.”");
      lines.push("−6 heat · +12 happy · favor +1");
      break;
    }
    default:
      return null;
  }

  return { state: next, lines, cashDelta: 0, title };
}

export function unlockedContacts(s: GameState): ContactDef[] {
  return CONTACTS.filter((c) => isContactUnlocked(c, s));
}

export function lockedContacts(s: GameState): ContactDef[] {
  return CONTACTS.filter((c) => !isContactUnlocked(c, s));
}
