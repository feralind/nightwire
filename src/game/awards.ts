import { AWARDS, getAward } from "@/content/catalog";
import type { GameState } from "@/game/state";
import type { AwardDef } from "@/game/types";

export type AwardProgress = {
  award: AwardDef;
  unlocked: boolean;
  unlockedAt: number | null;
  hint: string;
};

function networth(s: GameState): number {
  return s.clean + s.street + s.bank;
}

function crimeAttempts(s: GameState): number {
  return s.lifetime.crimesAttempted;
}

function crimeWins(s: GameState): number {
  return s.lifetime.crimesSucceeded;
}

/** Whether the award condition is currently met (idempotent). */
export function awardConditionMet(id: string, s: GameState): boolean {
  switch (id) {
    case "neon_scratch":
      return crimeWins(s) >= 1;
    case "corner_habit":
      return (s.mastery.petty?.attempts ?? 0) >= 5 && (s.mastery.petty?.cash ?? 0) > 0;
    case "alley_ledger":
      return (s.mastery.street?.attempts ?? 0) >= 5;
    case "heavy_breath":
      return (s.mastery.heavy?.attempts ?? 0) >= 1 && (s.mastery.heavy?.cash ?? 0) > 0;
    case "punch_card":
      return s.lifetime.shiftsWorked >= 1;
    case "side_hustle":
      return s.lifetime.gigsDone >= 1;
    case "gig_circuit":
      return s.lifetime.gigsDone >= 8;
    case "steady_hands":
      return s.lifetime.shiftsWorked >= 10;
    case "name_on_roster":
      return s.lifetime.promotions >= 1;
    case "campus_ghost":
      return s.completedCourses.length >= 1;
    case "ledger_clean":
      return s.completedCourses.includes("cf1");
    case "keys_on_hook":
      return s.ownedProperties.length >= 1;
    case "rent_collector":
      return s.ownedProperties.length >= 2;
    case "night_deposit":
      return s.lifetime.bankDeposits >= 1;
    case "nest_under_glass":
      return s.bank >= 5000 || s.lifetime.peakBank >= 5000;
    case "iron_hours":
      return s.lifetime.gymSessions >= 10;
    case "three_rails":
      return s.lifetime.districtsVisited.length >= 3;
    case "six_rails":
      return s.lifetime.districtsVisited.length >= 6;
    case "alley_mark":
      return s.lifetime.attacksWon >= 1;
    case "holding_cell_grad":
      return s.lifetime.timesJailed >= 1;
    case "wire_climber":
      return s.level >= 5;
    case "too_loud":
      return s.lifetime.peakHeat >= 80;
    case "vex_noticed":
      return Boolean(s.rivalFlags.c10);
    case "first_favor":
      return s.lifetime.contactUses >= 1;
    case "tip_bought":
      return s.lifetime.tipsBought >= 1;
    case "ten_grand_glow":
      return networth(s) >= 10000 || s.lifetime.peakNetworth >= 10000;
    case "first_fail":
      return crimeAttempts(s) >= 1 && crimeWins(s) < crimeAttempts(s);
    case "dock_cert":
      return s.completedCourses.includes("hl1");
    case "interest_drip":
      return s.lifetime.interestEarned >= 50;
    case "first_board":
      return (s.lifetime.heistsCompleted ?? 0) >= 1;
    case "board_collector":
      return (s.lifetime.heistsCompleted ?? 0) >= 3;
    default:
      return false;
  }
}

export function awardHint(id: string): string {
  switch (id) {
    case "neon_scratch":
      return "Succeed at any crime";
    case "corner_habit":
      return "Attempt 5 petty jobs";
    case "alley_ledger":
      return "Attempt 5 street jobs";
    case "heavy_breath":
      return "Succeed at a heavy score";
    case "punch_card":
      return "Work one job shift";
    case "side_hustle":
      return "Complete one short gig";
    case "gig_circuit":
      return "Complete 8 gigs";
    case "steady_hands":
      return "Work 10 shifts";
    case "name_on_roster":
      return "Earn a job promotion";
    case "campus_ghost":
      return "Complete any course";
    case "ledger_clean":
      return "Finish Bookkeeping (cf1)";
    case "keys_on_hook":
      return "Buy a property";
    case "rent_collector":
      return "Own 2 properties";
    case "night_deposit":
      return "Deposit at the bank";
    case "nest_under_glass":
      return "Bank balance $5,000";
    case "iron_hours":
      return "Train at the gym 10 times";
    case "three_rails":
      return "Visit 3 districts";
    case "six_rails":
      return "Visit all 6 districts";
    case "alley_mark":
      return "Win an NPC attack";
    case "holding_cell_grad":
      return "Survive a jail stay";
    case "wire_climber":
      return "Reach level 5";
    case "too_loud":
      return "Hit heat 80+";
    case "vex_noticed":
      return "Draw Vex’s attention (10 crimes)";
    case "first_favor":
      return "Use any contact action";
    case "tip_bought":
      return "Buy a tip or spend a favor marker";
    case "ten_grand_glow":
      return "Networth $10,000";
    case "first_fail":
      return "Fail a crime attempt";
    case "dock_cert":
      return "Finish Dock Safety";
    case "interest_drip":
      return "Earn $50 bank interest";
    case "first_board":
      return "Complete an organized heist";
    case "board_collector":
      return "Complete 3 organized heists";
    default:
      return "Hidden";
  }
}

export function evaluateAwards(s: GameState, now = Date.now()): { state: GameState; unlocked: AwardDef[] } {
  const unlocked: AwardDef[] = [];
  const map = { ...(s.unlockedAwards ?? {}) };
  for (const award of AWARDS) {
    if (map[award.id]) continue;
    if (!awardConditionMet(award.id, s)) continue;
    map[award.id] = now;
    unlocked.push(award);
  }
  if (!unlocked.length) return { state: s, unlocked };
  return { state: { ...s, unlockedAwards: map }, unlocked };
}

export function awardProgressList(s: GameState): AwardProgress[] {
  return AWARDS.map((award) => ({
    award,
    unlocked: Boolean(s.unlockedAwards?.[award.id]),
    unlockedAt: s.unlockedAwards?.[award.id] ?? null,
    hint: awardHint(award.id),
  }));
}

export function awardsCompletePct(s: GameState): number {
  if (!AWARDS.length) return 0;
  const n = Object.keys(s.unlockedAwards ?? {}).filter((id) => getAward(id)).length;
  return Math.round((n / AWARDS.length) * 100);
}
