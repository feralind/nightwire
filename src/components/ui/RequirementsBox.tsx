"use client";

import Link from "next/link";
import styles from "./RequirementsBox.module.css";

export function RequirementsBox({
  reasons,
}: {
  reasons: { label: string; href?: string }[];
}) {
  if (!reasons.length) return null;
  return (
    <div className={styles.box} role="status">
      <div className={styles.title}>Requirements</div>
      <ul>
        {reasons.map((r) => (
          <li key={r.label}>
            {r.href ? <Link href={r.href}>{r.label}</Link> : r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
