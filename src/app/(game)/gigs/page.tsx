"use client";

import { DISTRICTS, GIGS, getCourse, getGig } from "@/content/catalog";
import { GIGS_WEEKLY_CAP, gigDoReasons, gigPayBonusPct } from "@/game/gigs";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { GIG_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";
import board from "./gigs.module.css";

export default function GigsPage() {
  const s = useGame();
  const courseGigBonus = gigPayBonusPct(s.completedCourses);
  const districtName = DISTRICTS.find((d) => d.id === s.district)?.name ?? s.district;

  return (
    <div>
      <PageHero
        title="Gigs"
        subtitle="Short legal contracts — clean cash even unemployed. Heat soft-gates civic work."
        tone="city"
        image="/art/gigs/hero.webp"
        tall
      />

      <Module
        title="Board"
        footer={`Weekly gig cap ${GIGS_WEEKLY_CAP} · Quality RNG · Course gig pay stacks`}
      >
        <p className={styles.sub}>
          This week {s.gigsThisWeek}/{GIGS_WEEKLY_CAP}
          {courseGigBonus ? ` · Course gig pay +${courseGigBonus}%` : ""}
          {s.jobId ? " · Works alongside your job" : " · No job required"}
          {" · "}
          Now in {districtName}
        </p>
        <div className={board.grid}>
          {GIGS.map((g) => {
            const reasons = gigDoReasons(g, s);
            const locked = reasons.length > 0;
            const inDistrict = g.districtBias.includes(s.district);
            const course = g.requiresCourse ? getCourse(g.requiresCourse) : null;
            const art = GIG_ART[g.id] ?? "/art/gigs/hero.webp";
            return (
              <article key={g.id} className={[board.card, locked ? board.locked : ""].filter(Boolean).join(" ")}>
                <div className={board.art}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art} alt="" className={board.thumb} />
                  <div className={board.artShade} />
                  <div className={board.artTitle}>
                    <strong>{g.name}</strong>
                  </div>
                </div>
                <div className={board.body}>
                  <p className={board.blurb}>{g.blurb}</p>
                  <div className={board.meta}>
                    <span>
                      Pay <strong className="tabular">{formatMoney(g.basePay)}</strong>
                    </span>
                    <span>
                      Energy <strong className="tabular">{g.energy}</strong>
                    </span>
                  </div>
                  <div className={board.notes}>
                    {inDistrict ? (
                      <div style={{ color: "var(--success)" }}>District +10%</div>
                    ) : (
                      <div>
                        Bias:{" "}
                        {g.districtBias.map((id) => DISTRICTS.find((d) => d.id === id)?.name ?? id).join(", ")}
                      </div>
                    )}
                    {g.maxHeat != null ? <div>Max heat {g.maxHeat}</div> : null}
                    {course ? <div>Needs {course.name}</div> : null}
                    {g.requiresStudy ? <div>Study track</div> : null}
                    {g.happyGain ? <div>+{g.happyGain} happy</div> : null}
                  </div>
                  <div className={board.actions}>
                    {locked ? <RequirementsBox reasons={reasons} /> : null}
                    <GameButton disabled={locked} onClick={() => s.doGig(g.id)}>
                      Take
                    </GameButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Module>

      <Module title="Recent gigs" footer="Last 8 outcomes">
        {(s.gigLog ?? []).length === 0 ? (
          <p className={styles.sub}>No gigs yet. Take one above — unemployed or not.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Gig</th>
                <th>Quality</th>
                <th>Pay</th>
                <th>Special</th>
              </tr>
            </thead>
            <tbody>
              {(s.gigLog ?? []).map((row, i) => (
                <tr key={`${row.at}-${i}`}>
                  <td>{getGig(row.gigId)?.name ?? row.gigId}</td>
                  <td>{row.quality}</td>
                  <td className="tabular money-pos">{formatMoney(row.pay)}</td>
                  <td>{row.special ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Module>
    </div>
  );
}
