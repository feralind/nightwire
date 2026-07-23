import type { ReactNode } from "react";
import styles from "./InfoRow.module.css";

/** Torn-style dense label | value row */
export function InfoRow({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: "default" | "pos" | "neg" | "warn";
}) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span
        className={[
          styles.value,
          "tabular",
          tone === "pos" ? styles.pos : "",
          tone === "neg" ? styles.neg : "",
          tone === "warn" ? styles.warn : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

export function InfoRowBlock({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={[styles.block, className].filter(Boolean).join(" ")}>{children}</div>;
}
