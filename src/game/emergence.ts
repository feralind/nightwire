import { EMERGENCE_RULES, awayRules, directorRules, type EmergenceRule } from "@/content/emergence_rules";
import { getProperty } from "@/content/catalog";
import { unit01 } from "@/game/rng";
import {
  normalizeSafehouseRooms,
  vaultRaidCostMult,
} from "@/game/safehouse";
import type { GameState } from "@/game/state";

export type DirectorPick = { id: string; label: string };

/** Map director rule ids → stable short ids used by bazaar/stocks (legacy + new). */
export function directorEffectId(rule: EmergenceRule): string {
  switch (rule.effect) {
    case "festival_spill":
      return "festival";
    case "strike_slow":
      return "strike";
    case "sweep_pressure":
      return "sweep";
    case "blackout_glitch":
      return "outage";
    case "harbor_fog":
      return "fog";
    case "ward_siren":
      return "siren";
    case "audit_nudge":
      return "audit";
    case "market_jitter":
      return "jitter";
    default:
      return rule.id.replace(/^dir_/, "");
  }
}

/** Weighted pick among director rules — deterministic from seed + bucket. */
export function pickDirectorEvent(seed: string, bucket: number): DirectorPick {
  const rules = directorRules();
  const total = rules.reduce((a, r) => a + (r.weight ?? 1), 0);
  let roll = unit01(seed, "director_pick", bucket) * total;
  for (const r of rules) {
    roll -= r.weight ?? 1;
    if (roll <= 0) {
      return { id: directorEffectId(r), label: r.label };
    }
  }
  const last = rules[rules.length - 1]!;
  return { id: directorEffectId(last), label: last.label };
}

function ruleMatches(rule: EmergenceRule, s: GameState, hours: number): boolean {
  if (rule.minHours != null && hours < rule.minHours) return false;
  if (rule.minHeat != null && s.heat < rule.minHeat) return false;
  if (rule.minStreet != null && s.street < rule.minStreet) return false;
  if (rule.requireProperty && s.ownedProperties.length === 0) return false;
  if (rule.requireBusiness && s.power.businessTierOwned <= 0) return false;
  if (rule.minInvestigation != null && s.investigation < rule.minInvestigation) return false;
  if (rule.minRivalScore != null && s.rivalScore < rule.minRivalScore) return false;
  return true;
}

export type EmergenceBuckets = {
  legal: string[];
  street: string[];
  city: string[];
};

/**
 * Apply data-driven away/pressure rules once per catch-up.
 * Property raid & street seize keep prior economic teeth; others are soft flavor + light stats.
 */
export function applyEmergenceAway(
  state: GameState,
  hours: number,
  now: number,
  buckets: EmergenceBuckets
): GameState {
  if (hours < 1) return state;
  let s = state;
  const rooms = normalizeSafehouseRooms(s.safehouseRooms);
  const hourBucket = Math.floor(now / 3600000);

  for (const rule of awayRules()) {
    if (!ruleMatches(rule, s, hours)) continue;
    const chance = rule.chance ?? 0.1;
    const roll = unit01(s.seed, `emerge:${rule.id}`, hourBucket + Math.floor(hours));
    if (roll >= chance) continue;

    s = applyRuleEffect(s, rule, hours, now, buckets, rooms);
  }

  return s;
}

function applyRuleEffect(
  s: GameState,
  rule: EmergenceRule,
  hours: number,
  now: number,
  buckets: EmergenceBuckets,
  rooms: ReturnType<typeof normalizeSafehouseRooms>
): GameState {
  switch (rule.effect) {
    case "property_raid": {
      if (!s.ownedProperties.length || s.heat < 70) return s;
      const risk =
        s.ownedProperties.reduce((a, id) => a + (getProperty(id)?.raidRisk ?? 1), 0) /
        s.ownedProperties.length;
      const chance = Math.min(0.35, (s.heat - 60) / 100) * risk;
      // Already rolled rule.chance; scale bribe by risk only
      if (chance <= 0) return s;
      const bribe = Math.floor(400 * s.ownedProperties.length * vaultRaidCostMult(rooms));
      if (s.street >= bribe) {
        s = { ...s, street: s.street - bribe };
        buckets.street.push(`Raid pressure — bribed out (−$${bribe} street)`);
      } else if (s.clean >= bribe) {
        s = { ...s, clean: s.clean - bribe };
        buckets.legal.push(`Raid pressure — paid quiet (−$${bribe} clean)`);
      } else {
        const lost = Math.min(s.clean, Math.floor(bribe / 2));
        s = { ...s, clean: s.clean - lost, heat: Math.min(120, s.heat + 8) };
        buckets.city.push(`Property raid scare (−$${lost} clean, heat +8)`);
      }
      return s;
    }
    case "street_seize": {
      if (s.street <= 10000 || s.heat <= 50) {
        // Softer pressure variant when conditions are looser
        if (s.street >= 5000 && s.heat >= 40) {
          const lost = Math.min(s.street, Math.floor(s.street * 0.03));
          if (lost > 0) {
            s = { ...s, street: s.street - lost };
            buckets.street.push(`Loud wallet skim −$${lost}`);
          }
        }
        return s;
      }
      const lost = Math.floor(s.street * 0.1);
      s = { ...s, street: s.street - lost };
      buckets.street.push(`Street cash seized −$${lost}`);
      return s;
    }
    case "heat_bleed": {
      const drop = Math.min(12, 2 + hours * 0.15);
      s = { ...s, heat: Math.max(0, s.heat - drop) };
      buckets.city.push(`${rule.label} (heat −${Math.floor(drop)})`);
      return s;
    }
    case "stress_spike": {
      const add = Math.min(15, 3 + hours * 0.1);
      s = { ...s, stress: Math.min(100, s.stress + add) };
      buckets.city.push(`${rule.label} (stress +${Math.floor(add)})`);
      return s;
    }
    case "happy_dip": {
      const dip = Math.min(40, 8 + hours * 0.2);
      s = { ...s, happy: Math.max(0, s.happy - dip) };
      buckets.city.push(`${rule.label} (happy −${Math.floor(dip)})`);
      return s;
    }
    case "audit_nudge": {
      if (s.power.businessRisk === 1) {
        const fine = 80 + Math.floor(hours);
        const paid = Math.min(s.clean, fine);
        s = {
          ...s,
          clean: s.clean - paid,
          heat: Math.min(120, s.heat + 3),
        };
        buckets.city.push(`Audit whisper (−$${paid}, heat +3)`);
      } else {
        buckets.city.push(rule.label);
      }
      return s;
    }
    case "rival_whisper": {
      s = {
        ...s,
        rivalLast: "Vex left chalk marks while you were gone.",
        rivalScore: s.rivalScore + 1,
        stress: Math.min(100, s.stress + 3),
      };
      buckets.city.push(rule.label);
      return s;
    }
    case "market_jitter":
    case "festival_spill":
    case "blackout_glitch":
    case "strike_slow":
    case "sweep_pressure":
    case "harbor_fog":
    case "ward_siren":
    case "laundry_tip":
    case "bank_notice":
    case "contact_ping":
    case "gym_echo":
    case "comp_sting":
    case "director_spawn":
      buckets.city.push(rule.label);
      if (rule.effect === "comp_sting" && s.compPoints > 0) {
        s = { ...s, compPoints: Math.max(0, s.compPoints - 2) };
      }
      if (rule.effect === "gym_echo") {
        s = { ...s, energy: Math.max(0, s.energy - 2) };
      }
      if (rule.effect === "harbor_fog") {
        s = { ...s, heat: Math.max(0, s.heat - 2) };
      }
      if (rule.effect === "sweep_pressure") {
        s = { ...s, stress: Math.min(100, s.stress + 2) };
      }
      return s;
    default:
      buckets.city.push(rule.label);
      return s;
  }
}

export function emergenceRuleCount(): number {
  return EMERGENCE_RULES.length;
}

export { EMERGENCE_RULES };
