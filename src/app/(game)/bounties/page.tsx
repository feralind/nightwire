"use client";

import { useEffect } from "react";
import { DISTRICTS, getNpc } from "@/content/catalog";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, NPC_ART } from "@/components/ui/Visuals";
import { activeBounties } from "@/game/bounties";
import { formatMoney } from "@/game/formulas";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

export default function BountiesPage() {
  const s = useGame();
  const list = activeBounties(s.bounties ?? []);

  useEffect(() => {
    if (s.created && list.length === 0) {
      s.refreshBountyBoard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.created]);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Bounties"
        subtitle="Offline NPC contracts. Claim by KO in their district — clean payout on top of street loot."
        tone="crime"
        image="/art/crimes/mug.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>{list.length} live</span>
          <span className={hub.chip}>Attacks won {s.lifetime.attacksWon}</span>
        </div>
      </PageHero>

      <Module title="Board" footer="Refresh rolls a new day sheet · must travel to target district then claim">
        <div style={{ marginBottom: 10 }}>
          <GameButton variant="secondary" onClick={() => s.refreshBountyBoard()}>
            Refresh board
          </GameButton>
        </div>
        {list.length === 0 ? (
          <p className={styles.sub}>No live contracts. Refresh the board.</p>
        ) : (
          <div className={hub.grid}>
            {list.map((b) => {
              const npc = getNpc(b.npcId);
              if (!npc) return null;
              const district = DISTRICTS.find((d) => d.id === npc.district)?.name ?? npc.district;
              const here = s.district === npc.district;
              const portrait = NPC_ART[npc.id] ?? "/art/crimes/mug.webp";
              return (
                <article key={b.npcId} className={hub.panel}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={portrait}
                      alt=""
                      style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 4 }}
                    />
                    <div>
                      <strong>{npc.name}</strong>
                      <div className={hub.sub}>{npc.title}</div>
                    </div>
                  </div>
                  <div className={hub.statRow}>
                    <span>District</span>
                    <strong>{district}</strong>
                  </div>
                  <div className={hub.statRow}>
                    <span>Payout</span>
                    <strong className="tabular money-pos">{formatMoney(b.payout)} clean</strong>
                  </div>
                  <div className={hub.statRow}>
                    <span>Expires</span>
                    <strong className="tabular">{new Date(b.expiresAt).toLocaleTimeString()}</strong>
                  </div>
                  <GameButton
                    disabled={!here}
                    onClick={() => s.claimBountyAttack(b.npcId)}
                    title={here ? "Attack and claim" : "Travel to their district first"}
                  >
                    {here ? "Claim (attack)" : "Travel required"}
                  </GameButton>
                </article>
              );
            })}
          </div>
        )}
      </Module>
    </div>
  );
}
