"use client";

import { HEISTS } from "@/content/heists";
import { getDistrict, getItem } from "@/content/catalog";
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
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import type { HeistDef, HeistStageDef } from "@/game/types";
import styles from "../tables.module.css";
import boardStyles from "./organized.module.css";

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
  const unlocked = HEISTS.filter((h) => isHeistUnlocked(h, s));
  const locked = HEISTS.filter((h) => !isHeistUnlocked(h, s));
  const live = unlocked.filter((h) => getPrepBoard(s, h.id).executePhase);

  return (
    <div>
      <PageHero
        title="Organized"
        subtitle="Prep boards, not one-click scores. Intel → crew → kit → window → execute. Failures can burn staged tools — never the whole save."
        tone="crime"
        image="/art/crimes/harbor.webp"
        tall
      />

      <Module
        title="Ops board"
        footer={`${HEISTS.length}/24 boards live · Path toward full V2 set · Completions ${s.lifetime.heistsCompleted ?? 0}`}
      >
        {live.length > 0 && (
          <p className={styles.sub} style={{ marginBottom: 8 }}>
            Live execute: {live.map((h) => h.name).join(", ")}
          </p>
        )}
        {unlocked.length === 0 ? (
          <p className={styles.sub}>No boards unlocked yet. Raise level or finish the course gates below.</p>
        ) : (
          <div className={boardStyles.list}>
            {unlocked.map((h) => (
              <BoardCard key={h.id} heist={h} />
            ))}
          </div>
        )}
      </Module>

      {locked.length > 0 && (
        <Module title="Locked boards">
          <div className={boardStyles.list}>
            {locked.map((h) => (
              <BoardCard key={h.id} heist={h} />
            ))}
          </div>
        </Module>
      )}
    </div>
  );
}
