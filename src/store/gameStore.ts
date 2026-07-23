"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  COURSES,
  CRIMES,
  DISTRICTS,
  HEADLINES,
  ITEMS,
  JOBS,
  NPCS,
  RANK_TITLES,
  getCourse,
  getCrime,
  getDistrict,
  getGig,
  getItem,
  getJob,
  getNpc,
  getProperty,
} from "@/content/catalog";
import {
  applyWound,
  canDoLeisure,
  cotRestHappyGain,
  cotRestStressRelief,
  easeWounds,
  getLeisure,
  gymOvertrainStressGain,
  normalizeWounds,
  rollCrimeFailWound,
  woundArmHitPenalty,
  woundCrimeOddsPenalty,
  woundLegMovePenalty,
  type LeisureId,
} from "@/game/body";
import {
  applySoftCap,
  armorSoakAmount,
  attackDamage,
  attackHitChance,
  bailCost,
  clamp,
  computeCrimeOdds,
  expectedValue,
  formatMoney,
  happyCrimeOddsPenalty,
  happyJobQualityPenalty,
  heatCritFailBonus,
  medicalCost,
  softCap,
  stressOddsPenalty,
  xpToLevel,
} from "@/game/formulas";
import {
  applyHospitalDuration,
  canApplyJob,
  canEnrollCourse,
  canPromote,
  educationOddsMod,
  jobSpecialtyOddsMod,
  nextRankJob,
} from "@/game/careers";
import { evaluateAwards } from "@/game/awards";
import { refreshBazaarState, sellPrice } from "@/game/bazaar";
import {
  applyContactAction,
  applyMentorReply,
  contactActionBypassesBlock,
  contactTipOddsBonus,
  type MentorReplyId,
} from "@/game/contacts";
import { canDoGig, computeGigPay } from "@/game/gigs";
import { licenseJobPayBonus } from "@/game/licenses";
import { masteryOddsBonus, masteryTitleFor } from "@/game/mastery";
import {
  canBuyBusiness,
  canBuyPolitical,
  canHireBusinessStaff,
  laundryFeeRate,
  nextBusinessTier,
  nextPoliticalRung,
  ownedPolitical,
  politicalBailMult,
  politicalCounterplayDiscount,
  politicalHeatCritRelief,
  respectFlexPay,
  respectLootMult,
  respectStreetOddsBonus,
  respectTitle,
  RESPECT_FLEX,
  BUSINESS_STAFF_HIRE_CLEAN,
  BUSINESS_STAFF_MAX,
  territoryInvestCost,
  territoryOddsBonus,
} from "@/game/power";
import { canBuyProperty } from "@/game/properties";
import {
  armoryCraftCost,
  armoryToolModBonus,
  canAddInventoryStack,
  canUpgradeRoom,
  craftRecipeReasons,
  garageRepairCost,
  garageRepairReasons,
  garageTravelMult,
  nextUpgradeCost,
  normalizeSafehouseRooms,
  stashCapacity,
} from "@/game/safehouse";
import { applyCallRitual, applyRitualCashBonus, ensureDailyRitual } from "@/game/ritual";
import { maybeApplyRivalEvents } from "@/game/rival";
import { pickWeighted, rollD10000, unit01 } from "@/game/rng";
import { planStreetShopBuy } from "@/game/shops";
import { applyExecuteChoice, applyPrepStage } from "@/game/heists";
import { pickCrimeResultLine, pickHeistResultLine, syncTimeline } from "@/game/lore";
import { createInitialState, normalizeState as normalizeStateRaw, type AwayModalState, type GameState, type ResultModalState } from "@/game/state";
import { applyCatchUp } from "@/game/tick";
import { ARMORY_RECIPES, getSafehouseRoom } from "@/content/safehouse";
import type { AwardDef, ContactActionId, DistrictId, HeistExecuteChoice, SafehouseRoomId } from "@/game/types";

function normalizeState(s: GameState): GameState {
  return syncTimeline(normalizeStateRaw(s));
}

function actionBlocked(s: GameState, now = Date.now()): boolean {
  if (s.hospitalUntil && now < s.hospitalUntil) return true;
  if (s.jailUntil && now < s.jailUntil) return true;
  if (s.travelUntil && now < s.travelUntil) return true;
  if (s.laylowUntil && now < s.laylowUntil) return true;
  return false;
}

type UIState = {
  resultModal: ResultModalState;
  awayModal: AwayModalState;
  awardModal: { name: string; blurb: string }[] | null;
  clock: number;
};

type Actions = {
  createCharacter: (name: string, district: DistrictId, background: string) => void;
  tick: () => void;
  dismissResult: () => void;
  dismissAway: () => void;
  dismissAwards: () => void;
  attemptCrime: (crimeId: string) => void;
  workShift: () => void;
  doGig: (gigId: string) => void;
  applyJob: (jobId: string) => void;
  promoteJob: () => void;
  quitJob: () => void;
  train: (track: "bulk" | "tech" | "speed" | "tank") => void;
  enrollCourse: (courseId: string, useStreet?: boolean) => void;
  dropCourse: () => void;
  travelTo: (district: DistrictId) => void;
  payMedical: () => void;
  payBail: () => void;
  attackNpc: (npcId: string) => void;
  bankDeposit: (amount: number, from: "clean" | "street") => void;
  bankWithdraw: (amount: number) => void;
  cleanMoney: (amount: number) => void;
  buyItem: (itemId: string, withStreet?: boolean) => void;
  useItem: (itemId: string) => void;
  equipItem: (itemId: string) => void;
  buyProperty: (propertyId: string) => void;
  upgradeSafehouseRoom: (roomId: SafehouseRoomId) => void;
  craftArmoryTool: (itemId: string) => void;
  garageRepair: () => void;
  doLeisure: (id: LeisureId) => void;
  interactContact: (contactId: string, actionId: ContactActionId) => void;
  replyMentor: (choice: MentorReplyId) => void;
  investigationCounterplay: (kind: "lawyer" | "burn" | "laylow" | "bribe" | "leave") => void;
  refreshBazaar: () => void;
  bazaarBuy: (listingIndex: number) => void;
  bazaarSell: (itemId: string) => void;
  generateRitual: () => void;
  advanceRitual: (kind: string) => void;
  callRitual: () => void;
  investTerritory: (district: DistrictId) => void;
  buyPoliticalRung: () => void;
  buyRespectFlex: (flexId: string, useStreet?: boolean) => void;
  buyBusinessTier: () => void;
  setBusinessRisk: (risk: 0 | 1) => void;
  hireBusinessStaff: () => void;
  runHeistPrep: (heistId: string) => void;
  executeHeist: (heistId: string, choice: HeistExecuteChoice) => void;
  exportSave: () => string;
  importSave: (json: string) => void;
  resetSave: () => void;
  setDensity: (d: "classic" | "comfortable") => void;
  getCrimeOddsView: (crimeId: string) => {
    locked: boolean;
    reasons: { label: string; href?: string }[];
    odds: number;
    ev: number;
    modifiers: { label: string; value: number }[];
  };
};

function pushLog(s: GameState, text: string, kind: "system" | "diegetic" | "result" = "system"): GameState {
  const id = s.logSeq + 1;
  const entry = { id, ts: Date.now(), text, kind };
  return { ...s, logSeq: id, logs: [entry, ...s.logs].slice(0, 200) };
}

function withPeaks(s: GameState): GameState {
  const net = s.clean + s.street + s.bank;
  return {
    ...s,
    lifetime: {
      ...s.lifetime,
      peakHeat: Math.max(s.lifetime.peakHeat, s.heat),
      peakBank: Math.max(s.lifetime.peakBank, s.bank),
      peakNetworth: Math.max(s.lifetime.peakNetworth, net),
    },
  };
}

function applyAwardPass(s: GameState): { state: GameState; unlocked: AwardDef[] } {
  const { state, unlocked } = evaluateAwards(withPeaks(s));
  if (!unlocked.length) return { state, unlocked };
  let next = state;
  for (const a of unlocked) {
    next = pushLog(next, `Award unlocked: ${a.name}`, "diegetic");
  }
  return { state: next, unlocked };
}

function awardModalPayload(unlocked: AwardDef[]) {
  return unlocked.map((a) => ({ name: a.name, blurb: a.blurb }));
}

function addXp(s: GameState, xp: number): GameState {
  let next = { ...s, xp: s.xp + xp };
  while (next.xp >= xpToLevel(next.level)) {
    next.xp -= xpToLevel(next.level);
    next.level += 1;
    next.energyMax = Math.min(150, 100 + next.level * 2);
    next.nerveMax = 10 + Math.floor(next.level / 5) * 1;
    next.energy = next.energyMax;
    next.nerve = next.nerveMax;
    next = pushLog(next, `Level up → ${next.level}`, "diegetic");
  }
  const score = next.level * 10 + Math.log10(next.clean + next.street + next.bank + 1) * 20 + (next.str + next.def + next.spd + next.dex) / 10;
  next.rankIndex = clamp(Math.floor(score / 25), 0, RANK_TITLES.length - 1);
  return next;
}

function equippedToolMod(s: GameState): number {
  let mod = 0;
  for (const slot of s.inventory.filter((i) => i.equipped)) {
    const item = getItem(slot.itemId);
    if (item?.toolMod) mod += item.toolMod;
  }
  mod += armoryToolModBonus(normalizeSafehouseRooms(s.safehouseRooms));
  return mod;
}

function hasItem(s: GameState, itemId: string): boolean {
  return s.inventory.some((i) => i.itemId === itemId && i.qty > 0);
}

function addItem(s: GameState, itemId: string, qty = 1): GameState {
  const rooms = normalizeSafehouseRooms(s.safehouseRooms);
  const inv = [...s.inventory];
  const idx = inv.findIndex((i) => i.itemId === itemId);
  if (idx >= 0) {
    inv[idx] = { ...inv[idx], qty: inv[idx].qty + qty };
  } else {
    if (!canAddInventoryStack(rooms, inv.length, false)) return s;
    inv.push({ itemId, qty });
  }
  return { ...s, inventory: inv, safehouseRooms: rooms };
}

function removeItem(s: GameState, itemId: string, qty = 1): GameState {
  const inv = s.inventory
    .map((i) => (i.itemId === itemId ? { ...i, qty: i.qty - qty } : i))
    .filter((i) => i.qty > 0);
  return { ...s, inventory: inv };
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function rolloverWeek(s: GameState, now = Date.now()): GameState {
  if (now - s.weekStart < WEEK_MS) return s;
  return { ...s, weekStart: now, shiftsThisWeek: 0, gigsThisWeek: 0 };
}

function loadoutMods(s: GameState): { weaponDmg: number; armorSoak: number; stealth: number } {
  let weaponDmg = 0;
  let armorSoak = 0;
  let stealth = 0;
  for (const slot of s.inventory.filter((i) => i.equipped)) {
    const item = getItem(slot.itemId);
    if (!item) continue;
    if (item.kind === "weapon") {
      if (item.id === "bat") weaponDmg += 5;
      else if (item.id === "knife") weaponDmg += 3;
      else weaponDmg += 2;
    }
    if (item.kind === "armor") armorSoak += item.id === "vest" ? 8 : 4;
    if (item.id === "gloves" || item.id === "shim_kit") stealth += 2;
    if (item.id === "radio") stealth += 1;
  }
  return { weaponDmg, armorSoak, stealth };
}

function updateIdentity(s: GameState): GameState {
  const rank = RANK_TITLES[s.rankIndex] ?? "Nobody";
  const job = s.jobId ? getJob(s.jobId)?.title ?? "Unemployed" : "Unemployed";
  const edu = s.licenses.length ? "Licensee" : s.completedCourses.length ? "Student" : "Street";
  const best = Object.entries(s.mastery).sort((a, b) => b[1].level - a[1].level)[0];
  const masteryTitle = best ? masteryTitleFor(best[0], best[1].level) ?? "" : "";
  const streetCred = respectTitle(s.power.respect);
  const civic = ownedPolitical(s.power.politicalRung)?.title;
  const lead = streetCred || civic || masteryTitle || edu;
  const subtitle = [lead, job, rank].filter(Boolean).join(" · ");
  return { ...s, identitySubtitle: subtitle };
}

/** Advance daily ritual progress when the action kind matches */
function bumpRitual(s: GameState, kind: string, amount = 1): GameState {
  if (!s.ritual || s.ritual.rewardClaimed) return s;
  if (s.ritual.kind !== kind) return s;
  return {
    ...s,
    ritual: {
      ...s.ritual,
      current: Math.min(s.ritual.target, s.ritual.current + amount),
    },
  };
}

function bumpMastery(s: GameState, family: string, cash: number, success: boolean): GameState {
  const m = { ...(s.mastery[family] ?? { attempts: 0, cash: 0, level: 0, streak: 0 }) };
  m.attempts += 1;
  m.cash += Math.max(0, cash);
  m.streak = success ? m.streak + 1 : 0;
  let level = 0;
  if (m.attempts >= 10) level = 1;
  if (m.attempts >= 25) level = 2;
  if (m.attempts >= 50 && m.streak >= 5) level = 3;
  if (m.attempts >= 100 && m.cash >= 10000) level = 4;
  if (m.attempts >= 200 && m.cash >= 50000) level = 5;
  m.level = Math.max(m.level, level);
  return updateIdentity({ ...s, mastery: { ...s.mastery, [family]: m } });
}

function maybeRival(s: GameState): GameState {
  return maybeApplyRivalEvents(s, pushLog);
}

function ensureBazaar(s: GameState): GameState {
  return refreshBazaarState(s);
}

function ensureRitual(s: GameState): GameState {
  return ensureDailyRitual(s);
}

export const useGame = create<GameState & UIState & Actions>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      resultModal: null,
      awayModal: null,
      awardModal: null,
      clock: Date.now(),

      createCharacter: (name, district, background) => {
        let s = createInitialState({
          created: true,
          name: name.trim() || "Operator",
          district,
          identitySubtitle: `${background} · Fresh`,
          clean: background === "Dock family" ? 300 : background === "Clerk parents" ? 800 : 500,
          street: background === "Street kid" ? 150 : 0,
        });
        if (background === "Street kid") s = addItem(s, "crowbar");
        if (background === "Pre-med dropout") s = addItem(s, "street_meds", 2);
        s = pushLog(s, `Welcome to Nightwire City, ${s.name}.`, "diegetic");
        s = pushLog(s, "Mentor: Start small. Petty work. Keep your head.", "diegetic");
        s = ensureRitual(s);
        s = ensureBazaar(s);
        s = syncTimeline(s);
        set({ ...s, resultModal: null, awayModal: null, awardModal: null });
      },

      tick: () => {
        const prev = normalizeState(get());
        const now = Date.now();
        if (!prev.created) return;

        const { state, awaySummary } = applyCatchUp(prev, now);
        // Ritual first; bazaar after director so mid-day events can reprice
        let s = ensureRitual(state);
        const directorBeforeId = s.directorEvent?.id ?? null;
        if (!s.directorEvent && unit01(s.seed, "director", Math.floor(now / 600000)) < 0.02) {
          const events = [
            { id: "outage", label: "Power outage in Glassrow" },
            { id: "strike", label: "Harbor strike in DocksReach" },
            { id: "festival", label: "Festival crowds in Glassrow" },
            { id: "sweep", label: "Police sweep" },
          ];
          const ev = events[Math.floor(now / 600000) % events.length];
          s = {
            ...pushLog(s, `Director: ${ev.label}`, "system"),
            directorEvent: { ...ev, until: now + 30 * 60 * 1000 },
          };
        }
        if (s.directorEvent && now > s.directorEvent.until) {
          s = { ...s, directorEvent: null };
        }
        const directorChanged = directorBeforeId !== (s.directorEvent?.id ?? null);
        s = refreshBazaarState(s, directorChanged);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;

        const dailyMutated =
          s.ritualDay !== prev.ritualDay ||
          s.bazaar.day !== prev.bazaar.day ||
          JSON.stringify(s.ritual) !== JSON.stringify(prev.ritual) ||
          JSON.stringify(s.ritualBonus) !== JSON.stringify(prev.ritualBonus) ||
          JSON.stringify(s.bazaar.listings) !== JSON.stringify(prev.bazaar.listings);

        const meaningful =
          Boolean(awaySummary) ||
          awardPass.unlocked.length > 0 ||
          s.energy !== prev.energy ||
          s.nerve !== prev.nerve ||
          s.life !== prev.life ||
          s.happy !== prev.happy ||
          Math.floor(s.heat) !== Math.floor(prev.heat) ||
          s.bank !== prev.bank ||
          s.clean !== prev.clean ||
          s.street !== prev.street ||
          s.hospitalUntil !== prev.hospitalUntil ||
          s.jailUntil !== prev.jailUntil ||
          s.travelUntil !== prev.travelUntil ||
          s.laylowUntil !== prev.laylowUntil ||
          s.investigation !== prev.investigation ||
          s.courseProgressHours !== prev.courseProgressHours ||
          s.activeCourseId !== prev.activeCourseId ||
          s.district !== prev.district ||
          s.directorEvent?.id !== prev.directorEvent?.id ||
          s.wounds.arm !== prev.wounds.arm ||
          s.wounds.leg !== prev.wounds.leg ||
          Math.floor(s.stress) !== Math.floor(prev.stress) ||
          s.leisureUntil !== prev.leisureUntil ||
          dailyMutated;

        if (meaningful) {
          set({
            ...s,
            clock: now,
            awardModal: awardPass.unlocked.length
              ? awardModalPayload(awardPass.unlocked)
              : get().awardModal,
            awayModal: awaySummary
              ? {
                  hours: awaySummary.hours,
                  legal: awaySummary.legal,
                  street: awaySummary.street,
                  city: awaySummary.city,
                  progress: awaySummary.progress,
                }
              : get().awayModal,
          });
        } else {
          // Quiet tick — only advance lastTickAt so catch-up stays accurate
          set({ lastTickAt: s.lastTickAt });
        }
      },

      dismissResult: () => set({ resultModal: null }),
      dismissAway: () => set({ awayModal: null }),
      dismissAwards: () => set({ awardModal: null }),

      getCrimeOddsView: (crimeId) => {
        const s = get();
        const crime = getCrime(crimeId);
        if (!crime) return { locked: true, reasons: [{ label: "Unknown crime" }], odds: 0, ev: 0, modifiers: [] };
        const reasons: { label: string; href?: string }[] = [];
        if (crime.requiresLevel && s.level < crime.requiresLevel) {
          reasons.push({ label: `Level ${crime.requiresLevel}`, href: "/profile" });
        }
        if (crime.requiresCourse && !s.completedCourses.includes(crime.requiresCourse)) {
          // street crimes with course: still attemptable but note bonus — warehouse/pharmacy locked until course per V0? Plan: 2 default unlocked, 2 require course. So locked.
          reasons.push({ label: `Course ${getCourse(crime.requiresCourse)?.name ?? crime.requiresCourse}`, href: "/education" });
        }
        if (crime.requiresTool && !hasItem(s, crime.requiresTool)) {
          reasons.push({ label: `Need ${getItem(crime.requiresTool)?.name ?? crime.requiresTool}`, href: "/shops" });
        }
        // Default unlocked street: mug, car_breakin (car needs tool). warehouse/pharmacy need course.
        const hour = new Date().getHours();
        const hourMod = hour >= 20 || hour < 5 ? 3 : -1;
        const district = getDistrict(s.district);
        const districtMod = district?.crimeBias[crime.tier] ?? 0;
        const eduMod = educationOddsMod(s.completedCourses, crime.family, s.licenses);
        const jobMod = jobSpecialtyOddsMod(s.jobId, crime.id);
        const masteryBonus = 0; // odds edge applied below as % — not skill points
        const chainMod =
          s.chainFamily === crime.family ? Math.min(10, s.chainLevel * 0.5) : 0;
        const heatPenalty = s.heat * 0.15;
        const stressPenalty = stressOddsPenalty(s.stress) + happyCrimeOddsPenalty(s.happy);
        const tipBonus = contactTipOddsBonus(s.contactTips ?? [], crime);
        const { odds, modifiers } = computeCrimeOdds({
          dex: s.dex,
          spd: s.spd,
          str: s.str,
          def: s.def,
          level: s.level,
          toolMod: equippedToolMod(s) + masteryBonus,
          eduMod: eduMod + jobMod,
          districtMod: districtMod / 5,
          hourMod,
          chainMod,
          heatPenalty,
          stressPenalty: stressPenalty / 5,
          difficulty: crime.difficulty,
        });
        const territory = s.power.territory[s.district] ?? 0;
        const terrOdds = territoryOddsBonus(territory);
        const tipOdds = tipBonus * 0.01;
        const mastOdds = masteryOddsBonus(s.mastery[crime.family]?.level ?? 0);
        const respOdds =
          crime.family === "street" ? respectStreetOddsBonus(s.power.respect) : 0;
        const woundPts = woundCrimeOddsPenalty(s.wounds);
        const woundOdds = woundPts * 0.01;
        const finalOdds = clamp(odds + terrOdds + tipOdds + mastOdds + respOdds - woundOdds, 0.05, 0.9);
        const tipMods = [
          ...modifiers,
          ...(terrOdds > 0
            ? [{ label: `Territory ${Math.floor(territory)}%`, value: terrOdds * 100 }]
            : []),
          ...(tipBonus > 0 ? [{ label: "Contact tip", value: tipBonus }] : []),
          ...(mastOdds > 0 ? [{ label: "Mastery 5", value: mastOdds * 100 }] : []),
          ...(respOdds > 0 ? [{ label: "Street respect", value: respOdds * 100 }] : []),
          ...(woundPts > 0 ? [{ label: "Wounds", value: -woundPts }] : []),
        ];
        return {
          locked: reasons.length > 0,
          reasons,
          odds: finalOdds,
          ev: expectedValue(finalOdds, crime.cashMin, crime.cashMax, crime.nerve),
          modifiers: tipMods,
        };
      },

      attemptCrime: (crimeId) => {
        const cur = get();
        let s: GameState = { ...cur };
        if (!s.created) return;
        if (actionBlocked(s)) return;
        const crime = getCrime(crimeId);
        if (!crime) return;
        const view = get().getCrimeOddsView(crimeId);
        if (view.locked) return;
        if (s.nerve < crime.nerve) return;

        s = { ...s, nerve: s.nerve - crime.nerve, actionIndex: s.actionIndex + 1, lastCrimeId: crimeId };
        s.lifetime = {
          ...s.lifetime,
          crimesAttempted: s.lifetime.crimesAttempted + 1,
        };
        // heat while enrolled
        const heatMult = s.activeCourseId ? 1.25 : 1;
        const actionKey = `crime:${crimeId}`;
        const r = rollD10000(s.seed, actionKey, s.actionIndex);
        const successThreshold = Math.floor(view.odds * 10000);
        const failMass = 10000 - successThreshold;
        const heatCrit = Math.max(
          0,
          heatCritFailBonus(s.heat) - politicalHeatCritRelief(s.power.politicalRung)
        );
        const critFailExtra = Math.floor(failMass * heatCrit);

        let title: NonNullable<ResultModalState>["title"] = "FAILED";
        let cash = 0;
        const lines: string[] = [];
        let lifeDelta = 0;
        let jailed = false;
        let hospital = false;

        if (r < successThreshold * 0.05) {
          title = "SUCCESS";
          cash = Math.round(crime.cashMax * 1.25 * (1 + Math.min(10, s.chainLevel) * 0.05));
          lines.push(pickCrimeResultLine(crime.family, "SUCCESS", s.seed, crimeId, s.actionIndex));
        } else if (r < successThreshold) {
          title = "SUCCESS";
          cash = Math.round(
            crime.cashMin + unit01(s.seed, `cash:${crimeId}`, s.actionIndex) * (crime.cashMax - crime.cashMin)
          );
          cash = Math.round(cash * (1 + Math.min(10, s.chainLevel) * 0.05));
          lines.push(pickCrimeResultLine(crime.family, "SUCCESS", s.seed, crimeId, s.actionIndex));
        } else if (r < successThreshold + failMass * 0.3) {
          title = "MIXED";
          cash = Math.round(crime.cashMin * 0.4);
          lifeDelta = -Math.ceil(crime.failDamage * 0.4);
          lines.push(pickCrimeResultLine(crime.family, "MIXED", s.seed, crimeId, s.actionIndex));
        } else if (r < 10000 - Math.max(failMass * 0.1, critFailExtra * 0.5)) {
          title = "FAILED";
          lifeDelta = -crime.failDamage;
          lines.push(pickCrimeResultLine(crime.family, "FAILED", s.seed, crimeId, s.actionIndex));
        } else {
          title = "FAILED";
          lifeDelta = -crime.failDamage;
          if (unit01(s.seed, `critfail:${crimeId}`, s.actionIndex) < 0.5) {
            jailed = true;
            title = "JAILED";
            lines.push(pickCrimeResultLine(crime.family, "JAILED", s.seed, crimeId, s.actionIndex));
          } else {
            hospital = true;
            title = "HOSPITALIZED";
            lines.push(pickCrimeResultLine(crime.family, "HOSPITALIZED", s.seed, crimeId, s.actionIndex));
          }
        }

        if (title === "SUCCESS" || title === "MIXED") {
          if (cash > 0) {
            const before = cash;
            const boosted = applyRitualCashBonus(s, crime.family, cash);
            s = boosted.state;
            cash = boosted.cash;
            if (cash !== before) lines.push(`Ritual bonus → ${formatMoney(cash)}`);
          }
          s.street += cash;
          s = addXp(s, crime.xp + (title === "SUCCESS" ? 0 : -Math.floor(crime.xp / 2)));
          s.heat = Math.min(120, s.heat + crime.heat * heatMult * (1 + s.chainLevel * 0.2));
          s.chainFamily = crime.family;
          s.chainLevel = s.chainFamily === crime.family ? s.chainLevel + 1 : 1;
          s.chainUpdatedAt = Date.now();
          s.happy = Math.min(s.happyMax, s.happy + 2);
          if (title === "SUCCESS") {
            s.lifetime = { ...s.lifetime, crimesSucceeded: s.lifetime.crimesSucceeded + 1 };
          }
          s = bumpMastery(s, crime.family, cash, title === "SUCCESS");
          s = bumpRitual(s, crime.family);
        } else {
          s.heat = Math.min(120, s.heat + crime.heat * heatMult);
          s.stress = Math.min(100, s.stress + 10);
          s.happy = Math.max(0, s.happy - 5);
          s.chainLevel = 0;
          s.chainFamily = null;
          s = bumpMastery(s, crime.family, 0, false);
        }

        s.life = clamp(s.life + lifeDelta, 0, s.lifeMax);
        if (s.life <= 0 || hospital) {
          const baseMs = Math.max(10, crime.failDamage) * 60 * 1000;
          s.hospitalUntil = Date.now() + applyHospitalDuration(baseMs, s.completedCourses, s.licenses);
          s.life = Math.max(1, s.life);
          s.hospitalReason = `Crime fail: ${crime.name}`;
          title = "HOSPITALIZED";
          hospital = true;
        }
        if (title === "FAILED" || title === "JAILED" || hospital) {
          const wr = unit01(s.seed, `wound:${crimeId}`, s.actionIndex);
          const slot = rollCrimeFailWound(wr, hospital);
          if (slot) {
            s.wounds = applyWound(normalizeWounds(s.wounds), slot, 1);
            lines.push(`Wound: ${slot} — soft debuff until hospital or patch.`);
          }
        }
        if (jailed) {
          s.jailUntil = Date.now() + (4 + Math.floor(s.heat / 20)) * 60 * 60 * 1000;
          s.jailReason = `Caught on ${crime.name}`;
          s.stress = Math.min(100, s.stress + 15);
          s.lifetime = { ...s.lifetime, timesJailed: s.lifetime.timesJailed + 1 };
        }

        // investigation rise
        if (s.heat > 60 && s.investigation < 1) s.investigation = 1;
        if (s.heat > 75 && s.investigation < 2) s.investigation = 2;
        if (s.heat > 90 && s.investigation < 3) {
          s.investigation = 3;
          s.investigationDeadline = Date.now() + 24 * 3600 * 1000;
        }

        lines.push(`${cash >= 0 ? "+" : ""}${formatMoney(cash)} street`);
        if (lifeDelta) lines.push(`Life ${lifeDelta}`);
        lines.push(`Heat +${crime.heat}`);

        s = pushLog(s, `${title}: ${crime.name} (${formatMoney(cash)})`, "result");
        s = maybeRival(s);
        s = updateIdentity(s);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        if (awardPass.unlocked.length) {
          for (const a of awardPass.unlocked) lines.push(`Award: ${a.name}`);
        }

        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title,
            lines,
            cashDelta: cash,
            repeatable: { type: "crime", id: crimeId },
            ritual: {
              seed: s.seed,
              actionKey,
              actionIndex: s.actionIndex,
              roll: r,
              odds: view.odds,
              ev: view.ev,
              modifiers: view.modifiers,
            },
          },
        });
      },

      applyJob: (jobId) => {
        const job = getJob(jobId);
        if (!job) return;
        let s: GameState = { ...get() };
        if (!canApplyJob(job, s)) return;
        s = pushLog({ ...s, jobId, jobXp: 0 }, `Hired as ${job.title}`, "system");
        s = updateIdentity(s);
        set(s);
      },

      promoteJob: () => {
        let s: GameState = { ...get() };
        if (!s.jobId) return;
        const current = getJob(s.jobId);
        if (!current) return;
        const next = nextRankJob(current);
        if (!next || !canPromote(next, s)) return;
        s = {
          ...s,
          jobId: next.id,
          jobXp: 0,
          lifetime: { ...s.lifetime, promotions: s.lifetime.promotions + 1 },
        };
        s = pushLog(s, `Promoted to ${next.title}`, "system");
        s = updateIdentity(s);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title: "SUCCESS",
            lines: [
              `Promoted to ${next.title}`,
              `Base pay now ${formatMoney(next.basePay)}`,
              ...awardPass.unlocked.map((a) => `Award: ${a.name}`),
            ],
            cashDelta: 0,
          },
        });
      },

      quitJob: () => {
        let s: GameState = { ...get() };
        if (!s.jobId) return;
        const title = getJob(s.jobId)?.title ?? "job";
        s = pushLog({ ...s, jobId: null, jobXp: 0 }, `Quit ${title}`, "system");
        s = updateIdentity(s);
        set(s);
      },

      workShift: () => {
        let s: GameState = { ...get() };
        s = rolloverWeek(s);
        if (!s.jobId) return;
        if (actionBlocked(s)) return;
        const job = getJob(s.jobId);
        if (!job) return;
        if (s.energy < job.energy) return;
        if (s.shiftsThisWeek >= 40) return;

        const quality = pickWeighted(s.seed, "shift", s.actionIndex + 1, {
          Poor: 20,
          Standard: 40,
          Good: 25,
          Excellent: 15,
        });
        const mult = { Poor: 0.6, Standard: 1, Good: 1.25, Excellent: 1.6 }[quality];
        const happyPen = 1 - happyJobQualityPenalty(s.happy);
        const districtBonus = job.districtBias.includes(s.district) ? 1.1 : 1;
        const courseBonus = 1 + s.completedCourses.reduce((a, id) => a + ((getCourse(id)?.jobPayBonus ?? 0) / 100), 0);
        const licenseBonus = 1 + licenseJobPayBonus(s.licenses) / 100;
        let pay = Math.round(job.basePay * mult * districtBonus * courseBonus * licenseBonus * happyPen);
        const xpGain = Math.round(10 * mult);

        {
          const boosted = applyRitualCashBonus(s, "job", pay);
          s = boosted.state;
          pay = boosted.cash;
        }

        s = {
          ...s,
          energy: s.energy - job.energy,
          happy: Math.max(0, s.happy - 3),
          shiftsThisWeek: s.shiftsThisWeek + 1,
          actionIndex: s.actionIndex + 1,
          jobXp: s.jobXp + xpGain,
          lastJobId: s.jobId,
          clean: s.clean + pay,
          legitimacy: Math.min(100, s.legitimacy + 0.5),
          lifetime: { ...s.lifetime, shiftsWorked: s.lifetime.shiftsWorked + 1 },
        };
        s = addXp(s, Math.round(8 * mult));

        const lines = [`Shift ${quality}`, `+${formatMoney(pay)} clean`, `Job XP +${xpGain}`];
        let specialLine: string | undefined;
        if (quality === "Excellent" && unit01(s.seed, "special", s.actionIndex) < 0.55) {
          if (job.career === "kitchen") {
            s = addItem(s, "food");
            specialLine = "Leftover kit";
            lines.push("Special: Leftover kit");
          } else if (job.career === "dockhand") {
            s = addItem(s, "crowbar");
            specialLine = "Mislabel tool";
            lines.push("Special: Mislabel tool");
          } else if (job.career === "retail") {
            s.heat = Math.max(0, s.heat - 3);
            specialLine = "Shrinkage cover (−3 heat)";
            lines.push("Special: Shrinkage cover (heat -3)");
          } else {
            const tip = 50 + Math.floor(unit01(s.seed, "tip", s.actionIndex) * 150);
            s.clean += tip;
            specialLine = `Fare tip +$${tip}`;
            lines.push(`Special: Fare tip +$${tip}`);
          }
        }

        const next = nextRankJob(job);
        if (next && canPromote(next, s)) {
          lines.push(`Eligible for promotion → ${next.title}`);
        } else if (next) {
          const need = next.promoteXp ?? 300;
          lines.push(`Promotion ${Math.min(s.jobXp, need)}/${need} XP`);
        }

        s = {
          ...s,
          shiftLog: [{ quality, pay, special: specialLine, at: Date.now() }, ...(s.shiftLog ?? [])].slice(0, 8),
        };

        s = bumpRitual(s, "job");

        s = bumpMastery(s, `career:${job.career}`, pay, true);
        s = pushLog(s, `Shift ${quality}: +${formatMoney(pay)}`, "result");
        s = updateIdentity(s);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        if (awardPass.unlocked.length) {
          for (const a of awardPass.unlocked) lines.push(`Award: ${a.name}`);
        }
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: { title: "SUCCESS", lines, cashDelta: pay, repeatable: { type: "job", id: s.jobId! } },
        });
      },

      doGig: (gigId) => {
        let s: GameState = { ...get() };
        s = rolloverWeek(s);
        const gig = getGig(gigId);
        if (!gig) return;
        if (actionBlocked(s)) return;
        if (!canDoGig(gig, s)) return;

        const quality = pickWeighted(s.seed, "gig", s.actionIndex + 1, {
          Poor: 18,
          Standard: 42,
          Good: 28,
          Excellent: 12,
        }) as "Poor" | "Standard" | "Good" | "Excellent";
        let pay = computeGigPay(gig, {
          quality,
          district: s.district,
          completedCourses: s.completedCourses,
          happy: s.happy,
        });

        {
          const boosted = applyRitualCashBonus(s, "gig", pay);
          s = boosted.state;
          pay = boosted.cash;
        }

        s = {
          ...s,
          energy: s.energy - gig.energy,
          happy: Math.min(s.happyMax, Math.max(0, s.happy - 2 + (gig.happyGain ?? 0))),
          gigsThisWeek: s.gigsThisWeek + 1,
          actionIndex: s.actionIndex + 1,
          lastGigId: gigId,
          clean: s.clean + pay,
          legitimacy: Math.min(100, s.legitimacy + (gig.legitimacyGain ?? 0.3)),
          stress: Math.max(0, s.stress - (gig.happyGain ? 2 : 0)),
          lifetime: { ...s.lifetime, gigsDone: s.lifetime.gigsDone + 1 },
        };
        s = addXp(s, Math.round(5 * ({ Poor: 0.7, Standard: 1, Good: 1.2, Excellent: 1.4 }[quality])));

        const lines = [`Gig ${quality}: ${gig.name}`, `+${formatMoney(pay)} clean`];
        let specialLine: string | undefined;
        if (quality === "Excellent" && gig.special && unit01(s.seed, "gig_special", s.actionIndex) < 0.6) {
          const tip = 30 + Math.floor(unit01(s.seed, "gig_tip", s.actionIndex) * 90);
          s.clean += tip;
          pay += tip;
          specialLine = `${gig.special} +$${tip}`;
          lines.push(`Special: ${specialLine}`);
        }
        if (gig.happyGain) {
          lines.push(`Happy +${gig.happyGain}`);
        }

        s = {
          ...s,
          gigLog: [
            { gigId, quality, pay, special: specialLine, at: Date.now() },
            ...(s.gigLog ?? []),
          ].slice(0, 8),
        };

        s = bumpRitual(s, "gig");

        s = pushLog(s, `Gig ${quality}: ${gig.name} +${formatMoney(pay)}`, "result");
        s = updateIdentity(s);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        if (awardPass.unlocked.length) {
          for (const a of awardPass.unlocked) lines.push(`Award: ${a.name}`);
        }
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title: "SUCCESS",
            lines,
            cashDelta: pay,
            repeatable: { type: "gig", id: gigId },
          },
        });
      },

      train: (track) => {
        let s: GameState = { ...get() };
        if (s.energy < 5) return;
        if (actionBlocked(s)) return;
        const day = new Date().toISOString().slice(0, 10);
        if (s.gymDay !== day) s = { ...s, gymDay: day, gymToday: {} };
        const plans = {
          bulk: { str: 1, def: 0.2, happy: 8, key: "str" },
          tech: { dex: 0.8, spd: 0.3, happy: 6, key: "dex" },
          speed: { spd: 0.9, dex: 0.2, happy: 6, key: "spd" },
          tank: { def: 0.7, str: 0.3, happy: 7, key: "def" },
        } as const;
        const p = plans[track];
        const count = s.gymToday[p.key] ?? 0;
        const dim = count >= 3 ? 0.5 : 1;
        const softBonus = s.completedCourses.reduce((a, id) => a + (getCourse(id)?.softCapBonus ?? 0), 0);
        const cap = softCap(s.level, s.completedCourses.length) + softBonus;
        const trackStat =
          p.key === "str" ? s.str : p.key === "def" ? s.def : p.key === "spd" ? s.spd : s.dex;
        const overCap = trackStat >= cap;
        const overtrainStress = gymOvertrainStressGain(count, overCap);

        s = {
          ...s,
          energy: s.energy - 5,
          happy: Math.max(0, s.happy - p.happy),
          stress: overtrainStress
            ? Math.min(100, s.stress + overtrainStress)
            : Math.max(0, s.stress - 3),
          gymToday: { ...s.gymToday, [p.key]: count + 1 },
          actionIndex: s.actionIndex + 1,
          lifetime: { ...s.lifetime, gymSessions: s.lifetime.gymSessions + 1 },
        };
        if ("str" in p && p.str) s.str += applySoftCap(s.str, cap, p.str * dim);
        if ("def" in p && typeof p.def === "number") s.def += applySoftCap(s.def, cap, (p as { def: number }).def * dim);
        if ("dex" in p && typeof (p as { dex?: number }).dex === "number")
          s.dex += applySoftCap(s.dex, cap, (p as { dex: number }).dex * dim);
        if ("spd" in p && typeof (p as { spd?: number }).spd === "number")
          s.spd += applySoftCap(s.spd, cap, (p as { spd: number }).spd * dim);

        s = pushLog(s, `Gym ${track} complete`, "system");
        s = bumpRitual(s, "gym");
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title: "SUCCESS",
            lines: [
              `Trained ${track}`,
              dim < 1 ? "Diminishing returns" : "Solid session",
              overtrainStress
                ? `Overtrain — stress +${overtrainStress}`
                : "Stress eased a notch",
              ...awardPass.unlocked.map((a) => `Award: ${a.name}`),
            ],
            cashDelta: 0,
          },
        });
      },

      enrollCourse: (courseId, useStreet = false) => {
        let s: GameState = { ...get() };
        const course = getCourse(courseId);
        if (!course) return;
        if (!canEnrollCourse(course, s, useStreet)) return;
        if (useStreet) {
          const cost = Math.round(course.fee * 1.2);
          s.street -= cost;
        } else {
          s.clean -= course.fee;
        }
        s = {
          ...s,
          activeCourseId: courseId,
          courseProgressHours: 0,
        };
        s = pushLog(s, `Enrolled: ${course.name}`, "system");
        set(s);
      },

      dropCourse: () => {
        let s: GameState = { ...get() };
        if (!s.activeCourseId) return;
        const name = getCourse(s.activeCourseId)?.name ?? s.activeCourseId;
        s = {
          ...s,
          activeCourseId: null,
          courseProgressHours: 0,
        };
        s = pushLog(s, `Dropped course: ${name} (fee kept)`, "system");
        set(s);
      },

      travelTo: (district) => {
        let s: GameState = { ...get() };
        if (s.district === district) return;
        // Lay-low may travel (leave-district counterplay); hospital/jail/in-transit may not
        if (s.hospitalUntil && Date.now() < s.hospitalUntil) return;
        if (s.jailUntil && Date.now() < s.jailUntil) return;
        if (s.travelUntil && Date.now() < s.travelUntil) return;
        const d = getDistrict(district);
        if (!d) return;
        if (s.clean < d.travelCost) return;
        if (s.heat >= 81) return;
        s.clean -= d.travelCost;
        const rooms = normalizeSafehouseRooms(s.safehouseRooms);
        const secs = Math.max(15, Math.round(d.travelSeconds * garageTravelMult(rooms)));
        s.travelUntil = Date.now() + secs * 1000;
        s.travelTarget = district;
        s.safehouseRooms = rooms;
        s.actionIndex += 1;
        if (s.investigation >= 2 && unit01(s.seed, "checkpoint", s.actionIndex) < 0.25) {
          s.heat += 10;
          s = pushLog(s, "Checkpoint — delayed and questioned.", "diegetic");
        }
        s = pushLog(s, `Traveling to ${d.name}…`, "system");
        set(s);
      },

      payMedical: () => {
        let s: GameState = { ...get() };
        if (!s.hospitalUntil || Date.now() >= s.hospitalUntil) return;
        const cost = medicalCost(s.district, s.heat);
        if (s.clean < cost) return;
        s.clean -= cost;
        s.hospitalUntil = null;
        s.hospitalReason = null;
        s.wounds = { arm: 0, leg: 0 };
        s.life = Math.max(s.life, 60);
        s = pushLog(s, `Paid medical (${formatMoney(cost)}) — discharged early.`, "system");
        set(s);
      },

      payBail: () => {
        let s: GameState = { ...get() };
        if (!s.jailUntil || Date.now() >= s.jailUntil) return;
        const bail = Math.round(
          bailCost(s.heat, s.investigation) * politicalBailMult(s.power.politicalRung)
        );
        if (s.clean < bail) return;
        s.clean -= bail;
        s.jailUntil = null;
        s.jailReason = null;
        s.heat = Math.max(0, s.heat - 5);
        s = pushLog(s, `Bail posted (${formatMoney(bail)}).`, "system");
        set(s);
      },

      attackNpc: (npcId) => {
        let s: GameState = normalizeState(get());
        if (!s.created) return;
        if (actionBlocked(s)) return;
        const npc = getNpc(npcId);
        if (!npc) return;
        if (npc.district !== s.district) return;
        if (s.energy < npc.energyCost) return;
        if (s.life < 15) return;

        const loadout = loadoutMods(s);
        const armPenalty = woundArmHitPenalty(s.wounds);
        const legPenalty = woundLegMovePenalty(s.wounds);
        s = { ...s, energy: s.energy - npc.energyCost, actionIndex: s.actionIndex + 1 };

        const lines: string[] = [];
        let title: NonNullable<ResultModalState>["title"] = "FAILED";
        let cash = 0;

        // 1) Approach
        const approach =
          0.35 +
          s.spd * 0.02 +
          loadout.stealth * 0.03 -
          npc.dex * 0.015 -
          legPenalty -
          s.heat * 0.002;
        const approachRoll = unit01(s.seed, `atk:approach:${npcId}`, s.actionIndex);
        if (approachRoll > clamp(approach, 0.12, 0.85)) {
          lines.push("Spotted on approach — target slips away.");
          s.heat = Math.min(120, s.heat + Math.ceil(npc.heatOnLose / 2));
          s.stress = Math.min(100, s.stress + 4);
          s.lifetime = { ...s.lifetime, attacksLost: s.lifetime.attacksLost + 1 };
          s = pushLog(s, `Attack failed approach: ${npc.name}`, "result");
          const awardPass = applyAwardPass(s);
          s = awardPass.state;
          set({
            ...s,
            awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
            resultModal: { title: "FAILED", lines, cashDelta: 0 },
          });
          return;
        }
        lines.push("Approach clean.");

        // 2) Initiative
        const playerInit = s.spd + unit01(s.seed, `atk:init:p:${npcId}`, s.actionIndex) * 10;
        const npcInit = npc.spd + unit01(s.seed, `atk:init:n:${npcId}`, s.actionIndex) * 10;
        let playerTurnFirst = playerInit >= npcInit;
        lines.push(playerTurnFirst ? "You seize initiative." : `${npc.name} moves first.`);

        let playerLife = s.life;
        let npcLife = npc.life;
        let fled = false;
        let woundedArm = false;
        let woundedLeg = false;

        for (let round = 1; round <= 3; round++) {
          const actors: Array<"player" | "npc"> = playerTurnFirst ? ["player", "npc"] : ["npc", "player"];
          for (const actor of actors) {
            if (playerLife <= 0 || npcLife <= 0 || fled) break;
            if (actor === "player") {
              const hit = attackHitChance(s.dex, npc.spd, armPenalty);
              const roll = unit01(s.seed, `atk:hit:p:${npcId}:${round}`, s.actionIndex);
              if (roll < hit) {
                const dmg = attackDamage(
                  s.str,
                  loadout.weaponDmg,
                  unit01(s.seed, `atk:dmg:p:${npcId}:${round}`, s.actionIndex)
                );
                const soak = armorSoakAmount(0, npc.def);
                const dealt = Math.max(1, dmg - Math.floor(soak / 2));
                npcLife -= dealt;
                lines.push(`R${round}: You hit for ${dealt}.`);
              } else {
                lines.push(`R${round}: You miss.`);
                // optional flee attempt if losing
                if (playerLife < npc.life * 0.35 && unit01(s.seed, `atk:flee:${npcId}:${round}`, s.actionIndex) < 0.25 + s.spd * 0.01 - legPenalty) {
                  fled = true;
                  lines.push("You break contact and flee.");
                }
              }
            } else {
              const hit = attackHitChance(npc.dex, s.spd, 0);
              const roll = unit01(s.seed, `atk:hit:n:${npcId}:${round}`, s.actionIndex);
              if (roll < hit) {
                const dmg = attackDamage(
                  npc.str,
                  1,
                  unit01(s.seed, `atk:dmg:n:${npcId}:${round}`, s.actionIndex)
                );
                const soak = armorSoakAmount(loadout.armorSoak, s.def);
                const dealt = Math.max(1, dmg - soak);
                playerLife -= dealt;
                lines.push(`R${round}: ${npc.name} hits for ${dealt}.`);
                const woundRoll = unit01(s.seed, `atk:wound:${npcId}:${round}`, s.actionIndex);
                if (woundRoll > 0.88) {
                  woundedArm = true;
                  lines.push("Wound: arm — hit chance soft-debuffed.");
                } else if (woundRoll > 0.78) {
                  woundedLeg = true;
                  lines.push("Wound: leg — approach/flee soft-debuffed.");
                }
              } else {
                lines.push(`R${round}: ${npc.name} misses.`);
              }
            }
          }
          playerTurnFirst = !playerTurnFirst;
        }

        s.life = clamp(playerLife, 0, s.lifeMax);
        if (woundedArm) s.wounds = applyWound(normalizeWounds(s.wounds), "arm", 1);
        if (woundedLeg) s.wounds = applyWound(normalizeWounds(s.wounds), "leg", 1);

        if (fled) {
          title = "MIXED";
          s.heat = Math.min(120, s.heat + npc.heatOnLose);
          s.stress = Math.min(100, s.stress + 6);
          lines.push("Got out — empty-handed.");
        } else if (npcLife <= 0 && s.life > 0) {
          title = "SUCCESS";
          cash = Math.round(
            (npc.lootMin +
              unit01(s.seed, `atk:loot:${npcId}`, s.actionIndex) * (npc.lootMax - npc.lootMin)) *
              respectLootMult(s.power.respect)
          );
          s.street += cash;
          s.heat = Math.min(120, s.heat + npc.heatOnWin);
          s.happy = Math.min(s.happyMax, s.happy + 4);
          s = addXp(s, 12 + Math.floor(npc.power / 5));
          s = bumpMastery(s, "street", cash, true);
          s.lifetime = { ...s.lifetime, attacksWon: s.lifetime.attacksWon + 1 };
          lines.push(`KO — looted ${formatMoney(cash)} street.`);
          if (unit01(s.seed, `atk:item:${npcId}`, s.actionIndex) < 0.12) {
            s = addItem(s, npc.district === "docksreach" ? "courier_bag" : "painkillers");
            lines.push("Found a pocket item.");
          }
        } else if (s.life <= 0 || (npcLife > 0 && playerLife <= npcLife * 0.2 && npcLife > playerLife)) {
          title = "HOSPITALIZED";
          s.life = Math.max(1, s.life);
          s.hospitalUntil =
            Date.now() +
            applyHospitalDuration(
              (12 + Math.floor(npc.power / 4)) * 60 * 1000,
              s.completedCourses,
              s.licenses
            );
          s.hospitalReason = `Lost fight vs ${npc.name}`;
          s.heat = Math.min(120, s.heat + npc.heatOnLose);
          s.stress = Math.min(100, s.stress + 12);
          s.happy = Math.max(0, s.happy - 15);
          s.lifetime = { ...s.lifetime, attacksLost: s.lifetime.attacksLost + 1 };
          lines.push("Lights out. Hospital.");
        } else {
          title = "MIXED";
          const scrap = Math.round(npc.lootMin * 0.25);
          cash = scrap;
          s.street += scrap;
          s.heat = Math.min(120, s.heat + Math.ceil((npc.heatOnWin + npc.heatOnLose) / 2));
          s.stress = Math.min(100, s.stress + 5);
          lines.push(`Stalemate scrap — ${formatMoney(scrap)}.`);
        }

        s = maybeRival(s);
        s = updateIdentity(s);
        s = pushLog(s, `Attack ${title}: ${npc.name} (${formatMoney(cash)})`, "result");
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        if (awardPass.unlocked.length) {
          for (const a of awardPass.unlocked) lines.push(`Award: ${a.name}`);
        }
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: { title, lines, cashDelta: cash },
        });
      },

      bankDeposit: (amount, from) => {
        let s: GameState = { ...get() };
        if (amount <= 0) return;
        if (from === "clean") {
          if (s.clean < amount) return;
          s.clean -= amount;
          s.bank += amount;
        } else {
          if (s.street < amount) return;
          const fee = Math.round(amount * 0.15);
          s.street -= amount;
          s.bank += amount - fee;
          s = pushLog(s, `Converted street→bank (fee $${fee})`, "system");
        }
        s.lifetime = { ...s.lifetime, bankDeposits: s.lifetime.bankDeposits + 1 };
        s = pushLog(s, `Bank deposit ${formatMoney(amount)} (${from})`, "system");
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
        });
      },

      bankWithdraw: (amount) => {
        let s: GameState = { ...get() };
        if (amount <= 0 || s.bank < amount) return;
        s.bank -= amount;
        s.clean += amount;
        s = pushLog(s, `Bank withdraw ${formatMoney(amount)}`, "system");
        set(s);
      },

      cleanMoney: (amount) => {
        let s: GameState = normalizeState(get());
        if (s.street < amount || amount <= 0) return;
        const rate = laundryFeeRate(s.power);
        const fee = Math.round(amount * rate);
        s.street -= amount;
        s.clean += amount - fee;
        const via =
          s.power.businessTierOwned > 0
            ? ` via front (${Math.round(rate * 100)}%)`
            : ` via bank cage (${Math.round(rate * 100)}%)`;
        s = pushLog(s, `Cleaned ${formatMoney(amount)}${via} −$${fee} fee`, "system");
        set(s);
      },

      buyItem: (itemId, withStreet = false) => {
        let s: GameState = normalizeState(get());
        const item = getItem(itemId);
        if (!item) return;
        const rooms = normalizeSafehouseRooms(s.safehouseRooms);
        s.safehouseRooms = rooms;
        if (!canAddInventoryStack(rooms, s.inventory.length, hasItem(s, itemId))) {
          s = pushLog(s, `Stash full (${s.inventory.length}/${stashCapacity(rooms)}) — upgrade Vault`, "system");
          set(s);
          return;
        }
        const district = getDistrict(s.district);
        const price = item.baseValue;
        if (withStreet) {
          const plan = planStreetShopBuy({
            district: s.district,
            shopStyle: district?.shopStyle,
            street: s.street,
            streetSpendVisit: s.streetSpendVisit,
            shopSpendDistrict: s.shopSpendDistrict,
            price,
          });
          if (!plan.ok) {
            s = pushLog(s, plan.reason, "system");
            set(s);
            return;
          }
          s.street -= plan.pay;
          s.streetSpendVisit = plan.streetSpendVisit;
          s.shopSpendDistrict = plan.shopSpendDistrict;
        } else {
          if (s.clean < price) return;
          s.clean -= price;
        }
        s = addItem(s, itemId);
        s = pushLog(s, `Bought ${item.name}${withStreet ? " (street)" : ""}`, "system");
        set(s);
      },

      useItem: (itemId) => {
        let s: GameState = { ...get() };
        if (!hasItem(s, itemId)) return;
        if (itemId === "street_meds") {
          s.life = Math.min(s.lifeMax, s.life + 15);
          s = removeItem(s, itemId);
        } else if (itemId === "happy_pills") {
          s.happy = Math.min(s.happyMax, s.happy + 40);
          s = removeItem(s, itemId);
        } else if (itemId === "food") {
          s.happy = Math.min(s.happyMax, s.happy + 20);
          s = removeItem(s, itemId);
        } else if (itemId === "painkillers") {
          s.life = Math.min(s.lifeMax, s.life + 10);
          s.stress = Math.max(0, s.stress - 5);
          s = removeItem(s, itemId);
        } else if (itemId === "evidence_burn") {
          s.investigation = Math.max(0, (s.investigation - 1) as 0 | 1 | 2 | 3 | 4) as 0 | 1 | 2 | 3 | 4;
          s = removeItem(s, itemId);
        } else return;
        set(s);
      },

      equipItem: (itemId) => {
        const s: GameState = { ...get() };
        const inv = s.inventory.map((i) =>
          i.itemId === itemId ? { ...i, equipped: !i.equipped } : i
        );
        set({ ...s, inventory: inv });
      },

      buyProperty: (propertyId) => {
        let s: GameState = { ...get() };
        const prop = getProperty(propertyId);
        if (!prop) return;
        if (!canBuyProperty(prop, s)) return;
        s.clean -= prop.cost;
        s.ownedProperties = [...s.ownedProperties, prop.id];
        s.safehouseRooms = normalizeSafehouseRooms(s.safehouseRooms);
        s = pushLog(s, `Bought ${prop.name} (${prop.district})`, "system");
        s = maybeRival(s);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title: "SUCCESS",
            lines: [
              `Keys: ${prop.name}`,
              `Rent $${prop.weeklyIncome}/wk · Upkeep $${prop.weeklyUpkeep}/wk`,
              "Safehouse rooms unlock on /safehouse",
              ...awardPass.unlocked.map((a) => `Award: ${a.name}`),
            ],
            cashDelta: -prop.cost,
          },
        });
      },

      upgradeSafehouseRoom: (roomId) => {
        let s: GameState = normalizeState(get());
        if (!s.created) return;
        s.safehouseRooms = normalizeSafehouseRooms(s.safehouseRooms);
        if (!canUpgradeRoom(roomId, s)) return;
        const def = getSafehouseRoom(roomId);
        if (!def) return;
        const lvl = s.safehouseRooms[roomId] ?? 0;
        const cost = nextUpgradeCost(roomId, lvl);
        if (!cost) return;
        s.clean -= cost.clean;
        s.street -= cost.street;
        s.safehouseRooms = { ...s.safehouseRooms, [roomId]: lvl + 1 };
        const next = lvl + 1;
        s = pushLog(s, `Safehouse: ${def.name} → L${next}`, "system");
        set({
          ...s,
          resultModal: {
            title: "SUCCESS",
            lines: [
              `${def.name} upgraded to level ${next}`,
              cost.clean ? `−$${cost.clean} clean` : null,
              cost.street ? `−$${cost.street} street` : null,
              `Stash capacity ${stashCapacity(s.safehouseRooms)} stacks`,
            ].filter(Boolean) as string[],
            cashDelta: -(cost.clean + cost.street),
          },
        });
      },

      craftArmoryTool: (itemId) => {
        let s: GameState = normalizeState(get());
        if (!s.created) return;
        s.safehouseRooms = normalizeSafehouseRooms(s.safehouseRooms);
        const reasons = craftRecipeReasons(itemId, {
          ownedProperties: s.ownedProperties,
          street: s.street,
          safehouseRooms: s.safehouseRooms,
          inventoryStacks: s.inventory.length,
          hasItem: hasItem(s, itemId),
        });
        if (reasons.length) return;
        const recipe = ARMORY_RECIPES.find((r) => r.itemId === itemId);
        if (!recipe) return;
        const cost = armoryCraftCost(itemId, s.safehouseRooms.armory);
        if (cost == null || s.street < cost) return;
        const item = getItem(itemId);
        if (!item) return;
        s.street -= cost;
        s = addItem(s, itemId);
        s = pushLog(s, `Armory crafted ${item.name} (−$${cost} street)`, "system");
        set({
          ...s,
          resultModal: {
            title: "SUCCESS",
            lines: [`Crafted ${item.name} at the rack`, `−$${cost} street`],
            cashDelta: -cost,
          },
        });
      },

      garageRepair: () => {
        let s: GameState = normalizeState(get());
        if (!s.created) return;
        s.safehouseRooms = normalizeSafehouseRooms(s.safehouseRooms);
        if (garageRepairReasons(s).length) return;
        const cost = garageRepairCost(s.safehouseRooms);
        s.street -= cost;
        const lifeGain = 12 + s.safehouseRooms.garage * 6;
        s.life = Math.min(s.lifeMax, s.life + lifeGain);
        s.wounds = easeWounds(normalizeWounds(s.wounds), 1);
        s.stress = Math.max(0, s.stress - 3);
        s = pushLog(s, `Garage bench repair (−$${cost} street, life +${lifeGain})`, "system");
        set({
          ...s,
          resultModal: {
            title: "SUCCESS",
            lines: [
              `Patched up in the bay (+${lifeGain} life)`,
              s.wounds.arm || s.wounds.leg ? "Wounds eased one notch" : "Wounds clear",
              `−$${cost} street`,
            ],
            cashDelta: -cost,
          },
        });
      },

      doLeisure: (id) => {
        let s: GameState = normalizeState(get());
        if (!s.created) return;
        const now = Date.now();
        const def = getLeisure(id);
        if (!def) return;
        const rooms = normalizeSafehouseRooms(s.safehouseRooms);
        s.safehouseRooms = rooms;
        s.wounds = normalizeWounds(s.wounds);
        const ctx = {
          clean: s.clean,
          street: s.street,
          ownedProperties: s.ownedProperties,
          safehouseRooms: rooms,
          leisureUntil: s.leisureUntil,
          hospitalUntil: s.hospitalUntil,
          jailUntil: s.jailUntil,
          travelUntil: s.travelUntil,
          laylowUntil: s.laylowUntil,
          stress: s.stress,
          happy: s.happy,
          happyMax: s.happyMax,
          life: s.life,
          lifeMax: s.lifeMax,
          wounds: s.wounds,
          district: s.district,
        };
        if (!canDoLeisure(id, ctx, now)) return;

        let stressRelief = def.stressRelief;
        let happyGain = def.happyGain;
        if (id === "cot_rest") {
          stressRelief = cotRestStressRelief(rooms);
          happyGain = cotRestHappyGain(rooms);
        }

        s.clean -= def.clean;
        s.street -= def.street;
        s.stress = Math.max(0, s.stress - stressRelief);
        s.happy = Math.min(s.happyMax, s.happy + happyGain);
        if (def.lifeGain) s.life = Math.min(s.lifeMax, s.life + def.lifeGain);
        if (def.woundEase) s.wounds = easeWounds(s.wounds, def.woundEase);
        s.leisureUntil = now + def.cooldownMs;
        s.actionIndex += 1;

        const cashDelta = -(def.clean + def.street);
        const lines = [
          def.blurb,
          `−${stressRelief} stress · +${happyGain} happy`,
          def.lifeGain ? `+${def.lifeGain} life` : null,
          def.woundEase ? "Wounds eased one notch" : null,
          def.clean ? `−$${def.clean} clean` : null,
          def.street ? `−$${def.street} street` : null,
        ].filter(Boolean) as string[];

        s = pushLog(s, `${def.name}: stress −${stressRelief}`, "system");
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title: "SUCCESS",
            lines: [...lines, ...awardPass.unlocked.map((a) => `Award: ${a.name}`)],
            cashDelta,
          },
        });
      },

      interactContact: (contactId, actionId) => {
        let s: GameState = { ...get() };
        if (!s.created) return;
        const bypass = contactActionBypassesBlock(contactId, actionId);
        const now = Date.now();
        const jailed = Boolean(s.jailUntil && now < s.jailUntil);
        const hospital = Boolean(s.hospitalUntil && now < s.hospitalUntil);
        const travel = Boolean(s.travelUntil && now < s.travelUntil);
        const laylow = Boolean(s.laylowUntil && now < s.laylowUntil);
        if (travel || laylow) return;
        if (jailed && bypass !== "jail") return;
        if (hospital && bypass !== "hospital") return;
        if (!jailed && !hospital && actionBlocked(s, now)) return;
        const result = applyContactAction(s, contactId, actionId, now);
        if (!result) return;
        s = result.state;
        s = pushLog(s, result.lines[0] ?? `Contact: ${contactId}`, "diegetic");
        s = maybeRival(s);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title: result.title,
            lines: [...result.lines, ...awardPass.unlocked.map((a) => `Award: ${a.name}`)],
            cashDelta: result.cashDelta,
          },
        });
      },

      replyMentor: (choice) => {
        let s: GameState = { ...get() };
        if (!s.created) return;
        if (actionBlocked(s)) return;
        const result = applyMentorReply(s, choice);
        if (!result) return;
        s = result.state;
        s = pushLog(s, result.lines[0] ?? "Mentor reply", "diegetic");
        for (const line of result.lines.slice(1, 3)) {
          s = pushLog(s, line, "diegetic");
        }
        s = maybeRival(s);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title: result.title,
            lines: [...result.lines, ...awardPass.unlocked.map((a) => `Award: ${a.name}`)],
            cashDelta: result.cashDelta,
          },
        });
      },

      investigationCounterplay: (kind) => {
        let s: GameState = normalizeState(get());
        if (s.investigation <= 0) return;
        if (kind === "lawyer") {
          const base = 2000;
          const cost = Math.round(base * (1 - politicalCounterplayDiscount(s.power.politicalRung)));
          if (s.clean < cost) return;
          s.clean -= cost;
          s.investigation = Math.max(0, s.investigation - 1) as 0 | 1 | 2 | 3 | 4;
          if (s.investigation < 3) s.investigationDeadline = null;
          s = pushLog(
            s,
            cost < base
              ? `Lawyer worked the case (−$${cost} with political discount) — investigation −1`
              : "Lawyer worked the case — investigation −1",
            "system"
          );
        } else if (kind === "burn") {
          if (!hasItem(s, "evidence_burn")) return;
          s = removeItem(s, "evidence_burn");
          s.investigation = Math.max(0, s.investigation - 1) as 0 | 1 | 2 | 3 | 4;
          if (s.investigation < 3) s.investigationDeadline = null;
          s = pushLog(s, "Evidence burned — investigation −1", "system");
        } else if (kind === "laylow") {
          if (s.laylowUntil && Date.now() < s.laylowUntil) return;
          if (s.hospitalUntil || s.jailUntil || s.travelUntil) return;
          // Real timer: 4h hidden; heat decays faster; on expiry sheds 1 investigation stage
          s.laylowUntil = Date.now() + 4 * 60 * 60 * 1000;
          s = pushLog(s, "Went to ground — laying low 4h (actions blocked; travel allowed)", "diegetic");
        } else if (kind === "leave") {
          // Arrival in another district sheds a stage (see tick travel complete)
          s = pushLog(s, "Leave district: travel somewhere else to shed a case stage.", "system");
          s.actionIndex += 1;
          set(s);
          return;
        } else if (kind === "bribe") {
          if (s.street < 1000) return;
          s.street -= 1000;
          const chance = 0.5 + politicalCounterplayDiscount(s.power.politicalRung) * 0.5;
          if (unit01(s.seed, "bribe", s.actionIndex) < chance) {
            s.investigation = Math.max(0, s.investigation - 1) as 0 | 1 | 2 | 3 | 4;
            if (s.investigation < 3) s.investigationDeadline = null;
            s = pushLog(s, "Bribe stuck — investigation −1", "system");
          } else {
            s.investigation = Math.min(4, s.investigation + 1) as 0 | 1 | 2 | 3 | 4;
            s.heat += 20;
            s = pushLog(s, "Bribe backfired — investigation +1, heat +20", "system");
          }
        } else {
          return;
        }
        s.actionIndex += 1;
        set(s);
      },

      refreshBazaar: () => set(ensureBazaar(get())),

      bazaarBuy: (listingIndex) => {
        let s: GameState = ensureBazaar(get());
        const listing = s.bazaar.listings[listingIndex];
        if (!listing) return;
        if (s.clean < listing.price) return;
        const rooms = normalizeSafehouseRooms(s.safehouseRooms);
        s.safehouseRooms = rooms;
        if (!canAddInventoryStack(rooms, s.inventory.length, hasItem(s, listing.itemId))) {
          s = pushLog(s, `Stash full — upgrade Vault at /safehouse`, "system");
          set(s);
          return;
        }
        s.clean -= listing.price;
        s = addItem(s, listing.itemId);
        s = pushLog(
          s,
          `Bazaar bought ${getItem(listing.itemId)?.name} from ${listing.seller ?? "vendor"}`,
          "system"
        );
        set(s);
      },

      bazaarSell: (itemId) => {
        let s: GameState = ensureBazaar(get());
        if (!hasItem(s, itemId)) return;
        const item = getItem(itemId);
        if (!item) return;
        s = { ...s, actionIndex: s.actionIndex + 1 };
        const price = sellPrice(item.baseValue, s.seed, s.actionIndex);
        s = removeItem(s, itemId);
        s.street += price;
        const pct = Math.round((price / Math.max(1, item.baseValue)) * 100);
        s = pushLog(s, `Bazaar sold ${item.name} for ${formatMoney(price)} (${pct}%)`, "system");
        set(s);
      },

      generateRitual: () => set(ensureRitual(get())),

      advanceRitual: () => {},

      callRitual: () => {
        let s = ensureRitual(get());
        const result = applyCallRitual(s);
        s = result.state;
        for (const line of result.lines) {
          s = pushLog(s, line, "system");
        }
        set({
          ...s,
          resultModal: {
            title: result.title,
            lines: result.lines,
            cashDelta: result.cashDelta,
          },
        });
      },

      investTerritory: (district) => {
        let s: GameState = { ...get() };
        const pct = s.power.territory[district] ?? 0;
        if (pct >= 100) return;
        const cost = territoryInvestCost(pct);
        if (s.clean + s.street < cost) return;
        if (s.clean >= cost) s.clean -= cost;
        else {
          const rest = cost - s.clean;
          s.clean = 0;
          s.street -= rest;
        }
        s.power = {
          ...s.power,
          territory: { ...s.power.territory, [district]: Math.min(100, pct + 5) },
        };
        s = pushLog(
          s,
          `Territory ${getDistrict(district)?.name ?? district} → ${s.power.territory[district]}% (−${formatMoney(cost)})`,
          "system"
        );
        s = updateIdentity(s);
        set(s);
      },

      buyPoliticalRung: () => {
        let s: GameState = { ...get() };
        const next = nextPoliticalRung(s.power.politicalRung);
        if (!next || !canBuyPolitical(s)) return;
        s.clean -= next.costClean;
        s.power = { ...s.power, politicalRung: s.power.politicalRung + 1 };
        s = pushLog(s, `Political capital: ${next.title}`, "diegetic");
        s = updateIdentity(s);
        set(s);
      },

      buyRespectFlex: (flexId, useStreet = true) => {
        let s: GameState = { ...get() };
        const flex = RESPECT_FLEX.find((f) => f.id === flexId);
        if (!flex) return;
        const pay = respectFlexPay(flex, useStreet);
        if (useStreet) {
          if (s.street < pay) return;
          s.street -= pay;
        } else {
          if (s.clean < pay) return;
          s.clean -= pay;
        }
        s.power = { ...s.power, respect: s.power.respect + flex.respect };
        const note = useStreet ? " (street 2×)" : " (clean)";
        s = pushLog(s, `${flex.name}: Respect +${flex.respect}${note}`, "diegetic");
        s = updateIdentity(s);
        set(s);
      },

      buyBusinessTier: () => {
        let s: GameState = normalizeState(get());
        const next = nextBusinessTier(s.power.businessTierOwned);
        if (!next || !canBuyBusiness(s)) return;
        s.clean -= next.costClean;
        s.power = { ...s.power, businessTierOwned: s.power.businessTierOwned + 1 };
        s = pushLog(s, `Business empire: ${next.name}`, "diegetic");
        s = updateIdentity(s);
        set(s);
      },

      setBusinessRisk: (risk) => {
        let s: GameState = normalizeState(get());
        if (s.power.businessTierOwned <= 0) return;
        if (risk !== 0 && risk !== 1) return;
        s.power = { ...s.power, businessRisk: risk };
        s = pushLog(
          s,
          risk === 1
            ? "Books set aggressive — more clean/hr, audits possible"
            : "Books set conservative — quieter ledgers",
          "system"
        );
        set(s);
      },

      hireBusinessStaff: () => {
        let s: GameState = normalizeState(get());
        if (!canHireBusinessStaff(s)) return;
        s.clean -= BUSINESS_STAFF_HIRE_CLEAN;
        s.power = { ...s.power, businessStaff: s.power.businessStaff + 1 };
        s = pushLog(
          s,
          `Hired front clerk (${s.power.businessStaff}/${BUSINESS_STAFF_MAX}) −${formatMoney(BUSINESS_STAFF_HIRE_CLEAN)}`,
          "system"
        );
        set(s);
      },

      runHeistPrep: (heistId) => {
        let s: GameState = normalizeState(get());
        if (!s.created) return;
        if (actionBlocked(s)) return;
        const result = applyPrepStage(s, heistId);
        if (!result) return;
        s = result.state;
        s = pushLog(s, `${result.title}: ${result.lines[0] ?? heistId}`, "result");
        s = maybeRival(s);
        s = updateIdentity(s);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title: result.title,
            lines: [...result.lines, ...awardPass.unlocked.map((a) => `Award: ${a.name}`)],
            cashDelta: result.cashDelta,
            ritual: result.ritual,
          },
        });
      },

      executeHeist: (heistId, choice) => {
        let s: GameState = normalizeState(get());
        if (!s.created) return;
        if (actionBlocked(s) && choice !== "abort") return;
        const result = applyExecuteChoice(s, heistId, choice);
        if (!result) return;
        s = result.state;
        s = pushLog(s, `${result.title}: ${result.lines[0] ?? heistId}`, "result");
        s = maybeRival(s);
        s = updateIdentity(s);
        const awardPass = applyAwardPass(s);
        s = awardPass.state;
        const flavorOutcome =
          result.title === "SUCCESS" || result.title === "MIXED"
            ? result.title
            : ("FAILED" as const);
        const flavor = pickHeistResultLine(flavorOutcome, s.seed, heistId, s.actionIndex);
        set({
          ...s,
          awardModal: awardPass.unlocked.length ? awardModalPayload(awardPass.unlocked) : get().awardModal,
          resultModal: {
            title: result.title,
            lines: [flavor, ...result.lines, ...awardPass.unlocked.map((a) => `Award: ${a.name}`)],
            cashDelta: result.cashDelta,
            ritual: result.ritual,
          },
        });
      },

      exportSave: () => {
        const { resultModal, awayModal, awardModal, clock, ...rest } = get();
        void resultModal;
        void awayModal;
        void awardModal;
        void clock;
        return JSON.stringify(rest, null, 2);
      },

      importSave: (json) => {
        try {
          const data = JSON.parse(json) as GameState;
          set({
            ...createInitialState(),
            ...normalizeState({ ...createInitialState(), ...data }),
            resultModal: null,
            awayModal: null,
            awardModal: null,
            clock: Date.now(),
          });
        } catch {
          /* ignore */
        }
      },

      resetSave: () =>
        set({ ...createInitialState(), resultModal: null, awayModal: null, awardModal: null, clock: Date.now() }),

      setDensity: (d) => set({ density: d }),
    }),
    {
      name: "nightwire-save-v1",
      partialize: (s) => {
        const { resultModal, awayModal, awardModal, clock, ...rest } = s;
        void resultModal;
        void awayModal;
        void awardModal;
        void clock;
        return rest;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        const merged = { ...current, ...p };
        return {
          ...merged,
          ...normalizeState(merged),
          awardModal: null,
        };
      },
    }
  )
);

export { CRIMES, JOBS, COURSES, DISTRICTS, ITEMS, HEADLINES, RANK_TITLES, NPCS };
