"use client";

import { useEffect, useState } from "react";
import { UNDO_LIMITS_COPY, undoIsAlive, undoRemainingMs } from "@/game/undo";
import { useGame } from "@/store/gameStore";
import { GameButton } from "@/components/ui/GameButton";
import styles from "./UndoBar.module.css";

/** Short undo window after cash/nerve/inventory mutations */
export function UndoBar() {
  const undoPending = useGame((s) => s.undoPending);
  const undoLastAction = useGame((s) => s.undoLastAction);
  const clearUndo = useGame((s) => s.clearUndo);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!undoPending) return;
    const id = window.setInterval(() => {
      if (!undoIsAlive(useGame.getState().undoPending)) {
        clearUndo();
      }
      tick((n) => n + 1);
    }, 250);
    return () => window.clearInterval(id);
  }, [undoPending, clearUndo]);

  if (!undoPending || !undoIsAlive(undoPending)) return null;

  const left = Math.ceil(undoRemainingMs(undoPending) / 1000);

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <div className={styles.main}>
        <span className={styles.label}>Undo</span>
        <span className={styles.detail}>{undoPending.label}</span>
        <span className={`tabular ${styles.timer}`}>{left}s</span>
      </div>
      <div className={styles.actions}>
        <GameButton variant="primary" onClick={() => undoLastAction()}>
          Undo
        </GameButton>
        <GameButton variant="ghost" onClick={() => clearUndo()}>
          Dismiss
        </GameButton>
      </div>
      <p className={styles.limits}>{UNDO_LIMITS_COPY}</p>
    </div>
  );
}
