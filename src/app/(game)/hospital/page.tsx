"use client";

import Link from "next/link";
import { getItem } from "@/content/catalog";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, SceneBanner } from "@/components/ui/Visuals";
import { formatMmSs, formatMoney, medicalCost } from "@/game/formulas";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

export default function HospitalPage() {
  const s = useGame();
  const now = Date.now();
  const active = !!(s.hospitalUntil && now < s.hospitalUntil);
  const cost = medicalCost(s.district, s.heat);
  const remaining = active ? ((s.hospitalUntil as number) - now) / 1000 : 0;
  const meds = s.inventory.filter((i) => {
    const item = getItem(i.itemId);
    return item?.kind === "consumable" && (i.itemId.includes("med") || i.itemId === "painkillers" || i.itemId === "street_meds");
  });
  const lifePct = Math.round((s.life / s.lifeMax) * 100);

  const beds = [
    { id: "A1", label: active ? "You" : "Empty", active },
    { id: "A2", label: "NPC — stable", active: false },
    { id: "B1", label: "Reserved", active: false },
    { id: "B2", label: "Empty", active: false },
    { id: "C1", label: "Trauma bay", active: false },
    { id: "C2", label: "Discharge", active: false },
  ];

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Hospital"
        subtitle="Patch up, clear wounds, get back on the street."
        tone="hospital"
        image="/art/hospital/ward.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Life {Math.floor(s.life)}/{s.lifeMax}</span>
          <span className={hub.chip}>District rate {formatMoney(cost)}</span>
          <span className={hub.chip}>{active ? "Admitted" : "Discharged"}</span>
        </div>
      </PageHero>

      <SceneBanner
        image="/art/hospital/ward.webp"
        height={140}
        title={active ? "Ward active — actions blocked" : "Ward quiet — beds waiting"}
        subtitle="Medical is a mandatory sink. Heat and district swing the bill."
      />

      <div className={hub.grid2}>
        <Module
          title={active ? "Status takeover" : "Outpatient desk"}
          footer="Waiting clears on tick · paying clears wounds now"
        >
          {active ? (
            <>
              <p className={`tabular ${hub.timer}`}>{formatMmSs(remaining)}</p>
              <p className={hub.sub}>
                Reason: {s.hospitalReason ?? "Injury"} · Life {Math.floor(s.life)}/{s.lifeMax}
                {(s.wounds.arm > 0 || s.wounds.leg > 0) &&
                  ` · Wounds: ${[s.wounds.arm ? "arm" : null, s.wounds.leg ? "leg" : null].filter(Boolean).join(", ")}`}
              </p>
              <p style={{ marginTop: 8 }}>Actions blocked until discharge.</p>
              <p style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <GameButton disabled={s.clean < cost} onClick={() => s.payMedical()}>
                  Pay medical ({formatMoney(cost)} clean)
                </GameButton>
                <GameButton
                  variant="ghost"
                  disabled={!s.inventory.some((i) => i.itemId === "street_meds" && i.qty > 0)}
                  onClick={() => s.useItem("street_meds")}
                >
                  Use street meds
                </GameButton>
              </p>
            </>
          ) : (
            <>
              <div className={hub.statRow}>
                <span>Condition</span>
                <strong>{lifePct >= 90 ? "Clear" : lifePct >= 50 ? "Bruised" : "Fragile"}</strong>
              </div>
              <div className={hub.statRow}>
                <span>Life</span>
                <strong className="tabular">
                  {Math.floor(s.life)}/{s.lifeMax} ({lifePct}%)
                </strong>
              </div>
              <div className={hub.statRow}>
                <span>Est. admit cost</span>
                <strong className="tabular">{formatMoney(cost)}</strong>
              </div>
              <div className={hub.statRow}>
                <span>Wounds</span>
                <strong>
                  {s.wounds.arm || s.wounds.leg
                    ? [s.wounds.arm ? "arm" : null, s.wounds.leg ? "leg" : null].filter(Boolean).join(", ")
                    : "None"}
                </strong>
              </div>
              <p className={hub.sub} style={{ marginTop: 10 }}>
                You are clear to leave. Come back when life hits zero or combat puts you under. Soft wounds clear on
                paid discharge.
              </p>
            </>
          )}
        </Module>

        <div className={hub.wrap}>
          <div className={hub.panel}>
            <h2 className={hub.panelTitle}>Ward beds</h2>
            <div className={hub.bedGrid}>
              {beds.map((b) => (
                <div key={b.id} className={`${hub.bed} ${b.active ? hub.bedActive : ""}`}>
                  <div className={hub.bedLabel}>Bay {b.id}</div>
                  <div style={{ marginTop: 6, fontSize: 12 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className={hub.panel}>
            <h2 className={hub.panelTitle}>Meds on you</h2>
            {meds.length === 0 ? (
              <p className={hub.sub}>No medical consumables. Buy street meds / painkillers at Shops.</p>
            ) : (
              <ul className={hub.sub} style={{ margin: 0, paddingLeft: 16 }}>
                {meds.map((m) => (
                  <li key={m.itemId}>
                    {getItem(m.itemId)?.name ?? m.itemId} ×{m.qty}
                  </li>
                ))}
              </ul>
            )}
            <p style={{ marginTop: 10 }}>
              <Link href="/shops" style={{ fontSize: 12, color: "var(--text-link)" }}>
                Open shops →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
