"use client";

import Link from "next/link";
import { LICENSES, getCourse } from "@/content/catalog";
import {
  licenseCourseName,
  licenseEffectLabels,
  licensePerkSum,
} from "@/game/licenses";
import { Module } from "@/components/ui/Module";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";

export default function LicensesPage() {
  const s = useGame();
  const owned = LICENSES.filter((l) => s.licenses.includes(l.id));
  const locked = LICENSES.filter((l) => !s.licenses.includes(l.id));
  const sum = licensePerkSum(s.licenses);

  return (
    <div>
      <PageHero
        title="Licenses"
        subtitle="Campus certs that stick. Finish a course, keep the seal — pay, bank, odds, and weekly stipends."
        tone="campus"
        image="/art/campus/hero.webp"
        tall
      />

      <Module title="Active seals" footer="Permanent · stack with transcript perks">
        {owned.length === 0 ? (
          <p className={styles.sub}>
            No licenses yet. Complete a course on the{" "}
            <Link href="/education">Education campus</Link> to earn your first cert.
          </p>
        ) : (
          <div className={styles.grid2}>
            {owned.map((l) => (
              <div key={l.id} className={styles.card}>
                <strong>{l.name}</strong>
                <p className={styles.sub} style={{ marginTop: 4 }}>
                  {l.blurb}
                </p>
                <p className={styles.sub}>From {licenseCourseName(l)}</p>
                <ul className={styles.sub} style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {licenseEffectLabels(l).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Module>

      {owned.length > 0 ? (
        <Module title="License ledger" footer="Weekly stipend ticks offline with bank interest">
          <ul className={styles.sub} style={{ margin: 0, paddingLeft: 18 }}>
            {sum.jobPayBonus ? <li>Job pay +{sum.jobPayBonus}%</li> : null}
            {sum.bankInterestBonus ? <li>Bank interest +{sum.bankInterestBonus}%</li> : null}
            {sum.oddsBonus ? <li>Crime odds crumbs +{sum.oddsBonus}</li> : null}
            {sum.hospitalTimeReduction ? <li>Hospital time −{sum.hospitalTimeReduction}%</li> : null}
            {sum.weeklyStipend ? <li>Weekly stipend ${sum.weeklyStipend}</li> : null}
            <li>Legitimacy {Math.floor(s.legitimacy)} (certs bump on earn)</li>
          </ul>
        </Module>
      ) : null}

      <Module title="Still to earn" footer="One license per campus course">
        {locked.length === 0 ? (
          <p className={styles.sub}>Full wallet of seals. Campus track complete.</p>
        ) : (
          <ul className={styles.sub} style={{ margin: 0, paddingLeft: 18 }}>
            {locked.map((l) => {
              const course = getCourse(l.courseId);
              return (
                <li key={l.id}>
                  <strong>{l.name}</strong> — finish {course?.name ?? l.courseId} (
                  <Link href="/education">{course?.school ?? "campus"}</Link>)
                </li>
              );
            })}
          </ul>
        )}
      </Module>
    </div>
  );
}
