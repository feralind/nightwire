import { AWARDS, getAward } from "@/content/catalog";
import type { GameState } from "@/game/state";
import type { AwardDef } from "@/game/types";
import { densityAwardConditionMet, densityAwardHint } from "@/game/densityAwards";

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
      return s.lifetime.districtsVisited.length >= 8;
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
    case "wide_rolodex":
      return Object.values(s.contacts).filter((c) => c.uses > 0).length >= 6;
    case "ten_grand_glow":
      return networth(s) >= 10000 || s.lifetime.peakNetworth >= 10000;
    case "first_fail":
      return crimeAttempts(s) >= 1 && crimeWins(s) < crimeAttempts(s);
    case "dock_cert":
      return s.completedCourses.includes("hl1");
    case "med_wing":
      return s.completedCourses.includes("mc1");
    case "pins_licensed":
      return s.completedCourses.includes("le1");
    case "interest_drip":
      return s.lifetime.interestEarned >= 50;
    case "first_board":
      return (s.lifetime.heistsCompleted ?? 0) >= 1;
    case "board_collector":
      return (s.lifetime.heistsCompleted ?? 0) >= 3;
    case "petty_fifty":
      return (s.mastery.petty?.attempts ?? 0) >= 50;
    case "street_twenty":
      return (s.mastery.street?.attempts ?? 0) >= 20;
    case "heavy_five":
      return (s.mastery.heavy?.attempts ?? 0) >= 5 && (s.mastery.heavy?.cash ?? 0) > 0;
    case "crime_century":
      return crimeAttempts(s) >= 100;
    case "board_five":
      return (s.lifetime.heistsCompleted ?? 0) >= 5;
    case "shift_fifty":
      return s.lifetime.shiftsWorked >= 50;
    case "gig_twenty":
      return s.lifetime.gigsDone >= 20;
    case "promote_three":
      return s.lifetime.promotions >= 3;
    case "campus_five":
      return s.completedCourses.length >= 5;
    case "systems_cert":
      return s.completedCourses.includes("sy1");
    case "fence_grad":
      return s.completedCourses.includes("se5");
    case "property_four":
      return s.ownedProperties.length >= 4;
    case "bank_25k":
      return s.bank >= 25000 || s.lifetime.peakBank >= 25000;
    case "networth_50k":
      return networth(s) >= 50000 || s.lifetime.peakNetworth >= 50000;
    case "interest_500":
      return s.lifetime.interestEarned >= 500;
    case "gym_fifty":
      return s.lifetime.gymSessions >= 50;
    case "attack_ten":
      return s.lifetime.attacksWon >= 10;
    case "hospital_grad":
      return s.lifetime.attacksLost >= 1;
    case "level_ten":
      return s.level >= 10;
    case "heat_100":
      return s.lifetime.peakHeat >= 100;
    case "contact_twelve":
      return Object.values(s.contacts).filter((c) => c.uses > 0).length >= 12;
    case "favor_ten":
      return s.lifetime.contactUses >= 10;
    case "tip_five":
      return s.lifetime.tipsBought >= 5;
    default: {
      const dens = densityAwardConditionMet(id, s);
      return dens === null ? false : dens;
    }
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
      return "Visit all 8 districts";
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
    case "wide_rolodex":
      return "Use 6 different contacts";
    case "ten_grand_glow":
      return "Networth $10,000";
    case "first_fail":
      return "Fail a crime attempt";
    case "dock_cert":
      return "Finish Dock Safety";
    case "med_wing":
      return "Finish First Aid (mc1)";
    case "pins_licensed":
      return "Finish Legal Locksmith (le1)";
    case "interest_drip":
      return "Earn $50 bank interest";
    case "first_board":
      return "Complete an organized heist";
    case "board_collector":
      return "Complete 3 organized heists";
    case "petty_fifty":
      return "Attempt 50 petty crimes";
    case "street_twenty":
      return "Attempt 20 street crimes";
    case "heavy_five":
      return "Succeed at 5 heavy scores";
    case "crime_century":
      return "Attempt 100 crimes";
    case "board_five":
      return "Complete 5 organized heists";
    case "shift_fifty":
      return "Work 50 shifts";
    case "gig_twenty":
      return "Complete 20 gigs";
    case "promote_three":
      return "Earn 3 promotions";
    case "campus_five":
      return "Complete 5 courses";
    case "systems_cert":
      return "Finish Radio Discipline (sy1)";
    case "fence_grad":
      return "Finish Fence Networks (se5)";
    case "property_four":
      return "Own 4 properties";
    case "bank_25k":
      return "Bank balance $25,000";
    case "networth_50k":
      return "Networth $50,000";
    case "interest_500":
      return "Earn $500 bank interest";
    case "gym_fifty":
      return "Train at the gym 50 times";
    case "attack_ten":
      return "Win 10 NPC attacks";
    case "hospital_grad":
      return "Lose an NPC attack";
    case "level_ten":
      return "Reach level 10";
    case "heat_100":
      return "Hit heat 100+";
    case "contact_twelve":
      return "Use 12 different contacts";
    case "favor_ten":
      return "Use contacts 10 times";
    case "tip_five":
      return "Buy 5 tips";
    default:
      return densityAwardHint(id) ?? "Hidden";
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
