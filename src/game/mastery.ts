/** Mastery titles / cosmetic labels — original Nightwire set */

export function masteryTitleFor(family: string, level: number): string | null {
  if (level < 3) return null;
  if (family === "petty") return level >= 5 ? "Ghost Hand" : "Slick";
  if (family === "street") return level >= 5 ? "Alley King" : "Street Smart";
  if (family === "heavy") return level >= 5 ? "Mastermind" : "Pro";
  if (family.startsWith("career:")) {
    if (level >= 5) return "Career Ace";
    if (level >= 3) return "Shift Ghost";
  }
  return level >= 5 ? "Marked" : "Known";
}

/** +3% odds at mastery 5 on that crime family */
export function masteryOddsBonus(level: number): number {
  return level >= 5 ? 0.03 : 0;
}

export function masteryStars(level: number): string {
  return "★".repeat(Math.max(0, Math.min(5, level))) || "—";
}
