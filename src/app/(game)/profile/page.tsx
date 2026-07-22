"use client";

import { RANK_TITLES } from "@/content/catalog";
import { formatMoney } from "@/game/formulas";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";

export default function ProfilePage() {
  const s = useGame();
  const masteryEntries = Object.entries(s.mastery);

  return (
    <div>
      <PageHero
        title="Profile"
        subtitle="Identity, networth, counterplay."
        tone="city"
        image="/art/profile/hero.webp"
        tall
      />
      <Module>
        <div className={styles.grid2}>
          <div className={styles.card}>
            <div style={{ color: "var(--text-dim)", fontSize: 10, letterSpacing: "0.06em" }}>ID CARD</div>
            <strong>{s.name}</strong> [{s.playerId}]
            <div>{RANK_TITLES[s.rankIndex]}</div>
            <div style={{ color: "var(--text-dim)" }}>{s.identitySubtitle}</div>
            <div>District: {s.district}</div>
            <div>Courses completed: {s.completedCourses.length}</div>
          </div>
          <div className={styles.card}>
            <div>Networth {formatMoney(s.clean + s.street + s.bank)}</div>
            <div>
              STR {s.str.toFixed(1)} · DEF {s.def.toFixed(1)} · SPD {s.spd.toFixed(1)} · DEX {s.dex.toFixed(1)}
            </div>
            <div>
              Heat {s.heat.toFixed(0)} · Stress {s.stress.toFixed(0)} · Happy {s.happy.toFixed(0)} · Inv{" "}
              {s.investigation}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ color: "var(--text-dim)", fontSize: 10, textTransform: "uppercase" }}>Mastery</div>
              {masteryEntries.length ? (
                <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                  {masteryEntries.map(([k, v]) => (
                    <li key={k}>
                      {k}: {"★".repeat(v.level) || "0"}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "var(--text-dim)" }}>None yet — commit crimes to build it.</div>
              )}
            </div>
          </div>
        </div>
        <h3>Investigation counterplay</h3>
        <GameButton onClick={() => s.investigationCounterplay("lawyer")}>Lawyer ($2000)</GameButton>{" "}
        <GameButton onClick={() => s.investigationCounterplay("burn")}>Burn evidence</GameButton>{" "}
        <GameButton onClick={() => s.investigationCounterplay("laylow")}>Lay low</GameButton>{" "}
        <GameButton onClick={() => s.investigationCounterplay("bribe")}>Risky bribe</GameButton>
      </Module>
    </div>
  );
}
