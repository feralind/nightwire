"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/store/gameStore";
import { GameButton } from "@/components/ui/GameButton";
import styles from "./ResultModal.module.css";

/** Unlock feedback for Nightwire awards */
export function AwardModal() {
  const modal = useGame((s) => s.awardModal);
  const dismiss = useGame((s) => s.dismissAwards);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!modal?.length) return;
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, dismiss]);

  if (!modal?.length) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={dismiss}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Award unlocked"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: "relative",
            height: 72,
            margin: "-4px -4px 10px",
            borderRadius: "var(--r1)",
            overflow: "hidden",
            background: "center/cover no-repeat url(/art/awards/hero.webp), #151518",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg,transparent 20%,rgba(0,0,0,0.75))",
            }}
          />
          <div
            className={`${styles.title} ${styles.success}`}
            style={{ position: "relative", padding: "28px 10px 8px", margin: 0 }}
          >
            AWARD
          </div>
        </div>
        <ul className={styles.lines}>
          {modal.map((a) => (
            <li key={a.name}>
              <strong>{a.name}</strong> — {a.blurb}
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <GameButton ref={btnRef} onClick={dismiss}>
            Continue
          </GameButton>
        </div>
      </div>
    </div>
  );
}
