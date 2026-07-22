"use client";

import { useState } from "react";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { useGame } from "@/store/gameStore";

export default function SettingsPage() {
  const s = useGame();
  const [draft, setDraft] = useState("");
  return (
    <Module title="Settings">
      <p>
        Density:{" "}
        <GameButton onClick={() => s.setDensity("classic")}>Classic</GameButton>{" "}
        <GameButton onClick={() => s.setDensity("comfortable")}>Comfortable</GameButton>
      </p>
      <p>
        <GameButton
          onClick={() => {
            const json = s.exportSave();
            void navigator.clipboard.writeText(json);
            setDraft(json);
          }}
        >
          Export save
        </GameButton>{" "}
        <GameButton variant="danger" onClick={() => s.resetSave()}>
          Reset save
        </GameButton>
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={8}
        style={{ width: "100%", background: "var(--bg-inset)", color: "var(--text)", border: "1px solid var(--border)" }}
      />
      <GameButton onClick={() => s.importSave(draft)}>Import save</GameButton>
    </Module>
  );
}
