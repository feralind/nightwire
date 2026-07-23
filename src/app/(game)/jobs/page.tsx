"use client";

import { JOBS, getCourse, getJob } from "@/content/catalog";
import {
  canApplyJob,
  canPromote,
  jobApplyReasons,
  jobPromoteReasons,
  nextRankJob,
  promoteXpNeeded,
} from "@/game/careers";
import { formatMoney } from "@/game/formulas";
import { licenseJobPayBonus } from "@/game/licenses";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { JOB_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";
import board from "./jobs.module.css";

export default function JobsPage() {
  const s = useGame();
  const current = s.jobId ? getJob(s.jobId) : null;
  const next = current ? nextRankJob(current) : undefined;
  const promoteNeed = next ? promoteXpNeeded(next) : 0;
  const promotePct = next ? Math.min(100, Math.round((s.jobXp / promoteNeed) * 100)) : 0;
  const promoteOk = next ? canPromote(next, s) : false;
  const blocked =
    (s.hospitalUntil && Date.now() < s.hospitalUntil) ||
    (s.jailUntil && Date.now() < s.jailUntil) ||
    (s.travelUntil && Date.now() < s.travelUntil);
  const canWork =
    Boolean(current) && !blocked && s.energy >= (current?.energy ?? 5) && s.shiftsThisWeek < 40;

  const coursePayBonus = s.completedCourses.reduce((a, id) => a + (getCourse(id)?.jobPayBonus ?? 0), 0);
  const licensePayBonus = licenseJobPayBonus(s.licenses);
  const districtBoost = current?.districtBias.includes(s.district);
  const currentArt = current ? JOB_ART[current.career] ?? "/art/jobs/hero.webp" : "/art/jobs/hero.webp";

  return (
    <div>
      <PageHero
        title="Employment"
        subtitle="Careers with ranks, shifts, specials — clean money when heat runs hot."
        tone="city"
        image="/art/jobs/hero.webp"
        tall
      />

      <Module title="Current post" footer="Weekly shift cap 40 · Excellent may proc career special">
        {current ? (
          <div className={styles.card} style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ position: "relative", height: 100 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentArt}
                alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.35) 55%,rgba(0,0,0,0.55))",
                }}
              />
              <div style={{ position: "relative", padding: 12, maxWidth: 520 }}>
                <strong>{current.title}</strong>{" "}
                <span style={{ color: "var(--text-dim)" }}>
                  · {current.career} R{current.rank}
                </span>
                <p className={styles.sub} style={{ marginTop: 4, marginBottom: 0 }}>
                  {current.blurb}
                </p>
              </div>
            </div>
            <div style={{ padding: 12 }}>
              <div className="tabular" style={{ fontSize: 12, color: "var(--text-dim)" }}>
                Base {formatMoney(current.basePay)} · Energy {current.energy} · Special: {current.special}
              </div>
              <p className={styles.sub}>
                Shifts this week {s.shiftsThisWeek}/40
                {coursePayBonus ? ` · Course pay +${coursePayBonus}%` : ""}
                {licensePayBonus ? ` · License pay +${licensePayBonus}%` : ""}
                {districtBoost ? " · District labor +10%" : " · Travel to job district for +10%"}
              </p>
              {next ? (
                <div style={{ margin: "8px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--text-dim)",
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      Promotion → {next.title} ({s.jobXp}/{promoteNeed} XP)
                    </span>
                    <span className="tabular">{promotePct}%</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "var(--bg-panel-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${promotePct}%`,
                        height: "100%",
                        background: promoteOk ? "var(--accent-rail)" : "var(--text-dim)",
                      }}
                    />
                  </div>
                  {promoteOk ? (
                    <p style={{ margin: "8px 0 0" }}>
                      <GameButton onClick={() => s.promoteJob()}>Promote to {next.title}</GameButton>
                    </p>
                  ) : (
                    <div style={{ marginTop: 8 }}>
                      <RequirementsBox reasons={jobPromoteReasons(next, s)} />
                    </div>
                  )}
                </div>
              ) : (
                <p className={styles.sub}>Lead of this ladder for V0 — more ranks after gates.</p>
              )}
              <p style={{ margin: "8px 0 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
                <GameButton disabled={!canWork} onClick={() => s.workShift()}>
                  Work shift ({current.energy} energy)
                </GameButton>
                <GameButton variant="secondary" onClick={() => s.quitJob()}>
                  Quit
                </GameButton>
              </p>
              {blocked ? <p className={styles.sub}>Actions blocked while hospitalized, jailed, or traveling.</p> : null}
            </div>
          </div>
        ) : (
          <p className={styles.sub}>Unemployed. Apply to a rank-1 post below — promotions unlock rank 2.</p>
        )}
      </Module>

      <Module title="Career board" footer="Rank 2 = promote only · Illustrated by career ladder">
        <div className={board.grid}>
          {JOBS.map((j) => {
            const isCurrent = s.jobId === j.id;
            const applyReasons = jobApplyReasons(j, s);
            const locked = j.rank === 1 ? applyReasons.length > 0 : true;
            const exam = j.promoteCourse ? getCourse(j.promoteCourse)?.name : null;
            const art = JOB_ART[j.career] ?? "/art/jobs/hero.webp";
            return (
              <article key={j.id} className={[board.card, isCurrent ? board.current : ""].filter(Boolean).join(" ")}>
                <div className={board.art}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={art} alt="" className={board.thumb} />
                  <div className={board.artShade} />
                  <div className={board.artTitle}>
                    <strong>{j.title}</strong>
                    <span>
                      {j.career} R{j.rank}
                    </span>
                  </div>
                </div>
                <div className={board.body}>
                  <p className={board.blurb}>{j.blurb}</p>
                  <div className={board.meta}>
                    <span>
                      Pay <strong className="tabular">{formatMoney(j.basePay)}</strong>
                    </span>
                    <span>
                      Energy <strong className="tabular">{j.energy}</strong>
                    </span>
                    <span style={{ gridColumn: "1 / -1" }}>
                      Special <strong>{j.special}</strong>
                    </span>
                    {exam ? (
                      <span style={{ gridColumn: "1 / -1" }}>
                        Exam <strong>{exam}</strong>
                      </span>
                    ) : null}
                    {j.requiresLevel ? (
                      <span style={{ gridColumn: "1 / -1" }}>
                        Level <strong>{j.requiresLevel}+</strong>
                      </span>
                    ) : null}
                  </div>
                  <div className={board.actions}>
                    {j.rank > 1 && locked && !isCurrent ? (
                      <RequirementsBox
                        reasons={
                          s.jobId && getJob(s.jobId)?.career === j.career
                            ? jobPromoteReasons(j, s)
                            : [{ label: `Hold ${j.career} R1, then promote`, href: "/jobs" }]
                        }
                      />
                    ) : null}
                    {j.rank === 1 && locked && !isCurrent ? <RequirementsBox reasons={applyReasons} /> : null}
                    {j.rank === 1 ? (
                      <GameButton
                        variant="secondary"
                        disabled={!canApplyJob(j, s)}
                        onClick={() => s.applyJob(j.id)}
                      >
                        {isCurrent ? "Current" : "Apply"}
                      </GameButton>
                    ) : isCurrent ? (
                      <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Held</span>
                    ) : (
                      <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Promote from R1</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Module>

      <Module title="Recent shifts" footer="Last 8 outcomes">
        {(s.shiftLog ?? []).length === 0 ? (
          <p className={styles.sub}>No shifts yet. Work once to fill the log.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quality</th>
                <th>Pay</th>
                <th>Special</th>
              </tr>
            </thead>
            <tbody>
              {(s.shiftLog ?? []).map((row, i) => (
                <tr key={`${row.at}-${i}`}>
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
