"use client";

import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { ArtTile, PageHero } from "@/components/ui/Visuals";
import { formatMoney } from "@/game/formulas";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

type TableDef = {
  id: string;
  name: string;
  blurb: string;
  image: string;
  bet: number;
  edge: string;
  badge: string;
};

const TABLES: TableDef[] = [
  {
    id: "slots",
    name: "Wire Slots",
    blurb: "Three reels. Fast bleed. House keeps ~5%.",
    image: "/art/casino/slots.webp",
    bet: 50,
    badge: "Live",
    edge: "EV −5%",
  },
  {
    id: "blackjack",
    name: "Neon Blackjack",
    blurb: "Single hand vs the house. Clean cash only.",
    image: "/art/casino/blackjack.webp",
    bet: 100,
    badge: "Live",
    edge: "EV −5%",
  },
  {
    id: "highlow",
    name: "High / Low",
    blurb: "Flip the next card. Honest table, still hungry.",
    image: "/art/casino/highlow.webp",
    bet: 75,
    badge: "Live",
    edge: "EV −4%",
  },
  {
    id: "roulette",
    name: "Amber Roulette",
    blurb: "Wheel is live. Wider swing, published edge.",
    image: "/art/casino/roulette.webp",
    bet: 200,
    badge: "Live",
    edge: "EV −12%",
  },
  {
    id: "poker",
    name: "Video Poker",
    blurb: "Cabinet hums. Comps stack toward suite leisure.",
    image: "/art/casino/poker.webp",
    bet: 100,
    badge: "Live",
    edge: "EV −8%",
  },
];

export default function CasinoPage() {
  const s = useGame();
  const lossPerHour = Math.round(50 * 0.05 * 40); // rough slots pace flavor

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Casino"
        subtitle="Glassrow floor — published house edge, clean cash only. Comps → suite leisure."
        tone="casino"
        image="/art/casino/lobby.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
          <span className={hub.chip}>Comps {s.compPoints}</span>
          <span className={hub.chip}>Stress {Math.floor(s.stress)}</span>
          <span className={hub.chip}>~${lossPerHour}/hr expected (slots pace)</span>
        </div>
      </PageHero>

      <div className={hub.grid2}>
        <Module title="Floor" footer="Live tables take clean · Bookkeeping (cf1) tiny flavor perk">
          <div className={hub.grid}>
            {TABLES.map((t) => (
              <ArtTile key={t.id} image={t.image} title={t.name} subtitle={t.blurb} badge={t.badge}>
                <div className={hub.statRow}>
                  <span>Bet</span>
                  <strong className="tabular">{formatMoney(t.bet)}</strong>
                </div>
                <div className={hub.statRow}>
                  <span>Edge</span>
                  <strong>{t.edge}</strong>
                </div>
                <GameButton
                  variant="danger"
                  disabled={s.clean < t.bet}
                  onClick={() => s.playCasino(t.id)}
                >
                  Play ({formatMoney(t.bet)})
                </GameButton>
              </ArtTile>
            ))}
          </div>
        </Module>

        <div className={hub.wrap}>
          <div className={hub.panel}>
            <h2 className={hub.panelTitle}>Cage & comps</h2>
            <p className={hub.sub}>
              Comp points buy hotel suite leisure. Loss streaks raise stress; long win streaks can draw heat.
            </p>
            <div className={hub.statRow}>
              <span>Comp points</span>
              <strong className="tabular">{s.compPoints}</strong>
            </div>
            <div className={hub.statRow}>
              <span>Win / loss streak</span>
              <strong className="tabular">
                {s.casinoWinStreak} / {s.casinoLossStreak}
              </strong>
            </div>
            <div className={hub.statRow}>
              <span>Suite redeem</span>
              <strong>100 comps → +40 happy</strong>
            </div>
            <GameButton disabled={s.compPoints < 100} onClick={() => s.redeemComps()}>
              Redeem suite
            </GameButton>
          </div>
          <div
            className={hub.panel}
            style={{
              minHeight: 180,
              background:
                "linear-gradient(160deg,rgba(20,16,8,0.85),rgba(10,10,12,0.9)), center/cover no-repeat url(/art/casino/lobby.webp)",
            }}
          >
            <h2 className={hub.panelTitle}>House rules</h2>
            <ul className={hub.sub} style={{ margin: 0, paddingLeft: 16 }}>
              <li>No street cash on the felt</li>
              <li>Hospital / jail / travel block play</li>
              <li>Expected loss/hour stays visible — we&apos;re not a dark pattern casino</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
