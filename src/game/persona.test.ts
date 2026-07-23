import { describe, expect, it } from "vitest";
import { CONTACTS, NPCS } from "@/content/catalog";
import { npcBeatsForHour } from "@/game/cityLife";
import {
  proceduralLifeFallback,
  resolveLifePersona,
  type LifeContext,
} from "@/game/lifeAi";
import {
  VEX_DEF,
  assertPersonaCatalogSafe,
  contactBlurb,
  effectivePersona,
  isSluttyActive,
  npcFlavor,
} from "@/game/persona";

describe("adult NPC persona tags", () => {
  it("only tags slutty on explicitly female characters", () => {
    const check = assertPersonaCatalogSafe();
    expect(check).toEqual({ ok: true });

    const sluttyContacts = CONTACTS.filter((c) => c.persona === "slutty");
    expect(sluttyContacts.length).toBeGreaterThan(0);
    for (const c of sluttyContacts) {
      expect(c.gender).toBe("female");
    }

    const sluttyNpcs = NPCS.filter((n) => n.persona === "slutty");
    expect(sluttyNpcs.length).toBeGreaterThan(0);
    for (const n of sluttyNpcs) {
      expect(n.gender).toBe("female");
    }

    expect(VEX_DEF.gender).toBe("female");
    expect(VEX_DEF.persona).toBe("slutty");

    // Minority of female contacts (not all)
    const femaleContacts = CONTACTS.filter((c) => c.gender === "female");
    const ratio = sluttyContacts.length / femaleContacts.length;
    expect(ratio).toBeGreaterThanOrEqual(0.15);
    expect(ratio).toBeLessThanOrEqual(0.4);
  });

  it("adultNpc off → no slutty lines (contacts, rival, blurbs, flavors)", () => {
    const nix = CONTACTS.find((c) => c.id === "nix")!;
    expect(isSluttyActive(nix, false)).toBe(false);
    expect(effectivePersona(nix, false)).toBe("noir");
    expect(contactBlurb(nix, false)).toBe(nix.blurb);
    expect(contactBlurb(nix, false)).not.toContain("linger");

    const ctx: LifeContext = {
      kind: "contact",
      contactId: "nix",
      adultNpc: false,
    };
    expect(resolveLifePersona(ctx)).toBe("noir");
    const tip = proceduralLifeFallback(ctx, "seed_adult_off");
    expect(tip).toMatch(/Nix:/);
    expect(tip.toLowerCase()).not.toMatch(/smile|soft window|closer/);

    const rival = proceduralLifeFallback(
      { kind: "rival", adultNpc: false },
      "seed_adult_off"
    );
    expect(rival.toLowerCase()).not.toMatch(/lipstick|drink|purr/);

    const dealer = NPCS.find((n) => n.id === "np_dealer")!;
    expect(npcFlavor(dealer, false)).toBe(dealer.flavor);
  });

  it("adultNpc on → tagged females get flirt variants; untagged stay noir", () => {
    const nix = CONTACTS.find((c) => c.id === "nix")!;
    const mara = CONTACTS.find((c) => c.id === "mara")!;
    expect(isSluttyActive(nix, true)).toBe(true);
    expect(isSluttyActive(mara, true)).toBe(false);
    expect(contactBlurb(nix, true)).toBe(nix.blurbSlutty);
    expect(contactBlurb(mara, true)).toBe(mara.blurb);

    const tip = proceduralLifeFallback(
      { kind: "contact", contactId: "nix", adultNpc: true },
      "seed_adult_on"
    );
    expect(tip).toMatch(/Nix:/);
    expect(tip.toLowerCase()).toMatch(/smile|soft window|closer|listen close/);

    const maraTip = proceduralLifeFallback(
      { kind: "contact", contactId: "mara", adultNpc: true },
      "seed_adult_on"
    );
    expect(maraTip).toMatch(/Mara:/);
    expect(maraTip.toLowerCase()).not.toMatch(/smile|soft window/);

    const reedTip = proceduralLifeFallback(
      { kind: "contact", contactId: "reed", adultNpc: true },
      "seed_adult_on"
    );
    expect(reedTip).toMatch(/Reed:/);

    const rival = proceduralLifeFallback(
      { kind: "rival", adultNpc: true },
      "seed_adult_on"
    );
    expect(rival.toLowerCase()).toMatch(/vex/);
    expect(resolveLifePersona({ kind: "rival", adultNpc: true })).toBe("slutty");

    const dealer = NPCS.find((n) => n.id === "np_dealer")!;
    expect(npcFlavor(dealer, true)).toBe(dealer.flavorSlutty);
  });

  it("city schedule uses flirt lines only when adultNpc is on for tagged females", () => {
    // Local hour 22 includes Neon door (bouncer_neon)
    const t = new Date(2026, 6, 23, 22, 0, 0).getTime();
    const off = npcBeatsForHour(t, undefined, false);
    const on = npcBeatsForHour(t, undefined, true);
    const neonOff = off.find((b) => b.title === "Neon door");
    const neonOn = on.find((b) => b.title === "Neon door");
    expect(neonOff).toBeTruthy();
    expect(neonOn).toBeTruthy();
    expect(neonOff!.body).toContain("Guest list is a mood. Soft targets");
    expect(neonOn!.body).toContain("ask nice");
    expect(neonOn!.body).not.toBe(neonOff!.body);
  });
});
