"use client";

import { InfoRow, InfoRowBlock } from "@/components/ui/InfoRow";
import styles from "./OddsBreakdown.module.css";

export type OddsMod = { label: string; value: number };

function fmtSigned(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  if (rounded > 0) return `+${rounded}`;
  if (rounded < 0) return `${rounded}`;
  return "0";
}

function fmtOddsPct(odds: number): string {
  return `${(odds * 100).toFixed(1)}%`;
}

/** Presentational skill-lever list from getCrimeOddsView — no odds recompute */
export function OddsBreakdown({
  odds,
  ev,
  modifiers,
  compact,
  ritual,
}: {
  odds: number;
  ev?: number;
  modifiers: OddsMod[];
  compact?: boolean;
  ritual?: {
    seed: string;
    actionKey: string;
    actionIndex: number;
    roll: number;
  };
}) {
  const active = modifiers.filter((m) => Math.abs(m.value) > 0.0001);
  const rows = active.length ? active : modifiers;

  return (
    <div className={[styles.box, compact ? styles.compact : ""].filter(Boolean).join(" ")}>
      <InfoRowBlock>
        <InfoRow label="Odds" value={fmtOddsPct(odds)} />
        {ev != null && <InfoRow label="EV" value={Math.round(ev)} tone="pos" />}
        {ritual && (
          <>
            <InfoRow
              label="Roll"
              value={
                <>
                  {ritual.roll}
                  <span className={styles.dim}> / 10000</span>
                </>
              }
            />
            <InfoRow label="Seed" value={<code className={styles.code}>{ritual.seed}</code>} />
            <InfoRow
              label="Key"
              value={
                <>
                  <code className={styles.code}>{ritual.actionKey}</code>
                  <span className={styles.dim}> · {ritual.actionIndex}</span>
                </>
              }
            />
            <InfoRow label="Need &lt;" value={Math.floor(odds * 10000)} />
          </>
        )}
        {rows.map((m) => (
          <InfoRow
            key={m.label}
            label={m.label}
            value={fmtSigned(m.value)}
            tone={m.value > 0 ? "pos" : m.value < 0 ? "neg" : "default"}
          />
        ))}
        <InfoRow label="→ Final" value={fmtOddsPct(odds)} />
      </InfoRowBlock>
    </div>
  );
}
