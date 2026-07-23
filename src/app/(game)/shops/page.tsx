"use client";

import Link from "next/link";
import { DISTRICTS } from "@/content/catalog";
import { SHOPS, shopAllowsStreet, shopStock } from "@/content/shops";
import { formatMoney } from "@/game/formulas";
import { STREET_SHOP_VISIT_CAP } from "@/game/shops";
import { Module } from "@/components/ui/Module";
import { DISTRICT_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

export default function ShopsPage() {
  const s = useGame();
  const d = DISTRICTS.find((x) => x.id === s.district);
  const spent = s.shopSpendDistrict === s.district ? s.streetSpendVisit : 0;
  const remaining = Math.max(0, STREET_SHOP_VISIT_CAP - spent);
  const here = SHOPS.filter((shop) => shop.district === s.district);
  const elsewhere = SHOPS.filter((shop) => shop.district !== s.district);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="District shops"
        subtitle="Twelve named counters across the city — specialty stock, payment rules, soft price mults."
        tone="city"
        image={DISTRICT_ART[s.district] ?? "/art/city/skyline.webp"}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
          <span className={hub.chip}>Street {formatMoney(s.street)}</span>
          <span className={hub.chip}>
            Visit street {formatMoney(spent)}/{formatMoney(STREET_SHOP_VISIT_CAP)}
          </span>
          <span className={hub.chip}>${remaining} street left here</span>
        </div>
      </PageHero>

      <p className={hub.sub}>
        Peer board: <Link href="/market">Market</Link>
        {" · "}
        Instant stalls: <Link href="/bazaar">Bazaar</Link>
        {" · "}
        Laundry: <Link href="/cleaning">Cleaning</Link>
      </p>

      <Module
        title={`Here — ${d?.name ?? s.district}`}
        footer="Travel resets the street visit cap · elite counters refuse street cash"
      >
        {here.length === 0 ? (
          <p className={hub.sub}>No named counter in this district.</p>
        ) : (
          <div className={hub.grid}>
            {here.map((shop) => {
              const stock = shopStock(shop);
              return (
                <article key={shop.id} className={hub.panel}>
                  <h2 className={hub.panelTitle} style={{ color: "var(--text)", textTransform: "none", letterSpacing: 0 }}>
                    {shop.name}
                  </h2>
                  <p className={hub.sub}>{shop.blurb}</p>
                  <div className={hub.statRow}>
                    <span>Specialty</span>
                    <strong>{shop.specialty}</strong>
                  </div>
                  <div className={hub.statRow}>
                    <span>Payment</span>
                    <strong>
                      {shop.payment === "clean_only"
                        ? "Clean only"
                        : shop.payment === "medical"
                          ? "Medical · street if quiet"
                          : "Street OK (visit cap)"}
                    </strong>
                  </div>
                  <div className={hub.statRow}>
                    <span>Stock</span>
                    <strong className="tabular">{stock.length} SKUs</strong>
                  </div>
                  <Link href={`/shops/${shop.id}`} className={hub.chip} style={{ display: "inline-block", marginTop: 8 }}>
                    Open counter →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </Module>

      <Module title="City directory" footer={`${SHOPS.length} named shops`}>
        <div className={hub.grid}>
          {elsewhere.map((shop) => {
            const dist = DISTRICTS.find((x) => x.id === shop.district);
            return (
              <article key={shop.id} className={hub.panel}>
                <h2 className={hub.panelTitle} style={{ color: "var(--text)", textTransform: "none", letterSpacing: 0 }}>
                  {shop.name}
                </h2>
                <p className={hub.sub}>
                  {dist?.name ?? shop.district} · {shop.specialty}
                </p>
                <div className={hub.statRow}>
                  <span>Street</span>
                  <strong>{shopAllowsStreet(shop) ? "Allowed" : "Clean only"}</strong>
                </div>
                <Link href={`/shops/${shop.id}`} className={hub.chip} style={{ display: "inline-block", marginTop: 8 }}>
                  View →
                </Link>
              </article>
            );
          })}
        </div>
      </Module>
    </div>
  );
}
