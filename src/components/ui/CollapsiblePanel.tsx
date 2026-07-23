"use client";

import { useState, type ReactNode } from "react";
import styles from "./CollapsiblePanel.module.css";

/** Torn-style "General Information ▾" section header */
export function CollapsiblePanel({
  title,
  defaultOpen = true,
  children,
  footer,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={styles.panel}>
      <button
        type="button"
        className={styles.head}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.title}>{title}</span>
        <span className={styles.chev} aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && <div className={styles.body}>{children}</div>}
      {open && footer != null && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}
