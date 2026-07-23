import { ITEMS } from "@/content/catalog";
import type { DistrictId } from "@/game/types";
import type { ItemDef } from "@/game/types";

export type ShopPayment = "clean_only" | "street_ok" | "medical";

export type ShopDef = {
  id: string;
  name: string;
  district: DistrictId;
  specialty: string;
  blurb: string;
  payment: ShopPayment;
  /** Soft price multiplier (e.g. medical discount) */
  priceMult?: number;
  /** Prefer these kinds when stockIds not set */
  stockKinds?: Array<ItemDef["kind"]>;
  /** Explicit stock; if set, kinds are ignored */
  stockIds?: string[];
};

/** 12 named district / specialty counters — not one generic shop. */
export const SHOPS: ShopDef[] = [
  {
    id: "spire_outfitters",
    name: "Spire Outfitters",
    district: "glassrow",
    specialty: "Elite threads & armor",
    blurb: "Clean ledger only. The glass doors fog if you smell like street.",
    payment: "clean_only",
    stockKinds: ["flex", "armor"],
  },
  {
    id: "wire_counter",
    name: "Wire Counter",
    district: "glassrow",
    specialty: "Boutique tools",
    blurb: "Small tools with big markups. Still elite — no street cash.",
    payment: "clean_only",
    stockIds: ["lockpick", "shim_kit", "radio", "fake_id", "gloves", "badge_blank", "micro_shim", "pickup_gun", "rfid_spoof"],
  },
  {
    id: "yard_and_bolt",
    name: "Yard & Bolt",
    district: "millstone",
    specialty: "Yard tools",
    blurb: "Crowbars, cutters, and grit. Street spend welcome under the visit cap.",
    payment: "street_ok",
    stockKinds: ["tool"],
  },
  {
    id: "mill_meds",
    name: "Mill Meds Closet",
    district: "millstone",
    specialty: "Corner consumables",
    blurb: "Not a clinic — just a locked closet that sells calm.",
    payment: "street_ok",
    stockKinds: ["consumable"],
  },
  {
    id: "harbor_black_box",
    name: "Harbor Black Box",
    district: "docksreach",
    specialty: "Black-market kit",
    blurb: "Crane shadows and warm plastic. Weapons and serious tools.",
    payment: "street_ok",
    stockKinds: ["weapon", "tool"],
  },
  {
    id: "crane_surplus",
    name: "Crane Surplus",
    district: "docksreach",
    specialty: "Dock scrap & bags",
    blurb: "Manifest leftovers. Bags, cards, and fenceable junk.",
    payment: "street_ok",
    stockKinds: ["misc"],
  },
  {
    id: "ward_pharmacy",
    name: "Ward Pharmacy",
    district: "ashcourt",
    specialty: "Medical counter",
    blurb: "Civic light, soft discount. Clean preferred; street if quiet.",
    payment: "medical",
    priceMult: 0.85,
    stockKinds: ["consumable"],
  },
  {
    id: "civic_supply",
    name: "Civic Supply Desk",
    district: "ashcourt",
    specialty: "Paper & soft tools",
    blurb: "Badge blanks and lawyer cards sold as “stationery.”",
    payment: "street_ok",
    stockIds: ["badge_blank", "fake_id", "lawyer_retainer", "evidence_burn", "radio", "gloves", "press_pass", "clinic_badge"],
  },
  {
    id: "penthouse_atelier",
    name: "Penthouse Atelier",
    district: "spireyard",
    specialty: "Respect wardrobe",
    blurb: "Custom suits and lobby watches. Clean envelopes only.",
    payment: "clean_only",
    stockKinds: ["flex"],
  },
  {
    id: "commons_hardware",
    name: "Commons Hardware",
    district: "oldcommons",
    specialty: "Night hardware",
    blurb: "Brick-yard staples. Street cash under the visit cap.",
    payment: "street_ok",
    stockKinds: ["tool", "weapon"],
  },
  {
    id: "boardwalk_fence",
    name: "Boardwalk Fence",
    district: "neonpier",
    specialty: "Tourist black market",
    blurb: "Neon reflections on wet boards. Loud stock, louder prices.",
    payment: "street_ok",
    stockKinds: ["weapon", "misc", "consumable"],
  },
  {
    id: "red_cross_counter",
    name: "Red Cross Counter",
    district: "redclinic",
    specialty: "Clinic surplus",
    blurb: "Sirens close. Meds cheaper; street if the ward clerk looks away.",
    payment: "medical",
    priceMult: 0.8,
    stockKinds: ["consumable", "armor"],
  },
];

export function getShop(id: string): ShopDef | undefined {
  return SHOPS.find((s) => s.id === id);
}

export function shopsInDistrict(district: DistrictId): ShopDef[] {
  return SHOPS.filter((s) => s.district === district);
}

export function shopAllowsStreet(shop: ShopDef): boolean {
  return shop.payment !== "clean_only";
}

export function shopStock(shop: ShopDef): ItemDef[] {
  if (shop.stockIds?.length) {
    const set = new Set(shop.stockIds);
    return ITEMS.filter((i) => set.has(i.id));
  }
  const kinds = new Set(shop.stockKinds ?? []);
  return ITEMS.filter((i) => kinds.has(i.kind));
}

export function shopPrice(shop: ShopDef, baseValue: number): number {
  const mult = shop.priceMult ?? 1;
  return Math.max(1, Math.round(baseValue * mult));
}
