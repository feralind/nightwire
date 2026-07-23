"use client";

import { useEffect, useRef } from "react";
import { formatMoney } from "@/game/formulas";
import { useGame } from "@/store/gameStore";
import { GameButton } from "@/components/ui/GameButton";
import { OddsBreakdown } from "@/components/ui/OddsBreakdown";
import styles from "./ResultModal.module.css";

export function ResultModal() {
  const modal = useGame((s) => s.resultModal);
  const dismiss = useGame((s) => s.dismissResult);
  const attemptCrime = useGame((s) => s.attemptCrime);
  const workShift = useGame((s) => s.workShift);
  const doGig = useGame((s) => s.doGig);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!modal) return;
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, dismiss]);

  if (!modal) return null;

  const color =
    modal.title === "SUCCESS"
      ? styles.success
      : modal.title === "MIXED"
        ? styles.mixed
        : modal.title === "JAILED"
          ? styles.jail
          : modal.title === "HOSPITALIZED"
            ? styles.hospital
            : styles.fail;

  return (
    <div className={styles.backdrop} role="presentation" onClick={dismiss}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={modal.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${styles.title} ${color}`}>{modal.title}</div>
        <ul className={styles.lines}>
          {modal.lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        {modal.cashDelta !== 0 && (
          <div className={`tabular ${modal.cashDelta >= 0 ? "money-pos" : "money-neg"} ${styles.cash}`}>
            {modal.cashDelta >= 0 ? "+" : ""}
            {formatMoney(modal.cashDelta)}
          </div>
        )}
        {modal.ritual && (
          <div className={styles.ritual}>
            <div className={styles.ritualHead}>Attempt breakdown</div>
            <OddsBreakdown
              odds={modal.ritual.odds}
              ev={modal.ritual.ev}
              modifiers={modal.ritual.modifiers}
              ritual={{
                seed: modal.ritual.seed,
                actionKey: modal.ritual.actionKey,
                actionIndex: modal.ritual.actionIndex,
                roll: modal.ritual.roll,
              }}
            />
          </div>
        )}
        <div className={styles.actions}>
          <GameButton ref={btnRef} onClick={dismiss}>
            Continue
          </GameButton>
          {modal.repeatable && (
            <GameButton
              variant="secondary"
              onClick={() => {
                const rep = modal.repeatable;
                dismiss();
                queueMicrotask(() => {
                  if (rep?.type === "crime") attemptCrime(rep.id);
                  if (rep?.type === "job") workShift();
                  if (rep?.type === "gig") doGig(rep.id);
                });
              }}
            >
              Repeat last
            </GameButton>
          )}
        </div>
      </div>
    </div>
  );
}
