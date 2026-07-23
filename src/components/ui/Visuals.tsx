"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  CAREER_ART_EXTRA,
  COURSE_ART_EXTRA,
  CRIME_ART_EXTRA,
  JOB_ART_EXTRA,
  NPC_ART_EXTRA,
  SCENES_EXTRA,
} from "@/components/ui/artMapsExtra";
import { NPC_ART_DENSITY, PROPERTY_ART_DENSITY } from "@/content/density/artDensity";

/** Procedural atmospheric art panels — original Nightwire look, no Torn assets */

const SCENES: Record<string, { bg: string; accent: string; label: string }> = {
  shoplift: { bg: "linear-gradient(145deg,#1a1218 0%,#3a1828 40%,#0e0e10 100%)", accent: "#c45c7a", label: "corner store" },
  pickpocket: { bg: "linear-gradient(160deg,#12161e 0%,#243048 45%,#0e0e10 100%)", accent: "#6a8caf", label: "tram line" },
  bicycle: { bg: "linear-gradient(150deg,#141210 0%,#3a2e18 45%,#0e0e10 100%)", accent: "#c9a227", label: "bike rack" },
  parking_meter: { bg: "linear-gradient(145deg,#12141a 0%,#2a3040 45%,#0e0e10 100%)", accent: "#6a8caf", label: "meter" },
  fake_charity: { bg: "linear-gradient(150deg,#141018 0%,#3a2030 40%,#0e0e10 100%)", accent: "#c45c7a", label: "cup" },
  vending: { bg: "linear-gradient(135deg,#101410 0%,#1e3a28 50%,#0e0e10 100%)", accent: "#4caf70", label: "vending" },
  delivery_package: { bg: "linear-gradient(145deg,#12100e 0%,#3a2818 45%,#0e0e10 100%)", accent: "#a08040", label: "porch" },
  basic_lock: { bg: "linear-gradient(150deg,#101214 0%,#243038 45%,#0e0e10 100%)", accent: "#8890a8", label: "lock" },
  street_sign: { bg: "linear-gradient(145deg,#141210 0%,#2a2418 45%,#0e0e10 100%)", accent: "#a08040", label: "scrap" },
  short_change: { bg: "linear-gradient(150deg,#141218 0%,#2a2030 40%,#0e0e10 100%)", accent: "#c9a227", label: "stall" },
  cafe_phone: { bg: "linear-gradient(145deg,#100c14 0%,#281838 45%,#0c0a10 100%)", accent: "#9060c0", label: "cafe" },
  coinop_scam: { bg: "linear-gradient(140deg,#140e18 0%,#3a1828 45%,#0e0e10 100%)", accent: "#c45c7a", label: "junket" },
  laundry_pouch: { bg: "linear-gradient(145deg,#0e1214 0%,#183038 50%,#0e0e10 100%)", accent: "#40c0c8", label: "laundry" },
  bus_pass: { bg: "linear-gradient(150deg,#0e1218 0%,#1c2838 45%,#0e0e10 100%)", accent: "#6080b0", label: "forge" },
  atm_surf: { bg: "linear-gradient(145deg,#0a0810 0%,#241838 45%,#0c0a10 100%)", accent: "#9060c0", label: "atm" },
  construction_skip: { bg: "linear-gradient(150deg,#101010 0%,#2a2418 45%,#0e0e10 100%)", accent: "#a08040", label: "skip" },
  mug: { bg: "linear-gradient(160deg,#120e10 0%,#3a1520 40%,#1a0a10 100%)", accent: "#e05050", label: "alley" },
  car_breakin: { bg: "linear-gradient(140deg,#0e1014 0%,#1a2838 50%,#0e0e10 100%)", accent: "#4a90d9", label: "parking" },
  warehouse: { bg: "linear-gradient(155deg,#101010 0%,#2a2418 45%,#0e0e10 100%)", accent: "#a08040", label: "warehouse" },
  courier_hijack: { bg: "linear-gradient(145deg,#12161e 0%,#243048 45%,#0e0e10 100%)", accent: "#6a8caf", label: "bike run" },
  pharmacy: { bg: "linear-gradient(145deg,#0e1214 0%,#183038 50%,#0e0e10 100%)", accent: "#40c0c8", label: "pharmacy" },
  race_skim: { bg: "linear-gradient(150deg,#140e08 0%,#3a2810 45%,#100c08 100%)", accent: "#d4a017", label: "race" },
  advanced_lock: { bg: "linear-gradient(145deg,#0a0810 0%,#241838 45%,#0c0a10 100%)", accent: "#9060c0", label: "tumblers" },
  catalytic: { bg: "linear-gradient(150deg,#101010 0%,#2a2418 45%,#0e0e10 100%)", accent: "#a08040", label: "undercarriage" },
  badge_clone: { bg: "linear-gradient(145deg,#0e1218 0%,#1c2838 45%,#0e0e10 100%)", accent: "#6080b0", label: "badge" },
  drop_swap: { bg: "linear-gradient(150deg,#0a1014 0%,#143040 50%,#0a0e12 100%)", accent: "#3a90b0", label: "drop" },
  arson_scout: { bg: "linear-gradient(155deg,#140c08 0%,#3a2010 40%,#100808 100%)", accent: "#e07040", label: "scout" },
  food_truck: { bg: "linear-gradient(145deg,#141210 0%,#3a2e18 45%,#0e0e10 100%)", accent: "#c9a227", label: "till" },
  jewel_case: { bg: "linear-gradient(150deg,#121018 0%,#2a1838 40%,#0e0e10 100%)", accent: "#d4a017", label: "glass" },
  meter_maid: { bg: "linear-gradient(145deg,#0e1214 0%,#183038 50%,#0e0e10 100%)", accent: "#40c0c8", label: "plates" },
  dock_pierce: { bg: "linear-gradient(150deg,#0a1014 0%,#143040 50%,#0a0e12 100%)", accent: "#3a90b0", label: "crate" },
  hotel_safe: { bg: "linear-gradient(145deg,#0a0810 0%,#241838 45%,#0c0a10 100%)", accent: "#9060c0", label: "suite" },
  armored: { bg: "linear-gradient(150deg,#101014 0%,#2a2a38 40%,#0c0c10 100%)", accent: "#8890a8", label: "lobby" },
  casino_cage: { bg: "linear-gradient(160deg,#140e08 0%,#3a2810 45%,#100c08 100%)", accent: "#d4a017", label: "cage" },
  evidence_room: { bg: "linear-gradient(145deg,#0e1214 0%,#183038 50%,#0e0e10 100%)", accent: "#40c0c8", label: "evidence" },
  private_vault: { bg: "linear-gradient(150deg,#0a0810 0%,#241838 40%,#0c0a10 100%)", accent: "#9060c0", label: "vault" },
  evidence_swap: { bg: "linear-gradient(145deg,#0c1018 0%,#1c2838 45%,#0e0e10 100%)", accent: "#6080b0", label: "swap" },
  harbor: { bg: "linear-gradient(150deg,#0a1014 0%,#143040 50%,#0a0e12 100%)", accent: "#3a90b0", label: "container" },
  museum: { bg: "linear-gradient(145deg,#101014 0%,#2a2a38 40%,#0c0c10 100%)", accent: "#8890a8", label: "gallery" },
  gang_stash: { bg: "linear-gradient(160deg,#120e10 0%,#3a1520 40%,#1a0a10 100%)", accent: "#e05050", label: "stash" },
  chop_shop: { bg: "linear-gradient(155deg,#101010 0%,#2a2418 45%,#0e0e10 100%)", accent: "#a08040", label: "bay" },
  bond_fraud: { bg: "linear-gradient(145deg,#0c1018 0%,#1c2838 45%,#0e0e10 100%)", accent: "#6080b0", label: "bonds" },
  substation_copper: { bg: "linear-gradient(150deg,#101010 0%,#2a2418 40%,#0e0e10 100%)", accent: "#a08040", label: "copper" },
  hospital_vault: { bg: "linear-gradient(145deg,#0e1214 0%,#183038 50%,#0e0e10 100%)", accent: "#40c0c8", label: "ward vault" },
  airport_cargo: { bg: "linear-gradient(150deg,#0a1014 0%,#143040 50%,#0a0e12 100%)", accent: "#3a90b0", label: "cargo" },
  aide_blackmail: { bg: "linear-gradient(145deg,#0c1018 0%,#1c2838 45%,#0e0e10 100%)", accent: "#6080b0", label: "aide" },
  train_arms: { bg: "linear-gradient(150deg,#0c0c10 0%,#2a2a38 40%,#0c0c10 100%)", accent: "#8890a8", label: "rail yard" },
  courier: { bg: "linear-gradient(145deg,#100c14 0%,#281838 45%,#0c0a10 100%)", accent: "#9060c0", label: "courier" },
  ...SCENES_EXTRA,
};

/** Generated crime card art — V1 + AAA (aliases until unique plates land) */
const CRIME_ART: Record<string, string> = {
  shoplift: "/art/crimes/shoplift.webp",
  pickpocket: "/art/crimes/pickpocket.webp",
  bicycle: "/art/crimes/bicycle.webp",
  parking_meter: "/art/crimes/parking_meter.webp",
  fake_charity: "/art/crimes/fake_charity.webp",
  vending: "/art/crimes/vending.webp",
  delivery_package: "/art/crimes/delivery_package.webp",
  basic_lock: "/art/crimes/basic_lock.webp",
  street_sign: "/art/crimes/street_sign.webp",
  short_change: "/art/crimes/short_change.webp",
  cafe_phone: "/art/crimes/cafe_phone.webp",
  coinop_scam: "/art/crimes/coinop_scam.webp",
  laundry_pouch: "/art/crimes/laundry_pouch.webp",
  bus_pass: "/art/crimes/bus_pass.webp",
  atm_surf: "/art/crimes/atm_surf.webp",
  construction_skip: "/art/crimes/construction_skip.webp",
  mug: "/art/crimes/mug.webp",
  car_breakin: "/art/crimes/car_breakin.webp",
  warehouse: "/art/crimes/warehouse.webp",
  courier_hijack: "/art/crimes/courier_hijack.webp",
  pharmacy: "/art/crimes/pharmacy.webp",
  race_skim: "/art/crimes/race_skim.webp",
  advanced_lock: "/art/crimes/advanced_lock.webp",
  catalytic: "/art/crimes/catalytic.webp",
  badge_clone: "/art/crimes/badge_clone.webp",
  drop_swap: "/art/crimes/drop_swap.webp",
  arson_scout: "/art/crimes/arson_scout.webp",
  food_truck: "/art/crimes/food_truck.webp",
  jewel_case: "/art/crimes/jewel_case.webp",
  meter_maid: "/art/crimes/meter_maid.webp",
  dock_pierce: "/art/crimes/dock_pierce.webp",
  hotel_safe: "/art/crimes/hotel_safe.webp",
  armored: "/art/crimes/armored.webp",
  casino_cage: "/art/crimes/casino_cage.webp",
  evidence_room: "/art/crimes/evidence_room.webp",
  private_vault: "/art/crimes/private_vault.webp",
  evidence_swap: "/art/crimes/evidence_swap.webp",
  harbor: "/art/crimes/harbor.webp",
  museum: "/art/crimes/museum.webp",
  gang_stash: "/art/crimes/gang_stash.webp",
  chop_shop: "/art/crimes/chop_shop.webp",
  bond_fraud: "/art/crimes/bond_fraud.webp",
  substation_copper: "/art/crimes/substation_copper.webp",
  hospital_vault: "/art/crimes/hospital_vault.webp",
  airport_cargo: "/art/crimes/airport_cargo.webp",
  aide_blackmail: "/art/crimes/aide_blackmail.webp",
  train_arms: "/art/crimes/train_arms.webp",
  courier: "/art/crimes/courier.webp",
  ...CRIME_ART_EXTRA,
};

export const NPC_ART: Record<string, string> = {
  gr_courier: "/art/npcs/gr_courier.webp",
  gr_bouncer: "/art/npcs/gr_bouncer.webp",
  gr_tourist: "/art/npcs/gr_tourist.webp",
  ms_loader: "/art/npcs/ms_loader.webp",
  ms_scout: "/art/npcs/ms_scout.webp",
  ms_foreman: "/art/npcs/ms_foreman.webp",
  dr_smuggler: "/art/npcs/dr_smuggler.webp",
  dr_longshore: "/art/npcs/dr_longshore.webp",
  dr_lookout: "/art/npcs/dr_lookout.webp",
  ac_intern: "/art/npcs/ac_intern.webp",
  ac_security: "/art/npcs/ac_security.webp",
  sy_exec: "/art/npcs/sy_exec.webp",
  sy_guard: "/art/npcs/sy_guard.webp",
  oc_thug: "/art/npcs/oc_thug.webp",
  oc_runner: "/art/npcs/oc_runner.webp",
  np_dealer: "/art/npcs/np_dealer.webp",
  np_bouncer: "/art/npcs/np_bouncer.webp",
  rc_orderly: "/art/npcs/rc_orderly.webp",
  rc_security: "/art/npcs/rc_security.webp",
  ...NPC_ART_EXTRA,
  ...NPC_ART_DENSITY,
};

export const CONTACT_ART: Record<string, string> = {
  reed: "/art/contacts/reed.webp",
  mara: "/art/contacts/mara.webp",
  kilo: "/art/contacts/kilo.webp",
  ivy: "/art/contacts/ivy.webp",
  nix: "/art/contacts/nix.webp",
  soot: "/art/contacts/soot.webp",
  wren: "/art/contacts/wren.webp",
  calder: "/art/contacts/calder.webp",
  quill: "/art/contacts/quill.webp",
  joss: "/art/contacts/joss.webp",
  haze: "/art/contacts/haze.webp",
  pike: "/art/contacts/pike.webp",
  vex: "/art/contacts/vex.webp",
};

/** Career board thumbs — keyed by job id (unique art per rank) */
export const JOB_ART: Record<string, string> = {
  retail_1: "/art/jobs/retail_1.webp",
  retail_2: "/art/jobs/retail_2.webp",
  retail_3: "/art/jobs/retail_3.webp",
  kitchen_1: "/art/jobs/kitchen_1.webp",
  kitchen_2: "/art/jobs/kitchen_2.webp",
  kitchen_3: "/art/jobs/kitchen_3.webp",
  warehouse_1: "/art/jobs/warehouse_1.webp",
  warehouse_2: "/art/jobs/warehouse_2.webp",
  warehouse_3: "/art/jobs/warehouse_3.webp",
  dock_1: "/art/jobs/dock_1.webp",
  dock_2: "/art/jobs/dock_2.webp",
  dock_3: "/art/jobs/dock_3.webp",
  driver_1: "/art/jobs/driver_1.webp",
  driver_2: "/art/jobs/driver_2.webp",
  driver_3: "/art/jobs/driver_3.webp",
  orderly_1: "/art/jobs/orderly_1.webp",
  orderly_2: "/art/jobs/orderly_2.webp",
  orderly_3: "/art/jobs/orderly_3.webp",
  casino_1: "/art/jobs/casino_1.webp",
  casino_2: "/art/jobs/casino_2.webp",
  casino_3: "/art/jobs/casino_3.webp",
  citydesk_1: "/art/jobs/citydesk_1.webp",
  citydesk_2: "/art/jobs/citydesk_2.webp",
  citydesk_3: "/art/jobs/citydesk_3.webp",
  ...JOB_ART_EXTRA,
};

/** Gym track strips — keyed by store stat */
export const GYM_TRACK_ART: Record<string, string> = {
  str: "/art/gym/str.webp",
  def: "/art/gym/def.webp",
  spd: "/art/gym/spd.webp",
  dex: "/art/gym/dex.webp",
};

export const PROPERTY_ART: Record<string, string> = {
  gr_walkup: "/art/properties/gr_walkup.webp",
  gr_loft: "/art/properties/gr_loft.webp",
  ms_flat: "/art/properties/ms_flat.webp",
  ms_row: "/art/properties/ms_row.webp",
  ms_shed: "/art/properties/ms_shed.webp",
  dr_cot: "/art/properties/dr_cot.webp",
  dr_bay: "/art/properties/dr_bay.webp",
  dr_safe: "/art/properties/dr_safe.webp",
  ac_studio: "/art/properties/ac_studio.webp",
  ac_wardflat: "/art/properties/ac_wardflat.webp",
  sy_condo: "/art/properties/sy_condo.webp",
  sy_pent: "/art/properties/sy_pent.webp",
  oc_room: "/art/properties/oc_room.webp",
  oc_walkup: "/art/properties/oc_walkup.webp",
  np_booth: "/art/properties/np_booth.webp",
  np_loft: "/art/properties/np_loft.webp",
  rc_bunk: "/art/properties/rc_bunk.webp",
  rc_suite: "/art/properties/rc_suite.webp",
  ...PROPERTY_ART_DENSITY,
};

export const AWARD_CAT_ART: Record<string, string> = {
  crime: "/art/awards/crime.webp",
  work: "/art/awards/work.webp",
  money: "/art/awards/money.webp",
  body: "/art/awards/body.webp",
  city: "/art/awards/city.webp",
  story: "/art/awards/story.webp",
};

export const GIG_ART: Record<string, string> = {
  courier_drop: "/art/gigs/courier_drop.webp",
  data_entry: "/art/gigs/data_entry.webp",
  night_watch: "/art/gigs/night_watch.webp",
  tutoring: "/art/gigs/tutoring.webp",
  pier_walk: "/art/gigs/pier_walk.webp",
  campus_filing: "/art/gigs/campus_filing.webp",
  freight_assist: "/art/gigs/freight_assist.webp",
  civic_clipboard: "/art/gigs/civic_clipboard.webp",
  clinic_aide: "/art/gigs/clinic_aide.webp",
  locksmith_call: "/art/gigs/locksmith_call.webp",
  bike_courier: "/art/gigs/bike_courier.webp",
  market_stall: "/art/gigs/market_stall.webp",
  trash_route: "/art/gigs/trash_route.webp",
  neon_flyer: "/art/gigs/neon_flyer.webp",
  ward_errands: "/art/gigs/ward_errands.webp",
  spire_reception: "/art/gigs/spire_reception.webp",
  ledger_audit: "/art/gigs/ledger_audit.webp",
  container_count: "/art/gigs/container_count.webp",
  lab_cleanup: "/art/gigs/lab_cleanup.webp",
  parking_patrol: "/art/gigs/parking_patrol.webp",
  moving_crew: "/art/gigs/moving_crew.webp",
  food_runner: "/art/gigs/food_runner.webp",
  library_shelve: "/art/gigs/library_shelve.webp",
  ferry_ticket: "/art/gigs/ferry_ticket.webp",
  event_setup: "/art/gigs/event_setup.webp",
  blood_drive: "/art/gigs/blood_drive.webp",
  yard_sweep: "/art/gigs/yard_sweep.webp",
  translate_desk: "/art/gigs/translate_desk.webp",
  cold_storage: "/art/gigs/cold_storage.webp",
  shelter_shift: "/art/gigs/shelter_shift.webp",
  press_run: "/art/gigs/press_run.webp",
  tool_lend: "/art/gigs/tool_lend.webp",
  museum_rope: "/art/gigs/museum_rope.webp",
  ambulance_stock: "/art/gigs/ambulance_stock.webp",
  invoice_match: "/art/gigs/invoice_match.webp",
};

export const DISTRICT_ART: Record<string, string> = {
  glassrow: "/art/districts/glassrow.webp",
  millstone: "/art/districts/millstone.webp",
  docksreach: "/art/districts/docksreach.webp",
  ashcourt: "/art/districts/ashcourt.webp",
  spireyard: "/art/districts/spireyard.webp",
  oldcommons: "/art/districts/oldcommons.webp",
  neonpier: "/art/districts/neonpier.webp",
  redclinic: "/art/districts/redclinic.webp",
};

export const HEIST_ART: Record<string, string> = {
  tram_skim: "/art/heists/tram_skim.webp",
  yard_boost: "/art/heists/yard_boost.webp",
  commons_sweep: "/art/heists/commons_sweep.webp",
  bay_pierce: "/art/heists/bay_pierce.webp",
  ward_diversion: "/art/heists/ward_diversion.webp",
  spire_float: "/art/heists/spire_float.webp",
  soft_house_run: "/art/heists/soft_house_run.webp",
  bond_desk: "/art/heists/bond_desk.webp",
  neon_till: "/art/heists/neon_till.webp",
  gallery_wire: "/art/heists/gallery_wire.webp",
  loft_mail: "/art/heists/loft_mail.webp",
  pallet_ghost: "/art/heists/pallet_ghost.webp",
  substation_siphon: "/art/heists/substation_siphon.webp",
  chop_lane: "/art/heists/chop_lane.webp",
  crane_blind: "/art/heists/crane_blind.webp",
  cold_chain: "/art/heists/cold_chain.webp",
  ambulance_divert: "/art/heists/ambulance_divert.webp",
  evidence_soft: "/art/heists/evidence_soft.webp",
  clinic_ledger: "/art/heists/clinic_ledger.webp",
  courier_swap: "/art/heists/courier_swap.webp",
  penthouse_skim: "/art/heists/penthouse_skim.webp",
  stoop_tax: "/art/heists/stoop_tax.webp",
  race_bag: "/art/heists/race_bag.webp",
  alley_stash: "/art/heists/alley_stash.webp",
};

export const HEIST_HERO = "/art/heists/hero.webp";

export const SAFEHOUSE_ROOM_ART: Record<string, string> = {
  vault: "/art/safehouse/vault.webp",
  cot: "/art/safehouse/cot.webp",
  study: "/art/safehouse/study.webp",
  armory: "/art/safehouse/armory.webp",
  garage: "/art/safehouse/garage.webp",
};

export const SAFEHOUSE_HERO = "/art/safehouse/hero.webp";

export const CODEX_HERO = "/art/codex/hero.webp";
export const NEWSPAPER_HERO = "/art/newspaper/hero.webp";
export const TIMELINE_HERO = "/art/timeline/hero.webp";

export const BUSINESS_HERO = "/art/business/hero.webp";
export const BANK_HERO = "/art/bank/hero.webp";

export const BUSINESS_FRONT_ART: Record<string, string> = {
  corner_laundry: "/art/business/corner_laundry.webp",
  courier_front: "/art/business/courier_front.webp",
  pawn_consortium: "/art/business/pawn_consortium.webp",
  holding_co: "/art/business/holding_co.webp",
};

export const FACTION_ART: Record<string, string> = {
  glass_syndicate: "/art/factions/glass_syndicate.webp",
  mill_iron: "/art/factions/mill_iron.webp",
  dock_covenant: "/art/factions/dock_covenant.webp",
  civic_veil: "/art/factions/civic_veil.webp",
};
export const FACTION_HERO = "/art/factions/hero.webp";

export const RACE_ART: Record<string, string> = {
  alley_dash: "/art/raceway/alley_dash.webp",
  harbor_loop: "/art/raceway/harbor_loop.webp",
  commons_drift: "/art/raceway/commons_drift.webp",
  pier_sprint: "/art/raceway/pier_sprint.webp",
  spire_invite: "/art/raceway/spire_invite.webp",
  mill_night: "/art/raceway/mill_night.webp",
};
export const RACEWAY_HERO = "/art/raceway/hero.webp";

export const BOUNTIES_HERO = "/art/bounties/hero.webp";
export const CASINO_HERO = "/art/casino/lobby.webp";
export const CONTACTS_HERO = "/art/contacts/hero.webp";
export const GYMNASIUM_HERO = "/art/gym/hero.webp";
export const AWARDS_HERO = "/art/awards/hero.webp";
export const HOSPITAL_HERO = "/art/hospital/hero.webp";
export const HOSPITAL_WARD = "/art/hospital/ward.webp";
export const JAIL_HERO = "/art/jail/hero.webp";
export const JAIL_BLOCK = "/art/jail/block.webp";

export const LEISURE_ART: Record<string, string> = {
  dive_bar: "/art/leisure/dive_bar.webp",
  cafe_sit: "/art/leisure/cafe_sit.webp",
  clinic_chair: "/art/leisure/clinic_chair.webp",
  therapy: "/art/leisure/therapy.webp",
  cot_rest: "/art/leisure/cot_rest.webp",
};

/** Legacy career thumbs (rank-1 aliases) — kept for any hero fallbacks */
export const CAREER_ART: Record<string, string> = {
  retail: "/art/jobs/retail.webp",
  kitchen: "/art/jobs/kitchen.webp",
  warehouse: "/art/jobs/warehouse.webp",
  dockhand: "/art/jobs/dockhand.webp",
  driver: "/art/jobs/driver.webp",
  orderly: "/art/jobs/orderly.webp",
  casino: "/art/jobs/casino.webp",
  citydesk: "/art/jobs/citydesk.webp",
  ...CAREER_ART_EXTRA,
};

export const VEX_ART = "/art/contacts/vex.webp";

/** Shared focal crop so faces / landmarks sit above the fold */
const HERO_BG_POS = "center 30%";
const CARD_BG_POS = "center 30%";

export function CrimeArt({ crimeId, locked }: { crimeId: string; locked?: boolean }) {
  const photo = CRIME_ART[crimeId];
  const scene = SCENES[crimeId] ?? {
    bg: "linear-gradient(145deg,#121212,#1a1a22)",
    accent: "#666",
    label: "op",
  };

  return (
    <div
      style={{
        position: "relative",
        height: 240,
        background: photo
          ? `${CARD_BG_POS}/cover no-repeat url(${photo}), ${scene.bg}`
          : scene.bg,
        overflow: "hidden",
        opacity: locked ? 0.5 : 1,
        filter: locked ? "grayscale(0.75) brightness(0.7)" : undefined,
      }}
    >
      {!photo && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(255,255,255,0.02) 2px,rgba(255,255,255,0.02) 3px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -10,
              width: 80,
              height: 160,
              background: `linear-gradient(180deg,${scene.accent}55,transparent)`,
              transform: "rotate(18deg)",
              filter: "blur(1px)",
            }}
          />
          <svg viewBox="0 0 200 110" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden>
            <rect x="10" y="50" width="40" height="60" fill="rgba(0,0,0,0.45)" />
            <rect x="55" y="35" width="28" height="75" fill="rgba(0,0,0,0.5)" />
            <rect x="130" y="40" width="50" height="70" fill="rgba(0,0,0,0.4)" />
            <circle cx="160" cy="30" r="18" fill={`${scene.accent}33`} />
            <path d="M0 90 Q50 70 100 85 T200 75 L200 110 L0 110 Z" fill="rgba(0,0,0,0.35)" />
          </svg>
        </>
      )}
      {/* bottom vignette for photo readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none",
        }}
      />
      {locked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/ui/locked.webp" alt="" width={48} height={48} style={{ objectFit: "cover", borderRadius: 2, opacity: 0.9 }} />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 6,
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.65)",
          textShadow: "0 1px 2px #000",
        }}
      >
        {scene.label}
      </div>
    </div>
  );
}

export function PageHero({
  title,
  subtitle,
  tone = "default",
  image,
  tall,
  children,
}: {
  title: string;
  subtitle?: string;
  tone?: "default" | "crime" | "gym" | "city" | "casino" | "hospital" | "jail" | "campus";
  image?: string;
  tall?: boolean;
  children?: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem("nw-hero-strip") === "1") {
        setCollapsed(true);
      } else if (typeof window !== "undefined") {
        sessionStorage.setItem("nw-hero-strip", "1");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const tones: Record<string, string> = {
    default: "linear-gradient(120deg,#1a1a22 0%,#121218 60%,#0e0e10 100%)",
    crime: "linear-gradient(120deg,#1c1014 0%,#2a1520 40%,#0e0e10 100%)",
    gym: "linear-gradient(120deg,#101418 0%,#1a2830 45%,#0e0e10 100%)",
    city: "linear-gradient(120deg,#12141c 0%,#1c2438 45%,#0e0e10 100%)",
    casino: "linear-gradient(120deg,#1a1408 0%,#3a2810 40%,#0e0e10 100%)",
    hospital: "linear-gradient(120deg,#0e1418 0%,#183038 45%,#0e0e10 100%)",
    jail: "linear-gradient(120deg,#121418 0%,#1a2228 45%,#0e0e10 100%)",
    campus: "linear-gradient(120deg,#14161c 0%,#243048 40%,#0e0e10 100%)",
  };

  const strip = collapsed;
  const style: CSSProperties = {
    position: "relative",
    margin: "-6px -12px 12px",
    padding: strip
      ? "6px var(--hero-pad-x)"
      : tall
        ? "var(--hero-pad-y) var(--hero-pad-x)"
        : "8px var(--hero-pad-x)",
    minHeight: strip ? "var(--hero-strip-h)" : tall ? "var(--hero-min-h-tall)" : image ? "var(--hero-min-h)" : undefined,
    background: image
      ? `linear-gradient(105deg,rgba(8,8,10,0.92) 0%,rgba(8,8,10,0.55) 45%,rgba(8,8,10,0.75) 100%), ${HERO_BG_POS}/cover no-repeat url(${image})`
      : tones[tone],
    borderBottom: "1px solid var(--border)",
    overflow: "hidden",
  };

  return (
    <div style={style}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(255,255,255,0.015) 3px,rgba(255,255,255,0.015) 4px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: 640,
          display: "flex",
          alignItems: strip ? "center" : "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontSize: strip ? 15 : "var(--hero-title)",
              letterSpacing: "0.04em",
              fontWeight: 700,
              textShadow: image ? "0 2px 8px rgba(0,0,0,0.85)" : undefined,
            }}
          >
            {title}
          </h1>
          {!strip && subtitle && (
            <p
              style={{
                margin: "4px 0 0",
                color: "var(--text-dim)",
                fontSize: 11,
                lineHeight: 1.35,
                textShadow: image ? "0 1px 4px rgba(0,0,0,0.9)" : undefined,
              }}
            >
              {subtitle}
            </p>
          )}
          {!strip && children}
        </div>
        <button
          type="button"
          onClick={() => {
            setCollapsed((c) => {
              const next = !c;
              try {
                sessionStorage.setItem("nw-hero-strip", next ? "1" : "0");
              } catch {
                /* ignore */
              }
              return next;
            });
          }}
          style={{
            flexShrink: 0,
            background: "var(--bg-inset)",
            border: "1px solid var(--border)",
            color: "var(--text-dim)",
            fontSize: 10,
            padding: "2px 6px",
            cursor: "pointer",
            borderRadius: "var(--r1)",
          }}
          aria-label={strip ? "Expand hero" : "Collapse hero"}
        >
          {strip ? "▾" : "▴"}
        </button>
      </div>
    </div>
  );
}

/** Full-bleed scene panel used to kill empty voids */
export function SceneBanner({
  image,
  title,
  subtitle,
  height = 160,
  footer,
}: {
  image: string;
  title?: string;
  subtitle?: string;
  height?: number;
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        height,
        border: "1px solid var(--border)",
        borderRadius: "var(--r1)",
        overflow: "hidden",
        background: `${HERO_BG_POS}/cover no-repeat url(${image}), #121218`,
        marginBottom: 12,
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.25) 55%,rgba(0,0,0,0.5) 100%)",
        }}
      />
      <div style={{ position: "relative", padding: 14, maxWidth: 420 }}>
        {title && (
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.03em" }}>{title}</div>
        )}
        {subtitle && (
          <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: 12 }}>{subtitle}</p>
        )}
        {footer}
      </div>
    </div>
  );
}

export function ArtTile({
  image,
  title,
  subtitle,
  locked,
  badge,
  children,
  onClick,
  disabled,
}: {
  image: string;
  title: string;
  subtitle?: string;
  locked?: boolean;
  badge?: string;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <article
      style={{
        border: "1px solid var(--border)",
        background: "linear-gradient(165deg,#222228 0%,var(--bg-panel) 100%)",
        borderRadius: "var(--r1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: locked || disabled ? 0.72 : 1,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 168,
          background: `${CARD_BG_POS}/cover no-repeat url(${image}), #151518`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg,transparent 35%,rgba(0,0,0,0.78))",
          }}
        />
        {locked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(0,0,0,0.45)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/ui/locked.webp" alt="" width={44} height={44} style={{ objectFit: "cover", borderRadius: 2 }} />
          </div>
        )}
        {badge && (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: 10,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 6px",
              border: "1px solid var(--border-strong)",
              background: "rgba(0,0,0,0.65)",
              color: locked ? "var(--text-dim)" : "var(--text)",
            }}
          >
            {badge}
          </span>
        )}
        <div style={{ position: "absolute", left: 10, bottom: 8, right: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, textShadow: "0 1px 3px #000" }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "rgba(220,220,220,0.75)", marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
      </div>
      {children && (
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>{children}</div>
      )}
      {onClick && (
        <div style={{ padding: "0 10px 10px" }}>
          <button
            type="button"
            disabled={disabled || locked}
            onClick={onClick}
            style={{
              width: "100%",
              height: 26,
              cursor: disabled || locked ? "not-allowed" : "pointer",
              border: "1px solid var(--border-strong)",
              background: locked ? "var(--bg-inset)" : "linear-gradient(180deg,#2e2e36,var(--bg-inset))",
              color: "var(--text)",
              fontSize: 12,
            }}
          >
            {locked ? "Locked" : "Play"}
          </button>
        </div>
      )}
    </article>
  );
}

export const SCHOOL_ART: Record<string, string> = {
  "Street Electives": "/art/campus/street.webp",
  "Commerce & Finance": "/art/campus/commerce.webp",
  "Harbor & Logistics": "/art/campus/harbor.webp",
  "Med & Civic": "/art/campus/med.webp",
  "Locks & Entry": "/art/campus/locks.webp",
  "Systems & Signals": "/art/campus/systems.webp",
};

/** Per-course plate art — keyed by course id */
export const COURSE_ART: Record<string, string> = {
  se1: "/art/campus/courses/se1.webp",
  se2: "/art/campus/courses/se2.webp",
  se3: "/art/campus/courses/se3.webp",
  se4: "/art/campus/courses/se4.webp",
  se5: "/art/campus/courses/se5.webp",
  cf1: "/art/campus/courses/cf1.webp",
  cf2: "/art/campus/courses/cf2.webp",
  cf3: "/art/campus/courses/cf3.webp",
  cf4: "/art/campus/courses/cf4.webp",
  hl1: "/art/campus/courses/hl1.webp",
  hl2: "/art/campus/courses/hl2.webp",
  hl3: "/art/campus/courses/hl3.webp",
  hl4: "/art/campus/courses/hl4.webp",
  mc1: "/art/campus/courses/mc1.webp",
  mc2: "/art/campus/courses/mc2.webp",
  mc3: "/art/campus/courses/mc3.webp",
  mc4: "/art/campus/courses/mc4.webp",
  le1: "/art/campus/courses/le1.webp",
  le2: "/art/campus/courses/le2.webp",
  le3: "/art/campus/courses/le3.webp",
  sy1: "/art/campus/courses/sy1.webp",
  sy2: "/art/campus/courses/sy2.webp",
  sy3: "/art/campus/courses/sy3.webp",
  sy4: "/art/campus/courses/sy4.webp",
  ...COURSE_ART_EXTRA,
};
