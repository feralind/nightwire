import { AWARDS_EXTRA_META } from "@/content/density/awardsExtra";
import { CONTACTS } from "@/content/catalog";
import type { GameState } from "@/game/state";

function networth(s: GameState): number {
  return s.clean + s.street + s.bank;
}

function hasItem(s: GameState, itemId: string): boolean {
  return (s.inventory.find((i) => i.itemId === itemId)?.qty ?? 0) >= 1;
}

function anySafehouseRoom(s: GameState): boolean {
  const rooms = s.safehouseRooms ?? {};
  return Object.values(rooms).some((lvl) => (lvl ?? 0) >= 1);
}

/** Evaluate density-pack awards via AWARDS_EXTRA_META. */
export function densityAwardConditionMet(id: string, s: GameState): boolean | null {
  const meta = AWARDS_EXTRA_META.find((m) => m.id === id);
  if (!meta) return null;
  const v = meta.value;
  switch (meta.kind) {
    case "mastery.petty.attempts":
      return (s.mastery.petty?.attempts ?? 0) >= Number(v);
    case "mastery.street.attempts":
      return (s.mastery.street?.attempts ?? 0) >= Number(v);
    case "mastery.heavy.cashwins":
      return (s.mastery.heavy?.attempts ?? 0) >= Number(v) && (s.mastery.heavy?.cash ?? 0) > 0;
    case "crimesAttempted":
      return s.lifetime.crimesAttempted >= Number(v);
    case "heistsCompleted":
      return (s.lifetime.heistsCompleted ?? 0) >= Number(v);
    case "crimeFails":
      return s.lifetime.crimesAttempted - s.lifetime.crimesSucceeded >= Number(v);
    case "shiftsWorked":
      return s.lifetime.shiftsWorked >= Number(v);
    case "gigsDone":
      return s.lifetime.gigsDone >= Number(v);
    case "promotions":
      return s.lifetime.promotions >= Number(v);
    case "courses":
      return s.completedCourses.length >= Number(v);
    case "properties":
      return s.ownedProperties.length >= Number(v);
    case "bank":
      return s.bank >= Number(v) || s.lifetime.peakBank >= Number(v);
    case "networth":
      return networth(s) >= Number(v) || s.lifetime.peakNetworth >= Number(v);
    case "interest":
      return s.lifetime.interestEarned >= Number(v);
    case "gym":
      return s.lifetime.gymSessions >= Number(v);
    case "attacksWon":
      return s.lifetime.attacksWon >= Number(v);
    case "jailed":
      return s.lifetime.timesJailed >= Number(v);
    case "hospital":
      return s.lifetime.attacksLost >= Number(v);
    case "level":
      return s.level >= Number(v);
    case "peakHeat":
      return s.lifetime.peakHeat >= Number(v);
    case "rankIndex":
      return s.rankIndex >= Number(v);
    case "contactsAll":
      return Object.values(s.contacts).filter((c) => c.uses > 0).length >= CONTACTS.length;
    case "contactUses":
      return s.lifetime.contactUses >= Number(v);
    case "tips":
      return s.lifetime.tipsBought >= Number(v);
    case "missions":
      return (s.lifetime.missionsCompleted ?? 0) >= Number(v);
    case "distCrime":
      return (
        (s.lifetime.districtsVisited ?? []).includes(String(v) as never) &&
        s.lifetime.crimesSucceeded >= 20
      );
    case "legitimacy":
      return s.legitimacy >= Number(v);
    case "respect":
      return (s.power?.respect ?? 0) >= Number(v);
    case "chain":
      return (s.chainLevel ?? 0) >= Number(v);
    case "cleanEarned":
      return s.clean + s.bank >= Number(v) || s.lifetime.peakBank >= Number(v);
    case "streetEarned":
      return s.street >= Number(v) || s.lifetime.peakNetworth >= Number(v);
    case "hybrid":
      return Boolean(s.activeCourseId) && s.lifetime.crimesSucceeded >= Number(v);
    case "safehouse":
      return anySafehouseRoom(s);
    case "item":
      return hasItem(s, String(v));
    case "shopBuys":
      return s.lifetime.bankDeposits + s.lifetime.gigsDone >= Number(v);
    default:
      return false;
  }
}

export function densityAwardHint(id: string): string | null {
  const meta = AWARDS_EXTRA_META.find((m) => m.id === id);
  if (!meta) return null;
  const v = meta.value;
  switch (meta.kind) {
    case "mastery.petty.attempts":
      return `Attempt ${v} petty crimes`;
    case "mastery.street.attempts":
      return `Attempt ${v} street crimes`;
    case "mastery.heavy.cashwins":
      return `Clear ${v} heavy scores`;
    case "crimesAttempted":
      return `Attempt ${v} crimes`;
    case "heistsCompleted":
      return `Complete ${v} heists`;
    case "crimeFails":
      return `Fail ${v} crimes`;
    case "shiftsWorked":
      return `Work ${v} shifts`;
    case "gigsDone":
      return `Complete ${v} gigs`;
    case "promotions":
      return `Earn ${v} promotions`;
    case "courses":
      return `Finish ${v} courses`;
    case "properties":
      return `Own ${v} properties`;
    case "bank":
      return `Bank $${Number(v).toLocaleString()}`;
    case "networth":
      return `Networth $${Number(v).toLocaleString()}`;
    case "interest":
      return `Earn $${v} interest`;
    case "gym":
      return `Train ${v} times`;
    case "attacksWon":
      return `Win ${v} NPC attacks`;
    case "jailed":
      return `Get jailed ${v} times`;
    case "hospital":
      return `Lose ${v} NPC attacks`;
    case "level":
      return `Reach level ${v}`;
    case "peakHeat":
      return `Hit heat ${v}+`;
    case "rankIndex":
      return `Reach rank index ${v}+`;
    case "contactsAll":
      return "Use every contact once";
    case "contactUses":
      return `Use contacts ${v} times`;
    case "tips":
      return `Buy ${v} tips`;
    case "missions":
      return `Complete ${v} missions`;
    case "distCrime":
      return `Visit ${v} and succeed 20 crimes`;
    case "legitimacy":
      return `Reach legitimacy ${v}`;
    case "respect":
      return `Reach respect ${v}`;
    case "chain":
      return `Reach crime chain ${v}`;
    case "cleanEarned":
      return `Hold $${Number(v).toLocaleString()} clean/bank`;
    case "streetEarned":
      return `Hold $${Number(v).toLocaleString()} street`;
    case "hybrid":
      return `Study while holding ${v}+ crime wins`;
    case "safehouse":
      return "Upgrade any safehouse room";
    case "item":
      return `Own ${v}`;
    case "shopBuys":
      return "Buy / bank / gig enough times";
    default:
      return "Hidden";
  }
}
