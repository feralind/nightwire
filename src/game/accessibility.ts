/** Display accessibility packs — applied as data-attributes on <html>. */

export type ColorblindPackId = "none" | "protanopia" | "deuteranopia" | "tritanopia";

export const COLORBLIND_PACKS: {
  id: ColorblindPackId;
  label: string;
  blurb: string;
}[] = [
  {
    id: "none",
    label: "Default",
    blurb: "Standard Nightwire palette (red / green / blue vitals).",
  },
  {
    id: "protanopia",
    label: "Protanopia",
    blurb: "Red-weak friendly — shifts life/danger away from pure red toward magenta/amber.",
  },
  {
    id: "deuteranopia",
    label: "Deuteranopia",
    blurb: "Green-weak friendly — nerve/money/success use cyan/amber instead of green.",
  },
  {
    id: "tritanopia",
    label: "Tritanopia",
    blurb: "Blue-yellow friendly — energy/happy use rose/teal instead of blue/yellow.",
  },
];

export function normalizeColorblindPack(v: unknown): ColorblindPackId {
  if (v === "protanopia" || v === "deuteranopia" || v === "tritanopia") return v;
  return "none";
}

export function getColorblindPack(id: ColorblindPackId) {
  return COLORBLIND_PACKS.find((p) => p.id === id) ?? COLORBLIND_PACKS[0];
}
