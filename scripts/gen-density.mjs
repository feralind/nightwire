/**
 * One-shot generator for content density EXTRA modules.
 * Run: node scripts/gen-density.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve("src/content/density");
fs.mkdirSync(ROOT, { recursive: true });

const DISTRICTS = [
  "glassrow",
  "millstone",
  "docksreach",
  "ashcourt",
  "spireyard",
  "oldcommons",
  "neonpier",
  "redclinic",
];

const DIST_SHORT = {
  glassrow: "gr",
  millstone: "ms",
  docksreach: "dr",
  ashcourt: "ac",
  spireyard: "sy",
  oldcommons: "oc",
  neonpier: "np",
  redclinic: "rc",
};

const DIST_NAME = {
  glassrow: "Glassrow",
  millstone: "Millstone",
  docksreach: "DocksReach",
  ashcourt: "Ashcourt",
  spireyard: "SpireYard",
  oldcommons: "OldCommons",
  neonpier: "Neon Pier",
  redclinic: "Red Clinic",
};

function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function q(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// ——— ITEMS (~160 new → ~209 total) ———
const itemSeeds = [
  // tools
  ["micro_shim", "Micro shim", "tool", 95, 2, "Thin steel for soft latches."],
  ["pickup_gun", "Pick gun", "tool", 1100, 6, "Noisy if you rush the pins."],
  ["torque_wrench", "Torque wrench", "tool", 280, 3, "Turns stubborn fasteners quietly enough."],
  ["glass_cutter", "Glass cutter", "tool", 420, 4, "Score, tap, lift. Watch the edges."],
  ["bump_key", "Bump key set", "tool", 650, 5, "Old doors love bad habits."],
  ["signal_jammer", "Pocket jammer", "tool", 3200, 7, "Short window on cheap cameras."],
  ["key_cloner", "Key cloner wand", "tool", 2800, 6, "Copies soft blanks in a heartbeat."],
  ["pry_wedge", "Silent pry wedge", "tool", 140, 2, "Door gaps without the clang."],
  ["fiber_scope", "Fiber scope", "tool", 1900, 5, "See past the gap before you commit."],
  ["magnet_wand", "Magnet wand", "tool", 360, 3, "Pulls pins and cheap sensors."],
  ["ladder_hooks", "Roof ladder hooks", "tool", 220, 2, "Up without asking the lobby."],
  ["duct_tape_pro", "Industrial tape roll", "tool", 45, 1, "Mouths, hinges, and temporary seals."],
  ["multimeter", "Pocket multimeter", "tool", 180, 2, "Know when the wire is live."],
  ["usb_drop", "USB drop stick", "tool", 900, 4, "Plant and walk. Firmware does the rest."],
  ["rfid_spoof", "RFID spoof fob", "tool", 2400, 6, "Badges that blink friendly for a minute."],
  ["window_suction", "Window cups", "tool", 160, 2, "Lift panes without shattered nerves."],
  ["chain_breaker", "Chain breaker", "tool", 310, 3, "Bike locks and dock chains."],
  ["safe_dial_cam", "Dial camera", "tool", 1500, 5, "Watch the wheel without leaning in."],
  ["noise_blankets", "Noise blankets", "tool", 480, 3, "Muffles drills in soft rooms."],
  ["laser_mic", "Laser mic kit", "tool", 4100, 8, "Listen through glass. Expensive ears."],
  ["cord_ladder", "Cord ladder", "tool", 340, 3, "Down the alley side of tall problems."],
  ["lock_spray", "Lock graphite", "tool", 55, 1, "Sticky pins become polite."],
  ["hinge_pins", "Hinge pin punch", "tool", 90, 2, "Doors open the wrong way on purpose."],
  ["camera_hood", "Camera hood", "tool", 210, 2, "Blackout a lens for one sweep."],
  ["dock_pass", "Dock day pass", "tool", 700, 3, "Looks temporary. Works temporary."],
  ["valve_key", "Valve key", "tool", 130, 2, "Utility rooms pretend to be locked."],
  ["soft_hammer", "Dead-blow mallet", "tool", 190, 2, "Impact without the ring."],
  ["tie_wraps", "Heavy zip ties", "tool", 35, 1, "Temporary restraints and cable management."],
  ["paint_marker", "UV paint marker", "tool", 70, 1, "Mark drops only you can see."],
  ["spare_batteries", "Spare cells", "tool", 40, 1, "Keep scanners awake past midnight."],
  // weapons
  ["stun_ring", "Stun ring", "weapon", 420, null, "Close handshake with teeth."],
  ["sap_glove", "Sap glove", "weapon", 380, null, "Weighted palm. Quiet bruise."],
  ["pipe_short", "Short pipe", "weapon", 90, null, "Found metal with intent."],
  ["taser_pocket", "Pocket taser", "weapon", 900, null, "One click of persuasion."],
  ["garrote_wire", "Garrote wire", "weapon", 260, null, "Ugly option. Works."],
  ["throwing_knife", "Throwing knife", "weapon", 310, null, "Reach without commitment."],
  ["expand_baton", "Expandable baton", "weapon", 640, null, "Collapses into a jacket."],
  ["pepper_gel", "Pepper gel", "weapon", 120, null, "Crowd control in a can."],
  ["steel_toes", "Steel-toe inserts", "weapon", 180, null, "Kick with receipts."],
  ["chain_whip", "Bike chain whip", "weapon", 150, null, "Commons classic."],
  ["needle_spike", "Needle spike", "weapon", 200, null, "Clinic-adjacent menace."],
  ["blackjack", "Leather blackjack", "weapon", 340, null, "Old school soft knock."],
  // armor
  ["leather_jacket", "Lined leather", "armor", 1600, null, "Looks like fashion. Acts like padding."],
  ["chain_shirt", "Chain shirt", "armor", 3400, null, "Heavy under a hoodie."],
  ["trauma_plates", "Trauma plates", "armor", 6100, null, "Stops the first bad idea."],
  ["riot_helmet", "Riot helmet", "armor", 2200, null, "Face stays attached."],
  ["cut_gloves", "Cut-resistant gloves", "armor", 280, null, "Glass and knives argue less."],
  ["shin_guards", "Shin guards", "armor", 420, null, "Alley kicks bounce."],
  ["neck_guard", "Neck guard", "armor", 900, null, "Ugly accessory that saves throats."],
  ["ballistic_hoodie", "Ballistic hoodie", "armor", 4800, null, "Street fashion with a rating."],
  ["clinic_apron", "Lead clinic apron", "armor", 1100, null, "Looks medical. Stops scrapes."],
  ["dock_harness", "Dock harness", "armor", 750, null, "Fall arrest and punch absorb."],
  // consumables
  ["smoke_tabs", "Smoke tabs", "consumable", 80, null, "+8 happy, soft cover myth."],
  ["calm_tea", "Calm tea", "consumable", 45, null, "-6 stress, warm hands."],
  ["sugar_rush", "Sugar rush pack", "consumable", 20, null, "+8 happy, short buzz."],
  ["blood_patch", "Blood patch", "consumable", 110, null, "+18 life, sticky."],
  ["nerve_tonic", "Nerve tonic", "consumable", 140, null, "-8 stress, sharper feel."],
  ["ice_pack", "Gel ice pack", "consumable", 35, null, "+8 life, -3 stress."],
  ["antibiotic", "Street antibiotics", "consumable", 95, null, "+12 life over a slow hour."],
  ["sleeping_draft", "Sleeping draft", "consumable", 160, null, "-12 stress, heavy eyelids."],
  ["steroid_shot", "Gray-market shot", "consumable", 280, null, "+20 life, loud heart."],
  ["detox_charcoal", "Detox charcoal", "consumable", 70, null, "-5 stress, bitter exit."],
  ["bandage_kit", "Field bandage kit", "consumable", 55, null, "+14 life."],
  ["caffeine_tabs", "Caffeine tabs", "consumable", 30, null, "+6 happy, jitter tax."],
  ["morphine_vial", "Morphine vial", "consumable", 320, null, "+30 life, -10 stress."],
  ["epinephrine", "Epi pen street", "consumable", 240, null, "+22 life fast."],
  ["herbal_wrap", "Herbal wrap", "consumable", 50, null, "+10 life, smells like Millstone."],
  ["booster_vial", "Booster vial", "consumable", 180, null, "+15 life, +5 happy."],
  ["salt_tabs", "Salt tabs", "consumable", 25, null, "+5 life after a long walk."],
  ["lube_spray", "Quiet hinge oil", "consumable", 40, null, "Doors stop announcing you."],
  ["chalk_dust", "Chalk dust pouch", "consumable", 15, null, "Prints smear. Cheap trick."],
  ["flare_stick", "Flare stick", "consumable", 60, null, "Distraction light. Hot exit."],
  ["foam_earplugs", "Foam earplugs", "consumable", 12, null, "-2 stress in loud rooms."],
  ["glucose_gel", "Glucose gel", "consumable", 22, null, "+6 happy, quick sugar."],
  ["antiseptic", "Antiseptic spray", "consumable", 48, null, "+10 life, sting included."],
  ["cooling_rag", "Cooling rag", "consumable", 18, null, "-4 stress, pier nights."],
  ["ward_snack", "Ward snack pack", "consumable", 28, null, "+10 happy, clinic vending."],
  ["pier_soda", "Pier soda", "consumable", 16, null, "+7 happy, neon sugar."],
  // misc
  ["blank_invoice", "Blank invoice pad", "misc", 220, null, "Paper that looks like money owed."],
  ["courier_tag", "Courier route tag", "misc", 180, null, "Bags move when tags match."],
  ["pawn_ticket", "Warm pawn ticket", "misc", 90, null, "Someone else's collateral."],
  ["usb_dead", "Dead drop USB", "misc", 400, null, "Encrypted nothing until it isn't."],
  ["press_pass", "Press pass blank", "misc", 850, null, "Lobby doors love clipboards."],
  ["valet_chip", "Valet chip", "misc", 320, null, "Cars that aren't yours answer."],
  ["hotel_key", "Hotel master blank", "misc", 1200, null, "Soft floors, softer locks."],
  ["tram_pass", "All-night tram pass", "misc", 60, null, "Ride without questions."],
  ["locker_tag", "Gym locker tag", "misc", 40, null, "Wrong locker, right contents."],
  ["cargo_seal", "Cargo seal stamp", "misc", 980, null, "Manifest fiction in rubber."],
  ["clinic_badge", "Clinic visitor badge", "misc", 540, null, "Ward doors blink once."],
  ["festival_wrist", "Festival wristband", "misc", 75, null, "Crowds become cover."],
  ["spy_mirror", "Spy mirror", "misc", 110, null, "Corners stop surprising you."],
  ["voice_changer", "Voice changer", "misc", 700, null, "Calls that aren't your throat."],
  ["map_annotated", "Annotated alley map", "misc", 150, null, "Shortcuts the tram ignores."],
  ["bribe_envelope", "Bribe envelope", "misc", 2000, null, "Cash shaped like a problem solved."],
  ["witness_photo", "Witness polaroid", "misc", 300, null, "Leverage that fits a pocket."],
  ["counterfeit_chip", "Counterfeit chip", "misc", 450, null, "Cage math with a limp."],
  ["shipping_label", "Shipping label kit", "misc", 260, null, "Crates go where paper says."],
  ["burner_phone", "Burner phone", "misc", 120, null, "One conversation, then trash."],
  ["sim_pack", "Prepaid SIM pack", "misc", 80, null, "Numbers that expire with the night."],
  ["notebook_cipher", "Cipher notebook", "misc", 190, null, "Names in a grammar only you keep."],
  ["dummy_wallet", "Dummy wallet", "misc", 55, null, "Give them something to steal."],
  ["decoy_bag", "Decoy courier bag", "misc", 340, null, "Heavy sand, light consequences."],
  ["evidence_bag", "Evidence bag blank", "misc", 160, null, "Looks official. Isn't."],
  ["key_ring_dummy", "Dummy key ring", "misc", 45, null, "Jingles like authority."],
  ["parking_permit", "Parking permit fake", "misc", 210, null, "Spire curb theater."],
  ["club_stamp", "Club re-entry stamp", "misc", 35, null, "Pier doors remember ink."],
  // flex
  ["silver_rings", "Silver ring stack", "flex", 3200, null, "Respect that stacks on knuckles."],
  ["silk_scarf", "Silk scarf", "flex", 1800, null, "Soft money signal."],
  ["designer_shades", "Designer shades", "flex", 2600, null, "Eyes that don't flinch."],
  ["cufflinks", "Spire cufflinks", "flex", 5200, null, "Lobby grammar."],
  ["fur_collar", "Fur collar wrap", "flex", 7800, null, "Neon cold-weather flex."],
  ["custom_sneakers", "Custom sneakers", "flex", 2400, null, "Street respect underfoot."],
  ["platinum_tooth", "Platinum tooth", "flex", 4100, null, "Smile that invoices."],
  ["leather_briefcase", "Leather briefcase", "flex", 3600, null, "Looks like clean work."],
  ["monogram_case", "Monogram case", "flex", 6400, null, "Initials the desk notices."],
  ["velvet_blazer", "Velvet blazer", "flex", 8900, null, "Pier VIP without the rope."],
  ["diamond_stud", "Diamond stud", "flex", 12000, null, "One stone, many stares."],
  ["chrome_lighter", "Chrome lighter", "flex", 900, null, "Click that ends arguments."],
  ["perfume_vial", "Signature perfume", "flex", 1400, null, "Walk into a room already known."],
  ["tailored_coat", "Tailored night coat", "flex", 11000, null, "Heat looks expensive in this cut."],
  ["obsidian_ring", "Obsidian ring", "flex", 4700, null, "Dark stone, darker rooms."],
  ["pearl_choker", "Pearl choker", "flex", 6800, null, "Boardwalk money on a throat."],
  ["ivory_comb", "Ivory comb", "flex", 2100, null, "Grooming as status."],
  ["gilt_flask", "Gilt flask", "flex", 3300, null, "Drinks that look like deals."],
  ["satin_gloves", "Satin gloves", "flex", 1900, null, "Soft hands, hard reputation."],
  ["opera_glasses", "Opera glasses", "flex", 2800, null, "Spire balconies love toys."],
];

// pad to 160+ with patterned variants
const toolPad = [
  "angle", "offset", "slim", "heavy", "quiet", "field", "night", "yard", "harbor", "ward",
  "mesh", "alloy", "carbon", "titanium", "ceramic", "polymer", "brass", "steel", "matte", "ghost",
];
const toolNouns = [
  "pick", "shim", "probe", "clamp", "hook", "snip", "driver", "bit", "scope", "fob",
];
let pad = 0;
while (itemSeeds.length < 160) {
  const adj = toolPad[pad % toolPad.length];
  const noun = toolNouns[Math.floor(pad / toolPad.length) % toolNouns.length];
  const id = `${adj}_${noun}_${pad}`;
  if (itemSeeds.some((x) => x[0] === id)) {
    pad++;
    continue;
  }
  const kind = pad % 5 === 0 ? "misc" : pad % 7 === 0 ? "consumable" : "tool";
  const mod = kind === "tool" ? 1 + (pad % 6) : null;
  const val = 40 + pad * 17;
  const name = `${adj[0].toUpperCase()}${adj.slice(1)} ${noun}`;
  const desc =
    kind === "consumable"
      ? `Field kit ${pad}. Soft recover.`
      : kind === "misc"
        ? `Fenceable ${noun}. Nightwire scrap #${pad}.`
        : `${name} for soft entry and stubborn doors.`;
  itemSeeds.push([id, name, kind, val, mod, desc]);
  pad++;
}

function emitItems() {
  const lines = [
    `import type { ItemDef } from "@/game/types";`,
    ``,
    `/** Density pack — shop/loadout volume. */`,
    `export const ITEMS_EXTRA: ItemDef[] = [`,
  ];
  for (const [id, name, kind, baseValue, toolMod, description] of itemSeeds) {
    const tm = toolMod != null ? `, toolMod: ${toolMod}` : "";
    lines.push(
      `  { id: ${q(id)}, name: ${q(name)}, kind: ${q(kind)}, baseValue: ${baseValue}${tm}, description: ${q(description)} },`
    );
  }
  lines.push(`];`, ``);
  fs.writeFileSync(path.join(ROOT, "itemsExtra.ts"), lines.join("\n"));
  return itemSeeds.length;
}

// ——— NPCs (~55 new → ~90) ———
const npcRoles = [
  { title: "Soft target", power: 16, str: 4, def: 3, spd: 9, dex: 7, life: 38, loot: [100, 240], heat: [3, 2], energy: 7 },
  { title: "Lookout", power: 22, str: 5, def: 5, spd: 11, dex: 10, life: 42, loot: [140, 300], heat: [4, 3], energy: 8 },
  { title: "Muscle", power: 34, str: 12, def: 10, spd: 7, dex: 6, life: 56, loot: [180, 400], heat: [5, 4], energy: 10 },
  { title: "Operator", power: 28, str: 8, def: 7, spd: 10, dex: 11, life: 48, loot: [200, 440], heat: [5, 3], energy: 9 },
  { title: "Fixer", power: 30, str: 7, def: 8, spd: 9, dex: 12, life: 50, loot: [220, 480], heat: [6, 3], energy: 9 },
  { title: "Enforcer", power: 40, str: 14, def: 12, spd: 6, dex: 7, life: 62, loot: [260, 560], heat: [7, 5], energy: 11 },
  { title: "Ghost", power: 26, str: 6, def: 6, spd: 13, dex: 12, life: 44, loot: [180, 420], heat: [5, 3], energy: 8 },
];

const npcNamePools = {
  glassrow: [
    ["gr_hostess", "Neon Hostess", "female", "slutty", "Clipboard smile at the velvet rope.", "Clipboard smile, velvet voice — she clocks your pulse before your name."],
    ["gr_dj", "Booth DJ", "male", null, "Headphones half-on. Knows every side door.", null],
    ["gr_valet", "Alley Valet", "male", null, "Keys on a ring that isn't yours yet.", null],
    ["gr_barista", "Late Barista", "female", null, "Steam and gossip in equal measure.", null],
    ["gr_pickpocket", "Tram Pick", "unknown", null, "Crowds are a second skin.", null],
    ["gr_promoter_f", "Guest-list Girl", "female", "slutty", "Wristbands and warmer promises.", "Wristbands, warmer promises — she stamps more than paper if you linger."],
    ["gr_cam_tech", "Camera Tech", "male", null, "Blind spots mapped in grease pencil.", null],
  ],
  millstone: [
    ["ms_crane_kid", "Crane Apprentice", "male", null, "Hard hat, soft nerves.", null],
    ["ms_parts_girl", "Parts Counter Girl", "female", null, "Catalog smile, warehouse keys.", null],
    ["ms_dog_man", "Yard Dog Handler", "male", null, "Whistle that ends arguments.", null],
    ["ms_welder_f", "Night Welder", "female", null, "Sparks and overtime.", null],
    ["ms_scrap", "Scrap Runner", "unknown", null, "Copper in the bag, heat in the walk.", null],
    ["ms_union", "Union Steward", "male", null, "Clipboard that can freeze a shift.", null],
    ["ms_forklift", "Forklift Ghost", "male", null, "Pallets that vanish on paper.", null],
  ],
  docksreach: [
    ["dr_bosun", "Night Bosun", "male", null, "Salt voice, crane radio.", null],
    ["dr_manifest", "Manifest Clerk", "female", null, "Stamps that never match crates.", null],
    ["dr_smuggle_f", "Bay Smuggler", "female", "slutty", "Container smiles and salt perfume.", "Container smiles, salt perfume — she loads more than freight if you tip right."],
    ["dr_rope", "Rope Hand", "male", null, "Knots faster than questions.", null],
    ["dr_customs_f", "Soft Customs", "female", null, "Badge that blinks for friends.", null],
    ["dr_pilot", "Harbor Pilot", "male", null, "Knows every dark channel.", null],
    ["dr_net", "Net Mender", "unknown", null, "Quiet pier work after midnight.", null],
  ],
  ashcourt: [
    ["ac_nurse", "Night Nurse", "female", null, "Ward light and softer threats.", null],
    ["ac_records", "Records Aide", "female", null, "Files that open doors.", null],
    ["ac_porter", "Clinic Porter", "male", null, "Gurneys and side corridors.", null],
    ["ac_advocate", "Civic Advocate", "female", null, "Clipboard justice, expensive favors.", null],
    ["ac_orderly_f", "Float Orderly", "female", null, "Codes for doors that shouldn't.", null],
    ["ac_guard_night", "Night Desk Guard", "male", null, "Metal detector boredom.", null],
    ["ac_phlebotomy", "Phlebotomist", "female", null, "Needles and quiet rooms.", null],
  ],
  spireyard: [
    ["sy_concierge", "Lobby Concierge", "male", null, "Names filed by zip code.", null],
    ["sy_pa", "Exec PA", "female", null, "Calendar that moves vaults.", null],
    ["sy_analyst_f", "Risk Analyst", "female", null, "Numbers that smell like heat.", null],
    ["sy_doorman", "Doorman", "male", null, "Umbrella and judgment.", null],
    ["sy_intern_f", "Spire Intern", "female", null, "Badge on a lanyard that opens soft floors.", null],
    ["sy_courier_lux", "Lux Courier", "male", null, "Boxes that never go through mail.", null],
    ["sy_host_f", "Penthouse Host", "female", "slutty", "Guest list with warmer footnotes.", "Guest list with warmer footnotes — she seats you closer if you ask nicely."],
  ],
  oldcommons: [
    ["oc_stoop", "Stoop Lookout", "male", null, "Sees every tram and tourist.", null],
    ["oc_auntie", "Stoop Auntie", "female", null, "Tea and threats in one cup.", null],
    ["oc_runner_f", "Alley Runner", "female", null, "Bags that change hands mid-block.", null],
    ["oc_bookie", "Corner Bookie", "male", null, "Odds written on a napkin.", null],
    ["oc_mechanic", "Basement Mechanic", "male", null, "Engines and alibis.", null],
    ["oc_vendor", "Night Vendor", "female", null, "Steam cart, warmer rumors.", null],
    ["oc_kid", "Message Kid", "unknown", null, "Fast feet, empty pockets on purpose.", null],
  ],
  neonpier: [
    ["np_dealer_2", "Chip Runner", "female", "slutty", "Warm plastic, colder math.", "Warm plastic, colder math — she deals like the night owes her a dance."],
    ["np_dancer", "Boardwalk Dancer", "female", "slutty", "Neon on skin, tips in pockets.", "Neon on skin, tips in pockets — she sells the smile before the song."],
    ["np_barker", "Pier Barker", "male", null, "Voice that pulls tourists sideways.", null],
    ["np_bartender", "Neon Bartender", "female", "slutty", "Drinks that double as invitations.", "Drinks that double as invitations — last call is a soft window if you linger."],
    ["np_tech", "Arcade Tech", "male", null, "Cabinets that pay sideways.", null],
    ["np_photo", "Photo Booth Girl", "female", null, "Strips that never make the board.", null],
    ["np_security_f", "Velvet Rope", "female", null, "List in one hand, radio in the other.", null],
  ],
  redclinic: [
    ["rc_triage", "Triage Nurse", "female", null, "Sirens are her metronome.", null],
    ["rc_emt", "Night EMT", "male", null, "Kits that open more than veins.", null],
    ["rc_admin", "Ward Admin", "female", null, "Badge doors and quiet books.", null],
    ["rc_janitor", "Night Janitor", "male", null, "Keys to every utility closet.", null],
    ["rc_psych", "Psych Float", "female", null, "Soft voice, hard files.", null],
    ["rc_supply", "Supply Clerk", "unknown", null, "Morphine counts that almost match.", null],
    ["rc_security_f", "Ward Security", "female", null, "Badge and boredom after midnight.", null],
  ],
};

function emitNpcs() {
  const lines = [
    `import type { NpcDef } from "@/game/types";`,
    ``,
    `/** Density pack — district attack pool volume. Slutty = female nightlife minority only. */`,
    `export const NPCS_EXTRA: NpcDef[] = [`,
  ];
  let count = 0;
  for (const d of DISTRICTS) {
    const pool = npcNamePools[d];
    pool.forEach((row, i) => {
      const [id, name, gender, persona, flavor, flavorSlutty] = row;
      const role = npcRoles[i % npcRoles.length];
      const genderLine = gender !== "unknown" ? `\n    gender: ${q(gender)},` : "";
      const personaLine = persona ? `\n    persona: ${q(persona)},` : "";
      const sluttyLine = flavorSlutty
        ? `\n    flavorSlutty: ${q(flavorSlutty)},`
        : "";
      lines.push(`  {
    id: ${q(id)},
    name: ${q(name)},
    title: ${q(role.title)},
    district: ${q(d)},
    power: ${role.power + (i % 3)},
    str: ${role.str},
    def: ${role.def},
    spd: ${role.spd},
    dex: ${role.dex},
    life: ${role.life},
    lootMin: ${role.loot[0]},
    lootMax: ${role.loot[1]},
    heatOnWin: ${role.heat[0]},
    heatOnLose: ${role.heat[1]},
    energyCost: ${role.energy},${genderLine}${personaLine}
    flavor: ${q(flavor)},${sluttyLine}
  },`);
      count++;
    });
  }
  lines.push(`];`, ``);
  fs.writeFileSync(path.join(ROOT, "npcsExtra.ts"), lines.join("\n"));
  return count;
}

// ——— PROPERTIES (12 new → 30) ———
const propExtra = [
  ["gr_sublet", "Tram Sublet", "glassrow", 9500, 150, 65, "Shared neon, shared excuses.", 0.85],
  ["gr_booth", "Wire Booth Flat", "glassrow", 21000, 300, 130, "Above the counter. Clean mail.", 0.55],
  ["ms_loft", "Mill Loft Bay", "millstone", 12500, 190, 80, "Winch access and dog treaties.", 1.0],
  ["dr_office", "Pier Office Lease", "docksreach", 18500, 250, 115, "Radios overnight. Salt in the vents.", 1.1],
  ["ac_lab", "Ashcourt Lab Share", "ashcourt", 16000, 240, 105, "White coats as cover rent.", 0.7],
  ["sy_suite", "Spire Mid Suite", "spireyard", 36000, 400, 190, "Not penthouse. Still invoices heat.", 0.45],
  ["oc_basement", "Commons Basement", "oldcommons", 5500, 95, 40, "Damp keys. Cheap silence.", 1.25],
  ["oc_roof", "Roof Shed Keys", "oldcommons", 7200, 120, 50, "Sightlines and pigeon diplomacy.", 1.1],
  ["np_cabin", "Boardwalk Cabin", "neonpier", 14000, 210, 95, "Neon through thin curtains.", 1.05],
  ["np_vip", "Pier VIP Closet", "neonpier", 26000, 320, 140, "Tiny, loud, expensive.", 0.85],
  ["rc_staff", "Staff Housing Wing", "redclinic", 11000, 170, 75, "Sirens included in rent.", 0.8],
  ["rc_quiet", "Quiet Observation Flat", "redclinic", 24000, 300, 130, "Badge doors, soft books.", 0.65],
];

function emitProperties() {
  const lines = [
    `import type { PropertyDef } from "@/game/types";`,
    ``,
    `export const PROPERTIES_EXTRA: PropertyDef[] = [`,
  ];
  for (const [id, name, district, cost, weeklyIncome, weeklyUpkeep, blurb, raidRisk] of propExtra) {
    lines.push(`  {
    id: ${q(id)},
    name: ${q(name)},
    district: ${q(district)},
    cost: ${cost},
    weeklyIncome: ${weeklyIncome},
    weeklyUpkeep: ${weeklyUpkeep},
    blurb: ${q(blurb)},
    raidRisk: ${raidRisk},
  },`);
  }
  lines.push(`];`, ``);
  fs.writeFileSync(path.join(ROOT, "propertiesExtra.ts"), lines.join("\n"));
  return propExtra.length;
}

// ——— AWARDS (~63 new → ~120) ———
const awardExtra = [];
const awardCats = ["crime", "work", "body", "city", "money", "story"];
const awardDefs = [
  ["petty_ten", "Ten Petty", "Ten petty attempts logged.", "crime", "mastery.petty.attempts", 10],
  ["petty_hundred", "Hundred Petty", "A hundred petty habits.", "crime", "mastery.petty.attempts", 100],
  ["street_fifty", "Fifty Street", "Fifty street attempts.", "crime", "mastery.street.attempts", 50],
  ["heavy_ten", "Ten Heavies", "Ten heavy clears.", "crime", "mastery.heavy.cashwins", 10],
  ["crime_250", "Quarter Wire", "Two-fifty crime attempts.", "crime", "crimesAttempted", 250],
  ["crime_500", "Half Wire", "Five hundred attempts under the wires.", "crime", "crimesAttempted", 500],
  ["board_ten", "Ten Boards", "Ten organized ops.", "crime", "heistsCompleted", 10],
  ["fail_ten", "Ten Burns", "Ten failed crimes. Still walking.", "crime", "crimeFails", 10],
  ["shift_100", "Hundred Shifts", "A hundred punches.", "work", "shiftsWorked", 100],
  ["gig_fifty", "Fifty Gigs", "Fifty short contracts.", "work", "gigsDone", 50],
  ["promote_five", "Five Promotes", "Five roster climbs.", "work", "promotions", 5],
  ["campus_ten", "Ten Transcripts", "Ten courses finished.", "work", "courses", 10],
  ["campus_twenty", "Twenty Transcripts", "Twenty courses stamped.", "work", "courses", 20],
  ["property_six", "Six Roofs", "Six keys on the ledger.", "money", "properties", 6],
  ["property_eight", "Eight Roofs", "A roof per district mood.", "money", "properties", 8],
  ["bank_50k", "Glass Nest 50k", "Fifty grand under glass.", "money", "bank", 50000],
  ["bank_100k", "Glass Nest 100k", "Six figures sleeping.", "money", "bank", 100000],
  ["networth_100k", "Hundred-Grand Glow", "Networth hits six figures.", "money", "networth", 100000],
  ["networth_250k", "Quarter-Mil Glow", "Networth quarter million.", "money", "networth", 250000],
  ["interest_2k", "Interest Flood", "Two thousand in interest.", "money", "interest", 2000],
  ["gym_100", "Hundred Iron", "A hundred gym sessions.", "body", "gym", 100],
  ["attack_25", "Twenty-Five Marks", "Twenty-five NPC wins.", "body", "attacksWon", 25],
  ["attack_50", "Fifty Marks", "Fifty fights won.", "body", "attacksWon", 50],
  ["jail_three", "Three Cells", "Jailed three times.", "body", "jailed", 3],
  ["hospital_three", "Three Wards", "Hospitalized three times.", "body", "hospital", 3],
  ["level_15", "Wire Fifteen", "Level 15 climb.", "city", "level", 15],
  ["level_20", "Wire Twenty", "Level 20 on the wire.", "city", "level", 20],
  ["heat_150", "Siren Choir", "Heat past 150.", "city", "peakHeat", 150],
  ["rank_fixer", "Fixer Ink", "Rank Fixer or better.", "city", "rankIndex", 4],
  ["rank_kingpin", "Kingpin Ink", "Kingpin title worn.", "city", "rankIndex", 9],
  ["contact_all", "Every Voice", "Used every contact once.", "story", "contactsAll", 12],
  ["favor_25", "Twenty-Five Favors", "Twenty-five contact uses.", "story", "contactUses", 25],
  ["tip_15", "Fifteen Tips", "Fifteen warm tips bought.", "story", "tips", 15],
  ["mission_five", "Five Contracts", "Five missions complete.", "story", "missions", 5],
  ["mission_fifteen", "Fifteen Contracts", "Fifteen missions closed.", "story", "missions", 15],
  ["district_glass_habit", "Glassrow Habit", "Twenty crimes in Glassrow.", "city", "distCrime", "glassrow"],
  ["district_pier_habit", "Pier Habit", "Twenty crimes at Neon Pier.", "city", "distCrime", "neonpier"],
  ["legit_25", "Civic Mask", "Legitimacy 25+.", "work", "legitimacy", 25],
  ["legit_50", "Civic Costume", "Legitimacy 50+.", "work", "legitimacy", 50],
  ["respect_20", "Street Nod", "Respect 20+.", "city", "respect", 20],
  ["respect_40", "Street Bow", "Respect 40+.", "city", "respect", 40],
  ["chain_five", "Five-Link Chain", "Crime chain of five.", "crime", "chain", 5],
  ["clean_10k", "Clean Ten", "Earn 10k clean lifetime.", "money", "cleanEarned", 10000],
  ["street_10k", "Street Ten", "Earn 10k street lifetime.", "money", "streetEarned", 10000],
  ["hybrid_life", "Hybrid Pulse", "Course active + 10 crimes.", "story", "hybrid", 10],
  ["safehouse_one", "First Room", "Any safehouse room level 1.", "money", "safehouse", 1],
  ["item_crowbar", "Crowbar Cred", "Own a crowbar.", "crime", "item", "crowbar"],
  ["item_lockpick", "Pins Cred", "Own lockpicks.", "crime", "item", "lockpick"],
  ["shopper", "Till Regular", "Buy ten shop items.", "money", "shopBuys", 10],
];

// pad awards to ~63 with patterned milestones
for (const a of awardDefs) awardExtra.push(a);
const padAwardNames = [
  "Midnight", "Neon", "Salt", "Brick", "Glass", "Ward", "Pier", "Spire", "Commons", "Harbor",
  "Wire", "Alley", "Vault", "Ledger", "Badge", "Tram", "Crane", "Clinic", "Festival", "Shadow",
];
let ai = 0;
while (awardExtra.length < 63) {
  const n = padAwardNames[ai % padAwardNames.length];
  const cat = awardCats[ai % awardCats.length];
  const id = `dens_${cat}_${ai}`;
  awardExtra.push([
    id,
    `${n} ${cat[0].toUpperCase()}${cat.slice(1)} Mark`,
    `${n} milestone on the ${cat} track.`,
    cat,
    "level",
    3 + (ai % 15),
  ]);
  ai++;
}

function emitAwards() {
  const lines = [
    `import type { AwardDef } from "@/game/types";`,
    ``,
    `export const AWARDS_EXTRA: AwardDef[] = [`,
  ];
  const meta = [];
  for (const row of awardExtra) {
    const [id, name, blurb, category, kind, value] = row;
    lines.push(
      `  { id: ${q(id)}, name: ${q(name)}, blurb: ${q(blurb)}, category: ${q(category)} },`
    );
    meta.push({ id, kind, value });
  }
  lines.push(`];`, ``);
  lines.push(`/** Condition metadata for awards.ts wiring */`);
  lines.push(`export const AWARDS_EXTRA_META = ${JSON.stringify(meta, null, 2)} as const;`);
  lines.push(``);
  fs.writeFileSync(path.join(ROOT, "awardsExtra.ts"), lines.join("\n"));
  return awardExtra.length;
}

// ——— MISSIONS (46 new → 60) ———
function emitMissions() {
  const missions = [];
  let i = 0;
  for (const d of DISTRICTS) {
    missions.push({
      id: `m_tour_${DIST_SHORT[d]}`,
      name: `${DIST_NAME[d]} circuit`,
      blurb: `Walk ${DIST_NAME[d]}, land a gig, prove the board you move.`,
      tier: i % 3 === 0 ? "civic" : i % 3 === 1 ? "street" : "shadow",
      energyCost: 2 + (i % 3),
      districtHint: d,
      objectives: [
        { type: "visit_district", district: d },
        { type: "gigs_done", count: 1 },
      ],
      rewards: { clean: 350 + i * 20, xp: 25 + i, legitimacy: 1 },
      deadlineHours: 48,
    });
    i++;
  }
  const templates = [
    () => ({
      id: `m_earn_street_${missions.length}`,
      name: "Street float",
      blurb: "Stack street paper before the board stamps the receipt.",
      tier: "street",
      energyCost: 3,
      objectives: [{ type: "earn_street", amount: 300 + missions.length * 40 }],
      rewards: { street: 400, xp: 30, respect: 1 },
      failPenalty: { heat: 4 },
      deadlineHours: 36,
    }),
    () => ({
      id: `m_earn_clean_${missions.length}`,
      name: "Clean float",
      blurb: "Civic clients want clean deposits, not excuses.",
      tier: "civic",
      energyCost: 3,
      objectives: [{ type: "earn_clean", amount: 400 + missions.length * 50 }],
      rewards: { clean: 500, xp: 30, legitimacy: 1 },
      deadlineHours: 48,
    }),
    () => ({
      id: `m_crimes_${missions.length}`,
      name: "Mark streak",
      blurb: "Shadow wants successful noise on the ledger.",
      tier: "shadow",
      energyCost: 5,
      nerveCost: 2,
      requiresLevel: 2,
      objectives: [{ type: "crimes_ok", count: 2 + (missions.length % 3) }],
      rewards: { street: 800, xp: 45, respect: 2 },
      failPenalty: { heat: 8 },
      deadlineHours: 30,
    }),
    () => ({
      id: `m_gym_${missions.length}`,
      name: "Iron receipt",
      blurb: "Trainer wants proof you hit the floor.",
      tier: "street",
      energyCost: 2,
      objectives: [{ type: "gym_sessions", count: 2 + (missions.length % 3) }],
      rewards: { clean: 280, xp: 20, respect: 1 },
      deadlineHours: 48,
    }),
    () => ({
      id: `m_shift_${missions.length}`,
      name: "Shift cover",
      blurb: "Someone called out. Clock honest hours.",
      tier: "civic",
      energyCost: 2,
      requiresLevel: 2,
      objectives: [{ type: "shifts_worked", count: 2 }],
      rewards: { clean: 650, xp: 28, legitimacy: 1 },
      deadlineHours: 72,
    }),
    () => ({
      id: `m_attack_${missions.length}`,
      name: "Pressure test",
      blurb: "Win a fight. Leave with street paper.",
      tier: "street",
      energyCost: 4,
      nerveCost: 1,
      requiresLevel: 2,
      objectives: [{ type: "attacks_won", count: 1 }],
      rewards: { street: 450, xp: 35, respect: 2 },
      failPenalty: { heat: 5 },
      deadlineHours: 36,
    }),
    () => ({
      id: `m_bank_${missions.length}`,
      name: "Nest proof",
      blurb: "Show a bank float. Spire paper loves quiet numbers.",
      tier: "civic",
      energyCost: 3,
      requiresLevel: 3,
      objectives: [{ type: "bank_balance", amount: 300 + missions.length * 50 }],
      rewards: { clean: 700, xp: 40, legitimacy: 2 },
      deadlineHours: 60,
    }),
    () => ({
      id: `m_heat_${missions.length}`,
      name: "Cool-down contract",
      blurb: "Drop heat. Prove you can go quiet.",
      tier: "shadow",
      energyCost: 3,
      maxHeat: 55,
      objectives: [{ type: "heat_below", heat: 30 + (missions.length % 10) }],
      rewards: { street: 500, xp: 35, respect: 1 },
      deadlineHours: 40,
    }),
    () => ({
      id: `m_level_${missions.length}`,
      name: "Climb receipt",
      blurb: "Hit the next rung while holding a float.",
      tier: "civic",
      energyCost: 4,
      requiresLevel: 2,
      objectives: [
        { type: "reach_level", level: 3 + (missions.length % 5) },
        { type: "bank_balance", amount: 200 },
      ],
      rewards: { clean: 1200, xp: 70, legitimacy: 2 },
      deadlineHours: 96,
    }),
    () => ({
      id: `m_item_${missions.length}`,
      name: "Kit credential",
      blurb: "Own the kit, work the district, stamp the board.",
      tier: "street",
      energyCost: 3,
      districtHint: DISTRICTS[missions.length % 8],
      objectives: [
        { type: "have_item", itemId: missions.length % 2 === 0 ? "crowbar" : "street_meds", qty: 1 },
        { type: "visit_district", district: DISTRICTS[missions.length % 8] },
      ],
      rewards: { street: 400, xp: 30, itemId: "gloves" },
      deadlineHours: 48,
    }),
  ];
  while (missions.length < 46) {
    const t = templates[missions.length % templates.length];
    missions.push(t());
  }

  const lines = [
    `import type { MissionDef } from "@/content/missions";`,
    ``,
    `export const MISSIONS_EXTRA: MissionDef[] = [`,
  ];
  for (const m of missions) {
    lines.push(`  ${JSON.stringify(m, null, 2).replace(/\n/g, "\n  ")},`);
  }
  lines.push(`];`, ``);
  fs.writeFileSync(path.join(ROOT, "missionsExtra.ts"), lines.join("\n"));
  return missions.length;
}

// ——— RANKS ———
const ranksExtra = [
  "Wire Nobody",
  "Corner Echo",
  "Neon Rook",
  "Block Broker",
  "Harbor Shadow",
  "Vault Whisper",
  "District Myth",
  "City Silhouette",
  "Night Sovereign",
  "Wire Legend",
  "Underking",
  "Mesh Phantom",
];

function emitRanks() {
  const lines = [
    `/** Inserted after core titles — total 18–24 ranks. */`,
    `export const RANK_TITLES_EXTRA = ${JSON.stringify(ranksExtra, null, 2)} as const;`,
    ``,
  ];
  fs.writeFileSync(path.join(ROOT, "ranksExtra.ts"), lines.join("\n"));
  return ranksExtra.length;
}

// ——— LORE: headlines, codex, flavor ———
function emitLore() {
  const headlines = [];
  const hedSeeds = [
    "patrol budget",
    "camera maintenance",
    "tram delay",
    "pier rumor",
    "ward overtime",
    "vault premium",
    "crane overtime",
    "festival egress",
    "fence network",
    "scholarship freeze",
    "rival tag",
    "chip float",
    "evidence reconcile",
    "soft-house lease",
    "gym bruise report",
    "lobby silence",
    "customs shrug",
    "alley ledger",
    "mesh flicker",
    "clinic diversion",
  ];
  const places = Object.values(DIST_NAME);
  for (let i = 0; i < 160; i++) {
    const place = places[i % places.length];
    const seed = hedSeeds[i % hedSeeds.length];
    headlines.push(
      `${place}: ${seed} — nightwire desk notes #${i + 1}`
    );
  }
  // more varied
  const extras = [
    "Anonymous tip claims SpireYard vault drills ran past dawn",
    "Millstone dogs quiet for an hour — yard bosses deny treat deal",
    "Neon Pier photo booth prints go missing mid-weekend",
    "Red Clinic morphine count ‘almost’ matches again",
    "OldCommons stoop auction sells a key that shouldn’t exist",
    "Glassrow hostess union petitions for later last-call",
    "DocksReach bosun radio caught speaking two languages at once",
    "Ashcourt records aide promoted — files follow her",
    "City mesh ping spikes whenever festival lights brown out",
    "Lawyer retainers climb faster than tram fares",
    "Pawn ticket surge after catalytic week",
    "Harbor soft-house listings scrubbed then reposted",
    "Campus waitlists longer than pier lines",
    "Rival ink appears under three tram maps same night",
    "Bank clerks whisper about nests that never sleep",
  ];
  headlines.push(...extras);

  const codex = [
    {
      id: "dist_neonpier",
      category: "district",
      title: "Neon Pier",
      body: "Boardwalk neon, tourist math, and velvet ropes that double as ledgers. Loud stock, louder nights — heat rides the water.",
      hint: "Travel to Neon Pier.",
    },
    {
      id: "dist_redclinic",
      category: "district",
      title: "Red Clinic",
      body: "Sirens as metronome. Ward doors, surplus meds, and admin suites that look civic until the badge blinks wrong.",
      hint: "Travel to Red Clinic.",
    },
  ];

  const sysTopics = [
    ["sys_missions", "Contracts board", "Missions are timed contracts — accept, hit objectives, collect. Miss the window and heat sticks.", "Accept any mission."],
    ["sys_shops", "Named counters", "Twelve counters, not one till. Elite wants clean; black boxes take street under visit caps.", "Visit any shop."],
    ["sys_loadout", "Loadout grammar", "Tools, weapons, armor, flex — equip what the night needs. Tool mods whisper into crime odds.", "Equip any item."],
    ["sys_ranks", "Rank titles", "Titles are costumes until the paper stops hedging. Climb is score-gated, not gift-wrapped.", "Reach rank Hustler+."],
    ["sys_awards", "Awards wall", "Original Nightwire ink — milestones that remember your noise without Torn titles.", "Unlock any award."],
    ["sys_gym", "Iron hours", "Soft caps notice gym sessions. Str/def/spd/dex tracks are the body résumé.", "Train at the gym."],
    ["sys_travel", "District rails", "Eight stamps. Travel costs time and clean; shortcuts live in maps and garage rooms.", "Travel between districts."],
    ["sys_inventory", "Pockets & fences", "Items fence, stack, and unlock missions. Burn kits and lawyer cards are counterplay, not cosmetics.", "Buy or loot an item."],
    ["sys_energy", "Energy & nerve", "Energy fuels work and travel; nerve fuels crime. Both regen — neither forgives spam.", "Spend energy or nerve."],
    ["sys_stress", "Stress ledger", "Stress taxes odds and mood. Calm tea and lay-low are cheaper than hospital clocks.", "Hit stress 20+."],
    ["sys_legitimacy", "Legitimacy mask", "Civic points open soft doors. Pure street stalls political capital; hybrid wears both.", "Gain legitimacy."],
    ["sys_respect", "Street respect", "Respect is alley currency. Fights, boards, and loud takes mint it.", "Gain respect."],
    ["sys_adult", "Adult voice gate", "Some nightlife dossiers carry a second voice. Settings keep it optional; catalog keeps it female-tagged only.", "Toggle adult NPC voice in settings."],
    ["sys_newspaper", "City desk", "Headlines rotate; reactive ink answers your flags. The paper is a mirror with an agenda.", "Open the newspaper."],
    ["sys_timeline", "Timeline tape", "Actions leave tape. Timeline is memory you can scroll when the city gaslights you.", "Generate any log line."],
  ];
  for (const [id, title, body, hint] of sysTopics) {
    codex.push({ id, category: "system", title, body, hint });
  }

  const storyTopics = [
    ["story_pier_first", "First pier night", "Neon on water. Tourists tip; locals linger. The boardwalk writes you in gossip before ink.", "Visit Neon Pier."],
    ["story_clinic_first", "First ward hour", "Sirens closer than neon. Meds cheaper; questions more expensive.", "Visit Red Clinic."],
    ["story_mission_one", "First contract", "A board stamped your name. Deadlines are a second heat.", "Complete one mission."],
    ["story_property_two", "Second roof", "Two keys. Rent starts arguing with itself.", "Own two properties."],
    ["story_rank_operator", "Operator ink", "The paper stops calling you nobody.", "Reach Operator rank."],
    ["story_attack_five", "Five marks", "Five wins. Alleys remember silhouettes.", "Win five NPC attacks."],
    ["story_course_three", "Three transcripts", "Campus ribbon stack. Edges multiply.", "Finish three courses."],
    ["story_heist_one", "First board close", "Prep spine held. Execute sang — or limped.", "Complete one heist."],
    ["story_bank_nest_big", "Bigger nest", "Twenty-five grand under glass. Clerks notice careers.", "Bank $25,000+."],
    ["story_heat_siren", "Siren choir", "Heat past a hundred. Soft voices get loud.", "Peak heat 100+."],
    ["story_gig_ten", "Ten gigs", "Short contracts become a circuit.", "Complete 10 gigs."],
    ["story_shift_twenty", "Twenty shifts", "Still punching in. Roster knows your face.", "Work 20 shifts."],
    ["story_flex", "Flex signal", "Wear money. Respect notices fabric.", "Own a flex item."],
    ["story_tool_pro", "Pro kit", "Serious entry tools. Doors change tone.", "Own lockpicks or better."],
    ["story_district_all", "Eight stamps", "Every district underfoot. Traveler status.", "Visit all 8 districts."],
  ];
  for (const [id, title, body, hint] of storyTopics) {
    codex.push({ id, category: "story", title, body, hint });
  }

  // pad codex to 48 new (80 total with 32 core)
  const padCodex = [
    "alley", "vault", "tram", "crane", "badge", "chip", "mesh", "stoop", "ward", "lobby",
    "manifest", "festival", "harbor", "clinic", "broker", "runner", "fixer", "ghost", "king", "echo",
  ];
  let ci = 0;
  while (codex.length < 48) {
    const word = padCodex[ci % padCodex.length];
    const cat = ci % 3 === 0 ? "system" : ci % 3 === 1 ? "story" : "school";
    codex.push({
      id: `dens_${cat}_${ci}`,
      category: cat,
      title: `${word[0].toUpperCase()}${word.slice(1)} note`,
      body: `Nightwire field note on ${word}: the city keeps score even when you don't.`,
      hint: cat === "school" ? "Complete any course." : "Play on the wire.",
    });
    ci++;
  }

  // Result flavor — generate ~400 lines
  const verbs = ["lift", "slide", "cut", "swap", "ghost", "skim", "crack", "mute", "stamp", "fade"];
  const nouns = ["crowd", "camera", "yard", "lobby", "pier", "ward", "tram", "crate", "till", "rope"];
  const tails = [
    "City barely shrugs.",
    "Heat notices anyway.",
    "Pockets heavier.",
    "Pride lighter.",
    "Exit clean enough.",
    "Exit messy.",
    "Newspaper will invent the rest.",
    "Mentor would approve.",
    "Vex would laugh.",
    "Rain covers footsteps.",
  ];
  const outcomes = ["SUCCESS", "MIXED", "FAILED", "JAILED", "HOSPITALIZED"];
  const families = ["petty", "street", "heavy"];
  const flavor = { petty: {}, street: {}, heavy: {} };
  for (const f of families) {
    for (const o of outcomes) flavor[f][o] = [];
  }
  let fi = 0;
  while (fi < 420) {
    const f = families[fi % 3];
    const o = outcomes[Math.floor(fi / 3) % 5];
    const line = `${verbs[fi % verbs.length]} the ${nouns[fi % nouns.length]} — ${tails[fi % tails.length]} (${f}/${o})`;
    flavor[f][o].push(line);
    fi++;
  }
  // nicer hand lines
  const hand = {
    petty: {
      SUCCESS: [
        "Fingers faster than the aisle music.",
        "Tourist blink; you're gone.",
        "Receipt printer never met you.",
        "Festival foam hides a perfect lift.",
        "Corner store gap measured in heartbeats.",
        "Tram sneeze covers the snatch.",
        "Vending coil never stood a chance.",
        "Charity cup lighter; smile intact.",
        "Bike lock learns a new opinion.",
        "Parking meter coughs coins into your palm.",
      ],
      MIXED: [
        "Score sticks; elbow doesn't.",
        "Half the take, all the shove.",
        "Crowd helps then points.",
        "You keep cash and a new bruise map.",
        "Almost invisible. Almost.",
      ],
      FAILED: [
        "Aisle eyes arrive early.",
        "Hands too hungry for the shelf.",
        "Camera loves your worst second.",
        "Empty pockets, full heat.",
        "The corner files your face.",
      ],
      JAILED: [
        "Cuffs under neon — graduate energy.",
        "Holding cell smells like bad coffee.",
        "Uniforms already knew the aisle.",
        "Fresh mistake, stamped.",
      ],
      HOSPITALIZED: [
        "Concrete wins petty arguments.",
        "Clinic light replaces neon.",
        "You wake up billed for a shove.",
        "Soft crime, hard floor.",
      ],
    },
    street: {
      SUCCESS: [
        "Alley math balances in your favor.",
        "Bag swap cleaner than the route sheet.",
        "Yard dogs choose silence tonight.",
        "Warehouse shadow does the heavy lifting.",
        "Chain feels longer by one honest link.",
        "Catalytic undercarriage says goodbye.",
        "Drop point empty when you arrive — on purpose.",
        "Street family nods without smiling.",
      ],
      MIXED: [
        "Loot yes; ribs maybe.",
        "Partial lift, full argument.",
        "You win the wallet and lose the tempo.",
        "Profitable limp home.",
        "Street tax paid in both currencies.",
      ],
      FAILED: [
        "Wrong alley owns you tonight.",
        "Lookout read you first.",
        "Empty hands, louder block.",
        "Yard remembers your last scent.",
        "Street spits you toward the tram.",
      ],
      JAILED: [
        "Patrol closes both ends of the brick.",
        "Street-to-cell commute is short.",
        "Cuffs over wet concrete.",
        "They booked the corner in advance.",
      ],
      HOSPITALIZED: [
        "Knuckles write the chart.",
        "Ward lights, not streetlights.",
        "Gravity collects street debts.",
        "You lose the argument horizontally.",
      ],
    },
    heavy: {
      SUCCESS: [
        "Vault grammar fluent for one night.",
        "Manifests will never match — perfect.",
        "Spire carpets mute the right crime.",
        "Harbor container tells the truth quietly.",
        "Crew timing holds; city blinks.",
        "Private room opens like it owed you.",
        "Heavy take justifies the nerve math.",
        "Professional silence after loud tools.",
      ],
      MIXED: [
        "Half the vault, all the sirens.",
        "Rich exit, wrong temperature.",
        "Alarm late; bruises early.",
        "Board would stamp this messy green.",
        "Cash up, life negotiating.",
      ],
      FAILED: [
        "Vault stays shut; heat doesn't.",
        "Wrong tumbler, right consequences.",
        "Lobby silhouette filed forever.",
        "Crew timing snaps like cheap wire.",
        "Heavy hope gets expensive fast.",
      ],
      JAILED: [
        "Evidence drawer already labeled.",
        "Heavy cuffs, soft lobby lights.",
        "The case writes itself in ink.",
        "Jail priced into the attempt — due now.",
      ],
      HOSPITALIZED: [
        "Vault floor meets your skull.",
        "Armor fails the fall exam.",
        "You wake inventoried.",
        "Clinic ward, not count room.",
      ],
    },
  };
  for (const f of families) {
    for (const o of outcomes) {
      flavor[f][o].push(...hand[f][o]);
    }
  }

  const heist = {
    SUCCESS: [
      "Board closed before the desk invents adjectives.",
      "Prep spine sang; execute whispered.",
      "Organized quiet buys loud payouts.",
      "Window timing jealous of itself.",
      "Crew dissolves into cleaner numbers.",
      "Rank ink still wet; city already quoting.",
      "Newspaper late to a finished story.",
      "The take consolidates; egos don't.",
      "Harbor night, board daylight.",
      "You leave the spine cleaner than you found it.",
    ],
    MIXED: [
      "Board pays with footnotes and limps.",
      "Execute improvises; loot forgives.",
      "Mixed rank: profitable noise.",
      "Payout survives the panic.",
      "You close the board breathing hard.",
      "City noticed; wallet noticed more.",
      "Green stamp, yellow bruises.",
      "Crew argues; cash settles it.",
    ],
    FAILED: [
      "Board burns; cooldown still invoices.",
      "Window closes on expensive prep.",
      "Execute fails the audition.",
      "Humiliation column drafts itself.",
      "Organized noise without music.",
      "Spine snaps at the last vertebra.",
      "Cooldown clock starts laughing.",
      "You leave poorer in nerve and myth.",
    ],
  };

  const lines = [
    `import type { CodexEntry, CrimeFamily, ResultOutcome } from "@/content/lore";`,
    ``,
    `export const HEADLINES_EXTRA: string[] = [`,
    ...headlines.map((h) => `  ${q(h)},`),
    `];`,
    ``,
    `export const CODEX_EXTRA: CodexEntry[] = [`,
  ];
  for (const e of codex) {
    lines.push(`  {
    id: ${q(e.id)},
    category: ${q(e.category)},
    title: ${q(e.title)},
    body: ${q(e.body)},
    hint: ${q(e.hint)},
  },`);
  }
  lines.push(`];`, ``);
  lines.push(`export const CRIME_RESULT_COPY_EXTRA: Record<CrimeFamily, Record<ResultOutcome, string[]>> = ${JSON.stringify(flavor, null, 2)};`);
  lines.push(``);
  lines.push(`export const HEIST_RESULT_COPY_EXTRA: Record<"SUCCESS" | "MIXED" | "FAILED", string[]> = ${JSON.stringify(heist, null, 2)};`);
  lines.push(``);
  fs.writeFileSync(path.join(ROOT, "loreExtra.ts"), lines.join("\n"));

  let flavorCount = 0;
  for (const f of families) for (const o of outcomes) flavorCount += flavor[f][o].length;
  flavorCount += heist.SUCCESS.length + heist.MIXED.length + heist.FAILED.length;
  return { headlines: headlines.length, codex: codex.length, flavor: flavorCount };
}

function emitArt() {
  // alias maps for new npcs/properties/items (items often have no art map)
  const npcAlias = {};
  const baseNpcArt = {
    glassrow: "gr_courier",
    millstone: "ms_loader",
    docksreach: "dr_smuggler",
    ashcourt: "ac_intern",
    spireyard: "sy_exec",
    oldcommons: "oc_thug",
    neonpier: "np_dealer",
    redclinic: "rc_orderly",
  };
  for (const d of DISTRICTS) {
    for (const row of npcNamePools[d]) {
      const id = row[0];
      npcAlias[id] = `/art/npcs/${baseNpcArt[d]}.webp`;
    }
  }
  const propAlias = {};
  const baseProp = {
    glassrow: "gr_walkup",
    millstone: "ms_flat",
    docksreach: "dr_cot",
    ashcourt: "ac_studio",
    spireyard: "sy_condo",
    oldcommons: "oc_room",
    neonpier: "np_booth",
    redclinic: "rc_bunk",
  };
  for (const [id, , district] of propExtra) {
    propAlias[id] = `/art/properties/${baseProp[district]}.webp`;
  }
  const lines = [
    `/** Density art aliases — reuse existing assets for volume. */`,
    `export const NPC_ART_DENSITY: Record<string, string> = ${JSON.stringify(npcAlias, null, 2)};`,
    ``,
    `export const PROPERTY_ART_DENSITY: Record<string, string> = ${JSON.stringify(propAlias, null, 2)};`,
    ``,
  ];
  fs.writeFileSync(path.join(ROOT, "artDensity.ts"), lines.join("\n"));
}

function emitIndex() {
  fs.writeFileSync(
    path.join(ROOT, "index.ts"),
    `export { ITEMS_EXTRA } from "./itemsExtra";
export { NPCS_EXTRA } from "./npcsExtra";
export { AWARDS_EXTRA, AWARDS_EXTRA_META } from "./awardsExtra";
export { PROPERTIES_EXTRA } from "./propertiesExtra";
export { MISSIONS_EXTRA } from "./missionsExtra";
export { RANK_TITLES_EXTRA } from "./ranksExtra";
export {
  HEADLINES_EXTRA,
  CODEX_EXTRA,
  CRIME_RESULT_COPY_EXTRA,
  HEIST_RESULT_COPY_EXTRA,
} from "./loreExtra";
export { NPC_ART_DENSITY, PROPERTY_ART_DENSITY } from "./artDensity";
`
  );
}

const counts = {
  items: emitItems(),
  npcs: emitNpcs(),
  properties: emitProperties(),
  awards: emitAwards(),
  missions: emitMissions(),
  ranks: emitRanks(),
  lore: emitLore(),
};
emitArt();
emitIndex();
console.log(JSON.stringify(counts, null, 2));
