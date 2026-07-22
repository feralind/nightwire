"use client";

import { DISTRICTS } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { DISTRICT_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

export default function TravelPage() {
  const s = useGame();
  const here = DISTRICTS.find((d) => d.id === s.district);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Travel"
        subtitle={`Now in ${here?.name ?? "Unknown"} — districts change risk, shops, and crime odds.`}
        tone="city"
        image={DISTRICT_ART[s.district] ?? "/art/city/skyline.webp"}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>{here?.risk}</span>
          <span className={hub.chip}>Shop: {here?.shopStyle}</span>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
        </div>
      </PageHero>

      <Module footer="Travel blocks actions · checkpoints if investigation ≥ Watch">
        <div className={hub.grid}>
          {DISTRICTS.map((d) => {
            const art = DISTRICT_ART[d.id];
            const isHere = s.district === d.id;
            const bias = Object.entries(d.crimeBias)
              .map(([k, v]) => `${k} ${v! > 0 ? "+" : ""}${v}%`)
              .join(" · ");
            return (
              <article
                key={d.id}
                className={`${hub.districtCard} ${isHere ? hub.districtCardHere : ""}`}
              >
                <div
                  className={hub.districtBg}
                  style={{ backgroundImage: art ? `url(${art})` : undefined }}
                />
                <div className={hub.districtShade} />
                <div className={hub.districtBody}>
                  <div className={hub.districtName}>{d.name}</div>
                  <p className={hub.sub} style={{ color: "rgba(220,220,220,0.8)" }}>
                    {d.risk} · {d.shopStyle} shops
                  </p>
                  <p className={hub.sub} style={{ color: "rgba(200,200,200,0.7)" }}>
                    {bias || "Neutral bias"}
                  </p>
                  <div className={hub.statRow} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                    <span>Fare</span>
                    <strong className="tabular">{formatMoney(d.travelCost)}</strong>
                  </div>
                  <div className={hub.statRow} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                    <span>Transit</span>
                    <strong className="tabular">{d.travelSeconds}s</strong>
                  </div>
                  {isHere ? (
                    <span className={hub.chip} style={{ alignSelf: "flex-start", color: "var(--text)" }}>
                      You are here
                    </span>
                  ) : (
                    <GameButton
                      disabled={s.clean < d.travelCost || s.heat >= 81}
                      onClick={() => s.travelTo(d.id)}
                    >
                      Travel ({formatMoney(d.travelCost)})
                    </GameButton>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
