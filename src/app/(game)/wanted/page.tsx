"use client";

import { DISTRICTS, NPCS } from "@/content/catalog";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero, NPC_ART } from "@/components/ui/Visuals";
import { formatMoney } from "@/game/formulas";
import { rollD10000 } from "@/game/rng";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "../tables.module.css";

/** Soft “wanted” board — observe for clean tip money + heat flavor (not combat). */
export default function WantedPage() {
  const s = useGame();
  const day = Math.floor(Date.now() / 86_400_000);
  const pool = NPCS.filter((n) => n.power >= 25).slice(0, 12);
  const listings = pool
    .map((npc, i) => {
      const roll = rollD10000(s.seed || "nw", `wanted:${day}`, i);
      if (roll % 3 === 0) return null;
      return {
        npc,
        tip: 80 + (npc.power % 40) * 3 + (roll % 50),
        heatNote: roll % 5 === 0 ? "Case whisper" : "Street rumor",
      };
    })
    .filter(Boolean) as { npc: (typeof NPCS)[number]; tip: number; heatNote: string }[];

  function observe(npcId: string, tip: number) {
    if (!s.created) return;
    if (s.energy < 2) return;
    useGame.setState((st) => {
      const next = {
        ...st,
        energy: st.energy - 2,
        clean: st.clean + tip,
        actionIndex: st.actionIndex + 1,
        heat: Math.min(120, st.heat + 1),
        legitimacy: Math.min(100, st.legitimacy + 0.15),
      };
      const npc = NPCS.find((n) => n.id === npcId);
      return {
        ...next,
        logs: [
          {
            id: next.logSeq + 1,
            ts: Date.now(),
            text: `Observed ${npc?.name ?? npcId} — tip ${formatMoney(tip)} clean`,
            kind: "result" as const,
          },
          ...next.logs,
        ].slice(0, 200),
        logSeq: next.logSeq + 1,
        resultModal: {
          title: "SUCCESS" as const,
          lines: [
            `You clock ${npc?.name ?? "the mark"} from a safe distance.`,
            `Tip ${formatMoney(tip)} clean · heat +1`,
            "Combat claims live on Bounties.",
          ],
          cashDelta: tip,
        },
      };
    });
  }

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Wanted"
        subtitle="Persons of interest — soft observe tips. Hard contracts sit on Bounties."
        tone="crime"
        image="/art/newspaper/hero.webp"
        tall
      />

      <Module title="Persons of interest" footer="2 energy · clean tip · daily sheet from seed">
        {listings.length === 0 ? (
          <p className={styles.sub}>Quiet sheet today.</p>
        ) : (
          <div className={hub.grid}>
            {listings.slice(0, 6).map(({ npc, tip, heatNote }) => {
              const district = DISTRICTS.find((d) => d.id === npc.district)?.name ?? npc.district;
              const portrait = NPC_ART[npc.id] ?? "/art/crimes/mug.webp";
              return (
                <article key={npc.id} className={hub.panel}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "stretch" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={portrait}
                      alt=""
                      style={{
                        flex: "0 0 120px",
                        width: 120,
                        height: 140,
                        objectFit: "cover",
                        objectPosition: "center top",
                        borderRadius: 4,
                        background: "#151518",
                      }}
                    />
                    <div>
                      <strong>{npc.name}</strong>
                      <div className={hub.sub}>
                        {npc.title} · {district}
                      </div>
                    </div>
                  </div>
                  <div className={hub.statRow}>
                    <span>Observe tip</span>
                    <strong className="tabular">{formatMoney(tip)}</strong>
                  </div>
                  <div className={hub.statRow}>
                    <span>Note</span>
                    <strong>{heatNote}</strong>
                  </div>
                  <GameButton disabled={s.energy < 2} onClick={() => observe(npc.id, tip)}>
                    Observe
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
