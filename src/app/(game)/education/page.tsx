"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { COURSES, CRIMES, LICENSES, getCourse } from "@/content/catalog";
import {
  canEnrollCourse,
  courseEnrollReasons,
  coursePerkLabels,
  schools,
  transcriptPerkSum,
} from "@/game/careers";
import { formatMoney } from "@/game/formulas";
import { licenseEffectLabels, licensePerkSum } from "@/game/licenses";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero, SCHOOL_ART, SceneBanner } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function EducationPage() {
  const s = useGame();
  const schoolList = useMemo(() => schools(), []);
  const [school, setSchool] = useState<string>(schoolList[0] ?? "Street Electives");
  const active = COURSES.find((c) => c.id === s.activeCourseId);
  const list = COURSES.filter((c) => c.school === school);
  const transcript = transcriptPerkSum(s.completedCourses);
  const licenseSum = licensePerkSum(s.licenses);
  const certs = useMemo(
    () => LICENSES.filter((l) => s.licenses.includes(l.id)),
    [s.licenses]
  );
  const pct = active ? Math.min(100, Math.round((s.courseProgressHours / active.hours) * 100)) : 0;
  const remaining = active ? Math.max(0, active.hours - s.courseProgressHours) : 0;
  const probation = Boolean(active && s.heat >= 70);
  const schoolArt = SCHOOL_ART[school] ?? "/art/campus/hero.webp";

  const unlockedNames = transcript.unlockedCrimeIds
    .map((id) => CRIMES.find((c) => c.id === id)?.name ?? id)
    .join(", ");

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Education campus"
        subtitle="Study while you earn — five schools, stacked certs, and unlocks that keep the city open."
        tone="campus"
        image="/art/campus/hero.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>
            {active ? `Studying ${active.name}` : "No active course"}
          </span>
          <span className={hub.chip}>Transcript {s.completedCourses.length}</span>
          <span className={hub.chip}>Licenses {s.licenses.length}</span>
          {probation ? <span className={hub.chip}>Probation</span> : null}
        </div>
      </PageHero>

      <SceneBanner
        image={schoolArt}
        height={130}
        title={school}
        subtitle="School wing — pick a course card below."
      />

      <div className={hub.grid2}>
        <Module title="Active study" footer="1 study focus · jail pauses · heat ≥70 suspends stipend">
          {active ? (
            <div>
              <strong>{active.name}</strong>
              <span style={{ color: "var(--text-dim)" }}> · {active.school}</span>
              <p className={hub.sub} style={{ marginTop: 4 }}>
                {active.blurb}
              </p>
              <p className={hub.sub}>
                {s.courseProgressHours.toFixed(1)}/{active.hours}h ({pct}%) · ~{remaining.toFixed(1)}h left · stipend $
                {active.stipendPerHour}/h
                {probation ? " · PROBATION" : ""}
              </p>
              <div
                style={{
                  height: 8,
                  background: "var(--bg-panel-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 2,
                  overflow: "hidden",
                  margin: "8px 0",
                }}
              >
                <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent-rail)" }} />
              </div>
              <p className={hub.sub}>Perks: {coursePerkLabels(active).join(" · ") || "—"}</p>
              <GameButton variant="secondary" onClick={() => s.dropCourse()}>
                Drop course (fee kept)
              </GameButton>
            </div>
          ) : (
            <p className={hub.sub}>No active course. Jobs, gigs, and crimes still run while enrolled.</p>
          )}
        </Module>

        <div className={hub.panel}>
          <h2 className={hub.panelTitle}>Legal income while studying</h2>
          <ul className={hub.sub} style={{ margin: 0, paddingLeft: 18 }}>
            <li>Job shifts still pay clean {s.jobId ? "(employed)" : "(apply on Jobs)"}</li>
            <li>Scholarship stipend ticks offline{probation ? " — suspended" : ""}</li>
            <li>Street fees allowed at +20%</li>
            <li>
              Bank {(2 + (transcript.bankInterestBonus ?? 0)).toFixed(1)}%/week with transcript
            </li>
          </ul>
        </div>
      </div>

      <Module
        tabs={
          <div className={styles.tabs}>
            {schoolList.map((name) => (
              <button
                key={name}
                type="button"
                className={school === name ? styles.tabActive : styles.tab}
                onClick={() => setSchool(name)}
              >
                {name}
              </button>
            ))}
          </div>
        }
        footer="Course cards · prereqs gate later courses"
      >
        <div className={hub.courseGrid}>
          {list.map((c) => {
            const done = s.completedCourses.includes(c.id);
            const isActive = s.activeCourseId === c.id;
            const cleanReasons = courseEnrollReasons(c, s, false);
            const streetReasons = courseEnrollReasons(c, s, true);
            const showReq = !done && !isActive && (cleanReasons.length > 0 || streetReasons.length > 0);
            return (
              <article
                key={c.id}
                style={{
                  border: "1px solid var(--border)",
                  background: "linear-gradient(165deg,#222228,var(--bg-panel))",
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    height: 96,
                    background: `linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.75)), center 30%/cover no-repeat url(${schoolArt})`,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      bottom: 8,
                      right: 10,
                      fontWeight: 700,
                      textShadow: "0 1px 4px #000",
                    }}
                  >
                    {c.name}
                    {done ? " ✓" : isActive ? " · studying" : ""}
                  </div>
                </div>
                <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  <p className={hub.sub}>{c.blurb}</p>
                  <div className={hub.statRow}>
                    <span>Hours</span>
                    <strong className="tabular">{c.hours}</strong>
                  </div>
                  <div className={hub.statRow}>
                    <span>Fee</span>
                    <strong className="tabular">{formatMoney(c.fee)}</strong>
                  </div>
                  <div className={hub.statRow}>
                    <span>Stipend</span>
                    <strong className="tabular">${c.stipendPerHour}/h</strong>
                  </div>
                  <p className={hub.sub}>{coursePerkLabels(c).join(" · ") || "—"}</p>
                  {showReq ? <RequirementsBox reasons={cleanReasons.length ? cleanReasons : streetReasons} /> : null}
                  {done ? (
                    <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Complete</span>
                  ) : (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "auto" }}>
                      <GameButton
                        disabled={!canEnrollCourse(c, s, false)}
                        onClick={() => s.enrollCourse(c.id, false)}
                      >
                        Enroll clean
                      </GameButton>
                      <GameButton
                        variant="secondary"
                        disabled={!canEnrollCourse(c, s, true)}
                        onClick={() => s.enrollCourse(c.id, true)}
                      >
                        Street+20%
                      </GameButton>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Module>

      <Module title="Transcript" footer="Permanent perks stack">
        {s.completedCourses.length === 0 ? (
          <p className={hub.sub}>
            Empty transcript. Finish City Navigation to unlock warehouse & pharmacy.{" "}
            <Link href="/crimes">View crimes</Link>
          </p>
        ) : (
          <>
            <p className={hub.sub}>
              Completed: {s.completedCourses.map((id) => getCourse(id)?.name ?? id).join(", ")}
            </p>
            <ul className={hub.sub} style={{ margin: 0, paddingLeft: 18 }}>
              {transcript.jobPayBonus ? <li>Job pay +{transcript.jobPayBonus}%</li> : null}
              {transcript.gigPayBonus ? <li>Gig pay +{transcript.gigPayBonus}%</li> : null}
              {transcript.oddsBonus ? <li>Crime odds crumbs +{transcript.oddsBonus}</li> : null}
              {transcript.softCapBonus ? <li>Gym soft cap +{transcript.softCapBonus}</li> : null}
              {transcript.bankInterestBonus ? <li>Bank interest +{transcript.bankInterestBonus}%</li> : null}
              {transcript.hospitalTimeReduction ? (
                <li>Hospital time −{transcript.hospitalTimeReduction}%</li>
              ) : null}
              {unlockedNames ? <li>Content unlocked: {unlockedNames}</li> : null}
            </ul>
          </>
        )}
      </Module>

      <Module
        title="Licenses"
        footer={
          <>
            Certs granted on course complete · <Link href="/licenses">Full wallet</Link>
          </>
        }
      >
        {certs.length === 0 ? (
          <p className={hub.sub}>No seals yet. Finish any course to earn its license.</p>
        ) : (
          <>
            <ul className={hub.sub} style={{ margin: 0, paddingLeft: 18 }}>
              {certs.map((l) => (
                <li key={l.id}>
                  <strong>{l.name}</strong> — {licenseEffectLabels(l).join(" · ") || l.blurb}
                </li>
              ))}
            </ul>
            <ul className={hub.sub} style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {licenseSum.jobPayBonus ? <li>License job pay +{licenseSum.jobPayBonus}%</li> : null}
              {licenseSum.bankInterestBonus ? (
                <li>License bank interest +{licenseSum.bankInterestBonus}%</li>
              ) : null}
              {licenseSum.oddsBonus ? <li>License odds crumbs +{licenseSum.oddsBonus}</li> : null}
              {licenseSum.hospitalTimeReduction ? (
                <li>License hospital time −{licenseSum.hospitalTimeReduction}%</li>
              ) : null}
              {licenseSum.weeklyStipend ? <li>Weekly stipend ${licenseSum.weeklyStipend}</li> : null}
            </ul>
          </>
        )}
      </Module>
    </div>
  );
}
