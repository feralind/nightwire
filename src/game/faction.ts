export type FactionDef = {
  id: string;
  name: string;
  lean: string;
  blurb: string;
};

export const FACTIONS: FactionDef[] = [
  {
    id: "glass_syndicate",
    name: "Glass Syndicate",
    lean: "Glassrow retail & casino floors",
    blurb: "Polished fronts. They hate loud heat and love clean envelopes.",
  },
  {
    id: "mill_iron",
    name: "Mill Iron",
    lean: "Millstone yards",
    blurb: "Tools, trucks, and grudges. Street respect opens doors.",
  },
  {
    id: "dock_covenant",
    name: "Dock Covenant",
    lean: "DocksReach cranes",
    blurb: "Container math. Harbor courses and dock jobs raise your stock.",
  },
  {
    id: "civic_veil",
    name: "Civic Veil",
    lean: "Ashcourt / SpireYard",
    blurb: "Quiet power. Legitimacy and political capital feed this table.",
  },
];

/** Rep delta helpers — clamp -100..100 at call site */
export function assistPay(rep: number) {
  return 400 + Math.max(0, rep) * 4;
}

export function warWeekBonus(rep: number) {
  return rep >= 40 ? 1.1 : 1;
}
