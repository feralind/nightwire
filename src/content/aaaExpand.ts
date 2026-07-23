/**
 * AAA content expansion scaffold (V3 targets).
 * Hand-authored catalog remains the live UI source (48/24/…).
 * This module generates draft IDs toward 144 crimes / 64 jobs / 48 courses for fill passes.
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
      favoredDistricts: ["glassrow"] as const,
    };
  });
}

export function generateJobPack(count: number) {
  const careers = [
    "retail",
    "kitchen",
    "warehouse",
    "dock",
    "driver",
    "orderly",
    "casino",
    "desk",
    "security",
    "courier",
    "mechanic",
    "clerk",
    "bar",
    "lab",
    "yard",
    "rail",
  ];
  return Array.from({ length: count }, (_, i) => {
    const career = careers[i % careers.length];
    const rank = (i % 4) + 1;
    return {
      id: `${career}_r${rank}_${Math.floor(i / 4)}`,
      career,
      rank,
      name: `${career} rank ${rank}`,
      basePay: 600 + rank * 200 + i * 5,
      energy: 5,
    };
  });
}

export function generateCoursePack(count: number) {
  const schools = ["Street", "Commerce", "Harbor", "Med", "Locks", "Systems"];
  return Array.from({ length: count }, (_, i) => ({
    id: `gen_course_${i + 1}`,
    school: schools[i % schools.length],
    name: `Course ${i + 1}`,
    hours: 12 + (i % 5) * 6,
    fee: 200 + i * 40,
  }));
}

export const AAA_TARGETS = {
  crimes: 144,
  jobs: 64,
  courses: 48,
  districts: 8,
  items: 300,
} as const;

export const generatedCrimeDrafts = generateCrimePack(AAA_TARGETS.crimes);
export const generatedJobDrafts = generateJobPack(AAA_TARGETS.jobs);
export const generatedCourseDrafts = generateCoursePack(AAA_TARGETS.courses);
