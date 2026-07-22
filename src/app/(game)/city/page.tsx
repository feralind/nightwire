"use client";

import Link from "next/link";
import { Module } from "@/components/ui/Module";
import { PageHero, DISTRICT_ART } from "@/components/ui/Visuals";
import { NavIcon } from "@/components/ui/Icons";
import { useGame } from "@/store/gameStore";
import { DISTRICTS } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import styles from "./city.module.css";
import hub from "../hub.module.css";

const ACTIONS = [
  { href: "/crimes", name: "Crimes", desc: "Spend nerve for street cash" },
  { href: "/gym", name: "Gym", desc: "Train STR / DEF / SPD / DEX" },
  { href: "/jobs", name: "Jobs", desc: "Clean shifts, weekly cap" },
  { href: "/gigs", name: "Gigs", desc: "Short contracts, even unemployed" },
  { href: "/education", name: "Education", desc: "Courses unlock crimes & bonuses" },
  { href: "/travel", name: "Travel", desc: "Change district risk & shops" },
  { href: "/casino", name: "Casino", desc: "Clean cash, honest house edge" },
  { href: "/hospital", name: "Hospital", desc: "Wards, meds, discharge" },
];

export default function CityPage() {
  const s = useGame();
  const d = DISTRICTS.find((x) => x.id === s.district);
  const art = DISTRICT_ART[s.district] ?? "/art/city/skyline.webp";

  let nextUnlock = "Raise mastery or buy territory influence";
  if (s.level < 5) nextUnlock = `Heavy crimes unlock at Level 5 (now ${s.level})`;
  else if (!s.completedCourses.includes("se1")) nextUnlock = "Street Electives I unlocks warehouse/pharmacy";
  else if (!s.jobId) nextUnlock = "Apply for a job for clean income";

  return (
    <div className={styles.wrap}>
      <PageHero
        title="City"
        subtitle={`${d?.name ?? "Unknown"} — pick a loop and run it.`}
        tone="city"
        image="/art/city/skyline.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Lv {s.level}</span>
          <span className={hub.chip}>Heat {Math.floor(s.heat)}</span>
          <span className={hub.chip}>Inv {s.investigation}</span>
        </div>
      </PageHero>

      <div
        className={hub.districtCard}
        style={{ minHeight: 120, marginBottom: 12 }}
      >
        <div className={hub.districtBg} style={{ backgroundImage: `url(${art})` }} />
        <div className={hub.districtShade} />
        <div className={hub.districtBody} style={{ minHeight: 120 }}>
          <div className={hub.districtName}>{d?.name}</div>
          <p className={hub.sub} style={{ color: "rgba(220,220,220,0.8)" }}>
            Risk: {d?.risk} · Shop: {d?.shopStyle}
          </p>
          <div className={hub.chipRow}>
            <span className={hub.chip}>
              Clean <strong className="tabular money-pos">{formatMoney(s.clean)}</strong>
            </span>
            <span className={hub.chip}>
              Street <strong className="tabular money-pos">{formatMoney(s.street)}</strong>
            </span>
          </div>
        </div>
      </div>

      <Module footer="N attempt · R repeat · / search">
        <div className={styles.status}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Next unlock</h2>
            <p className={styles.unlock}>{nextUnlock}</p>
            {s.directorEvent ? (
              <p className={styles.event}>Director: {s.directorEvent.label}</p>
            ) : (
              <p className={styles.meta}>No active director event.</p>
            )}
          </section>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>District strip</h2>
            <div className={hub.chipRow}>
              {DISTRICTS.map((dist) => (
                <Link key={dist.id} href="/travel" className={hub.chip} style={{ textDecoration: "none" }}>
                  {dist.name}
                  {dist.id === s.district ? " ●" : ""}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.actions}>
          {ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className={styles.tile}>
              <span className={styles.tileName}>
                <NavIcon href={a.href} />
                {a.name}
              </span>
              <span className={styles.tileDesc}>{a.desc}</span>
            </Link>
          ))}
        </div>

        <p className={styles.hint}>
          Legal EV: jobs + gigs + scholarships. Street EV: crimes. Hybrid wins the city.
        </p>
      </Module>
    </div>
  );
}
