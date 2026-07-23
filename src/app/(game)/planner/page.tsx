"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CRIMES, getCrime } from "@/content/catalog";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, CODEX_HERO } from "@/components/ui/Visuals";
import {
  buildMixSuggestions,
  forecastNervePacks,
  rankCrimesByEv,
  suggestSpendPlan,
} from "@/game/planner";
import { formatMoney } from "@/game/formulas";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

/** Activity + EV build planner */
export default function PlannerPage() {
  const s = useGame();
  const getCrimeOddsView = useGame((st) => st.getCrimeOddsView);
  const [n, setN] = useState(3);
  const lastCrime = useMemo(() => (s.lastCrimeId ? getCrime(s.lastCrimeId) : undefined), [s.lastCrimeId]);
  const busy = Boolean(s.hospitalUntil || s.jailUntil || s.travelUntil || s.laylowUntil);
  const clamp = Math.max(1, Math.min(20, n || 1));

  const views = useMemo(() => {
    const map: Record<string, { locked: boolean; odds: number; ev: number }> = {};
    for (const c of CRIMES) {
      const v = getCrimeOddsView(c.id);
      map[c.id] = { locked: v.locked, odds: v.odds, ev: v.ev };
    }
    return map;
  }, [getCrimeOddsView, s.nerve, s.heat, s.level, s.dex, s.spd, s.inventory, s.difficulty, s.district]);

  const ranked = useMemo(() => rankCrimesByEv(views, 8), [views]);
  const plan = useMemo(() => suggestSpendPlan(s, views), [s, views]);
  const mixes = useMemo(() => buildMixSuggestions(s, views), [s, views]);
  const forecast = useMemo(() => forecastNervePacks(s.nerve, ranked[0]), [s.nerve, ranked]);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Build planner"
        subtitle="EV-ranked crime mixes, nerve/energy spend, and batch queues."
        tone="city"
        image={CODEX_HERO}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Nerve {Math.floor(s.nerve)}</span>
          <span className={hub.chip}>Energy {Math.floor(s.energy)}</span>
          <span className={hub.chip}>Heat {Math.floor(s.heat)}</span>
          {lastCrime ? <span className={hub.chip}>Last: {lastCrime.name}</span> : null}
        </div>
      </PageHero>

      <Module title={plan.title} footer={plan.summary}>
        <div className={hub.chipRow} style={{ marginBottom: 10 }}>
          <span className={hub.chip}>
            Street EV ~ <strong className="tabular">{formatMoney(plan.expectedStreet)}</strong>
          </span>
          <span className={hub.chip}>
            Clean EV ~ <strong className="tabular">{formatMoney(plan.expectedClean)}</strong>
          </span>
          <span className={hub.chip}>Nerve −{plan.nerveSpend}</span>
          <span className={hub.chip}>Energy −{plan.energySpend}</span>
          <span className={hub.chip}>Heat ~+{plan.expectedHeat}</span>
        </div>
        <ol style={{ margin: "0 0 12px", paddingLeft: 18, color: "var(--text-dim)", fontSize: 13 }}>
          {plan.steps.map((step) => (
            <li key={step} style={{ marginBottom: 4 }}>
              {step}
            </li>
          ))}
        </ol>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {plan.crimeIds[0] ? (
            <GameButton
              variant="danger"
              disabled={busy}
              onClick={() => {
                for (const id of plan.crimeIds.slice(0, 5)) {
                  if (useGame.getState().nerve < (getCrime(id)?.nerve ?? 99)) break;
                  useGame.getState().attemptCrime(id);
                }
              }}
            >
              Run suggested crimes
            </GameButton>
          ) : null}
          {plan.preferJob ? (
            <GameButton
              disabled={busy || !s.jobId}
              onClick={() => {
                for (let i = 0; i < 2; i++) useGame.getState().workShift();
              }}
            >
              Work suggested shifts
            </GameButton>
          ) : null}
          <Link href="/advisor">
            <GameButton variant="secondary">Legal vs street advisor</GameButton>
          </Link>
          <Link href="/gym">
            <GameButton variant="secondary">Gym</GameButton>
          </Link>
        </div>
      </Module>

      <Module title="Top EV crimes" footer="Open boards only · EV is $/nerve at current odds">
        {ranked.length === 0 ? (
          <p className={hub.sub}>No open crimes — unlock courses, tools, or level.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Crime</th>
                <th>Odds</th>
                <th>EV</th>
                <th>Nerve</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {ranked.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td className="tabular">{(row.odds * 100).toFixed(0)}%</td>
                  <td className="tabular">{row.ev.toFixed(1)}</td>
                  <td className="tabular">{row.nerve}</td>
                  <td>
                    <GameButton
                      variant="danger"
                      disabled={busy || s.nerve < row.nerve}
                      onClick={() => useGame.getState().attemptCrime(row.id)}
                    >
                      Attempt
                    </GameButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {ranked[0] ? (
          <p className={hub.sub} style={{ marginTop: 10 }}>
            Full nerve on {ranked[0].name}: ~{forecast.attempts} attempts → ~
            {formatMoney(forecast.expectedCash)} street, heat ~+{forecast.expectedHeat}.
          </p>
        ) : null}
      </Module>

      <Module title="Build mixes" footer="Presets — not saved queues">
        <div className={hub.grid2} style={{ gap: 10 }}>
          {mixes.map((m) => (
            <div key={m.id} className={hub.panel}>
              <h3 className={hub.panelTitle}>{m.label}</h3>
              <p className={hub.sub}>{m.blurb}</p>
              <div className={hub.chipRow}>
                <span className={hub.chip}>Nerve {m.nerveBudget}</span>
                <span className={hub.chip}>Energy {m.energyBudget}</span>
                <span className={hub.chip}>{m.focus}</span>
              </div>
              {m.gymHint ? <p className={hub.sub}>{m.gymHint}</p> : null}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {m.crimeIds.slice(0, 2).map((id) => (
                  <GameButton
                    key={id}
                    variant="danger"
                    disabled={busy}
                    onClick={() => useGame.getState().attemptCrime(id)}
                  >
                    {getCrime(id)?.name ?? id}
                  </GameButton>
                ))}
                {m.workShifts > 0 ? (
                  <GameButton
                    disabled={busy || !s.jobId}
                    onClick={() => {
                      for (let i = 0; i < m.workShifts; i++) useGame.getState().workShift();
                    }}
                  >
                    Shifts ×{m.workShifts}
                  </GameButton>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Module>

      <Module title="Repeat queue" footer="Each loop pays energy/nerve costs · hospital/jail/travel/lay-low block the queue">
        {busy ? <p className={hub.sub}>You&apos;re occupied. Finish that first.</p> : null}
        <label className={hub.sub} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          Repeats
          <input
            type="number"
            min={1}
            max={20}
            value={clamp}
            onChange={(e) => setN(Number(e.target.value))}
            className="tabular"
            style={{
              width: 64,
              height: 28,
              background: "var(--bg-inset)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "0 6px",
            }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <GameButton
            variant="danger"
            disabled={busy || !s.lastCrimeId}
            onClick={() => {
              const id = s.lastCrimeId;
              if (!id) return;
              for (let i = 0; i < clamp; i++) useGame.getState().attemptCrime(id);
            }}
          >
            Repeat last crime ×{clamp}
          </GameButton>
          <GameButton
            disabled={busy || !s.jobId}
            onClick={() => {
              for (let i = 0; i < clamp; i++) useGame.getState().workShift();
            }}
          >
            Work shift ×{clamp}
          </GameButton>
          <Link href="/crimes">
            <GameButton variant="secondary">Crimes board</GameButton>
          </Link>
          <Link href="/jobs">
            <GameButton variant="secondary">Jobs board</GameButton>
          </Link>
        </div>
      </Module>
    </div>
  );
}
