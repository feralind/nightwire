import { DISTRICTS } from "@/content/catalog";
import { isSluttyActive } from "@/game/persona";
import type { DistrictId, PersonGender, PersonPersona } from "@/game/types";
import { unit01 } from "@/game/rng";

/** Lightweight diegetic city-life layer — procedural, no external API. */

export type CityLifeBeat = {
  id: string;
  kind: "npc" | "tip" | "day" | "ambient";
  title: string;
  body: string;
  district?: DistrictId;
  hourBucket: number;
};

type ScheduleNpc = {
  id: string;
  name: string;
  where: string;
  hours: number[];
  line: string;
  gender: PersonGender;
  persona: PersonPersona;
  lineSlutty?: string;
};

const NPC_SCHEDULE: ScheduleNpc[] = [
  {
    id: "vendor_mira",
    name: "Mira the cart",
    where: "Glassrow curb",
    hours: [7, 8, 9, 11, 12],
    gender: "female",
    persona: "slutty",
    line: "Coffee steam and gossip — she clocks every face that pays cash.",
    lineSlutty:
      "Coffee steam and a lingering look — Mira clocks faces, and flirts with the ones that tip well.",
  },
  {
    id: "dock_ron",
    name: "Ron on the pier",
    where: "DocksReach",
    hours: [5, 6, 14, 15, 22],
    gender: "male",
    persona: "noir",
    line: "Shift change whistle. Manifests walk themselves if you look busy.",
  },
  {
    id: "clinic_ada",
    name: "Ada at intake",
    where: "Red Clinic",
    hours: [0, 1, 2, 3, 18, 19],
    gender: "female",
    persona: "noir",
    line: "Night intake is quieter. She pretends not to recognize street burns.",
  },
  {
    id: "runner_jax",
    name: "Jax the runner",
    where: "Millstone alleys",
    hours: [10, 16, 17, 20, 21],
    gender: "male",
    persona: "noir",
    line: "Always late, always paid. Asks no questions about the bag.",
  },
  {
    id: "clerk_veil",
    name: "Civic clerk",
    where: "Ashcourt hall",
    hours: [9, 10, 11, 13, 14],
    gender: "unknown",
    persona: "noir",
    line: "Stamp window open. Bribes look like filing fees if you smile.",
  },
  {
    id: "bouncer_neon",
    name: "Neon door",
    where: "Neon Pier",
    hours: [21, 22, 23, 0, 1],
    gender: "female",
    persona: "slutty",
    line: "Guest list is a mood. Soft targets leave early; hard ones linger.",
    lineSlutty:
      "Guest list is a mood — she lets you linger if you ask nice, and longer if you tip.",
  },
  {
    id: "fence_old",
    name: "Old fence",
    where: "Old Commons",
    hours: [12, 13, 18, 19],
    gender: "unknown",
    persona: "noir",
    line: "Buys quiet metal before supper. Counts twice after dark.",
  },
  {
    id: "trainer_kyo",
    name: "Kyo at the bags",
    where: "Spireyard gym spill",
    hours: [6, 7, 17, 18],
    gender: "male",
    persona: "noir",
    line: "Pads up. Says form beats ego — then proves it.",
  },
];

const DAY_EVENTS: { id: string; title: string; body: string }[] = [
  { id: "fog_bank", title: "River fog bank", body: "Sightlines die on the waterfront. Soft crimes breathe easier; travel feels longer." },
  { id: "payroll_friday", title: "Payroll Friday", body: "Clean pockets thicken. Marks smile more. Heat cameras work overtime." },
  { id: "meter_raid", title: "Parking meter raid", body: "City crews crack open boxes. Petty thieves argue about who saw it first." },
  { id: "bus_detour", title: "Bus detour", body: "Reroutes dump strangers into Millstone. Pickpocket EV spikes; witnesses too." },
  { id: "blackout_drill", title: "Blackout drill", body: "Sirens practice. Real outages hide in the noise — bazaar prices jitter." },
  { id: "charity_drive", title: "Charity drive", body: "Legitimacy theater on every corner. Street scores look worse under camera lights." },
  { id: "tourney_heat", title: "Tourney weekend", body: "Casino strip floods with comps and bad decisions. Clean cash walks itself." },
  { id: "harbor_inspection", title: "Harbor inspection", body: "Customs tents on the pier. Dock work slows; heavy jobs wait a day." },
  { id: "school_letout", title: "School let-out", body: "Sidewalks clog. Courier gigs pay; loud crimes get noticed." },
  { id: "memorial_quiet", title: "Memorial quiet", body: "District goes soft for an afternoon. Heat decay feels faster if you stay clean." },
];

const DYNAMIC_TIPS: string[] = [
  "If heat sits Medium+, a clean shift often beats another heavy.",
  "Equip before you attempt — tool mods are free EV.",
  "Nerve regenerates on the clock; dumping it on trash EV is how you stagnate.",
  "Jail and hospital erase more cash than a failed roll ever will.",
  "Courses unlock boards; boards unlock mastery; mastery unlocks the city.",
  "Legitimacy opens politics and business — street alone hits a ceiling.",
  "Vault and cot rooms quietly fix away-time — safehouse is a build.",
  "Hybrid loops win: street EV, then legal cover, then sleep the heat.",
  "Watch the director ticker — sweeps and festivals rewrite district odds.",
  "When investigation hits 2+, burn, lawyer, or lay low before the next heavy.",
];

function hourOf(now: number): number {
  return new Date(now).getHours();
}

function dayBucket(now: number): number {
  return Math.floor(now / (24 * 60 * 60 * 1000));
}

function hourBucket(now: number): number {
  return Math.floor(now / (60 * 60 * 1000));
}

/** Active NPC schedule lines for the current hour. */
export function npcBeatsForHour(
  now = Date.now(),
  district?: DistrictId,
  adultNpc = false
): CityLifeBeat[] {
  const h = hourOf(now);
  const hb = hourBucket(now);
  return NPC_SCHEDULE.filter((n) => n.hours.includes(h))
    .filter((n) => {
      if (!district) return true;
      const dName = DISTRICTS.find((d) => d.id === district)?.name ?? "";
      return (
        n.where.toLowerCase().includes(dName.split(" ")[0]?.toLowerCase() ?? "") ||
        n.where.toLowerCase().includes(district)
      );
    })
    .slice(0, 3)
    .map((n) => {
      const line =
        isSluttyActive(n, adultNpc) && n.lineSlutty ? n.lineSlutty : n.line;
      return {
        id: `npc:${n.id}:${hb}`,
        kind: "npc" as const,
        title: n.name,
        body: `${n.where} · ${line}`,
        district,
        hourBucket: hb,
      };
    });
}

/** One procedural day event from seed + calendar day. */
export function dayEventFor(seed: string, now = Date.now()): CityLifeBeat {
  const day = dayBucket(now);
  const roll = unit01(seed, "citylife:day", day);
  const ev = DAY_EVENTS[Math.floor(roll * DAY_EVENTS.length) % DAY_EVENTS.length];
  return {
    id: `day:${ev.id}:${day}`,
    kind: "day",
    title: ev.title,
    body: ev.body,
    hourBucket: hourBucket(now),
  };
}

/** Rotating tip — changes hourly, deterministic. */
export function tipFor(seed: string, now = Date.now()): CityLifeBeat {
  const hb = hourBucket(now);
  const roll = unit01(seed, "citylife:tip", hb);
  const tip = DYNAMIC_TIPS[Math.floor(roll * DYNAMIC_TIPS.length) % DYNAMIC_TIPS.length];
  return {
    id: `tip:${hb}`,
    kind: "tip",
    title: "Wire tip",
    body: tip,
    hourBucket: hb,
  };
}

/** Ambient district flavor line. */
export function ambientForDistrict(district: DistrictId, seed: string, now = Date.now()): CityLifeBeat {
  const d = DISTRICTS.find((x) => x.id === district);
  const hb = hourBucket(now);
  const roll = unit01(seed, `citylife:amb:${district}`, hb);
  const lines = [
    `${d?.name ?? "The district"} hums — risk ${d?.risk ?? "unknown"}, shops lean ${d?.shopStyle ?? "mixed"}.`,
    `Streetlights buzz in ${d?.name ?? "town"}. Someone's counting bills that aren't theirs yet.`,
    `A patrol crawler passes ${d?.name ?? "here"} and keeps going. For now.`,
    `Radio chatter: ${d?.name ?? "district"} quiet enough to hear your own footsteps.`,
  ];
  return {
    id: `amb:${district}:${hb}`,
    kind: "ambient",
    title: d?.name ?? "District",
    body: lines[Math.floor(roll * lines.length) % lines.length],
    district,
    hourBucket: hb,
  };
}

export type CityLifeBundle = {
  day: CityLifeBeat;
  tip: CityLifeBeat;
  ambient: CityLifeBeat;
  npcs: CityLifeBeat[];
};

export function buildCityLifeBundle(
  seed: string,
  district: DistrictId,
  now = Date.now(),
  adultNpc = false
): CityLifeBundle {
  const day = dayEventFor(seed, now);
  const tip = tipFor(seed, now);
  const ambient = ambientForDistrict(district, seed, now);
  // Prefer district-filtered; fall back to global hour schedule
  let npcs = npcBeatsForHour(now, district, adultNpc);
  if (npcs.length === 0) npcs = npcBeatsForHour(now, undefined, adultNpc);
  return { day, tip, ambient, npcs };
}

/** Optional diegetic log line when the day event flips (call from tick). */
export function maybeCityLifeLogLine(
  seed: string,
  lastDayEventId: string | null,
  now = Date.now()
): { line: string; dayEventId: string } | null {
  const day = dayEventFor(seed, now);
  if (lastDayEventId === day.id) return null;
  return { line: `City life: ${day.title} — ${day.body}`, dayEventId: day.id };
}
