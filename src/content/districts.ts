import type { DistrictDef } from "@/game/types";

/** V1 — 6 playable districts (Neon Pier / Red Clinic are V3) */
export const DISTRICTS: DistrictDef[] = [
  {
    id: "glassrow",
    name: "Glassrow",
    crimeBias: { petty: 10, heavy: -10 },
    travelCost: 50,
    travelSeconds: 120,
    shopStyle: "elite",
    risk: "Low jail",
  },
  {
    id: "millstone",
    name: "Millstone",
    crimeBias: { street: 15 },
    travelCost: 30,
    travelSeconds: 150,
    shopStyle: "tools",
    risk: "Medium",
  },
  {
    id: "docksreach",
    name: "DocksReach",
    crimeBias: { heavy: 20 },
    travelCost: 40,
    travelSeconds: 180,
    shopStyle: "black",
    risk: "High heat",
  },
  {
    id: "ashcourt",
    name: "Ashcourt",
    crimeBias: { street: 8, petty: 5 },
    travelCost: 45,
    travelSeconds: 160,
    shopStyle: "medical",
    risk: "Civic eyes",
  },
  {
    id: "spireyard",
    name: "SpireYard",
    crimeBias: { heavy: 12, petty: -5 },
    travelCost: 60,
    travelSeconds: 200,
    shopStyle: "elite",
    risk: "Rich targets",
  },
  {
    id: "oldcommons",
    name: "OldCommons",
    crimeBias: { street: 12, petty: 8 },
    travelCost: 25,
    travelSeconds: 140,
    shopStyle: "tools",
    risk: "Night mugs",
  },
];
