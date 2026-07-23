/** Nightwire lore pack — original city voice (no Torn). Codex, headlines, result copy. */

export type CodexCategory = "district" | "system" | "story" | "school";

export type CodexEntry = {
  id: string;
  category: CodexCategory;
  title: string;
  body: string;
  /** Unlock hint when locked */
  hint: string;
};

export type ResultOutcome = "SUCCESS" | "MIXED" | "FAILED" | "JAILED" | "HOSPITALIZED";

export type CrimeFamily = "petty" | "street" | "heavy";

/** Static city ticker + newspaper desk pool */
export const HEADLINES: string[] = [
  "Glassrow lights flicker again — petty theft spikes",
  "Millstone warehouse cameras go dark for an hour",
  "Dockhands walk out — harbor slowdown",
  "Festival crowds thicken Glassrow alleys",
  "Police sweep announced across midtown",
  "Vex hits jewelry score in Glassrow",
  "New grad on the street. Competition?",
  "Amateur hour. Someone took a corner.",
  "Bazaar restock: tools and warm chips",
  "City council debates late-night patrol budgets",
  "Ashcourt clinic overtime — night ward fills early",
  "SpireYard lobby cameras ‘maintenance’ until dawn",
  "OldCommons tram skips two stops; riders shrug",
  "Harbor soft-house lease filings spike midweek",
  "Commerce students petition for later library hours",
  "Street Electives course waitlist doubles overnight",
  "Anonymous tip line jammed after Millstone yard fire drill",
  "Neon Pier rumor returns — city insists pier is still closed",
  "Red Clinic Ward rumor denied by civic spokesdesk",
  "Bank interest notices land soft; street cash still louder",
  "Gym memberships up in DocksReach — bruises included",
  "Scholarship office warns: heat on file can freeze aid",
  "Fixer ads bloom on OldCommons lamp posts",
  "Private vault insurers raise premiums in SpireYard",
  "Container manifests ‘misfiled’ at Pier 9 — again",
  "Rival tags appear under Glassrow tram maps",
  "Ward diversion drills confuse ambulance routes",
  "Casino cage overtime after a loud weekend",
  "Evidence room inventory ‘reconciled’ quietly",
  "Courier bags heavier than the route sheets claim",
  "Brick rowhouse raid rumor — bribe window open?",
  "City Navigation finals: half the class still gets lost",
  "Harbor cert holders hired for both crane and crate work",
  "Med short course cuts hospital wait — and opens pharmacy doors",
  "Night broker whispers: legitimacy is a costume, not a shield",
  "District Ghost spotted? Police say ‘unconfirmed silhouette’",
  "Kingpin gossip is cheap; proof costs heat",
  "Lay-low tips circulate: four hours, no street moves",
  "Lawyer retainers climb with investigation stage",
  "Power grid flicker timed with festival egress — coincidence?",
];

/**
 * Reactive headline templates keyed by flag id.
 * Newspaper fills {name} when present.
 */
export const REACTIVE_HEADLINES: Record<string, string> = {
  first_crime: "Local nobody pulls a score — city barely notices",
  first_jail: "Graduate-in-cuffs energy: fresh face, holding cell",
  heat_high: "Heat advisory: midtown patrols thicken after loud nights",
  rank_up: "{name} climbing the wire — new title, same alleys",
  heist_done: "Organized noise: prep boards turning into headlines",
  rival_vex: "Vex leaves calling cards — humiliation in ink",
  property: "Keys change hands — another address on the quiet list",
  course_done: "Campus ribbon cut: another transcript line, another edge",
  hybrid: "Day job, night nerve — dual résumé spotted downtown",
  bank_nest: "Clean nest growing — bank clerks notice quiet deposits",
  contact_favor: "Someone on the wire is answering again",
  too_loud: "Peak heat stories circulate — soft voices recommend cool-down",
  six_rails: "All six districts stamped — traveler or tourist?",
  board_collector: "Multiple boards closed — city starts using a name",
};

export const CODEX_ENTRIES: CodexEntry[] = [
  // —— Districts ——
  {
    id: "dist_glassrow",
    category: "district",
    title: "Glassrow",
    body: "Neon arteries and tram glass. Petty work loves the crowds; heavy work hates the cameras. Elite shops take clean only — street cash stops at the door.",
    hint: "Arrive in Glassrow (default start).",
  },
  {
    id: "dist_millstone",
    category: "district",
    title: "Millstone",
    body: "Brick yards, tool shops, and dogs that remember scent. Street crimes breathe easier here. Warehouse shadows forgive mistakes the neon won’t.",
    hint: "Travel to Millstone.",
  },
  {
    id: "dist_docksreach",
    category: "district",
    title: "DocksReach",
    body: "Salt, cranes, and manifests that never match the crates. Heavy scores pay; heat climbs faster than the tide. Soft-houses keep quiet keys near the pier.",
    hint: "Travel to DocksReach.",
  },
  {
    id: "dist_ashcourt",
    category: "district",
    title: "Ashcourt",
    body: "Civic eyes and clinic light. Medical shops, ward gossip, and paperwork that can shorten a hospital stay — or open a pharmacy door you shouldn’t know about.",
    hint: "Travel to Ashcourt.",
  },
  {
    id: "dist_spireyard",
    category: "district",
    title: "SpireYard",
    body: "Glass lobbies and soft carpets that mute footsteps. Rich targets, elite tills, and private vaults that invoice your mistakes in heat.",
    hint: "Travel to SpireYard.",
  },
  {
    id: "dist_oldcommons",
    category: "district",
    title: "OldCommons",
    body: "Stoops, shortcuts, and night mugs that treat tourists like ATM receipts. Cheap travel, loud alleys, and fixers who prefer cash over questions.",
    hint: "Travel to OldCommons.",
  },
  // —— Systems ——
  {
    id: "sys_dual_life",
    category: "system",
    title: "Two résumés",
    body: "Nightwire City runs on dual ledgers: clean money opens elite doors; street cash buys corners and silence. Hybrid players optimize both — pure lanes hit ceilings.",
    hint: "Create a character.",
  },
  {
    id: "sys_heat",
    category: "system",
    title: "Heat & investigation",
    body: "Heat is the city’s memory of your noise. Past soft bands it births investigation stages — lawyer, burn evidence, lay low, leave district, or risk a bribe.",
    hint: "Attempt any crime.",
  },
  {
    id: "sys_education",
    category: "system",
    title: "Campus as weapon",
    body: "Courses aren’t AFK jail — they unlock edges, licenses, and legal income while you study. Scholarship money can fund tools; heat on file can freeze aid.",
    hint: "Enroll in any course.",
  },
  {
    id: "sys_bank",
    category: "system",
    title: "Bank & laundry",
    body: "Clean earns quiet interest. Street→clean conversion costs a cut. Unbanked street cash is loud when heat is high — nests under glass sleep better.",
    hint: "Make a bank deposit.",
  },
  {
    id: "sys_mastery",
    category: "system",
    title: "Family mastery",
    body: "Petty, street, and heavy each keep their own stars. Attempts, cash, and clean streaks stack into titles and soft edges — cosmetics with teeth.",
    hint: "Succeed at crimes in one family.",
  },
  {
    id: "sys_contacts",
    category: "system",
    title: "The wire",
    body: "Contacts trade tips, favors, and cool-downs. Tips bump crime odds for a window; favors buy breathing room when cases climb.",
    hint: "Use any contact action.",
  },
  {
    id: "sys_heists",
    category: "system",
    title: "Organized boards",
    body: "Heists are prep spines: intel → crew → kit → window → execute. Boards cool down; ranks remember your best run. Newspaper loves closed boards.",
    hint: "Complete any organized heist.",
  },
  {
    id: "sys_rival",
    category: "system",
    title: "Vex",
    body: "Vex is event-driven humiliation, not a second life sim. Scripted beats skim street cash, spike stress, and write headlines you didn’t ask for.",
    hint: "Trigger a rival beat (play long enough / flags).",
  },
  {
    id: "sys_safehouse",
    category: "system",
    title: "Safehouse rooms",
    body: "Vault, cot, study, armory, garage — rooms stacked across owned keys. Capacity, study speed, travel cuts, and tool edges live here.",
    hint: "Own a property.",
  },
  {
    id: "sys_power",
    category: "system",
    title: "Power tracks",
    body: "Territory, political capital, street respect, business empire — midgame meters. Pure criminal stalls political; pure legal stalls respect. Hybrid wins the map.",
    hint: "Reach level 3 or buy territory influence.",
  },
  // —— Schools ——
  {
    id: "school_street",
    category: "school",
    title: "Street Electives",
    body: "City Navigation and alley literacy. Unlocks soft crime edges and tutoring gigs for people who still get lost between tram maps.",
    hint: "Complete a Street Electives course.",
  },
  {
    id: "school_commerce",
    category: "school",
    title: "Commerce & Finance",
    body: "Ledgers that look legitimate. Cleaning rates, front paperwork, and the polite violence of invoices.",
    hint: "Complete a Commerce course.",
  },
  {
    id: "school_harbor",
    category: "school",
    title: "Harbor & Logistics",
    body: "Crane shifts by day, container grammar by night. Harbor cert opens both honest docks and pier fiction.",
    hint: "Complete a Harbor course.",
  },
  {
    id: "school_med",
    category: "school",
    title: "Med & Civic",
    body: "Ashcourt’s clinic light and short courses that cut hospital clocks — white coats as costumes, pharmacy doors as side doors.",
    hint: "Complete a Med & Civic course.",
  },
  {
    id: "school_locks",
    category: "school",
    title: "Locks & Entry",
    body: "Pins, dials, and paperwork that makes entry look civic. Legal locksmith calls by day; quieter doors by night.",
    hint: "Complete a Locks & Entry course.",
  },
  // —— Story beats ——
  {
    id: "story_arrival",
    category: "story",
    title: "Arrival on the wire",
    body: "Mentor advice is always the same: start petty, keep your head, let the city write the second chapter.",
    hint: "Create a character.",
  },
  {
    id: "story_first_score",
    category: "story",
    title: "First score",
    body: "The city barely notices. You do. Nerve regenerates; heat remembers.",
    hint: "Succeed at any crime.",
  },
  {
    id: "story_cuffs",
    category: "story",
    title: "Holding cell graduate",
    body: "Uniforms already there. Bail is a sink; stress is a souvenir. The newspaper loves the phrase ‘fresh face’.",
    hint: "Get jailed once.",
  },
  {
    id: "story_too_loud",
    category: "story",
    title: "Too loud",
    body: "Peak heat stories travel faster than you do. Soft voices recommend cool-down; hard stages demand counterplay.",
    hint: "Reach peak heat 80+.",
  },
  {
    id: "story_six_rails",
    category: "story",
    title: "Six rails stamped",
    body: "Glassrow to OldCommons — every district stamp on the card. Traveler status, or tourist with better excuses.",
    hint: "Visit all six districts.",
  },
  {
    id: "story_boards",
    category: "story",
    title: "Boards closed",
    body: "Organized noise becomes reputation. The city starts using your name in the wrong columns.",
    hint: "Complete 3 heists.",
  },
  {
    id: "story_vex_noticed",
    category: "story",
    title: "Vex noticed you",
    body: "Calling cards, skimmed street, and ink that laughs. Rivalry is a headline engine.",
    hint: "Fire the late rival flag (c10).",
  },
  {
    id: "story_nest",
    category: "story",
    title: "Nest under glass",
    body: "Five thousand clean in the bank — clerks notice quiet. Street still shouts; clean whispers on purpose.",
    hint: "Hold $5,000+ in bank (or peak).",
  },
  {
    id: "story_hybrid",
    category: "story",
    title: "Student by day",
    body: "Active course plus street scores — the dual-life fantasy the city was built for. Scholarships fund gloves; gloves fund louder nights.",
    hint: "Study while holding street cash from crime.",
  },
  {
    id: "story_kingpin_whisper",
    category: "story",
    title: "Kingpin whisper",
    body: "Titles are costumes until the newspaper stops hedging. Kingpin gossip is cheap; proof costs heat and time.",
    hint: "Reach rank Kingpin (or Alley King+).",
  },
];

/** Flavor pools — seeded pick only; does not change odds/RNG math */
export const CRIME_RESULT_COPY: Record<
  CrimeFamily,
  Record<ResultOutcome, string[]>
> = {
  petty: {
    SUCCESS: [
      "Soft hands. Softer exit.",
      "Crowds cover everything — including you.",
      "Nobody looked twice. Perfect.",
      "Tram doors close on a lighter wallet.",
      "Petty work, clean lift.",
      "The till never learned your name.",
      "You vanish into festival noise.",
      "Corner store never saw the gap.",
      "Gloves still warm. Score cooler.",
      "A nobody score that pays like a habit.",
      "Neon blinks; you’re already gone.",
      "Small, sharp, repeatable.",
    ],
    MIXED: [
      "Got something. Ate a shove.",
      "Half a score, half a bruise.",
      "Exit messy — pockets still heavier.",
      "Crowd helped and hurt in the same breath.",
      "You keep the take. They keep your rhythm.",
      "Almost clean. Almost.",
      "Dropped a tell. Kept the cash.",
      "Petty win with street leftovers.",
    ],
    FAILED: [
      "Burned. Empty-handed.",
      "Eyes found you first.",
      "Hands too loud for the aisle.",
      "Nothing but heat for the trouble.",
      "The corner remembers faces.",
      "Amateur tell. Pro exit — without loot.",
      "Camera caught the wrong second.",
      "You leave lighter than you arrived — pride only.",
    ],
    JAILED: [
      "Uniforms already there.",
      "Cuffs click under neon.",
      "Holding cell: graduate energy.",
      "The city files you under ‘fresh mistake’.",
    ],
    HOSPITALIZED: [
      "Bad fall. Lights out.",
      "Concrete wins the argument.",
      "Clinic lights, not neon.",
      "You wake up billed and bruised.",
    ],
  },
  street: {
    SUCCESS: [
      "Alley math checks out.",
      "Street score — loud enough to matter.",
      "Yard dogs don’t bark for you tonight.",
      "You read the block better than the block.",
      "Bag swapped. Hands clean enough.",
      "Warehouse shadow does the rest.",
      "Chain feeling: another link.",
      "Street family approves in silence.",
      "The route sheet lied; you didn’t.",
      "Muscle memory, not luck.",
      "Heat rises — so does the take.",
      "You leave the block rearranged.",
    ],
    MIXED: [
      "Got the bag. Ate a punch.",
      "Score sticks; ribs complain.",
      "Partial lift — full argument.",
      "You win the wallet, lose the tempo.",
      "Street tax paid in blood and cash.",
      "Almost professional. Almost.",
      "Exit with loot and a limp.",
      "Mixed night: profitable bruises.",
    ],
    FAILED: [
      "Burned on the block.",
      "Wrong alley, right fists — theirs.",
      "Empty hands, louder heat.",
      "The yard remembered your last visit.",
      "Street doesn’t forgive loud feet.",
      "You misread the lookout.",
      "Nothing but stress for the nerve spent.",
      "The block spits you out.",
    ],
    JAILED: [
      "Patrol closes the alley both ways.",
      "Street to cell — short commute.",
      "Cuffs over concrete.",
      "They had the corner waiting.",
    ],
    HOSPITALIZED: [
      "Street medicine: horizontal.",
      "You lose the argument with gravity.",
      "Ward lights, not streetlights.",
      "Someone else’s knuckles wrote the chart.",
    ],
  },
  heavy: {
    SUCCESS: [
      "Heavy lift. Quiet exit — somehow.",
      "Vault grammar: you spoke fluently.",
      "The room that shouldn’t open, opened.",
      "Crew timing held. City didn’t.",
      "Manifests will never match — good.",
      "Heavy family: another clean myth.",
      "You steal like you’ve practiced the apology.",
      "Spire carpets mute the right footsteps.",
      "Harbor night, container truth.",
      "The take justifies the nerve.",
      "Professional silence after loud tools.",
      "Kingpin practice, not gossip.",
    ],
    MIXED: [
      "Half the vault. All the attention.",
      "Heavy take, heavier cost.",
      "You leave rich and wrong.",
      "Alarm late — damage early.",
      "Mixed rank: loot with a limp.",
      "The board would call this ‘messy green’.",
      "Cash up. Life down.",
      "You got out. The room didn’t forgive.",
    ],
    FAILED: [
      "Heavy fail — empty and loud.",
      "Vault stays shut. Heat doesn’t.",
      "Wrong tumbler, right consequences.",
      "The lobby remembers silhouettes.",
      "Crew timing broke; so did the night.",
      "Nothing but investigation crumbs.",
      "Heavy work punishes hope.",
      "You exit poorer in nerve and story.",
    ],
    JAILED: [
      "Evidence room already has a drawer for you.",
      "Heavy cuffs. Soft lights.",
      "The case writes itself.",
      "Jail time priced into the attempt — now due.",
    ],
    HOSPITALIZED: [
      "Heavy fail meets concrete.",
      "Clinic ward, not vault floor.",
      "You wake up inventoried.",
      "Armor didn’t help the fall.",
    ],
  },
};

export const HEIST_RESULT_COPY: Record<"SUCCESS" | "MIXED" | "FAILED", string[]> = {
  SUCCESS: [
    "Board closed. City desk will invent the rest.",
    "Prep spine held — execute sang.",
    "Organized quiet; payout loud.",
    "Window timing perfect. Newspaper jealous.",
    "Rank ink still wet on the board.",
    "Crew dissolves; take consolidates.",
  ],
  MIXED: [
    "Board pays — with footnotes.",
    "Execute messy; loot real.",
    "Mixed rank: the city still noticed.",
    "You close the board limping.",
    "Payout survives the improvisation.",
  ],
  FAILED: [
    "Board burns. Cooldown starts anyway.",
    "Execute fails; prep was the expensive part.",
    "The window closed on your hands.",
    "City desk drafts a humiliation column.",
    "Organized noise without the music.",
  ],
};

export function getCodexEntry(id: string): CodexEntry | undefined {
  return CODEX_ENTRIES.find((e) => e.id === id);
}
