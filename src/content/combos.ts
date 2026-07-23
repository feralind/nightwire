import { CRIMES, JOBS, ITEMS, getCrime, getJob, getItem } from "@/content/catalog";

export type ComboKind = "item_crime" | "job_crime" | "item_job" | "loadout" | "district";

export type ComboDef = {
  id: string;
  name: string;
  kind: ComboKind;
  blurb: string;
  /** Soft tip for the player */
  tip: string;
  itemIds?: string[];
  crimeIds?: string[];
  jobIds?: string[];
  districtIds?: string[];
  /** Flavor magnitude 1–5 */
  strength: 1 | 2 | 3 | 4 | 5;
};

/**
 * Synergy / combo catalog — mirrors real soft bonuses (job specialty crimes,
 * tool gates, district bias) plus curated loadout tips.
 */
export const COMBOS: ComboDef[] = [
  {
    id: "lock_and_laundry",
    name: "Pins + laundry vault",
    kind: "item_crime",
    blurb: "Lockpick set opens the laundromat night vault.",
    tip: "Buy a lockpick, finish Street Electives I, then hit laundry_vault.",
    itemIds: ["lockpick"],
    crimeIds: ["laundry_vault"],
    strength: 5,
  },
  {
    id: "shim_car",
    name: "Shim kit + car work",
    kind: "item_crime",
    blurb: "Quiet entry for break-ins and catalytic lifts.",
    tip: "Equip shim_kit before car_breakin / catalytic loops.",
    itemIds: ["shim_kit"],
    crimeIds: ["car_breakin", "catalytic"],
    strength: 3,
  },
  {
    id: "crowbar_crate",
    name: "Crowbar + warehouse",
    kind: "item_crime",
    blurb: "Stubborn crates yield to steel.",
    tip: "Crowbar toolMod softens warehouse / chop_shop difficulty.",
    itemIds: ["crowbar"],
    crimeIds: ["warehouse", "chop_shop"],
    strength: 3,
  },
  {
    id: "harbor_key",
    name: "Harbor keycard + docks",
    kind: "item_crime",
    blurb: "Rare dock access for heavy harbor scores.",
    tip: "Pair harbor_key with harbor / dock_pierce in DocksReach.",
    itemIds: ["harbor_key"],
    crimeIds: ["harbor", "dock_pierce"],
    districtIds: ["docksreach"],
    strength: 4,
  },
  {
    id: "drill_vault",
    name: "Quiet drill + vault family",
    kind: "item_crime",
    blurb: "Vault work rewards patience and bits.",
    tip: "drill_bit or thermal_lance before private_vault / laundry_vault.",
    itemIds: ["drill_bit", "thermal_lance"],
    crimeIds: ["private_vault", "laundry_vault", "pawn_safe"],
    strength: 4,
  },
  {
    id: "radio_sweep",
    name: "Scanner + high heat",
    kind: "loadout",
    blurb: "Hear sweeps before they hear you.",
    tip: "Equip radio when heat is Medium+; soft stealth bump.",
    itemIds: ["radio"],
    strength: 2,
  },
  {
    id: "gloves_prints",
    name: "Grip gloves + petty",
    kind: "item_crime",
    blurb: "Fewer prints, better grip on light lifts.",
    tip: "gloves + shim_kit stack stealth for pickpocket / shoplift.",
    itemIds: ["gloves", "shim_kit"],
    crimeIds: ["pickpocket", "shoplift"],
    strength: 2,
  },
  {
    id: "retail_specialty",
    name: "Retail job + store crimes",
    kind: "job_crime",
    blurb: "Day shift softens night odds on the same shelves.",
    tip: "Retail careers bump specialtyCrimeIds like shoplift / vending.",
    jobIds: ["retail_1", "retail_2", "retail_3"],
    crimeIds: ["shoplift", "vending", "short_change"],
    strength: 4,
  },
  {
    id: "med_specialty",
    name: "Medical job + ward scores",
    kind: "job_crime",
    blurb: "Badge proximity softens pharmacy and vault work.",
    tip: "Clinic careers specialty-bump pharmacy / hospital_vault.",
    jobIds: ["orderly_1", "orderly_2", "orderly_3"],
    crimeIds: ["pharmacy", "hospital_vault", "laundry_pouch"],
    strength: 4,
  },
  {
    id: "dock_specialty",
    name: "Harbor job + crane scores",
    kind: "job_crime",
    blurb: "Manifest familiarity is an edge.",
    tip: "Dock ladder bump on harbor / warehouse / courier.",
    jobIds: ["dock_1", "dock_2", "dock_3"],
    crimeIds: ["harbor", "warehouse", "courier"],
    strength: 4,
  },
  {
    id: "casino_specialty",
    name: "Casino job + cage work",
    kind: "job_crime",
    blurb: "You already know where the chips sleep.",
    tip: "Floor jobs bump casino_cage and related scams.",
    jobIds: ["casino_1", "casino_2", "casino_3"],
    crimeIds: ["casino_cage", "coinop_scam"],
    strength: 4,
  },
  {
    id: "pawn_specialty",
    name: "Pawn desk + vault night",
    kind: "job_crime",
    blurb: "Fence networks and dial feel.",
    tip: "Pawn careers specialty-bump pawn_safe / laundry_vault.",
    jobIds: ["pawn_1", "pawn_2", "pawn_3"],
    crimeIds: ["pawn_safe", "laundry_vault"],
    strength: 3,
  },
  {
    id: "hotel_specialty",
    name: "Hotel keys + guest rooms",
    kind: "job_crime",
    blurb: "Cart paths and minibar habits.",
    tip: "Hospitality specialty on hotel_safe / laundry_pouch.",
    jobIds: ["hotel_1", "hotel_2", "hotel_3"],
    crimeIds: ["hotel_safe", "hotel_minibar", "laundry_pouch"],
    strength: 3,
  },
  {
    id: "guard_specialty",
    name: "Security + badge clone",
    kind: "job_crime",
    blurb: "You wrote the booth schedule.",
    tip: "Guard careers soft-bump badge_clone / guard_booth.",
    jobIds: ["security_1", "security_2"],
    crimeIds: ["badge_clone", "guard_booth"],
    strength: 3,
  },
  {
    id: "bike_race",
    name: "Used bike + raceway",
    kind: "item_job",
    blurb: "Parts in inventory raise race odds.",
    tip: "Own bike / ecu / tire scraps before alley_dash.",
    itemIds: ["bike"],
    strength: 3,
  },
  {
    id: "vest_attack",
    name: "Armor + alley mark",
    kind: "loadout",
    blurb: "Soak turns losses into bruises.",
    tip: "Equip vest / kevlar before Attack or bounty claims.",
    itemIds: ["vest", "kevlar_liner"],
    strength: 3,
  },
  {
    id: "bat_knife",
    name: "Bat or knife loadout",
    kind: "loadout",
    blurb: "Weapon dmg feeds attack resolution.",
    tip: "Equip bat (+5) or knife (+3) for PvE scrapes.",
    itemIds: ["bat", "knife"],
    strength: 2,
  },
  {
    id: "burn_case",
    name: "Burn kit + investigation",
    kind: "loadout",
    blurb: "Evidence goes quiet when the kit is warm.",
    tip: "Keep evidence_burn for stage drops when Inv climbs.",
    itemIds: ["evidence_burn"],
    strength: 4,
  },
  {
    id: "lawyer_case",
    name: "Lawyer card + case clock",
    kind: "loadout",
    blurb: "Paperwork is a weapon.",
    tip: "lawyer_retainer drops one investigation stage.",
    itemIds: ["lawyer_retainer"],
    strength: 4,
  },
  {
    id: "millstone_street",
    name: "Millstone street bias",
    kind: "district",
    blurb: "Yards forgive street work.",
    tip: "Travel Millstone for warehouse / catalytic comfort.",
    districtIds: ["millstone"],
    crimeIds: ["warehouse", "catalytic", "chop_shop"],
    strength: 3,
  },
  {
    id: "docks_heavy",
    name: "DocksReach heavy bias",
    kind: "district",
    blurb: "Cranes and heat for heavy scores.",
    tip: "Heavy family crimes favor DocksReach.",
    districtIds: ["docksreach"],
    crimeIds: ["harbor", "armored", "train_arms"],
    strength: 4,
  },
  {
    id: "glassrow_petty",
    name: "Glassrow petty crowds",
    kind: "district",
    blurb: "Cameras hate heavy; crowds love petty.",
    tip: "Petty lifts in Glassrow; save heavy for darker rails.",
    districtIds: ["glassrow"],
    crimeIds: ["shoplift", "pickpocket", "vending"],
    strength: 3,
  },
  {
    id: "clinic_med",
    name: "Ashcourt / Red Clinic medical",
    kind: "district",
    blurb: "Ward light and pharmacy doors.",
    tip: "Pharmacy / hospital_vault lean civic districts.",
    districtIds: ["ashcourt", "redclinic"],
    crimeIds: ["pharmacy", "hospital_vault", "laundry_card"],
    strength: 3,
  },
  {
    id: "neon_tourist",
    name: "Neon Pier tourist heat",
    kind: "district",
    blurb: "Tourist wallets, tourist cameras.",
    tip: "Petty / street on the pier; watch heat climb.",
    districtIds: ["neonpier"],
    crimeIds: ["pickpocket", "pier_ticket", "coat_check"],
    strength: 2,
  },
  {
    id: "commerce_laundry",
    name: "Bookkeeping + laundry fee",
    kind: "item_job",
    blurb: "Commerce capital unlocks fronts; laundry beats the bank cage.",
    tip: "Finish cf1 path → Business → /cleaning for better street→clean.",
    strength: 5,
  },
  {
    id: "electives_street",
    name: "Street Electives unlocks",
    kind: "job_crime",
    blurb: "se1 opens warehouse / pharmacy doors.",
    tip: "Education → Street Electives I before mid-tier street crimes.",
    crimeIds: ["warehouse", "pharmacy"],
    strength: 5,
  },
  {
    id: "locksmith_pins",
    name: "Locksmith course + locks",
    kind: "item_crime",
    blurb: "le1 cert makes doors answer cleaner.",
    tip: "Complete Locksmith Electives before laundry_vault / hotel safes.",
    crimeIds: ["laundry_vault", "hotel_safe", "pawn_safe"],
    strength: 4,
  },
  {
    id: "happy_odds",
    name: "Happy pills before nerve",
    kind: "loadout",
    blurb: "Mood softens study and crime feel.",
    tip: "Pop happy_pills / food before a long crime session.",
    itemIds: ["happy_pills", "food"],
    strength: 2,
  },
  {
    id: "meds_ward",
    name: "Street meds after fail",
    kind: "loadout",
    blurb: "Life floor matters more than ego.",
    tip: "Keep street_meds / painkillers for post-fail recovery.",
    itemIds: ["street_meds", "painkillers", "adrenaline"],
    strength: 2,
  },
  {
    id: "flex_respect",
    name: "Threads → respect track",
    kind: "loadout",
    blurb: "Looks like money opens political / respect buys.",
    tip: "Buy threads / suit then Power → Respect flex.",
    itemIds: ["threads", "suit", "gold_chain"],
    strength: 2,
  },
];

export function getCombo(id: string): ComboDef | undefined {
  return COMBOS.find((c) => c.id === id);
}

export function comboLabels(combo: ComboDef): string[] {
  const labels: string[] = [];
  for (const id of combo.itemIds ?? []) {
    labels.push(getItem(id)?.name ?? id);
  }
  for (const id of combo.crimeIds ?? []) {
    labels.push(getCrime(id)?.name ?? id);
  }
  for (const id of combo.jobIds ?? []) {
    labels.push(getJob(id)?.title ?? id);
  }
  return labels;
}

/** How many referenced pieces the player currently holds / unlocks. */
export function comboProgress(
  combo: ComboDef,
  s: {
    inventory: { itemId: string; qty: number }[];
    jobId: string | null;
    district: string;
    completedCourses: string[];
    mastery: Record<string, { attempts: number }>;
  }
): { have: number; need: number; active: boolean } {
  let have = 0;
  let need = 0;
  for (const id of combo.itemIds ?? []) {
    need += 1;
    if (s.inventory.some((i) => i.itemId === id && i.qty > 0)) have += 1;
  }
  for (const id of combo.crimeIds ?? []) {
    need += 1;
    // “Have” if attempted or unlocked enough to show — soft: any mastery attempt on family
    const crime = getCrime(id);
    if (crime && (s.mastery[crime.family]?.attempts ?? 0) > 0) have += 1;
    else if (!crime) {
      // unknown crime id still counts as need; discovered via catalog later
    }
  }
  for (const id of combo.jobIds ?? []) {
    need += 1;
    if (s.jobId === id) have += 1;
  }
  for (const id of combo.districtIds ?? []) {
    need += 1;
    if (s.district === id) have += 1;
  }
  if (need === 0) need = 1;
  const active = have >= Math.ceil(need / 2);
  return { have, need, active };
}

// Touch catalogs so tree-shaking doesn't drop helpers used only via get*
void CRIMES;
void JOBS;
void ITEMS;
