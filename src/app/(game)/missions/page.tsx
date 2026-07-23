"use client";

import Link from "next/link";
import { DISTRICTS, getCourse } from "@/content/catalog";
import { getMission, MISSIONS } from "@/content/missions";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero } from "@/components/ui/Visuals";
import { formatMoney, formatMmSs } from "@/game/formulas";
import {
  availableMissions,
  emptyMissions,
  missionAcceptReasons,
  missionProgress,
  MISSIONS_ACTIVE_CAP,
  objectiveLabel,
} from "@/game/missions";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";
import board from "../gigs/gigs.module.css";

export default function MissionsPage() {
  const s = useGame();
  const missions = s.missions ?? emptyMissions();
  const open = availableMissions(s);
  const now = Date.now();

  return (
    <div>
      <PageHero
        title="Mission Board"
        subtitle="Contracts with objectives — accept, grind the checklist, claim or abandon. Cap two active."
        tone="crime"
        image="/art/gigs/hero.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>
            Active {missions.active.length}/{MISSIONS_ACTIVE_CAP}
          </span>
          <span className={hub.chip}>Done {missions.completedIds.length}</span>
          <span className={hub.chip}>Failed {missions.failedIds.length}</span>
          <span className={hub.chip}>Lifetime {s.lifetime.missionsCompleted ?? 0}</span>
        </div>
      </PageHero>

      <p className={styles.sub} style={{ padding: "0 0 8px" }}>
        Lighter clean work lives on <Link href="/gigs">Gigs</Link>
        {" · "}
        big prep runs on <Link href="/organized">Organized</Link>
        {" · "}
        {MISSIONS.length}+ contracts on this board.
      </p>

      <Module title="Active contracts" footer="Objectives track lifetime deltas since accept">
        {missions.active.length === 0 ? (
          <p className={styles.sub}>No active missions. Accept one below.</p>
        ) : (
          <div className={board.grid}>
            {missions.active.map((a) => {
              const m = getMission(a.missionId);
              if (!m) return null;
              const prog = missionProgress(m, s, a.snapshot);
              const left = a.deadlineAt ? Math.max(0, (a.deadlineAt - now) / 1000) : null;
              return (
                <article key={a.missionId} className={board.card}>
                  <div className={board.body}>
                    <strong>{m.name}</strong>
                    <span className={hub.chip} style={{ marginLeft: 8 }}>
                      {m.tier}
                    </span>
                    <p className={board.blurb}>{m.blurb}</p>
                    <ul className={board.notes} style={{ listStyle: "none", padding: 0, margin: "8px 0" }}>
                      {prog.checks.map((c) => (
                        <li key={c.label} style={{ color: c.done ? "var(--success)" : "var(--text-dim)" }}>
                          {c.done ? "✓" : "○"} {c.label}
                        </li>
                      ))}
                    </ul>
                    <div className={board.meta}>
                      <span>
                        Progress{" "}
                        <strong className="tabular">
                          {prog.done}/{prog.total}
                        </strong>
                      </span>
                      {left != null ? (
                        <span className="tabular">⏱ {formatMmSs(left)}</span>
                      ) : (
                        <span>No deadline</span>
                      )}
                    </div>
                    <div className={board.actions}>
                      <GameButton disabled={!prog.complete} onClick={() => s.claimMission(m.id)}>
                        Claim
                      </GameButton>
                      <GameButton variant="secondary" onClick={() => s.abandonMission(m.id)}>
                        Abandon
                      </GameButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Module>

      <Module title="Available" footer="Energy/nerve spent on accept · fail penalties on abandon/expire">
        <div className={board.grid}>
          {open.map((m) => {
            const reasons = missionAcceptReasons(m, s);
            const locked = reasons.length > 0;
            const course = m.requiresCourse ? getCourse(m.requiresCourse) : null;
            const hint = m.districtHint
              ? DISTRICTS.find((d) => d.id === m.districtHint)?.name ?? m.districtHint
              : null;
            const rewardBits = [
              m.rewards.clean ? `${formatMoney(m.rewards.clean)} clean` : null,
              m.rewards.street ? `${formatMoney(m.rewards.street)} street` : null,
              m.rewards.xp ? `${m.rewards.xp} XP` : null,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <article key={m.id} className={[board.card, locked ? board.locked : ""].filter(Boolean).join(" ")}>
                <div className={board.body}>
                  <div className={board.artTitle} style={{ position: "static", marginBottom: 6 }}>
                    <strong>{m.name}</strong>
                    <span className={hub.chip} style={{ marginLeft: 8 }}>
                      {m.tier}
                    </span>
                  </div>
                  <p className={board.blurb}>{m.blurb}</p>
                  <div className={board.meta}>
                    <span>{rewardBits || "Rewards"}</span>
                    {m.energyCost ? (
                      <span>
                        Energy <strong className="tabular">{m.energyCost}</strong>
                      </span>
                    ) : null}
                    {m.nerveCost ? (
                      <span>
                        Nerve <strong className="tabular">{m.nerveCost}</strong>
                      </span>
                    ) : null}
                  </div>
                  <div className={board.notes}>
                    {hint ? <div>Hint: {hint}</div> : null}
                    {m.maxHeat != null ? <div>Max heat {m.maxHeat}</div> : null}
                    {course ? <div>Needs {course.name}</div> : null}
                    {m.deadlineHours ? <div>{m.deadlineHours}h deadline</div> : null}
                    <div>
                      Objectives:{" "}
                      {m.objectives.map((o) => objectiveLabel(o)).join("; ")}
                    </div>
                  </div>
                  <div className={board.actions}>
                    {locked ? <RequirementsBox reasons={reasons} /> : null}
                    <GameButton disabled={locked} onClick={() => s.acceptMission(m.id)}>
                      Accept
                    </GameButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {open.length === 0 ? (
          <p className={styles.sub}>All contracts cleared or in progress. Check back after claims.</p>
        ) : null}
      </Module>

      <Module title="Recent" footer="Last 8 outcomes">
        {missions.log.length === 0 ? (
          <p className={styles.sub}>No mission history yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mission</th>
                <th>Outcome</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {missions.log.slice(0, 8).map((row, i) => (
                <tr key={`${row.missionId}-${row.at}-${i}`}>
                  <td>{getMission(row.missionId)?.name ?? row.missionId}</td>
                  <td>{row.outcome}</td>
                  <td className="tabular money-pos">{row.payout ? formatMoney(row.payout) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Module>
    </div>
  );
}
