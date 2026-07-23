import { COURSES, getProperty } from "@/content/catalog";
import { bankInterestRate } from "@/game/careers";
import { happyStudyFactor } from "@/game/formulas";
import {
  grantLicenseOnCourseComplete,
  licenseWeeklyStipend,
} from "@/game/licenses";
import { businessIncomeForHours } from "@/game/power";
import { weeklyPropertyNet } from "@/game/properties";
import { applyRivalAwayPressure } from "@/game/rival";
import { unit01 } from "@/game/rng";
import {
  cotHappyPerHour,
  cotLifePerHour,
  cotStressDecayPerHour,
  garageEnergyPerHour,
  normalizeSafehouseRooms,
  studySpeedMult,
  vaultHeatDecayBonus,
  vaultRaidCostMult,
} from "@/game/safehouse";
import type { GameState } from "@/game/state";

const ENERGY_MS = 5 * 60 * 1000;
const NERVE_MS = 5 * 60 * 1000;

export type TickResult = {
  state: GameState;
  awaySummary: {
    hours: number;
    legal: string[];
    street: string[];
    city: string[];
    progress: string[];
  } | null;
};

function bumpPeaks(s: GameState): GameState {
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

export function applyCatchUp(state: GameState, now = Date.now()): TickResult {
  const elapsed = Math.max(0, now - state.lastTickAt);
  const hours = elapsed / (60 * 60 * 1000);
  let s = { ...state, lifetime: { ...state.lifetime } };
  const rooms = normalizeSafehouseRooms(s.safehouseRooms);
  s.safehouseRooms = rooms;

  const energyGain = Math.floor(elapsed / ENERGY_MS);
  const nerveGain = Math.floor(elapsed / NERVE_MS);
  const garageEnergy = Math.floor(hours * garageEnergyPerHour(rooms));
  s.energy = Math.min(s.energyMax, s.energy + energyGain + garageEnergy);
  s.nerve = Math.min(s.nerveMax, s.nerve + nerveGain);
  s.life = Math.min(s.lifeMax, s.life + Math.floor(hours * cotLifePerHour(rooms)));
  s.happy = Math.min(s.happyMax, s.happy + Math.floor(hours * cotHappyPerHour(rooms)));
  const heatDecay = hours * ((s.energy < 5 ? 2 : 0.5) + vaultHeatDecayBonus(rooms));
  s.heat = Math.max(0, s.heat - heatDecay);
  const stressDrop =
    (hours >= 72 ? 20 : hours >= 8 ? 5 : 0) + hours * cotStressDecayPerHour(rooms);
  s.stress = Math.max(0, s.stress - stressDrop);

  const legal: string[] = [];
  const street: string[] = [];
  const city: string[] = [];
  const progress: string[] = [];

  if (energyGain) legal.push(`Energy +${energyGain}`);
  if (nerveGain) legal.push(`Nerve +${nerveGain}`);

  // Bank interest ~2%/week (+ commerce course + license bonuses)
  if (s.bank > 0 && hours >= 1) {
    const rate = bankInterestRate(s.completedCourses, s.licenses);
    const interest = Math.floor(s.bank * rate * (hours / 168));
    if (interest > 0) {
      s.bank += interest;
      s.lifetime.interestEarned += interest;
      legal.push(`Bank interest +$${interest}`);
    }
  }

  // License stipends — small weekly clean while holding certs
  if (hours >= 1) {
    const weekly = licenseWeeklyStipend(s.licenses);
    if (weekly > 0) {
      const stipend = Math.floor(weekly * (hours / 168));
      if (stipend > 0) {
        s.clean += stipend;
        legal.push(`License stipend +$${stipend}`);
      }
    }
  }

  // Property rent − upkeep (weekly rates scaled by hours)
  if (s.ownedProperties.length && hours >= 1) {
    const weeks = hours / 168;
    const { income, upkeep, net } = weeklyPropertyNet(s.ownedProperties, s.completedCourses);
    const incomeAmt = Math.floor(income * weeks);
    const upkeepAmt = Math.floor(upkeep * weeks);
    if (incomeAmt > 0) {
      s.clean += incomeAmt;
      s.lifetime.rentCollected += incomeAmt;
      legal.push(`Property rent +$${incomeAmt}`);
    }
    if (upkeepAmt > 0) {
      const paid = Math.min(s.clean, upkeepAmt);
      s.clean -= paid;
      if (paid < upkeepAmt) {
        const rest = upkeepAmt - paid;
        s.street = Math.max(0, s.street - rest);
        street.push(`Property upkeep shortfall −$${rest} street`);
      }
      legal.push(`Property upkeep −$${upkeepAmt}`);
    }
    if (net !== 0 && incomeAmt === 0 && upkeepAmt === 0 && hours >= 8) {
      // sub-week dust — skip
    }
  }

  // Business empire passive clean income − upkeep/wages (territory / risk / staff amplify)
  if (s.power.businessTierOwned > 0 && hours >= 1) {
    const { income, upkeep, label } = businessIncomeForHours(s.power, hours);
    if (income > 0) {
      s.clean += income;
      legal.push(label);
    }
    if (upkeep > 0) {
      const paid = Math.min(s.clean, upkeep);
      s.clean -= paid;
      if (paid < upkeep) {
        const rest = upkeep - paid;
        s.street = Math.max(0, s.street - rest);
        street.push(`Front upkeep shortfall −$${rest} street`);
      }
      legal.push(`Front upkeep −$${upkeep}`);
    }
    // Aggressive books: inspection risk scales with hours away
    if (s.power.businessRisk === 1 && hours >= 8) {
      const chance = Math.min(0.28, 0.06 + hours / 500);
      if (unit01(s.seed, "biz_inspect", Math.floor(now / 3600000) + s.power.businessTierOwned) < chance) {
        const fine = Math.max(80, Math.floor(upkeep * 2) || 120);
        const paid = Math.min(s.clean, fine);
        s.clean -= paid;
        if (paid < fine) {
          s.street = Math.max(0, s.street - (fine - paid));
        }
        s.heat = Math.min(120, s.heat + 5);
        city.push(`Tax audit on the front (−$${fine}, heat +5)`);
      }
    }
  }

  // High heat + property → raid/bribe pressure (emergence recipe)
  if (s.ownedProperties.length && s.heat >= 70 && hours >= 8) {
    const risk =
      s.ownedProperties.reduce((a, id) => a + (getProperty(id)?.raidRisk ?? 1), 0) / s.ownedProperties.length;
    const chance = Math.min(0.35, (s.heat - 60) / 100) * risk;
    if (unit01(s.seed, "prop_raid", Math.floor(now / 3600000) + s.ownedProperties.length) < chance) {
      const bribe = Math.floor(400 * s.ownedProperties.length * vaultRaidCostMult(rooms));
      if (s.street >= bribe) {
        s.street -= bribe;
        street.push(`Raid pressure — bribed out (−$${bribe} street)`);
      } else if (s.clean >= bribe) {
        s.clean -= bribe;
        legal.push(`Raid pressure — paid quiet (−$${bribe} clean)`);
      } else {
        const lost = Math.min(s.clean, Math.floor(bribe / 2));
        s.clean -= lost;
        s.heat = Math.min(120, s.heat + 8);
        city.push(`Property raid scare (−$${lost} clean, heat +8)`);
      }
    }
  }

  // Course progress — freezes in jail; scholarship soft-suspends at high heat
  if (s.activeCourseId) {
    const course = COURSES.find((c) => c.id === s.activeCourseId);
    const jailed = Boolean(s.jailUntil && now < s.jailUntil);
    if (course && !jailed) {
      const stressSlow = 1 - Math.min(0.25, s.stress * 0.002);
      const happySlow = happyStudyFactor(s.happy);
      const desk = studySpeedMult(rooms);
      const add = hours * stressSlow * happySlow * desk;
      s.courseProgressHours += add;
      if (s.ritual && !s.ritual.rewardClaimed && s.ritual.kind === "study" && add > 0) {
        s.ritual = {
          ...s.ritual,
          current: Math.min(s.ritual.target, s.ritual.current + add),
        };
      }
      const probation = s.heat >= 70;
      const stipend = probation ? 0 : Math.floor(add * course.stipendPerHour);
      if (stipend > 0) {
        s.clean += stipend;
        legal.push(`Scholarship +$${stipend}`);
      } else if (probation && hours >= 0.5) {
        legal.push("Scholarship suspended (heat probation)");
      }
      progress.push(`${course.name}: +${add.toFixed(1)}h`);
      if (s.courseProgressHours >= course.hours) {
        s.completedCourses = Array.from(new Set([...s.completedCourses, course.id]));
        s.activeCourseId = null;
        s.courseProgressHours = 0;
        progress.push(`Completed ${course.name}`);
        if (course.unlocks?.length) {
          progress.push(`Unlocked content: ${course.unlocks.join(", ")}`);
        }
        const granted = grantLicenseOnCourseComplete(s.licenses, course.id);
        s.licenses = granted.licenses;
        if (granted.license) {
          progress.push(`License earned: ${granted.license.name}`);
          if (granted.legitimacyGain > 0) {
            s.legitimacy = Math.min(100, s.legitimacy + granted.legitimacyGain);
            legal.push(`Legitimacy +${granted.legitimacyGain} (${granted.license.name})`);
          }
        }
      }
    } else if (course && jailed && hours >= 0.5) {
      progress.push(`${course.name}: paused (jail)`);
    }
  }

  // Timer expiry
  if (s.hospitalUntil && now >= s.hospitalUntil) {
    s.hospitalUntil = null;
    s.hospitalReason = null;
    s.wounds = { arm: 0, leg: 0 };
    s.life = Math.max(s.life, 40);
    city.push("Released from hospital");
  }
  if (s.jailUntil && now >= s.jailUntil) {
    s.jailUntil = null;
    s.jailReason = null;
    city.push("Released from jail");
  }
  if (s.travelUntil && now >= s.travelUntil && s.travelTarget) {
    const fromDistrict = s.district;
    s.district = s.travelTarget;
    const visited = new Set(s.lifetime.districtsVisited);
    visited.add(s.travelTarget);
    s.lifetime = {
      ...s.lifetime,
      travels: s.lifetime.travels + 1,
      districtsVisited: Array.from(visited),
    };
    s.travelUntil = null;
    s.travelTarget = null;
    // New district = new shop visit
    s.streetSpendVisit = 0;
    s.shopSpendDistrict = s.district;
    city.push(`Arrived in ${s.district}`);
    // Leave-district counterplay: shedding heat on the case
    if (s.investigation > 0 && fromDistrict !== s.district) {
      s.investigation = Math.max(0, s.investigation - 1) as GameState["investigation"];
      if (s.investigation < 3) s.investigationDeadline = null;
      city.push("Left the heat behind — investigation −1");
    }
  }

  // Lay-low: faster heat decay while hidden; on expiry shed investigation
  if (s.laylowUntil) {
    if (now < s.laylowUntil) {
      // Extra heat decay while laying low (scales with elapsed hours, including 1s online ticks)
      s.heat = Math.max(0, s.heat - hours * 1.5);
    } else {
      s.laylowUntil = null;
      if (s.investigation > 0) {
        s.investigation = Math.max(0, s.investigation - 1) as GameState["investigation"];
        if (s.investigation < 3) s.investigationDeadline = null;
        city.push("Lay-low over — investigation −1");
      }
      s.heat = Math.max(0, s.heat - 10);
      city.push("Came up from lay-low");
    }
  }

  // Investigation deadline
  if (s.investigation === 3 && s.investigationDeadline && now >= s.investigationDeadline) {
    s.investigation = 4;
    s.jailUntil = now + 6 * 3600 * 1000;
    s.lifetime = { ...s.lifetime, timesJailed: s.lifetime.timesJailed + 1 };
    city.push("Warrant served — jailed");
  }

  // Seizure risk
  if (s.street > 10000 && s.heat > 50) {
    const rolls = Math.floor(hours);
    for (let i = 0; i < rolls; i++) {
      if (unit01(s.seed, "seize", Math.floor(now / 3600000) + i) < 0.05) {
        const lost = Math.floor(s.street * 0.1);
        s.street -= lost;
        street.push(`Street cash seized −$${lost}`);
        break;
      }
    }
  }

  // Rival soft pressure while away (Hour-1 feel)
  if (hours >= 8) {
    s = applyRivalAwayPressure(s, hours, now, city, street);
  }

  if (hours >= 24 && s.investigation > 0 && s.investigation < 4) {
    s.investigation = Math.max(0, s.investigation - 1) as GameState["investigation"];
    city.push("Investigation cooled one stage");
  }

  s.lastTickAt = now;
  s = bumpPeaks(s);
  const awaySummary =
    hours >= 0.5
      ? { hours, legal, street, city, progress }
      : null;

  if (hours >= 0.5) s.lastAwayAt = now;

  return { state: s, awaySummary };
}
