"use client";

import { DISTRICTS, ITEMS } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import { STREET_SHOP_VISIT_CAP } from "@/game/shops";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { DISTRICT_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

export default function ShopsPage() {
  const s = useGame();
  const d = DISTRICTS.find((x) => x.id === s.district);
  const elite = d?.shopStyle === "elite";
  const medical = d?.shopStyle === "medical";
  const stock = ITEMS.filter((i) => i.kind === "tool" || i.kind === "consumable" || i.kind === "weapon");
  const spent = s.shopSpendDistrict === s.district ? s.streetSpendVisit : 0;
  const remaining = Math.max(0, STREET_SHOP_VISIT_CAP - spent);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Shops"
        subtitle={`${d?.name ?? "District"} — ${
          elite
            ? "elite clean-only counters"
            : medical
              ? "clinic counters · meds cheaper"
              : `street spend $${remaining} left this visit`
        }.`}
        tone="city"
        image={DISTRICT_ART[s.district] ?? "/art/city/skyline.webp"}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
          <span className={hub.chip}>Street {formatMoney(s.street)}</span>
          {!elite && (
            <span className={hub.chip}>
              Visit {formatMoney(spent)}/{formatMoney(STREET_SHOP_VISIT_CAP)}
            </span>
          )}
          <span className={hub.chip}>{d?.shopStyle} stock</span>
        </div>
      </PageHero>

      <Module
        title="Counter"
        footer={
          elite
            ? "Elite district — clean only"
            : `Street visit cap $${STREET_SHOP_VISIT_CAP} · $${remaining} remaining (resets when you change district)`
        }
      >
        <div className={hub.grid}>
          {stock.map((item) => {
            const streetBlocked = !elite && (remaining < item.baseValue || s.street < item.baseValue);
            return (
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
                      <GameButton variant="ghost" disabled={streetBlocked} onClick={() => s.buyItem(item.id, true)}>
                        Buy street
                      </GameButton>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
