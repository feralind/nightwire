import type { AwardDef } from "@/game/types";

export const AWARDS_EXTRA: AwardDef[] = [
  { id: "petty_ten", name: "Ten Petty", blurb: "Ten petty attempts logged.", category: "crime" },
  { id: "petty_hundred", name: "Hundred Petty", blurb: "A hundred petty habits.", category: "crime" },
  { id: "street_fifty", name: "Fifty Street", blurb: "Fifty street attempts.", category: "crime" },
  { id: "heavy_ten", name: "Ten Heavies", blurb: "Ten heavy clears.", category: "crime" },
  { id: "crime_250", name: "Quarter Wire", blurb: "Two-fifty crime attempts.", category: "crime" },
  { id: "crime_500", name: "Half Wire", blurb: "Five hundred attempts under the wires.", category: "crime" },
  { id: "board_ten", name: "Ten Boards", blurb: "Ten organized ops.", category: "crime" },
  { id: "fail_ten", name: "Ten Burns", blurb: "Ten failed crimes. Still walking.", category: "crime" },
  { id: "shift_100", name: "Hundred Shifts", blurb: "A hundred punches.", category: "work" },
  { id: "gig_fifty", name: "Fifty Gigs", blurb: "Fifty short contracts.", category: "work" },
  { id: "promote_five", name: "Five Promotes", blurb: "Five roster climbs.", category: "work" },
  { id: "campus_ten", name: "Ten Transcripts", blurb: "Ten courses finished.", category: "work" },
  { id: "campus_twenty", name: "Twenty Transcripts", blurb: "Twenty courses stamped.", category: "work" },
  { id: "property_six", name: "Six Roofs", blurb: "Six keys on the ledger.", category: "money" },
  { id: "property_eight", name: "Eight Roofs", blurb: "A roof per district mood.", category: "money" },
  { id: "bank_50k", name: "Glass Nest 50k", blurb: "Fifty grand under glass.", category: "money" },
  { id: "bank_100k", name: "Glass Nest 100k", blurb: "Six figures sleeping.", category: "money" },
  { id: "networth_100k", name: "Hundred-Grand Glow", blurb: "Networth hits six figures.", category: "money" },
  { id: "networth_250k", name: "Quarter-Mil Glow", blurb: "Networth quarter million.", category: "money" },
  { id: "interest_2k", name: "Interest Flood", blurb: "Two thousand in interest.", category: "money" },
  { id: "gym_100", name: "Hundred Iron", blurb: "A hundred gym sessions.", category: "body" },
  { id: "attack_25", name: "Twenty-Five Marks", blurb: "Twenty-five NPC wins.", category: "body" },
  { id: "attack_50", name: "Fifty Marks", blurb: "Fifty fights won.", category: "body" },
  { id: "jail_three", name: "Three Cells", blurb: "Jailed three times.", category: "body" },
  { id: "hospital_three", name: "Three Wards", blurb: "Hospitalized three times.", category: "body" },
  { id: "level_15", name: "Wire Fifteen", blurb: "Level 15 climb.", category: "city" },
  { id: "level_20", name: "Wire Twenty", blurb: "Level 20 on the wire.", category: "city" },
  { id: "heat_150", name: "Siren Choir", blurb: "Heat past 150.", category: "city" },
  { id: "rank_fixer", name: "Fixer Ink", blurb: "Rank Fixer or better.", category: "city" },
  { id: "rank_kingpin", name: "Kingpin Ink", blurb: "Kingpin title worn.", category: "city" },
  { id: "contact_all", name: "Every Voice", blurb: "Used every contact once.", category: "story" },
  { id: "favor_25", name: "Twenty-Five Favors", blurb: "Twenty-five contact uses.", category: "story" },
  { id: "tip_15", name: "Fifteen Tips", blurb: "Fifteen warm tips bought.", category: "story" },
  { id: "mission_five", name: "Five Contracts", blurb: "Five missions complete.", category: "story" },
  { id: "mission_fifteen", name: "Fifteen Contracts", blurb: "Fifteen missions closed.", category: "story" },
  { id: "district_glass_habit", name: "Glassrow Habit", blurb: "Twenty crimes in Glassrow.", category: "city" },
  { id: "district_pier_habit", name: "Pier Habit", blurb: "Twenty crimes at Neon Pier.", category: "city" },
  { id: "legit_25", name: "Civic Mask", blurb: "Legitimacy 25+.", category: "work" },
  { id: "legit_50", name: "Civic Costume", blurb: "Legitimacy 50+.", category: "work" },
  { id: "respect_20", name: "Street Nod", blurb: "Respect 20+.", category: "city" },
  { id: "respect_40", name: "Street Bow", blurb: "Respect 40+.", category: "city" },
  { id: "chain_five", name: "Five-Link Chain", blurb: "Crime chain of five.", category: "crime" },
  { id: "clean_10k", name: "Clean Ten", blurb: "Earn 10k clean lifetime.", category: "money" },
  { id: "street_10k", name: "Street Ten", blurb: "Earn 10k street lifetime.", category: "money" },
  { id: "hybrid_life", name: "Hybrid Pulse", blurb: "Course active + 10 crimes.", category: "story" },
  { id: "safehouse_one", name: "First Room", blurb: "Any safehouse room level 1.", category: "money" },
  { id: "item_crowbar", name: "Crowbar Cred", blurb: "Own a crowbar.", category: "crime" },
  { id: "item_lockpick", name: "Pins Cred", blurb: "Own lockpicks.", category: "crime" },
  { id: "shopper", name: "Till Regular", blurb: "Buy ten shop items.", category: "money" },
  { id: "dens_crime_0", name: "Midnight Crime Mark", blurb: "Midnight milestone on the crime track.", category: "crime" },
  { id: "dens_work_1", name: "Neon Work Mark", blurb: "Neon milestone on the work track.", category: "work" },
  { id: "dens_body_2", name: "Salt Body Mark", blurb: "Salt milestone on the body track.", category: "body" },
  { id: "dens_city_3", name: "Brick City Mark", blurb: "Brick milestone on the city track.", category: "city" },
  { id: "dens_money_4", name: "Glass Money Mark", blurb: "Glass milestone on the money track.", category: "money" },
  { id: "dens_story_5", name: "Ward Story Mark", blurb: "Ward milestone on the story track.", category: "story" },
  { id: "dens_crime_6", name: "Pier Crime Mark", blurb: "Pier milestone on the crime track.", category: "crime" },
  { id: "dens_work_7", name: "Spire Work Mark", blurb: "Spire milestone on the work track.", category: "work" },
  { id: "dens_body_8", name: "Commons Body Mark", blurb: "Commons milestone on the body track.", category: "body" },
  { id: "dens_city_9", name: "Harbor City Mark", blurb: "Harbor milestone on the city track.", category: "city" },
  { id: "dens_money_10", name: "Wire Money Mark", blurb: "Wire milestone on the money track.", category: "money" },
  { id: "dens_story_11", name: "Alley Story Mark", blurb: "Alley milestone on the story track.", category: "story" },
  { id: "dens_crime_12", name: "Vault Crime Mark", blurb: "Vault milestone on the crime track.", category: "crime" },
  { id: "dens_work_13", name: "Ledger Work Mark", blurb: "Ledger milestone on the work track.", category: "work" },
];

/** Condition metadata for awards.ts wiring */
export const AWARDS_EXTRA_META = [
  {
    "id": "petty_ten",
    "kind": "mastery.petty.attempts",
    "value": 10
  },
  {
    "id": "petty_hundred",
    "kind": "mastery.petty.attempts",
    "value": 100
  },
  {
    "id": "street_fifty",
    "kind": "mastery.street.attempts",
    "value": 50
  },
  {
    "id": "heavy_ten",
    "kind": "mastery.heavy.cashwins",
    "value": 10
  },
  {
    "id": "crime_250",
    "kind": "crimesAttempted",
    "value": 250
  },
  {
    "id": "crime_500",
    "kind": "crimesAttempted",
    "value": 500
  },
  {
    "id": "board_ten",
    "kind": "heistsCompleted",
    "value": 10
  },
  {
    "id": "fail_ten",
    "kind": "crimeFails",
    "value": 10
  },
  {
    "id": "shift_100",
    "kind": "shiftsWorked",
    "value": 100
  },
  {
    "id": "gig_fifty",
    "kind": "gigsDone",
    "value": 50
  },
  {
    "id": "promote_five",
    "kind": "promotions",
    "value": 5
  },
  {
    "id": "campus_ten",
    "kind": "courses",
    "value": 10
  },
  {
    "id": "campus_twenty",
    "kind": "courses",
    "value": 20
  },
  {
    "id": "property_six",
    "kind": "properties",
    "value": 6
  },
  {
    "id": "property_eight",
    "kind": "properties",
    "value": 8
  },
  {
    "id": "bank_50k",
    "kind": "bank",
    "value": 50000
  },
  {
    "id": "bank_100k",
    "kind": "bank",
    "value": 100000
  },
  {
    "id": "networth_100k",
    "kind": "networth",
    "value": 100000
  },
  {
    "id": "networth_250k",
    "kind": "networth",
    "value": 250000
  },
  {
    "id": "interest_2k",
    "kind": "interest",
    "value": 2000
  },
  {
    "id": "gym_100",
    "kind": "gym",
    "value": 100
  },
  {
    "id": "attack_25",
    "kind": "attacksWon",
    "value": 25
  },
  {
    "id": "attack_50",
    "kind": "attacksWon",
    "value": 50
  },
  {
    "id": "jail_three",
    "kind": "jailed",
    "value": 3
  },
  {
    "id": "hospital_three",
    "kind": "hospital",
    "value": 3
  },
  {
    "id": "level_15",
    "kind": "level",
    "value": 15
  },
  {
    "id": "level_20",
    "kind": "level",
    "value": 20
  },
  {
    "id": "heat_150",
    "kind": "peakHeat",
    "value": 150
  },
  {
    "id": "rank_fixer",
    "kind": "rankIndex",
    "value": 4
  },
  {
    "id": "rank_kingpin",
    "kind": "rankIndex",
    "value": 9
  },
  {
    "id": "contact_all",
    "kind": "contactsAll",
    "value": 12
  },
  {
    "id": "favor_25",
    "kind": "contactUses",
    "value": 25
  },
  {
    "id": "tip_15",
    "kind": "tips",
    "value": 15
  },
  {
    "id": "mission_five",
    "kind": "missions",
    "value": 5
  },
  {
    "id": "mission_fifteen",
    "kind": "missions",
    "value": 15
  },
  {
    "id": "district_glass_habit",
    "kind": "distCrime",
    "value": "glassrow"
  },
  {
    "id": "district_pier_habit",
    "kind": "distCrime",
    "value": "neonpier"
  },
  {
    "id": "legit_25",
    "kind": "legitimacy",
    "value": 25
  },
  {
    "id": "legit_50",
    "kind": "legitimacy",
    "value": 50
  },
  {
    "id": "respect_20",
    "kind": "respect",
    "value": 20
  },
  {
    "id": "respect_40",
    "kind": "respect",
    "value": 40
  },
  {
    "id": "chain_five",
    "kind": "chain",
    "value": 5
  },
  {
    "id": "clean_10k",
    "kind": "cleanEarned",
    "value": 10000
  },
  {
    "id": "street_10k",
    "kind": "streetEarned",
    "value": 10000
  },
  {
    "id": "hybrid_life",
    "kind": "hybrid",
    "value": 10
  },
  {
    "id": "safehouse_one",
    "kind": "safehouse",
    "value": 1
  },
  {
    "id": "item_crowbar",
    "kind": "item",
    "value": "crowbar"
  },
  {
    "id": "item_lockpick",
    "kind": "item",
    "value": "lockpick"
  },
  {
    "id": "shopper",
    "kind": "shopBuys",
    "value": 10
  },
  {
    "id": "dens_crime_0",
    "kind": "level",
    "value": 3
  },
  {
    "id": "dens_work_1",
    "kind": "level",
    "value": 4
  },
  {
    "id": "dens_body_2",
    "kind": "level",
    "value": 5
  },
  {
    "id": "dens_city_3",
    "kind": "level",
    "value": 6
  },
  {
    "id": "dens_money_4",
    "kind": "level",
    "value": 7
  },
  {
    "id": "dens_story_5",
    "kind": "level",
    "value": 8
  },
  {
    "id": "dens_crime_6",
    "kind": "level",
    "value": 9
  },
  {
    "id": "dens_work_7",
    "kind": "level",
    "value": 10
  },
  {
    "id": "dens_body_8",
    "kind": "level",
    "value": 11
  },
  {
    "id": "dens_city_9",
    "kind": "level",
    "value": 12
  },
  {
    "id": "dens_money_10",
    "kind": "level",
    "value": 13
  },
  {
    "id": "dens_story_11",
    "kind": "level",
    "value": 14
  },
  {
    "id": "dens_crime_12",
    "kind": "level",
    "value": 15
  },
  {
    "id": "dens_work_13",
    "kind": "level",
    "value": 16
  }
] as const;
