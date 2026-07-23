"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DISTRICTS } from "@/content/catalog";
import { getShop, shopAllowsStreet, shopPrice, shopStock } from "@/content/shops";
import { formatMoney } from "@/game/formulas";
import { STREET_SHOP_VISIT_CAP } from "@/game/shops";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { DISTRICT_ART, PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../../hub.module.css";

export default function ShopDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const shop = getShop(id);
  const s = useGame();

  if (!shop) {
    return (
      <div className={hub.wrap}>
        <PageHero title="Unknown shop" subtitle="That counter isn’t on the directory." tone="city" image="/art/city/skyline.webp" />
        <p className={hub.sub}>
          <Link href="/shops">← Back to shops</Link>
        </p>
      </div>
    );
  }

  const dist = DISTRICTS.find((x) => x.id === shop.district);
  const inDistrict = s.district === shop.district;
  const stock = shopStock(shop);
  const spent = s.shopSpendDistrict === s.district ? s.streetSpendVisit : 0;
  const remaining = Math.max(0, STREET_SHOP_VISIT_CAP - spent);
  const streetOk = shopAllowsStreet(shop);

  return (
    <div className={hub.wrap}>
      <PageHero
        title={shop.name}
        subtitle={`${dist?.name ?? shop.district} · ${shop.specialty}`}
        tone="city"
        image={DISTRICT_ART[shop.district] ?? "/art/city/skyline.webp"}
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>{shop.payment}</span>
          {shop.priceMult != null && shop.priceMult !== 1 ? (
            <span className={hub.chip}>{Math.round(shop.priceMult * 100)}% price</span>
          ) : null}
          <span className={hub.chip}>{inDistrict ? "In district" : "Travel required"}</span>
          {streetOk ? (
            <span className={hub.chip}>
              Street visit {formatMoney(spent)}/{formatMoney(STREET_SHOP_VISIT_CAP)}
            </span>
          ) : (
            <span className={hub.chip}>Clean only</span>
          )}
        </div>
      </PageHero>

      <p className={hub.sub}>
        <Link href="/shops">← All shops</Link>
        {" · "}
        {!inDistrict ? <Link href="/travel">Travel to {dist?.name ?? shop.district}</Link> : shop.blurb}
      </p>

      <Module
        title="Counter"
        footer={
          !inDistrict
            ? `Travel to ${dist?.name ?? shop.district} to buy`
            : streetOk
              ? `Street visit cap $${STREET_SHOP_VISIT_CAP} · $${remaining} remaining`
              : "Elite / clean ledger only"
        }
      >
        {stock.length === 0 ? (
          <p className={hub.sub}>Shelf empty — density pack may restock later.</p>
        ) : (
          <div className={hub.grid}>
            {stock.map((item) => {
              const price = shopPrice(shop, item.baseValue);
              const streetBlocked =
                !streetOk || !inDistrict || remaining < price || s.street < price;
              const cleanBlocked = !inDistrict || s.clean < price;
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
                      <strong className="tabular">{formatMoney(price)}</strong>
                    </div>
                    <div className={hub.statRow}>
                      <span>Kind</span>
                      <strong>{item.kind}</strong>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <GameButton
                        disabled={cleanBlocked}
                        onClick={() => s.buyItem(item.id, false, shop.id)}
                      >
                        Buy clean
                      </GameButton>
                      {streetOk ? (
                        <GameButton
                          variant="secondary"
                          disabled={streetBlocked}
                          onClick={() => s.buyItem(item.id, true, shop.id)}
                        >
                          Buy street
                        </GameButton>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Module>
    </div>
  );
}
