export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function sigmoid(x: number, k = 1.2): number {
  return 1 / (1 + Math.exp(-k * (x - 1)));
}

export function xpToLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.45));
}

export function formatMoney(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

export function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export type CrimeOddsInput = {
  dex: number;
  spd: number;
  str: number;
  def: number;
  level: number;
  toolMod: number;
  eduMod: number;
  districtMod: number;
  hourMod: number;
  chainMod: number;
  heatPenalty: number;
  stressPenalty: number;
  difficulty: number;
};

export function computeCrimeOdds(input: CrimeOddsInput): {
  odds: number;
  skill: number;
  modifiers: { label: string; value: number }[];
} {
  const skill =
    0.35 * input.dex +
    0.25 * input.spd +
    0.15 * input.str +
    0.1 * input.def +
    0.2 * input.level +
    input.toolMod +
    input.eduMod +
    input.districtMod +
    input.hourMod +
    input.chainMod -
    input.heatPenalty -
    input.stressPenalty;

  const raw = skill / input.difficulty;
  const odds = clamp(sigmoid(raw, 1.2), 0.05, 0.85);

  return {
    odds,
    skill,
    modifiers: [
      { label: "Stats/level", value: 0.35 * input.dex + 0.25 * input.spd + 0.15 * input.str + 0.1 * input.def + 0.2 * input.level },
      { label: "Tool", value: input.toolMod },
      { label: "Education", value: input.eduMod },
      { label: "District", value: input.districtMod },
      { label: "Hour", value: input.hourMod },
      { label: "Chain", value: input.chainMod },
      { label: "Heat", value: -input.heatPenalty },
      { label: "Stress", value: -input.stressPenalty },
    ],
  };
}

export function expectedValue(odds: number, cashMin: number, cashMax: number, nerve: number): number {
  const avg = (cashMin + cashMax) / 2;
  return (odds * avg) / Math.max(1, nerve);
}

export function heatBand(heat: number): string {
  if (heat <= 20) return "Safe";
  if (heat <= 40) return "Low";
  if (heat <= 60) return "Medium";
  if (heat <= 80) return "High";
  if (heat <= 100) return "Critical";
  return "Manhunt";
}

export function heatCritFailBonus(heat: number): number {
  if (heat <= 20) return 0;
  if (heat <= 40) return 0.05;
  if (heat <= 60) return 0.15;
  if (heat <= 80) return 0.3;
  return 0.5;
}

export function stressOddsPenalty(stress: number): number {
  if (stress <= 30) return 0;
  if (stress <= 50) return 5;
  if (stress <= 70) return 10;
  return 25;
}

export function happyCrimeOddsPenalty(happy: number): number {
  if (happy >= 500) return 0;
  if (happy >= 300) return 5;
  if (happy >= 100) return 20;
  return 20;
}

export function happyJobQualityPenalty(happy: number): number {
  if (happy >= 500) return 0;
  if (happy >= 300) return 0.15;
  return 0.15;
}

export function softCap(level: number, coursesCompleted: number): number {
  return level * 10 + coursesCompleted * 5;
}

export function applySoftCap(stat: number, cap: number, gain: number): number {
  if (stat < cap) return gain;
  return gain * 0.1;
}

/** Player combat power for fairness UI (range shown, not exact NPC power). */
export function playerCombatPower(input: {
  str: number;
  def: number;
  spd: number;
  dex: number;
  level: number;
  weaponDmg: number;
  armorSoak: number;
}): number {
  return (
    input.str * 1.2 +
    input.def * 0.9 +
    input.spd * 0.8 +
    input.dex * 0.7 +
    input.level * 2 +
    input.weaponDmg * 2 +
    input.armorSoak
  );
}

export function powerBandLabel(playerPower: number, npcPower: number): string {
  const ratio = playerPower / Math.max(1, npcPower);
  if (ratio >= 1.35) return "Favored";
  if (ratio >= 1.05) return "Even";
  if (ratio >= 0.75) return "Risky";
  return "Outmatched";
}

export function estimateNpcPowerRange(npcPower: number): { low: number; high: number } {
  return {
    low: Math.round(npcPower * 0.85),
    high: Math.round(npcPower * 1.15),
  };
}

export function attackHitChance(attackerDex: number, defenderSpd: number, woundArmPenalty = 0): number {
  const raw = 0.45 + (attackerDex - defenderSpd) * 0.02 - woundArmPenalty;
  return clamp(raw, 0.15, 0.9);
}

export function attackDamage(str: number, weaponDmg: number, variance01: number): number {
  const base = 4 + str * 0.6 + weaponDmg;
  return Math.max(1, Math.round(base * (0.75 + variance01 * 0.5)));
}

export function armorSoakAmount(armorSoak: number, def: number): number {
  return Math.round(armorSoak + def * 0.25);
}

export function medicalCost(district: string, heat: number): number {
  const base = district === "docksreach" ? 280 : district === "millstone" ? 220 : 200;
  return base + Math.floor(heat / 10) * 25;
}

export function bailCost(heat: number, investigation: number): number {
  return 500 + Math.floor(heat) * 8 + investigation * 250;
}
