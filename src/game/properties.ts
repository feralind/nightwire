import { getProperty, PROPERTIES } from "@/content/catalog";
import type { PropertyDef } from "@/game/types";

export type ReqReason = { label: string; href?: string };

/** Commerce Bookkeeping → landlord rent bump */
export function landlordRentBonus(completedCourseIds: string[]): number {
  return completedCourseIds.includes("cf1") ? 0.1 : 0;
}

export function propertyBuyReasons(
  prop: PropertyDef,
  s: { district: string; clean: number; ownedProperties: string[] }
): ReqReason[] {
  const reasons: ReqReason[] = [];
  if (s.ownedProperties.includes(prop.id)) {
    reasons.push({ label: "Already owned" });
  }
  if (s.district !== prop.district) {
    reasons.push({ label: `Travel to ${prop.district}`, href: "/travel" });
  }
  if (s.clean < prop.cost) {
    reasons.push({ label: `Need $${prop.cost} clean`, href: "/jobs" });
  }
  return reasons;
}

export function canBuyProperty(
  prop: PropertyDef,
  s: { district: string; clean: number; ownedProperties: string[] }
): boolean {
  return propertyBuyReasons(prop, s).length === 0;
}

export function ownedPropertyDefs(ownedIds: string[]): PropertyDef[] {
  return ownedIds.map((id) => getProperty(id)).filter((p): p is PropertyDef => Boolean(p));
}

export function weeklyPropertyNet(
  ownedIds: string[],
  completedCourseIds: string[]
): { income: number; upkeep: number; net: number } {
  const defs = ownedPropertyDefs(ownedIds);
  const bonus = 1 + landlordRentBonus(completedCourseIds);
  const income = Math.round(defs.reduce((a, p) => a + p.weeklyIncome, 0) * bonus);
  const upkeep = defs.reduce((a, p) => a + p.weeklyUpkeep, 0);
  return { income, upkeep, net: income - upkeep };
}

export function propertiesInDistrict(district: string): PropertyDef[] {
  return PROPERTIES.filter((p) => p.district === district);
}
