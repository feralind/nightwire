"use client";

import Link from "next/link";
import { getItem } from "@/content/catalog";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { GameButton } from "@/components/ui/GameButton";
import { InfoRow, InfoRowBlock } from "@/components/ui/InfoRow";
import { PageHero } from "@/components/ui/Visuals";
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
      />

      <div className={hub.grid2}>
        <CollapsiblePanel
          title={active ? "Status takeover" : "Outpatient desk"}
          footer="Waiting clears on tick · paying clears wounds now"
        >
          {active ? (
            <InfoRowBlock>
              <InfoRow label="Timer" value={formatMmSs(remaining)} tone="warn" />
              <InfoRow label="Reason" value={s.hospitalReason ?? "Injury"} />
              <InfoRow label="Life" value={`${Math.floor(s.life)}/${s.lifeMax}`} />
              <InfoRow
                label="Wounds"
                value={
                  s.wounds.arm || s.wounds.leg
                    ? [s.wounds.arm ? "arm" : null, s.wounds.leg ? "leg" : null].filter(Boolean).join(", ")
                    : "None"
                }
              />
              <InfoRow label="Medical" value={formatMoney(cost)} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "8px 0" }}>
                <GameButton disabled={s.clean < cost} onClick={() => s.payMedical()}>
                  Pay medical
                </GameButton>
                <GameButton
                  variant="ghost"
                  disabled={!s.inventory.some((i) => i.itemId === "street_meds" && i.qty > 0)}
                  onClick={() => s.useItem("street_meds")}
                >
                  Street meds
                </GameButton>
              </div>
            </InfoRowBlock>
          ) : (
            <InfoRowBlock>
              <InfoRow label="Condition" value={lifePct >= 90 ? "Clear" : lifePct >= 50 ? "Bruised" : "Fragile"} />
              <InfoRow label="Life" value={`${Math.floor(s.life)}/${s.lifeMax} (${lifePct}%)`} />
              <InfoRow label="Est. admit cost" value={formatMoney(cost)} />
              <InfoRow
                label="Wounds"
                value={
                  s.wounds.arm || s.wounds.leg
                    ? [s.wounds.arm ? "arm" : null, s.wounds.leg ? "leg" : null].filter(Boolean).join(", ")
                    : "None"
                }
              />
              <InfoRow label="Status" value="Discharged — come back when under" />
            </InfoRowBlock>
          )}
        </CollapsiblePanel>

        <div className={hub.wrap}>
          <CollapsiblePanel title="Ward beds" defaultOpen>
            <InfoRowBlock>
              {beds.map((b) => (
                <InfoRow
                  key={b.id}
                  label={`Bay ${b.id}`}
                  value={b.label}
                  tone={b.active ? "warn" : "default"}
                />
              ))}
            </InfoRowBlock>
          </CollapsiblePanel>
          <CollapsiblePanel title="Meds on you" defaultOpen={meds.length > 0}>
            {meds.length === 0 ? (
              <p className={hub.sub} style={{ padding: "8px 0" }}>
                No medical consumables.{" "}
                <Link href="/shops">Open shops →</Link>
              </p>
            ) : (
              <InfoRowBlock>
                {meds.map((m) => (
                  <InfoRow key={m.itemId} label={getItem(m.itemId)?.name ?? m.itemId} value={`×${m.qty}`} />
                ))}
              </InfoRowBlock>
            )}
          </CollapsiblePanel>
        </div>
      </div>
    </div>
  );
}
