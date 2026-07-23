"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { COMBOS, comboLabels, comboProgress, type ComboKind } from "@/content/combos";
import { Module } from "@/components/ui/Module";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

const KINDS: { id: ComboKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "item_crime", label: "Item + crime" },
  { id: "job_crime", label: "Job + crime" },
  { id: "item_job", label: "Item + job" },
  { id: "loadout", label: "Loadout" },
  { id: "district", label: "District" },
];

export default function CombosPage() {
  const s = useGame();
  const [kind, setKind] = useState<ComboKind | "all">("all");
  const list = useMemo(
    () => (kind === "all" ? COMBOS : COMBOS.filter((c) => c.kind === kind)),
    [kind]
  );
  const activeCount = list.filter((c) => comboProgress(c, s).active).length;

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Combo book"
        subtitle="Soft synergies the city rewards — tools, jobs, districts, loadouts. Not hard multipliers."
        tone="city"
        image="/art/codex/hero.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>{COMBOS.length} entries</span>
          <span className={hub.chip}>{activeCount} half-lit on you</span>
        </div>
      </PageHero>

      <p className={hub.sub}>
        Almanac formulas: <Link href="/almanac">Field guide</Link>
        {" · "}
        Education: <Link href="/education">Courses</Link>
        {" · "}
        Shops: <Link href="/shops">Counters</Link>
      </p>

      <Module title="Browser" footer="Active = you hold / sit in roughly half the pieces">
        <div className={styles.tabs} style={{ marginBottom: 10 }}>
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={kind === k.id ? styles.tabActive : styles.tab}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
        <div className={hub.grid}>
          {list.map((combo) => {
            const prog = comboProgress(combo, s);
            const labels = comboLabels(combo);
            const grey = !prog.active;
            return (
              <article
                key={combo.id}
                className={hub.panel}
                style={{ opacity: grey ? 0.55 : 1 }}
              >
                <div className={hub.statRow} style={{ borderBottom: "none", paddingTop: 0 }}>
                  <h2
                    className={hub.panelTitle}
                    style={{ color: "var(--text)", textTransform: "none", letterSpacing: 0, margin: 0 }}
                  >
                    {combo.name}
                  </h2>
                  <strong className="tabular">{"★".repeat(combo.strength)}</strong>
                </div>
                <p className={hub.sub}>{combo.blurb}</p>
                <p className={hub.sub} style={{ color: "var(--accent-rail)" }}>
                  {combo.tip}
                </p>
                {labels.length > 0 ? (
                  <div className={hub.chipRow} style={{ marginTop: 6 }}>
                    {labels.slice(0, 6).map((l) => (
                      <span key={l} className={hub.chip}>
                        {l}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className={hub.statRow}>
                  <span>Pieces</span>
                  <strong className="tabular">
                    {prog.have}/{prog.need}
                    {prog.active ? " · lit" : " · grey"}
                  </strong>
                </div>
              </article>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
