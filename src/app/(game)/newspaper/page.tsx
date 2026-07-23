"use client";

import { useMemo } from "react";
import { buildNewspaperEdition } from "@/game/lore";
import { Module } from "@/components/ui/Module";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import loreStyles from "../codex/lore.module.css";

function formatTs(ts?: number) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function NewspaperPage() {
  const s = useGame();
  const edition = useMemo(() => buildNewspaperEdition(s), [s]);
  const front = edition.filter((a) => a.column === "front");
  const city = edition.filter((a) => a.column === "city");
  const wire = edition.filter((a) => a.column === "wire");

  return (
    <div>
      <PageHero
        title="Nightwire Gazette"
        subtitle="Diegetic desk copy — reactive front page, city ticker pool, and your wire."
        tone="city"
        image="/art/newspaper/hero.webp"
        tall
      />

      <div className={loreStyles.paperGrid}>
        <Module title="Front page" footer="Reacts to heat, rank, heists, rival, and flags">
          {front.length === 0 ? (
            <p className={loreStyles.dim}>Quiet edition. Make some noise — carefully.</p>
          ) : (
            <ul className={loreStyles.hedList}>
              {front.map((a) => (
                <li key={a.id}>
                  <strong className={loreStyles.hed}>{a.hed}</strong>
                  {a.dek && <div className={loreStyles.dek}>{a.dek}</div>}
                </li>
              ))}
            </ul>
          )}
        </Module>

        <Module title="City desk" footer="Rotating pool from the wire ticker">
          <ul className={loreStyles.hedList}>
            {city.map((a) => (
              <li key={a.id}>
                <span className={loreStyles.hed}>{a.hed}</span>
              </li>
            ))}
          </ul>
        </Module>
      </div>

      <Module title="The wire" footer="Diegetic log + timeline milestones">
        {wire.length === 0 ? (
          <p className={loreStyles.dim}>No copy on the wire yet.</p>
        ) : (
          <ul className={loreStyles.hedList}>
            {wire.map((a) => (
              <li key={a.id}>
                <span className={loreStyles.hed}>{a.hed}</span>
                {a.dek && <div className={loreStyles.dek}>{a.dek}</div>}
                {a.ts ? <div className={loreStyles.dek}>{formatTs(a.ts)}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </Module>
    </div>
  );
}
