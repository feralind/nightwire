"use client";

import Link from "next/link";
import { DISTRICTS, PROPERTIES, getDistrict } from "@/content/catalog";
import {
  canBuyProperty,
  landlordRentBonus,
  ownedPropertyDefs,
  propertyBuyReasons,
  weeklyPropertyNet,
} from "@/game/properties";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { DISTRICT_ART, PROPERTY_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";
import board from "./properties.module.css";

function propertyImage(id: string, district: string) {
  return PROPERTY_ART[id] ?? DISTRICT_ART[district] ?? "/art/properties/hero.webp";
}

export default function PropertiesPage() {
  const s = useGame();
  const owned = ownedPropertyDefs(s.ownedProperties);
  const { income, upkeep, net } = weeklyPropertyNet(s.ownedProperties, s.completedCourses);
  const rentBonus = landlordRentBonus(s.completedCourses);
  const available = PROPERTIES.filter((p) => !s.ownedProperties.includes(p.id));
  const here = available.filter((p) => p.district === s.district);
  const elsewhere = available.filter((p) => p.district !== s.district);

  return (
    <div>
      <PageHero
        title="Properties"
        subtitle="Buy in-district. Rent ticks offline; upkeep is always due. High heat invites raid pressure."
        tone="city"
        image="/art/properties/hero.webp"
        tall
      />

      <Module
        title="Portfolio"
        footer={
          rentBonus
            ? "Bookkeeping landlord perk +10% rent"
            : "Commerce Bookkeeping (cf1) adds +10% rent"
        }
      >
        {owned.length === 0 ? (
          <p className={styles.sub}>No keys yet. Travel to a listing district and buy with clean cash.</p>
        ) : (
          <>
            <p className={styles.sub}>
              Weekly rent {formatMoney(income)} · Upkeep {formatMoney(upkeep)} · Net{" "}
              <span className={net >= 0 ? "money-pos" : "money-neg"}>{formatMoney(net)}</span>
              {s.lifetime.rentCollected > 0 ? ` · Lifetime rent ${formatMoney(s.lifetime.rentCollected)}` : ""}
            </p>
            <p className={styles.sub}>
              Room upgrades live on the{" "}
              <Link href="/safehouse">Safehouse</Link> floorplan — Vault, Cot, Study, Armory, Garage.
            </p>
            <div className={board.grid}>
              {owned.map((p) => (
                <article key={p.id} className={[board.card, board.owned].join(" ")}>
                  <div className={board.art}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={propertyImage(p.id, p.district)} alt="" className={board.thumb} />
                    <div className={board.artShade} />
                    <div className={board.artTitle}>
                      <strong>{p.name}</strong>
                      <span>{getDistrict(p.district)?.name ?? p.district}</span>
                    </div>
                  </div>
                  <div className={board.body}>
                    <p className={board.blurb}>{p.blurb}</p>
                    <div className={board.meta}>
                      <span>
                        Rent/wk{" "}
                        <strong className="tabular">
                          {formatMoney(Math.round(p.weeklyIncome * (1 + rentBonus)))}
                        </strong>
                      </span>
                      <span>
                        Upkeep <strong className="tabular">{formatMoney(p.weeklyUpkeep)}</strong>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </Module>

      <Module title={`Available here · ${getDistrict(s.district)?.name ?? s.district}`}>
        {here.length === 0 ? (
          <p className={styles.sub}>Nothing left to buy in this district.</p>
        ) : (
          <div className={board.grid}>
            {here.map((p) => {
              const reasons = propertyBuyReasons(p, s);
              const ok = canBuyProperty(p, s);
              return (
                <article key={p.id} className={board.card}>
                  <div className={board.art}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={propertyImage(p.id, p.district)} alt="" className={board.thumb} />
                    <div className={board.artShade} />
                    <div className={board.artTitle}>
                      <strong>{p.name}</strong>
                      <span>{formatMoney(p.cost)}</span>
                    </div>
                  </div>
                  <div className={board.body}>
                    <p className={board.blurb}>{p.blurb}</p>
                    <div className={board.meta}>
                      <span>
                        Cost <strong className="tabular">{formatMoney(p.cost)}</strong>
                      </span>
                      <span>
                        Net/wk{" "}
                        <strong className="tabular">{formatMoney(p.weeklyIncome - p.weeklyUpkeep)}</strong>
                      </span>
                    </div>
                    <div className={board.actions}>
                      {!ok && <RequirementsBox reasons={reasons} />}
                      <GameButton disabled={!ok} onClick={() => s.buyProperty(p.id)}>
                        Buy
                      </GameButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Module>

      {elsewhere.length > 0 && (
        <Module title="Other districts" footer="Travel first — properties only sell in-district">
          <div className={board.grid}>
            {elsewhere.map((p) => (
              <article key={p.id} className={[board.card, board.dimmed].join(" ")}>
                <div className={board.art}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={propertyImage(p.id, p.district)} alt="" className={board.thumb} />
                  <div className={board.artShade} />
                  <div className={board.artTitle}>
                    <strong>{p.name}</strong>
                    <span>{DISTRICTS.find((d) => d.id === p.district)?.name ?? p.district}</span>
                  </div>
                </div>
                <div className={board.body}>
                  <p className={board.blurb}>{p.blurb}</p>
                  <div className={board.meta}>
                    <span>
                      Cost <strong className="tabular">{formatMoney(p.cost)}</strong>
                    </span>
                    <span>
                      Net/wk{" "}
                      <strong className="tabular">{formatMoney(p.weeklyIncome - p.weeklyUpkeep)}</strong>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Module>
      )}
    </div>
  );
}
