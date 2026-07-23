"use client";

import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { useGame } from "@/store/gameStore";
import { useState } from "react";

/** Simple activity planner QoL */
export default function PlannerPage() {
  const s = useGame();
  const [n, setN] = useState(3);
  return (
    <Module title="Activity planner" footer="Repeat last ×N — anti-grind batching">
      <p>Queues Attempt/Shift repeats. Costs deducted per action.</p>
      <input type="number" min={1} max={20} value={n} onChange={(e) => setN(Number(e.target.value))} />
      <GameButton
        variant="danger"
        onClick={() => {
          const id = s.lastCrimeId;
          if (!id) return;
          for (let i = 0; i < n; i++) useGame.getState().attemptCrime(id);
        }}
      >
        Repeat last crime ×{n}
      </GameButton>{" "}
      <GameButton
        onClick={() => {
          for (let i = 0; i < n; i++) useGame.getState().workShift();
        }}
      >
        Work shift ×{n}
      </GameButton>
    </Module>
  );
}
