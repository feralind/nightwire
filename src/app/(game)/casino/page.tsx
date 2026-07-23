"use client";

import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { ArtTile, PageHero } from "@/components/ui/Visuals";
import { formatMoney } from "@/game/formulas";
import { unit01 } from "@/game/rng";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";

type TableDef = {
  id: string;
  name: string;
  blurb: string;
  image: string;
  bet: number;
  winChance: number;
  payout: number;
  locked?: boolean;
  badge: string;
  edge: string;
};

const TABLES: TableDef[] = [
  {
    id: "slots",
    name: "Wire Slots",
    blurb: "Three reels. Fast bleed. House keeps ~5%.",
    image: "/art/casino/slots.webp",
    bet: 50,
    winChance: 0.46,
    payout: 1.9,
    badge: "Live",
    edge: "EV −5%",
  },
  {
    id: "blackjack",
    name: "Neon Blackjack",
    blurb: "Single hand vs the house. Clean cash only.",
    image: "/art/casino/blackjack.webp",
    bet: 100,
    winChance: 0.45,
    payout: 1.9,
    badge: "Live",
    edge: "EV −5%",
  },
  {
    id: "highlow",
    name: "High / Low",
    blurb: "Flip the next card. Honest table, still hungry.",
    image: "/art/casino/highlow.webp",
    bet: 75,
    winChance: 0.48,
    payout: 1.85,
    badge: "Live",
    edge: "EV −4%",
  },
  {
    id: "roulette",
    name: "Amber Roulette",
    blurb: "Wheel opens after Hour-10. Watch the floor for now.",
    image: "/art/casino/roulette.webp",
    bet: 200,
    winChance: 0.4,
    payout: 2.2,
    locked: true,
    badge: "Soon",
    edge: "Locked",
  },
  {
    id: "poker",
    name: "Video Poker",
    blurb: "Comp points later. Cabinet stays dark tonight.",
    image: "/art/casino/poker.webp",
    bet: 100,
    winChance: 0.42,
    payout: 2,
    locked: true,
    badge: "Soon",
    edge: "Locked",
  },
  {
    id: "vip",
    name: "Cage Lounge",
    blurb: "VIP tables need legitimacy + Commerce cert.",
    image: "/art/ui/locked.webp",
    bet: 500,
    winChance: 0.4,
    payout: 2,
    locked: true,
    badge: "VIP",
    edge: "Locked",
  },
];

export default function CasinoPage() {
  const s = useGame();

  function play(table: TableDef) {
    if (table.locked || s.clean < table.bet) return;
    if (s.hospitalUntil || s.jailUntil || s.travelUntil) return;
    const win = unit01(s.seed, `casino_${table.id}`, s.actionIndex + 1) < table.winChance;
    const payout = win ? Math.round(table.bet * table.payout) : 0;
    const delta = payout - table.bet;
    useGame.setState((st) => {
      const next = {
        ...st,
        actionIndex: st.actionIndex + 1,
        clean: st.clean - table.bet + payout,
        stress: Math.min(100, st.stress + (win ? 0 : 2)),
        happy: Math.min(st.happyMax, st.happy + (win ? 5 : -8)),
      };
      return {
        ...next,
        resultModal: {
          title: win ? "SUCCESS" : "FAILED",
          lines: [
            win ? `${table.name} pays.` : `${table.name} — house wins.`,
            `Bet ${formatMoney(table.bet)} · ${table.edge}`,
            win ? `Payout ${formatMoney(payout)}` : "Chips stay on the felt.",
          ],
          cashDelta: delta,
          repeatable: undefined,
        },
      };
    });
  }

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Casino"
        subtitle="Glassrow floor — published house edge, clean cash only. Comp later."
        tone="casino"
        image="/art/casino/lobby.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>Clean {formatMoney(s.clean)}</span>
          <span className={hub.chip}>Stress {Math.floor(s.stress)}</span>
          <span className={hub.chip}>Honest EV shown</span>
        </div>
      </PageHero>

      <div className={hub.grid2}>
        <Module title="Floor" footer="Live tables take clean · locked tiles are atmosphere + future depth">
          <div className={hub.grid}>
            {TABLES.map((t) => (
              <ArtTile
                key={t.id}
                image={t.image}
                title={t.name}
                subtitle={t.blurb}
                locked={t.locked}
                badge={t.badge}
              >
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
                  disabled={!!t.locked || s.clean < t.bet}
                  onClick={() => play(t)}
                >
                  {t.locked ? "Coming online" : `Play (${formatMoney(t.bet)})`}
                </GameButton>
              </ArtTile>
            ))}
          </div>
        </Module>

        <div className={hub.wrap}>
          <div className={hub.panel}>
            <h2 className={hub.panelTitle}>Cage & comps</h2>
            <p className={hub.sub}>
              Comp points and hotel suite leisure unlock after Hour-10. Loss streaks raise stress; win streaks can draw
              heat flavor later.
            </p>
            <div className={hub.statRow}>
              <span>Comp points</span>
              <strong className="tabular">0</strong>
            </div>
            <div className={hub.statRow}>
              <span>Tonight&apos;s edge</span>
              <strong>~5% house</strong>
            </div>
            <div className={hub.statRow}>
              <span>Ledger</span>
              <strong>Clean only</strong>
            </div>
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
