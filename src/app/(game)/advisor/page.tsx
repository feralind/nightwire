"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CRIMES } from "@/content/catalog";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, CODEX_HERO } from "@/components/ui/Visuals";
import { buildAdvisorReport } from "@/game/advisor";
import { formatMoney } from "@/game/formulas";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function AdvisorPage() {
  const s = useGame();
  const getCrimeOddsView = useGame((st) => st.getCrimeOddsView);

  const report = useMemo(() => {
    const views: Record<string, { locked: boolean; odds: number; ev: number }> = {};
    for (const c of CRIMES) {
      const v = getCrimeOddsView(c.id);
      views[c.id] = { locked: v.locked, odds: v.odds, ev: v.ev };
    }
    return buildAdvisorReport(s, views);
  }, [s, getCrimeOddsView]);

  const verdictTone =
    report.verdict === "laylow"
      ? "money-neg"
      : report.verdict === "street"
        ? "money-pos"
        : "";

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Legal vs illegal"
        subtitle="Safer income vs street EV given heat, investigation, and cash pressure."
        tone="city"
        image={CODEX_HERO}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Heat {Math.floor(report.heat)} · {report.heatBand}</span>
          <span className={hub.chip}>Inv {report.investigation}</span>
          <span className={hub.chip}>Lv {s.level}</span>
        </div>
      </PageHero>

      <Module title="Verdict" footer="Advisory only — rolls and sinks still apply">
        <h2 className={verdictTone} style={{ margin: "0 0 6px", fontSize: 18 }}>
          {report.headline}
        </h2>
        <p className={hub.sub}>{report.detail}</p>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--text-dim)", fontSize: 13 }}>
          {report.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <Link href="/planner">
            <GameButton variant="secondary">Open planner</GameButton>
          </Link>
          <Link href="/jobs">
            <GameButton variant="secondary">Jobs</GameButton>
          </Link>
          <Link href="/crimes">
            <GameButton variant="secondary">Crimes</GameButton>
          </Link>
          <Link href="/wanted">
            <GameButton variant="ghost">Wanted / heat</GameButton>
          </Link>
        </div>
      </Module>

      <div className={hub.grid2}>
        <Module title="Best legal" footer="Clean cash · energy">
          {report.legalBest ? (
            <>
              <p style={{ margin: 0 }}>
                <strong>{report.legalBest.name}</strong>
              </p>
              <p className={hub.sub}>
                ~{formatMoney(report.legalBest.expectedCash)} ·{" "}
                {report.legalBest.evPerResource.toFixed(1)} $/energy · cost {report.legalBest.cost}
              </p>
              <p className={hub.sub}>{report.legalBest.notes}</p>
              <Link href={report.legalBest.href}>
                <GameButton>Open</GameButton>
              </Link>
            </>
          ) : (
            <p className={hub.sub}>No open legal lines — apply for a job or unlock gigs.</p>
          )}
        </Module>
        <Module title="Best street" footer="Street cash · nerve · heat">
          {report.streetBest ? (
            <>
              <p style={{ margin: 0 }}>
                <strong>{report.streetBest.name}</strong>
              </p>
              <p className={hub.sub}>
                ~{formatMoney(report.streetBest.expectedCash)} ·{" "}
                {report.streetBest.evPerResource.toFixed(1)} $/nerve · heat +
                {report.streetBest.heatDelta}
              </p>
              <p className={hub.sub}>{report.streetBest.notes}</p>
              <Link href={report.streetBest.href}>
                <GameButton variant="danger">Open</GameButton>
              </Link>
            </>
          ) : (
            <p className={hub.sub}>No open street lines.</p>
          )}
        </Module>
      </div>

      <Module title="Compared options" footer="Top legal and street by EV/resource">
        {report.options.length === 0 ? (
          <p className={hub.sub}>Nothing to compare right now.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Lane</th>
                <th>Play</th>
                <th>EV/$</th>
                <th>Cost</th>
                <th>Heat</th>
              </tr>
            </thead>
            <tbody>
              {report.options.map((o) => (
                <tr key={o.id}>
                  <td>{o.lane}</td>
                  <td>
                    <Link href={o.href}>{o.name}</Link>
                  </td>
                  <td className="tabular">{o.evPerResource.toFixed(1)}</td>
                  <td className="tabular">
                    {o.cost} {o.resource}
                  </td>
                  <td className="tabular">{o.heatDelta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Module>
    </div>
  );
}
