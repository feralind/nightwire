import { describe, expect, it } from "vitest";
import {
  fetchLifeBeat,
  lifeContextHash,
  proceduralLifeFallback,
  resolveLifePersona,
  type LifeContext,
} from "./lifeAi";

describe("life AI layer", () => {
  it("hashes context stably by kind + compact fields", () => {
    const a: LifeContext = { kind: "city", district: "glassrow", heat: 12, level: 3 };
    const b: LifeContext = { kind: "city", district: "glassrow", heat: 12, level: 3 };
    const c: LifeContext = { kind: "rival", district: "glassrow", heat: 12, level: 3 };
    expect(lifeContextHash(a)).toBe(lifeContextHash(b));
    expect(lifeContextHash(a)).not.toBe(lifeContextHash(c));
  });

  it("hashes adultNpc / persona into cache key", () => {
    const base: LifeContext = { kind: "contact", contactId: "nix", heat: 10 };
    const off = lifeContextHash({ ...base, adultNpc: false });
    const on = lifeContextHash({ ...base, adultNpc: true });
    expect(off).not.toBe(on);
    expect(resolveLifePersona({ ...base, adultNpc: true })).toBe("slutty");
    expect(resolveLifePersona({ ...base, adultNpc: false })).toBe("noir");
  });

  it("procedural fallback always returns non-empty diegetic text", () => {
    const kinds: LifeContext["kind"][] = ["city", "contact", "rival", "tip"];
    for (const kind of kinds) {
      const text = proceduralLifeFallback(
        { kind, district: "millstone", contactId: "reed", heat: 55, level: 4 },
        "seed_test"
      );
      expect(text.length).toBeGreaterThan(8);
    }
  });

  it("fetchLifeBeat respects enabled=false and never throws", async () => {
    const res = await fetchLifeBeat(
      { kind: "city", district: "glassrow" },
      { enabled: false, seed: "seed_off" }
    );
    expect(res.source).toBe("fallback");
    expect(res.text.length).toBeGreaterThan(8);
  });

  it("fetchLifeBeat falls back when API is unreachable", async () => {
    const res = await fetchLifeBeat(
      { kind: "rival", heat: 20 },
      { enabled: true, force: true, seed: "seed_net" }
    );
    expect(res.source).toBe("fallback");
    expect(res.text.length).toBeGreaterThan(8);
  });
});
