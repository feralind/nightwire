/**
 * AAA content expansion scaffold (V3 targets).
 * V0 uses catalog.ts (12/8/6/3). This module generates filler IDs toward
 * 144 crimes / 64 jobs for future vertical-slice fills without shipping them in UI yet.
 */

export function generateCrimePack(count: number) {
  const tiers = ["petty", "street", "heavy"] as const;
  return Array.from({ length: count }, (_, i) => {
    const tier = tiers[i % 3];
    return {
      id: `gen_${tier}_${i + 1}`,
      name: `${tier} op #${i + 1}`,
      tier,
      family: tier,
      nerve: tier === "petty" ? 1 + (i % 2) : tier === "street" ? 3 + (i % 2) : 6 + (i % 3),
      difficulty: 25 + i,
      cashMin: 50 * (i + 1),
      cashMax: 80 * (i + 1),
      xp: 5 + i,
      heat: 1 + (i % 10),
      failDamage: 4 + (i % 20),
      favoredDistricts: ["glassrow"],
    };
  });
}

export const AAA_TARGETS = {
  crimes: 144,
  jobs: 64,
  courses: 48,
  districts: 8,
  items: 300,
} as const;

export const generatedCrimeDrafts = generateCrimePack(AAA_TARGETS.crimes);
