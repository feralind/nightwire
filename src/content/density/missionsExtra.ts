import type { MissionDef } from "@/content/missions";

export const MISSIONS_EXTRA: MissionDef[] = [
  {
    "id": "m_tour_gr",
    "name": "Glassrow circuit",
    "blurb": "Walk Glassrow, land a gig, prove the board you move.",
    "tier": "civic",
    "energyCost": 2,
    "districtHint": "glassrow",
    "objectives": [
      {
        "type": "visit_district",
        "district": "glassrow"
      },
      {
        "type": "gigs_done",
        "count": 1
      }
    ],
    "rewards": {
      "clean": 350,
      "xp": 25,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_tour_ms",
    "name": "Millstone circuit",
    "blurb": "Walk Millstone, land a gig, prove the board you move.",
    "tier": "street",
    "energyCost": 3,
    "districtHint": "millstone",
    "objectives": [
      {
        "type": "visit_district",
        "district": "millstone"
      },
      {
        "type": "gigs_done",
        "count": 1
      }
    ],
    "rewards": {
      "clean": 370,
      "xp": 26,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_tour_dr",
    "name": "DocksReach circuit",
    "blurb": "Walk DocksReach, land a gig, prove the board you move.",
    "tier": "shadow",
    "energyCost": 4,
    "districtHint": "docksreach",
    "objectives": [
      {
        "type": "visit_district",
        "district": "docksreach"
      },
      {
        "type": "gigs_done",
        "count": 1
      }
    ],
    "rewards": {
      "clean": 390,
      "xp": 27,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_tour_ac",
    "name": "Ashcourt circuit",
    "blurb": "Walk Ashcourt, land a gig, prove the board you move.",
    "tier": "civic",
    "energyCost": 2,
    "districtHint": "ashcourt",
    "objectives": [
      {
        "type": "visit_district",
        "district": "ashcourt"
      },
      {
        "type": "gigs_done",
        "count": 1
      }
    ],
    "rewards": {
      "clean": 410,
      "xp": 28,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_tour_sy",
    "name": "SpireYard circuit",
    "blurb": "Walk SpireYard, land a gig, prove the board you move.",
    "tier": "street",
    "energyCost": 3,
    "districtHint": "spireyard",
    "objectives": [
      {
        "type": "visit_district",
        "district": "spireyard"
      },
      {
        "type": "gigs_done",
        "count": 1
      }
    ],
    "rewards": {
      "clean": 430,
      "xp": 29,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_tour_oc",
    "name": "OldCommons circuit",
    "blurb": "Walk OldCommons, land a gig, prove the board you move.",
    "tier": "shadow",
    "energyCost": 4,
    "districtHint": "oldcommons",
    "objectives": [
      {
        "type": "visit_district",
        "district": "oldcommons"
      },
      {
        "type": "gigs_done",
        "count": 1
      }
    ],
    "rewards": {
      "clean": 450,
      "xp": 30,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_tour_np",
    "name": "Neon Pier circuit",
    "blurb": "Walk Neon Pier, land a gig, prove the board you move.",
    "tier": "civic",
    "energyCost": 2,
    "districtHint": "neonpier",
    "objectives": [
      {
        "type": "visit_district",
        "district": "neonpier"
      },
      {
        "type": "gigs_done",
        "count": 1
      }
    ],
    "rewards": {
      "clean": 470,
      "xp": 31,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_tour_rc",
    "name": "Red Clinic circuit",
    "blurb": "Walk Red Clinic, land a gig, prove the board you move.",
    "tier": "street",
    "energyCost": 3,
    "districtHint": "redclinic",
    "objectives": [
      {
        "type": "visit_district",
        "district": "redclinic"
      },
      {
        "type": "gigs_done",
        "count": 1
      }
    ],
    "rewards": {
      "clean": 490,
      "xp": 32,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_level_8",
    "name": "Climb receipt",
    "blurb": "Hit the next rung while holding a float.",
    "tier": "civic",
    "energyCost": 4,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "reach_level",
        "level": 6
      },
      {
        "type": "bank_balance",
        "amount": 200
      }
    ],
    "rewards": {
      "clean": 1200,
      "xp": 70,
      "legitimacy": 2
    },
    "deadlineHours": 96
  },
  {
    "id": "m_item_9",
    "name": "Kit credential",
    "blurb": "Own the kit, work the district, stamp the board.",
    "tier": "street",
    "energyCost": 3,
    "districtHint": "millstone",
    "objectives": [
      {
        "type": "have_item",
        "itemId": "street_meds",
        "qty": 1
      },
      {
        "type": "visit_district",
        "district": "millstone"
      }
    ],
    "rewards": {
      "street": 400,
      "xp": 30,
      "itemId": "gloves"
    },
    "deadlineHours": 48
  },
  {
    "id": "m_earn_street_10",
    "name": "Street float",
    "blurb": "Stack street paper before the board stamps the receipt.",
    "tier": "street",
    "energyCost": 3,
    "objectives": [
      {
        "type": "earn_street",
        "amount": 700
      }
    ],
    "rewards": {
      "street": 400,
      "xp": 30,
      "respect": 1
    },
    "failPenalty": {
      "heat": 4
    },
    "deadlineHours": 36
  },
  {
    "id": "m_earn_clean_11",
    "name": "Clean float",
    "blurb": "Civic clients want clean deposits, not excuses.",
    "tier": "civic",
    "energyCost": 3,
    "objectives": [
      {
        "type": "earn_clean",
        "amount": 950
      }
    ],
    "rewards": {
      "clean": 500,
      "xp": 30,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_crimes_12",
    "name": "Mark streak",
    "blurb": "Shadow wants successful noise on the ledger.",
    "tier": "shadow",
    "energyCost": 5,
    "nerveCost": 2,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "crimes_ok",
        "count": 2
      }
    ],
    "rewards": {
      "street": 800,
      "xp": 45,
      "respect": 2
    },
    "failPenalty": {
      "heat": 8
    },
    "deadlineHours": 30
  },
  {
    "id": "m_gym_13",
    "name": "Iron receipt",
    "blurb": "Trainer wants proof you hit the floor.",
    "tier": "street",
    "energyCost": 2,
    "objectives": [
      {
        "type": "gym_sessions",
        "count": 3
      }
    ],
    "rewards": {
      "clean": 280,
      "xp": 20,
      "respect": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_shift_14",
    "name": "Shift cover",
    "blurb": "Someone called out. Clock honest hours.",
    "tier": "civic",
    "energyCost": 2,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "shifts_worked",
        "count": 2
      }
    ],
    "rewards": {
      "clean": 650,
      "xp": 28,
      "legitimacy": 1
    },
    "deadlineHours": 72
  },
  {
    "id": "m_attack_15",
    "name": "Pressure test",
    "blurb": "Win a fight. Leave with street paper.",
    "tier": "street",
    "energyCost": 4,
    "nerveCost": 1,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "attacks_won",
        "count": 1
      }
    ],
    "rewards": {
      "street": 450,
      "xp": 35,
      "respect": 2
    },
    "failPenalty": {
      "heat": 5
    },
    "deadlineHours": 36
  },
  {
    "id": "m_bank_16",
    "name": "Nest proof",
    "blurb": "Show a bank float. Spire paper loves quiet numbers.",
    "tier": "civic",
    "energyCost": 3,
    "requiresLevel": 3,
    "objectives": [
      {
        "type": "bank_balance",
        "amount": 1100
      }
    ],
    "rewards": {
      "clean": 700,
      "xp": 40,
      "legitimacy": 2
    },
    "deadlineHours": 60
  },
  {
    "id": "m_heat_17",
    "name": "Cool-down contract",
    "blurb": "Drop heat. Prove you can go quiet.",
    "tier": "shadow",
    "energyCost": 3,
    "maxHeat": 55,
    "objectives": [
      {
        "type": "heat_below",
        "heat": 37
      }
    ],
    "rewards": {
      "street": 500,
      "xp": 35,
      "respect": 1
    },
    "deadlineHours": 40
  },
  {
    "id": "m_level_18",
    "name": "Climb receipt",
    "blurb": "Hit the next rung while holding a float.",
    "tier": "civic",
    "energyCost": 4,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "reach_level",
        "level": 6
      },
      {
        "type": "bank_balance",
        "amount": 200
      }
    ],
    "rewards": {
      "clean": 1200,
      "xp": 70,
      "legitimacy": 2
    },
    "deadlineHours": 96
  },
  {
    "id": "m_item_19",
    "name": "Kit credential",
    "blurb": "Own the kit, work the district, stamp the board.",
    "tier": "street",
    "energyCost": 3,
    "districtHint": "ashcourt",
    "objectives": [
      {
        "type": "have_item",
        "itemId": "street_meds",
        "qty": 1
      },
      {
        "type": "visit_district",
        "district": "ashcourt"
      }
    ],
    "rewards": {
      "street": 400,
      "xp": 30,
      "itemId": "gloves"
    },
    "deadlineHours": 48
  },
  {
    "id": "m_earn_street_20",
    "name": "Street float",
    "blurb": "Stack street paper before the board stamps the receipt.",
    "tier": "street",
    "energyCost": 3,
    "objectives": [
      {
        "type": "earn_street",
        "amount": 1100
      }
    ],
    "rewards": {
      "street": 400,
      "xp": 30,
      "respect": 1
    },
    "failPenalty": {
      "heat": 4
    },
    "deadlineHours": 36
  },
  {
    "id": "m_earn_clean_21",
    "name": "Clean float",
    "blurb": "Civic clients want clean deposits, not excuses.",
    "tier": "civic",
    "energyCost": 3,
    "objectives": [
      {
        "type": "earn_clean",
        "amount": 1450
      }
    ],
    "rewards": {
      "clean": 500,
      "xp": 30,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_crimes_22",
    "name": "Mark streak",
    "blurb": "Shadow wants successful noise on the ledger.",
    "tier": "shadow",
    "energyCost": 5,
    "nerveCost": 2,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "crimes_ok",
        "count": 3
      }
    ],
    "rewards": {
      "street": 800,
      "xp": 45,
      "respect": 2
    },
    "failPenalty": {
      "heat": 8
    },
    "deadlineHours": 30
  },
  {
    "id": "m_gym_23",
    "name": "Iron receipt",
    "blurb": "Trainer wants proof you hit the floor.",
    "tier": "street",
    "energyCost": 2,
    "objectives": [
      {
        "type": "gym_sessions",
        "count": 4
      }
    ],
    "rewards": {
      "clean": 280,
      "xp": 20,
      "respect": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_shift_24",
    "name": "Shift cover",
    "blurb": "Someone called out. Clock honest hours.",
    "tier": "civic",
    "energyCost": 2,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "shifts_worked",
        "count": 2
      }
    ],
    "rewards": {
      "clean": 650,
      "xp": 28,
      "legitimacy": 1
    },
    "deadlineHours": 72
  },
  {
    "id": "m_attack_25",
    "name": "Pressure test",
    "blurb": "Win a fight. Leave with street paper.",
    "tier": "street",
    "energyCost": 4,
    "nerveCost": 1,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "attacks_won",
        "count": 1
      }
    ],
    "rewards": {
      "street": 450,
      "xp": 35,
      "respect": 2
    },
    "failPenalty": {
      "heat": 5
    },
    "deadlineHours": 36
  },
  {
    "id": "m_bank_26",
    "name": "Nest proof",
    "blurb": "Show a bank float. Spire paper loves quiet numbers.",
    "tier": "civic",
    "energyCost": 3,
    "requiresLevel": 3,
    "objectives": [
      {
        "type": "bank_balance",
        "amount": 1600
      }
    ],
    "rewards": {
      "clean": 700,
      "xp": 40,
      "legitimacy": 2
    },
    "deadlineHours": 60
  },
  {
    "id": "m_heat_27",
    "name": "Cool-down contract",
    "blurb": "Drop heat. Prove you can go quiet.",
    "tier": "shadow",
    "energyCost": 3,
    "maxHeat": 55,
    "objectives": [
      {
        "type": "heat_below",
        "heat": 37
      }
    ],
    "rewards": {
      "street": 500,
      "xp": 35,
      "respect": 1
    },
    "deadlineHours": 40
  },
  {
    "id": "m_level_28",
    "name": "Climb receipt",
    "blurb": "Hit the next rung while holding a float.",
    "tier": "civic",
    "energyCost": 4,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "reach_level",
        "level": 6
      },
      {
        "type": "bank_balance",
        "amount": 200
      }
    ],
    "rewards": {
      "clean": 1200,
      "xp": 70,
      "legitimacy": 2
    },
    "deadlineHours": 96
  },
  {
    "id": "m_item_29",
    "name": "Kit credential",
    "blurb": "Own the kit, work the district, stamp the board.",
    "tier": "street",
    "energyCost": 3,
    "districtHint": "oldcommons",
    "objectives": [
      {
        "type": "have_item",
        "itemId": "street_meds",
        "qty": 1
      },
      {
        "type": "visit_district",
        "district": "oldcommons"
      }
    ],
    "rewards": {
      "street": 400,
      "xp": 30,
      "itemId": "gloves"
    },
    "deadlineHours": 48
  },
  {
    "id": "m_earn_street_30",
    "name": "Street float",
    "blurb": "Stack street paper before the board stamps the receipt.",
    "tier": "street",
    "energyCost": 3,
    "objectives": [
      {
        "type": "earn_street",
        "amount": 1500
      }
    ],
    "rewards": {
      "street": 400,
      "xp": 30,
      "respect": 1
    },
    "failPenalty": {
      "heat": 4
    },
    "deadlineHours": 36
  },
  {
    "id": "m_earn_clean_31",
    "name": "Clean float",
    "blurb": "Civic clients want clean deposits, not excuses.",
    "tier": "civic",
    "energyCost": 3,
    "objectives": [
      {
        "type": "earn_clean",
        "amount": 1950
      }
    ],
    "rewards": {
      "clean": 500,
      "xp": 30,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_crimes_32",
    "name": "Mark streak",
    "blurb": "Shadow wants successful noise on the ledger.",
    "tier": "shadow",
    "energyCost": 5,
    "nerveCost": 2,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "crimes_ok",
        "count": 4
      }
    ],
    "rewards": {
      "street": 800,
      "xp": 45,
      "respect": 2
    },
    "failPenalty": {
      "heat": 8
    },
    "deadlineHours": 30
  },
  {
    "id": "m_gym_33",
    "name": "Iron receipt",
    "blurb": "Trainer wants proof you hit the floor.",
    "tier": "street",
    "energyCost": 2,
    "objectives": [
      {
        "type": "gym_sessions",
        "count": 2
      }
    ],
    "rewards": {
      "clean": 280,
      "xp": 20,
      "respect": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_shift_34",
    "name": "Shift cover",
    "blurb": "Someone called out. Clock honest hours.",
    "tier": "civic",
    "energyCost": 2,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "shifts_worked",
        "count": 2
      }
    ],
    "rewards": {
      "clean": 650,
      "xp": 28,
      "legitimacy": 1
    },
    "deadlineHours": 72
  },
  {
    "id": "m_attack_35",
    "name": "Pressure test",
    "blurb": "Win a fight. Leave with street paper.",
    "tier": "street",
    "energyCost": 4,
    "nerveCost": 1,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "attacks_won",
        "count": 1
      }
    ],
    "rewards": {
      "street": 450,
      "xp": 35,
      "respect": 2
    },
    "failPenalty": {
      "heat": 5
    },
    "deadlineHours": 36
  },
  {
    "id": "m_bank_36",
    "name": "Nest proof",
    "blurb": "Show a bank float. Spire paper loves quiet numbers.",
    "tier": "civic",
    "energyCost": 3,
    "requiresLevel": 3,
    "objectives": [
      {
        "type": "bank_balance",
        "amount": 2100
      }
    ],
    "rewards": {
      "clean": 700,
      "xp": 40,
      "legitimacy": 2
    },
    "deadlineHours": 60
  },
  {
    "id": "m_heat_37",
    "name": "Cool-down contract",
    "blurb": "Drop heat. Prove you can go quiet.",
    "tier": "shadow",
    "energyCost": 3,
    "maxHeat": 55,
    "objectives": [
      {
        "type": "heat_below",
        "heat": 37
      }
    ],
    "rewards": {
      "street": 500,
      "xp": 35,
      "respect": 1
    },
    "deadlineHours": 40
  },
  {
    "id": "m_level_38",
    "name": "Climb receipt",
    "blurb": "Hit the next rung while holding a float.",
    "tier": "civic",
    "energyCost": 4,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "reach_level",
        "level": 6
      },
      {
        "type": "bank_balance",
        "amount": 200
      }
    ],
    "rewards": {
      "clean": 1200,
      "xp": 70,
      "legitimacy": 2
    },
    "deadlineHours": 96
  },
  {
    "id": "m_item_39",
    "name": "Kit credential",
    "blurb": "Own the kit, work the district, stamp the board.",
    "tier": "street",
    "energyCost": 3,
    "districtHint": "redclinic",
    "objectives": [
      {
        "type": "have_item",
        "itemId": "street_meds",
        "qty": 1
      },
      {
        "type": "visit_district",
        "district": "redclinic"
      }
    ],
    "rewards": {
      "street": 400,
      "xp": 30,
      "itemId": "gloves"
    },
    "deadlineHours": 48
  },
  {
    "id": "m_earn_street_40",
    "name": "Street float",
    "blurb": "Stack street paper before the board stamps the receipt.",
    "tier": "street",
    "energyCost": 3,
    "objectives": [
      {
        "type": "earn_street",
        "amount": 1900
      }
    ],
    "rewards": {
      "street": 400,
      "xp": 30,
      "respect": 1
    },
    "failPenalty": {
      "heat": 4
    },
    "deadlineHours": 36
  },
  {
    "id": "m_earn_clean_41",
    "name": "Clean float",
    "blurb": "Civic clients want clean deposits, not excuses.",
    "tier": "civic",
    "energyCost": 3,
    "objectives": [
      {
        "type": "earn_clean",
        "amount": 2450
      }
    ],
    "rewards": {
      "clean": 500,
      "xp": 30,
      "legitimacy": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_crimes_42",
    "name": "Mark streak",
    "blurb": "Shadow wants successful noise on the ledger.",
    "tier": "shadow",
    "energyCost": 5,
    "nerveCost": 2,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "crimes_ok",
        "count": 2
      }
    ],
    "rewards": {
      "street": 800,
      "xp": 45,
      "respect": 2
    },
    "failPenalty": {
      "heat": 8
    },
    "deadlineHours": 30
  },
  {
    "id": "m_gym_43",
    "name": "Iron receipt",
    "blurb": "Trainer wants proof you hit the floor.",
    "tier": "street",
    "energyCost": 2,
    "objectives": [
      {
        "type": "gym_sessions",
        "count": 3
      }
    ],
    "rewards": {
      "clean": 280,
      "xp": 20,
      "respect": 1
    },
    "deadlineHours": 48
  },
  {
    "id": "m_shift_44",
    "name": "Shift cover",
    "blurb": "Someone called out. Clock honest hours.",
    "tier": "civic",
    "energyCost": 2,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "shifts_worked",
        "count": 2
      }
    ],
    "rewards": {
      "clean": 650,
      "xp": 28,
      "legitimacy": 1
    },
    "deadlineHours": 72
  },
  {
    "id": "m_attack_45",
    "name": "Pressure test",
    "blurb": "Win a fight. Leave with street paper.",
    "tier": "street",
    "energyCost": 4,
    "nerveCost": 1,
    "requiresLevel": 2,
    "objectives": [
      {
        "type": "attacks_won",
        "count": 1
      }
    ],
    "rewards": {
      "street": 450,
      "xp": 35,
      "respect": 2
    },
    "failPenalty": {
      "heat": 5
    },
    "deadlineHours": 36
  },
];
