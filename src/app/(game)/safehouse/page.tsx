"use client";

import Link from "next/link";
import { ARMORY_RECIPES, SAFEHOUSE_ROOMS, getItem } from "@/content/catalog";
import {
  activeBonusSummary,
  armoryCraftCost,
  canUpgradeRoom,
  craftRecipeReasons,
  garageRepairCost,
  garageRepairReasons,
  nextUpgradeCost,
  normalizeSafehouseRooms,
  roomEffectLabels,
  roomLevel,
  stashCapacity,
  upgradeRoomReasons,
} from "@/game/safehouse";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero, SAFEHOUSE_HERO, SAFEHOUSE_ROOM_ART } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";
import board from "./safehouse.module.css";

export default function SafehousePage() {
  const s = useGame();
  const rooms = normalizeSafehouseRooms(s.safehouseRooms);
  const owned = s.ownedProperties.length > 0;
  const bonuses = activeBonusSummary(rooms);
  const cap = stashCapacity(rooms);
  const repairReasons = garageRepairReasons({
    ownedProperties: s.ownedProperties,
    street: s.street,
    safehouseRooms: rooms,
    life: s.life,
    lifeMax: s.lifeMax,
    wounds: s.wounds,
  });

  return (
    <div>
      <PageHero
        title="Safehouse"
        subtitle="Rooms across your keys. Clean builds legitimacy; street oils the rack and bay."
        tone="city"
        image={SAFEHOUSE_HERO}
        tall
      />

      {!owned ? (
        <Module title="No keys on the hook">
          <RequirementsBox
            reasons={[{ label: "Buy a property to unlock room upgrades", href: "/properties" }]}
          />
          <p className={styles.sub} style={{ marginTop: 8 }}>
            Listings live on <Link href="/properties">Properties</Link>. Once you hold keys, Vault,
            Cot, Study, Armory, and Garage come online here.
          </p>
        </Module>
      ) : null}

      <Module title="Floorplan" footer={`${s.inventory.length}/${cap} stash stacks · rooms are global across owned places`}>
        <ul className={styles.sub} style={{ margin: "0 0 10px", paddingLeft: 18 }}>
          {bonuses.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <div className={board.grid}>
          {SAFEHOUSE_ROOMS.map((room) => {
            const lvl = roomLevel(rooms, room.id);
            const cost = nextUpgradeCost(room.id, lvl);
            const reasons = upgradeRoomReasons(room.id, {
              ownedProperties: s.ownedProperties,
              clean: s.clean,
              street: s.street,
              safehouseRooms: rooms,
            });
            const ok = canUpgradeRoom(room.id, {
              ownedProperties: s.ownedProperties,
              clean: s.clean,
              street: s.street,
              safehouseRooms: rooms,
            });
            return (
              <article
                key={room.id}
                className={[board.cell, lvl > 0 ? board.built : ""].filter(Boolean).join(" ")}
              >
                <div
                  className={board.art}
                  style={{
                    backgroundImage: `linear-gradient(180deg,transparent 25%,rgba(0,0,0,0.75)), url(${SAFEHOUSE_ROOM_ART[room.id] ?? SAFEHOUSE_HERO})`,
                  }}
                />
                <div className={board.head}>
                  <strong>{room.name}</strong>
                  <span className="tabular">L{lvl}/{room.maxLevel}</span>
                </div>
                <p className={board.blurb}>{room.blurb}</p>
                <ul className={board.effects}>
                  {(lvl > 0
                    ? roomEffectLabels(room.id, lvl)
                    : roomEffectLabels(room.id, 1).map((e) => `Unlocks: ${e}`)
                  ).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {cost ? (
                  <p className={board.cost}>
                    Next:{" "}
                    {cost.clean ? (
                      <span className="money-pos">{formatMoney(cost.clean)} clean</span>
                    ) : null}
                    {cost.clean && cost.street ? " · " : null}
                    {cost.street ? (
                      <span className="money-neg">{formatMoney(cost.street)} street</span>
                    ) : null}
                    {!cost.clean && !cost.street ? "—" : null}
                  </p>
                ) : (
                  <p className={board.cost}>Maxed</p>
                )}
                <div className={board.actions}>
                  {!ok && cost ? <RequirementsBox reasons={reasons} /> : null}
                  {cost ? (
                    <GameButton
                      disabled={!ok}
                      onClick={() => s.upgradeSafehouseRoom(room.id)}
                    >
                      Upgrade
                    </GameButton>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </Module>

      <Module title="Armory craft" footer="Street parts · discounts scale with Armory level">
        {rooms.armory < 1 ? (
          <p className={styles.sub}>Build Armory rack to craft tools on-site.</p>
        ) : (
          <div className={styles.grid2}>
            {ARMORY_RECIPES.map((recipe) => {
              const item = getItem(recipe.itemId);
              const cost = armoryCraftCost(recipe.itemId, rooms.armory);
              const reasons = craftRecipeReasons(recipe.itemId, {
                ownedProperties: s.ownedProperties,
                street: s.street,
                safehouseRooms: rooms,
                inventoryStacks: s.inventory.length,
                hasItem: s.inventory.some((i) => i.itemId === recipe.itemId && i.qty > 0),
              });
              const ok = reasons.length === 0;
              return (
                <div key={recipe.itemId} className={styles.card}>
                  <strong>{item?.name ?? recipe.itemId}</strong>
                  <p className={styles.sub} style={{ marginTop: 4 }}>
                    Needs Armory L{recipe.minLevel}
                    {cost != null ? ` · ${formatMoney(cost)} street` : ""}
                  </p>
                  {!ok ? <RequirementsBox reasons={reasons} /> : null}
                  <GameButton
                    disabled={!ok}
                    onClick={() => s.craftArmoryTool(recipe.itemId)}
                    style={{ marginTop: 6 }}
                  >
                    Craft
                  </GameButton>
                </div>
              );
            })}
          </div>
        )}
      </Module>

      <Module title="Garage bench" footer="Patch life and wounds without the hospital queue">
        {rooms.garage < 1 ? (
          <p className={styles.sub}>Build Garage for travel cuts, energy ticks, and bench repair.</p>
        ) : (
          <>
            <p className={styles.sub}>
              Repair cost {formatMoney(garageRepairCost(rooms))} street · Life {Math.floor(s.life)}/
              {s.lifeMax}
              {s.wounds.arm || s.wounds.leg
                ? ` · Wounds arm ${s.wounds.arm} / leg ${s.wounds.leg}`
                : " · No wounds"}
            </p>
            {!repairReasons.length ? null : <RequirementsBox reasons={repairReasons} />}
            <GameButton
              disabled={repairReasons.length > 0}
              onClick={() => s.garageRepair()}
            >
              Bench repair
            </GameButton>
          </>
        )}
      </Module>

      <Module title="Portfolio link" footer="Rent still ticks on Properties">
        <p className={styles.sub}>
          Manage listings on <Link href="/properties">Properties</Link>. Rooms here apply as long as
          you hold at least one key.
        </p>
      </Module>
    </div>
  );
}
