"use client";

import { DISTRICTS, ITEMS, npcsInDistrict } from "@/content/catalog";
import type { InventorySlot } from "@/game/state";
import {
  estimateNpcPowerRange,
  formatMoney,
  playerCombatPower,
  powerBandLabel,
} from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, DISTRICT_ART, NPC_ART } from "@/components/ui/Visuals";
import { npcFlavor } from "@/game/persona";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";
import attackStyles from "./attack.module.css";

function loadoutFromState(inventory: InventorySlot[]) {
  let weaponDmg = 0;
  let armorSoak = 0;
  const equipped: string[] = [];
  for (const slot of inventory.filter((i) => i.equipped)) {
    const item = ITEMS.find((x) => x.id === slot.itemId);
    if (!item) continue;
    equipped.push(item.name);
    if (item.kind === "weapon") {
      if (item.id === "bat") weaponDmg += 5;
      else if (item.id === "knife") weaponDmg += 3;
      else weaponDmg += 2;
    }
    if (item.kind === "armor") armorSoak += item.id === "vest" ? 8 : 4;
  }
  return { weaponDmg, armorSoak, equipped };
}

export default function AttackPage() {
  const s = useGame();
  const district = DISTRICTS.find((d) => d.id === s.district);
  const targets = npcsInDistrict(s.district);
  const loadout = loadoutFromState(s.inventory);
  const myPower = playerCombatPower({
    str: s.str,
    def: s.def,
    spd: s.spd,
    dex: s.dex,
    level: s.level,
    weaponDmg: loadout.weaponDmg,
    armorSoak: loadout.armorSoak,
  });
  const blocked =
    (s.hospitalUntil && Date.now() < s.hospitalUntil) ||
    (s.jailUntil && Date.now() < s.jailUntil) ||
    (s.travelUntil && Date.now() < s.travelUntil);

  return (
    <div>
      <PageHero
        title="Attack"
        subtitle="Hub combat — approach, exchange, loot or hospital."
        tone="crime"
        image={DISTRICT_ART[s.district] ?? "/art/crimes/mug.webp"}
        tall
      />
      <Module title="Loadout" footer="Equip weapons/armor on Inventory · wounds soft-debuff rolls">
        <p className={styles.sub}>
          District: {district?.name ?? s.district} · Your power ≈ {Math.round(myPower)}
          {s.wounds.arm > 0 || s.wounds.leg > 0
            ? ` · Wounds: ${[s.wounds.arm ? "arm" : null, s.wounds.leg ? "leg" : null].filter(Boolean).join(", ")}`
            : ""}
        </p>
        <p className={styles.sub}>
          Equipped: {loadout.equipped.length ? loadout.equipped.join(", ") : "none (bare fists)"} · Life{" "}
          {Math.floor(s.life)}/{s.lifeMax} · Energy {Math.floor(s.energy)}
        </p>
      </Module>
      <Module
        title={`Targets in ${district?.name ?? "district"}`}
        footer="Up to 3 rounds · seeded RNG · energy cost per attempt"
      >
        {blocked ? (
          <p className={styles.sub}>Actions blocked while hospitalized, jailed, or traveling.</p>
        ) : null}
        <div className={attackStyles.grid}>
          {targets.map((npc) => {
            const range = estimateNpcPowerRange(npc.power);
            const band = powerBandLabel(myPower, npc.power);
            const can = !blocked && s.energy >= npc.energyCost && s.life >= 15;
            const portrait = NPC_ART[npc.id] ?? "/art/crimes/mug.webp";
            return (
              <article key={npc.id} className={attackStyles.card}>
                <div className={attackStyles.art}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={portrait} alt="" className={attackStyles.portrait} />
                  <div className={attackStyles.artShade} />
                  <span className={attackStyles.badge}>{npc.title}</span>
                  <div className={attackStyles.artTitle}>
                    <strong>{npc.name}</strong>
                    <span>{band}</span>
                  </div>
                </div>
                <div className={attackStyles.body}>
                  <p className={attackStyles.flavor}>{npcFlavor(npc, s.adultNpc)}</p>
                  <div className={attackStyles.meta}>
                    <div>
                      <span>Power</span>
                      <strong className="tabular">
                        {range.low}–{range.high}
                      </strong>
                    </div>
                    <div>
                      <span>Loot</span>
                      <strong className="tabular">
                        {formatMoney(npc.lootMin)}–{formatMoney(npc.lootMax)}
                      </strong>
                    </div>
                    <div>
                      <span>Energy</span>
                      <strong className="tabular">{npc.energyCost}</strong>
                    </div>
                  </div>
                  <GameButton variant="danger" disabled={!can} onClick={() => s.attackNpc(npc.id)}>
                    Attack
                  </GameButton>
                </div>
              </article>
            );
          })}
        </div>
        <p className={styles.sub}>
          Travel to another district for a different NPC pool. Rival fights use this engine later.
        </p>
      </Module>
    </div>
  );
}
