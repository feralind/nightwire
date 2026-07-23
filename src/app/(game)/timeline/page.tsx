"use client";

import { useMemo } from "react";
import { listTimeline, timelineKindLabel } from "@/game/lore";
import { Module } from "@/components/ui/Module";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import loreStyles from "../codex/lore.module.css";

function formatTs(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function TimelinePage() {
  const s = useGame();
  const entries = useMemo(() => listTimeline(s), [s]);

  return (
    <div>
      <PageHero
        title="Personal timeline"
        subtitle="Milestones from lifetime stats, awards, ranks, and key flags — backfilled on load."
        tone="city"
        image="/art/timeline/hero.webp"
        tall
      />

      <Module title="Milestones" footer={`${entries.length} entries · persisted`}>
        {entries.length === 0 ? (
          <p className={loreStyles.dim}>No milestones yet. Arrive on the wire.</p>
        ) : (
          <ol className={loreStyles.timeline}>
            {entries.map((e) => (
              <li key={e.id} className={loreStyles.tlItem}>
                <div className={loreStyles.tlKind}>{timelineKindLabel(e.kind)}</div>
                <div className={loreStyles.tlBody}>
                  <strong>{e.title}</strong>
                  <div className={loreStyles.dek}>{e.detail}</div>
                  <div className={loreStyles.dek}>{formatTs(e.ts)}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Module>
    </div>
  );
}
