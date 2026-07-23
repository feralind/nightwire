"use client";

import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, SceneBanner } from "@/components/ui/Visuals";
import { bailCost, formatMmSs, formatMoney, heatBand } from "@/game/formulas";
import { politicalBailMult } from "@/game/power";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

const STAGE = ["Clear", "Rumor", "Watch", "Case", "Warrant"] as const;

export default function JailPage() {
  const s = useGame();
  const now = Date.now();
  const active = !!(s.jailUntil && now < s.jailUntil);
  const bail = Math.round(
    bailCost(s.heat, s.investigation) * politicalBailMult(s.power.politicalRung)
  );
  const remaining = active ? ((s.jailUntil as number) - now) / 1000 : 0;

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Jail"
        subtitle="Wait it out or buy freedom — heat prices bail. Stress climbs on the clock."
        tone="jail"
        image="/art/jail/block.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Heat {heatBand(s.heat)}</span>
          <span className={hub.chip}>Inv {STAGE[s.investigation] ?? s.investigation}</span>
          <span className={hub.chip}>{active ? "Holding" : "Free"}</span>
        </div>
      </PageHero>

      <SceneBanner
        image="/art/jail/block.webp"
        height={130}
        title={active ? "Holding cell — clocks only" : "Corridor empty — for now"}
        subtitle="Bail sinks clean cash. Stress rises while locked."
      />

      <div className={hub.grid2}>
        <Module title={active ? "Status takeover" : "Release desk"} footer="Course progress freezes while jailed">
          {active ? (
            <>
              <p className={`tabular ${hub.timer}`}>{formatMmSs(remaining)}</p>
              <p className={hub.sub}>
                Reason: {s.jailReason ?? "Arrest"} · Heat {heatBand(s.heat)} ({Math.floor(s.heat)}) · Investigation{" "}
                {STAGE[s.investigation] ?? s.investigation}
              </p>
              <p style={{ marginTop: 8 }}>
                Actions blocked until release or bail — except Pike&apos;s Cut time on Contacts ($700 clean, halves the clock).
              </p>
              <p style={{ marginTop: 12 }}>
                <GameButton disabled={s.clean < bail} onClick={() => s.payBail()}>
                  Pay bail ({formatMoney(bail)} clean)
                </GameButton>
              </p>
            </>
          ) : (
            <>
              <div className={hub.statRow}>
                <span>Status</span>
                <strong>Free</strong>
              </div>
              <div className={hub.statRow}>
                <span>Est. bail if booked</span>
                <strong className="tabular">{formatMoney(bail)}</strong>
              </div>
              <div className={hub.statRow}>
                <span>Heat band</span>
                <strong>
                  {heatBand(s.heat)} ({Math.floor(s.heat)})
                </strong>
              </div>
              <p className={hub.sub} style={{ marginTop: 10 }}>
                Crit-fail crimes and warrants put you back here. Don&apos;t make it a habit.
              </p>
            </>
          )}
        </Module>

        <div className={hub.panel}>
          <h2 className={hub.panelTitle}>Block map</h2>
          <div className={hub.bedGrid}>
            {["Holding", "Intake", "Visitor", "Release", "Solitary", "Yard"].map((cell) => (
              <div
                key={cell}
                className={`${hub.bed} ${active && cell === "Holding" ? hub.bedActive : ""}`}
              >
                <div className={hub.bedLabel}>{cell}</div>
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  {active && cell === "Holding" ? "You" : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
