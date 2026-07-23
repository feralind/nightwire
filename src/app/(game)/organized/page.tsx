"use client";

import { useMemo, useState } from "react";
import { HEISTS } from "@/content/heists";
import { DISTRICTS, getDistrict, getItem } from "@/content/catalog";
import {
  boardOnCooldown,
  canExecuteChoice,
  canRunStage,
  executeChoiceReasons,
  getPrepBoard,
  heistBoardSummary,
  heistUnlockReasons,
  isHeistUnlocked,
  nextPrepStage,
  prepReady,
  stageRunReasons,
} from "@/game/heists";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { HEIST_ART, HEIST_HERO, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import type { DistrictId, HeistDef, HeistRisk, HeistStageDef } from "@/game/types";
import styles from "../tables.module.css";
import boardStyles from "./organized.module.css";

type DistrictFilter = "all" | DistrictId;
type RiskFilter = "all" | HeistRisk;
type LockFilter = "all" | "unlocked" | "locked";

function stageCostBits(stage: HeistStageDef): string {
  const bits = [
    stage.energy ? `${stage.energy} energy` : null,
    stage.nerve ? `${stage.nerve} nerve` : null,
    stage.streetCost ? `${formatMoney(stage.streetCost)} street` : null,
    stage.cleanCost ? `${formatMoney(stage.cleanCost)} clean` : null,
    ...(stage.requireItems ?? []).map((r) => {
      const name = getItem(r.itemId)?.name ?? r.itemId;
      return `${r.qty}× ${name}`;
    }),
  ].filter(Boolean);
  return bits.join(" · ");
}

function BoardCard({ heist }: { heist: HeistDef }) {
  const s = useGame();
  const board = getPrepBoard(s, heist.id);
  const unlocked = isHeistUnlocked(heist, s);
  const next = nextPrepStage(heist, board);
  const ready = prepReady(heist, board);
  const cooling = boardOnCooldown(board);
  const district = getDistrict(heist.district);
  const runPrep = useGame((st) => st.runHeistPrep);
  const execute = useGame((st) => st.executeHeist);

  return (
    <article className={`${boardStyles.card} ${!unlocked ? boardStyles.locked : ""}`}>
      <div
        className={boardStyles.banner}
        style={{
          backgroundImage: `linear-gradient(90deg,rgba(0,0,0,0.55),rgba(0,0,0,0.2)), url(${HEIST_ART[heist.id] ?? HEIST_HERO})`,
        }}
      />
      <header className={boardStyles.head}>
        <div>
          <strong>{heist.name}</strong>
          <div className={boardStyles.meta}>
            {district?.name ?? heist.district} · {heist.risk} ·{" "}
            {formatMoney(heist.payoutMin)}–{formatMoney(heist.payoutMax)}
          </div>
        </div>
        <div className={boardStyles.summary}>{heistBoardSummary(heist, board)}</div>
      </header>
      <p className={boardStyles.blurb}>{heist.blurb}</p>

      {!unlocked && <RequirementsBox reasons={heistUnlockReasons(heist, s)} />}

      {unlocked && (
        <>
          <div className={boardStyles.kanban}>
            {heist.stages.map((stage) => {
              const done = board.completedStageIds.includes(stage.id);
              const isNext = next?.id === stage.id && stage.kind !== "execute";
              const isExec = stage.kind === "execute";
              const live = isExec && (board.executePhase || (ready && !cooling));
              return (
                <div
                  key={stage.id}
                  className={`${boardStyles.stage} ${done ? boardStyles.stageDone : ""} ${
                    isNext || (live && board.executePhase) ? boardStyles.stageActive : ""
                  }`}
                >
                  <div className={boardStyles.stageKind}>{stage.kind}</div>
                  <div className={boardStyles.stageName}>{stage.name}</div>
                  <div className={styles.sub}>{stage.blurb}</div>
                  {!isExec && (
                    <div className={styles.sub} style={{ marginTop: 4 }}>
                      {stageCostBits(stage)}
                    </div>
                  )}
                  {done && <div className={boardStyles.stamp}>Done</div>}
                  {isExec && board.executePhase && (
                    <div className={boardStyles.stamp}>Live · {board.executePhase}</div>
                  )}
                </div>
              );
            })}
          </div>

          {board.stagedItems.length > 0 && (
            <div className={styles.sub}>
              Staged:{" "}
              {board.stagedItems
                .map((i) => `${i.qty}× ${getItem(i.itemId)?.name ?? i.itemId}`)
                .join(", ")}
            </div>
          )}

          {cooling && (
            <p className={styles.sub}>Board cooling down after the last run.</p>
          )}

          {!cooling && next && next.kind !== "execute" && (
            <div className={boardStyles.actions}>
              {!canRunStage(heist, next, s) && (
                <RequirementsBox reasons={stageRunReasons(heist, next, s)} />
              )}
              <GameButton disabled={!canRunStage(heist, next, s)} onClick={() => runPrep(heist.id)}>
                Run: {next.name}
              </GameButton>
            </div>
          )}

          {!cooling && (ready || board.executePhase) && (
            <div className={boardStyles.execBlock}>
              <div className={boardStyles.execTitle}>
                Execute{board.executePhase ? ` — ${board.executePhase}` : " — ready"}
              </div>
              <p className={styles.sub} style={{ marginTop: 0 }}>
                Multi-roll: approach → breach → extract. Abort salvages kit; sacrifice burns a staged
                item for better odds.
              </p>
              <div className={boardStyles.execActions}>
                {(["push", "sacrifice", "abort"] as const).map((choice) => {
                  const ok = canExecuteChoice(heist, choice, s);
                  const reasons = executeChoiceReasons(heist, choice, s);
                  return (
                    <div key={choice} className={boardStyles.execChoice}>
                      {!ok && choice !== "abort" && <RequirementsBox reasons={reasons} />}
                      {!ok && choice === "abort" && board.executePhase && (
                        <RequirementsBox reasons={reasons} />
                      )}
                      <GameButton
                        variant={choice === "abort" ? "danger" : choice === "sacrifice" ? "secondary" : "primary"}
                        disabled={!ok}
                        onClick={() => execute(heist.id, choice)}
                      >
                        {choice === "push" ? "Push" : choice === "sacrifice" ? "Sacrifice item" : "Abort"}
                      </GameButton>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}

export default function OrganizedPage() {
  const s = useGame();
  const [district, setDistrict] = useState<DistrictFilter>("all");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [lock, setLock] = useState<LockFilter>("all");

  const filtered = useMemo(() => {
    return HEISTS.filter((h) => {
      if (district !== "all" && h.district !== district) return false;
      if (risk !== "all" && h.risk !== risk) return false;
      const unlocked = isHeistUnlocked(h, s);
      if (lock === "unlocked" && !unlocked) return false;
      if (lock === "locked" && unlocked) return false;
      return true;
    });
  }, [district, risk, lock, s]);

  const unlocked = filtered.filter((h) => isHeistUnlocked(h, s));
  const locked = filtered.filter((h) => !isHeistUnlocked(h, s));
  const live = unlocked.filter((h) => getPrepBoard(s, h.id).executePhase);

  return (
    <div>
      <PageHero
        title="Organized"
        subtitle="Prep boards, not one-click scores. Intel → crew → kit → window → execute. Failures can burn staged tools — never the whole save."
        tone="crime"
        image={HEIST_HERO}
        tall
      />

      <Module
        title="Ops board"
        tabs={
          <div className={boardStyles.filters}>
            <div className={boardStyles.tabs}>
              <button
                type="button"
                className={district === "all" ? boardStyles.tabActive : boardStyles.tab}
                onClick={() => setDistrict("all")}
              >
                All
              </button>
              {DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={district === d.id ? boardStyles.tabActive : boardStyles.tab}
                  onClick={() => setDistrict(d.id)}
                >
                  {d.name}
                </button>
              ))}
            </div>
            <div className={boardStyles.tabs}>
              {(["all", "moderate", "high", "extreme"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={risk === r ? boardStyles.tabActive : boardStyles.tab}
                  onClick={() => setRisk(r)}
                >
                  {r === "all" ? "Any risk" : r}
                </button>
              ))}
            </div>
            <div className={boardStyles.tabs}>
              {([
                ["all", "All boards"],
                ["unlocked", "Unlocked"],
                ["locked", "Locked"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={lock === id ? boardStyles.tabActive : boardStyles.tab}
                  onClick={() => setLock(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        }
        footer={`${HEISTS.length}/24 boards live · Showing ${filtered.length} · Completions ${s.lifetime.heistsCompleted ?? 0}`}
      >
        {live.length > 0 && (
          <p className={styles.sub} style={{ marginBottom: 8 }}>
            Live execute: {live.map((h) => h.name).join(", ")}
          </p>
        )}
        {filtered.length === 0 ? (
          <p className={styles.sub}>No boards match these filters.</p>
        ) : unlocked.length === 0 && lock !== "locked" ? (
          <p className={styles.sub}>No unlocked boards in this filter. Raise level, jobs, courses, or properties.</p>
        ) : (
          <div className={boardStyles.list}>
            {(lock === "locked" ? locked : lock === "unlocked" ? unlocked : [...unlocked, ...locked]).map(
              (h) => (
                <BoardCard key={h.id} heist={h} />
              )
            )}
          </div>
        )}
      </Module>
    </div>
  );
}
