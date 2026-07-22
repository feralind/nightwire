"use client";

import { DISTRICTS, ITEMS } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { DISTRICT_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

export default function ShopsPage() {
  const s = useGame();
  const elite = s.district === "glassrow";
  const d = DISTRICTS.find((x) => x.id === s.district);
  const stock = ITEMS.filter((i) => i.kind === "tool" || i.kind === "consumable" || i.kind === "weapon");

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Shops"
        subtitle={`${d?.name ?? "District"} — ${elite ? "elite clean-only counters" : "street spend capped $5,000/visit"}.`}
        tone="city"
        image={DISTRICT_ART[s.district] ?? "/art/city/skyline.webp"}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
          <span className={hub.chip}>Street {formatMoney(s.street)}</span>
          <span className={hub.chip}>{d?.shopStyle} stock</span>
        </div>
      </PageHero>

      <Module title="Counter" footer={elite ? "Elite district — clean only" : "Street spend capped $5,000/visit"}>
        <div className={hub.grid}>
          {stock.map((item) => (
            <article key={item.id} className={hub.panel} style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  height: 72,
                  background:
                    item.kind === "consumable"
                      ? "linear-gradient(135deg,#142018,#0e0e10)"
                      : item.kind === "weapon"
                        ? "linear-gradient(135deg,#281418,#0e0e10)"
                        : "linear-gradient(135deg,#182028,#0e0e10)",
                  borderBottom: "1px solid var(--border)",
                  padding: 10,
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <strong style={{ textShadow: "0 1px 3px #000" }}>{item.name}</strong>
              </div>
              <div style={{ padding: 10 }}>
                <p className={hub.sub}>{item.description}</p>
                <div className={hub.statRow}>
                  <span>Price</span>
                  <strong className="tabular">{formatMoney(item.baseValue)}</strong>
                </div>
                <div className={hub.statRow}>
                  <span>Kind</span>
                  <strong>{item.kind}</strong>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <GameButton onClick={() => s.buyItem(item.id, false)}>Buy clean</GameButton>
                  {!elite && (
                    <GameButton variant="ghost" onClick={() => s.buyItem(item.id, true)}>
                      Buy street
                    </GameButton>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Module>
    </div>
  );
}
