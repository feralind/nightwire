import type { DistrictId } from "@/game/types";

export const STREET_SHOP_VISIT_CAP = 5000;

/** Pure street-shop visit spend — elite blocks; cap is cumulative per district visit */
export function planStreetShopBuy(input: {
  district: DistrictId;
  shopStyle: string | undefined;
  street: number;
  streetSpendVisit: number;
  shopSpendDistrict: DistrictId | null;
  price: number;
}): { ok: false; reason: string } | { ok: true; pay: number; streetSpendVisit: number; shopSpendDistrict: DistrictId; remaining: number } {
  if (input.shopStyle === "elite") {
    return { ok: false, reason: "Elite shop — clean only" };
  }
  let spent = input.streetSpendVisit;
  if (input.shopSpendDistrict !== input.district) {
    spent = 0;
  }
  const remaining = STREET_SHOP_VISIT_CAP - spent;
  if (remaining <= 0) {
    return { ok: false, reason: `Street visit cap $${STREET_SHOP_VISIT_CAP} reached` };
  }
  if (input.price > remaining) {
    return { ok: false, reason: `Only $${remaining} street left this visit` };
  }
  if (input.street < input.price) {
    return { ok: false, reason: "Not enough street cash" };
  }
  return {
    ok: true,
    pay: input.price,
    streetSpendVisit: spent + input.price,
    shopSpendDistrict: input.district,
    remaining: remaining - input.price,
  };
}
