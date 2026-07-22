"use client";

import { DISTRICTS } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";

export default function PowerPage() {
  const s = useGame();
  return (
    <Module title="Power Tracks" footer="V1 money-meaning layer — clean vs street tension">
      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3>Territory</h3>
          {DISTRICTS.map((d) => (
            <div key={d.id}>
              {d.name}: {s.power.territory[d.id]}%{" "}
              <GameButton variant="ghost" onClick={() => s.investTerritory(d.id)}>
                +5%
              </GameButton>
            </div>
          ))}
        </div>
        <div className={styles.card}>
          <h3>Political Capital (clean only)</h3>
          <p>Rung {s.power.politicalRung}/4</p>
          <GameButton onClick={() => s.buyPoliticalRung()}>Buy next rung</GameButton>
        </div>
        <div className={styles.card}>
          <h3>Street Respect</h3>
          <p>Respect {s.power.respect}</p>
          <GameButton onClick={() => s.buyRespectFlex(2000, 25, true)}>Basic threads</GameButton>{" "}
          <GameButton onClick={() => s.buyRespectFlex(15000, 50, true)}>Custom suit</GameButton>
        </div>
        <div className={styles.card}>
          <h3>Business Empire</h3>
          <p>Tier {s.power.businessTierOwned}/4</p>
          <GameButton onClick={() => s.buyBusinessTier()}>Buy/upgrade front</GameButton>
        </div>
      </div>
      <p className={styles.sub}>
        Pure criminal cannot max Political. Pure legal cannot max Respect. Cash on hand {formatMoney(s.clean + s.street)}.
      </p>
    </Module>
  );
}
