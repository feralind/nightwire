"use client";

import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { PageHero } from "@/components/ui/Visuals";
import { COLORBLIND_PACKS, type ColorblindPackId } from "@/game/accessibility";
import { DIFFICULTIES, type DifficultyId } from "@/game/difficulty";
import {
  SAVE_SLOT_IDS,
  formatSlotSavedAt,
  type SaveSlotId,
  type SaveSlotMeta,
} from "@/game/saveSlots";
import { UNDO_LIMITS_COPY } from "@/game/undo";
import { useGame } from "@/store/gameStore";
import { useCallback, useEffect, useState } from "react";
import hub from "../hub.module.css";

const MODES = Object.values(DIFFICULTIES);

export default function SettingsPage() {
  const s = useGame();
  const [draft, setDraft] = useState("");
  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [activeSlot, setActiveSlot] = useState<SaveSlotId | null>(null);
  const [slotMsg, setSlotMsg] = useState<string | null>(null);
  const mode = (s.difficulty ?? "standard") as DifficultyId;
  const pack = (s.colorblindPack ?? "none") as ColorblindPackId;

  const refreshSlots = useCallback(() => {
    setSlots(s.listSlots());
    setActiveSlot(s.getActiveSlot());
  }, [s]);

  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Settings"
        subtitle="Density, accessibility packs, AI city life, adult NPC banter, difficulty mods, and save tools."
        tone="default"
        image="/art/city/skyline.webp"
      />

      <Module title="Display density" footer="Comfortable loosens chrome spacing">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <GameButton variant={s.density === "classic" ? "primary" : "secondary"} onClick={() => s.setDensity("classic")}>
            Classic
          </GameButton>
          <GameButton
            variant={s.density === "comfortable" ? "primary" : "secondary"}
            onClick={() => s.setDensity("comfortable")}
          >
            Comfortable
          </GameButton>
        </div>
      </Module>

      <Module
        title="Accessibility"
        footer="Packs apply CSS theme attributes on the page · saved with your game"
      >
        <p className={hub.sub} style={{ marginTop: 0 }}>
          High contrast boosts borders and text. Colorblind packs remap vitals and status hues so life, nerve, money,
          energy, and warnings stay distinguishable — they are friendly approximations, not clinical simulations.
        </p>

        <strong style={{ color: "var(--text)", display: "block", marginTop: 10 }}>High contrast</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <GameButton
            variant={s.highContrast ? "primary" : "secondary"}
            onClick={() => s.setHighContrast(true)}
          >
            On
          </GameButton>
          <GameButton
            variant={!s.highContrast ? "primary" : "secondary"}
            onClick={() => s.setHighContrast(false)}
          >
            Off
          </GameButton>
        </div>
        <div className={hub.chipRow} style={{ marginTop: 10 }}>
          <span className={hub.chip}>Active: {s.highContrast ? "High contrast" : "Standard contrast"}</span>
        </div>

        <strong style={{ color: "var(--text)", display: "block", marginTop: 14 }}>Colorblind pack</strong>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {COLORBLIND_PACKS.map((p) => (
            <div key={p.id} className={hub.panel} style={{ padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <div>
                  <strong style={{ color: "var(--text)" }}>{p.label}</strong>
                  <p className={hub.sub} style={{ margin: "4px 0 0" }}>
                    {p.blurb}
                  </p>
                </div>
                <GameButton
                  variant={pack === p.id ? "primary" : "secondary"}
                  onClick={() => s.setColorblindPack(p.id)}
                >
                  {pack === p.id ? "Selected" : "Use"}
                </GameButton>
              </div>
            </div>
          ))}
        </div>
      </Module>

      <Module
        title="AI city life (Grok)"
        footer="Needs XAI_API_KEY in .env.local · offline / missing key falls back to procedural beats"
      >
        <p className={hub.sub} style={{ marginTop: 0 }}>
          Optional flavor lines for city, contacts, and rival mood via xAI. Gameplay stays fully playable with the toggle off.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <GameButton
            variant={s.aiLife ? "primary" : "secondary"}
            onClick={() => s.setAiLife(true)}
          >
            On
          </GameButton>
          <GameButton
            variant={!s.aiLife ? "primary" : "secondary"}
            onClick={() => s.setAiLife(false)}
          >
            Off
          </GameButton>
        </div>
        <div className={hub.chipRow} style={{ marginTop: 10 }}>
          <span className={hub.chip}>Active: {s.aiLife ? "Grok when available" : "Procedural only"}</span>
        </div>
      </Module>

      <Module
        title="Adult NPC banter (some contacts)"
        footer="Off by default · only tagged adult female contacts / NPCs · others stay noir"
      >
        <p className={hub.sub} style={{ marginTop: 0 }}>
          When on, a minority of nightlife/broker contacts use sultry flirty tip lines (procedural and Grok). Male NPCs and untagged females stay normal noir.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <GameButton
            variant={s.adultNpc ? "primary" : "secondary"}
            onClick={() => s.setAdultNpc(true)}
          >
            On
          </GameButton>
          <GameButton
            variant={!s.adultNpc ? "primary" : "secondary"}
            onClick={() => s.setAdultNpc(false)}
          >
            Off
          </GameButton>
        </div>
        <div className={hub.chipRow} style={{ marginTop: 10 }}>
          <span className={hub.chip}>
            Active: {s.adultNpc ? "Flirt voice for tagged females" : "All noir"}
          </span>
        </div>
      </Module>

      <Module
        title="Difficulty / mods"
        footer="Persists in your save · changes odds, shop costs, pay, heat, and regen pace"
      >
        <div className={hub.chipRow} style={{ marginBottom: 10 }}>
          <span className={hub.chip}>Active: {DIFFICULTIES[mode].label}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MODES.map((d) => (
            <div key={d.id} className={hub.panel} style={{ padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <div>
                  <strong style={{ color: "var(--text)" }}>{d.label}</strong>
                  <p className={hub.sub} style={{ margin: "4px 0 0" }}>
                    {d.blurb}
                  </p>
                </div>
                <GameButton
                  variant={mode === d.id ? "primary" : "secondary"}
                  onClick={() => s.setDifficulty(d.id)}
                >
                  {mode === d.id ? "Selected" : "Use"}
                </GameButton>
              </div>
            </div>
          ))}
        </div>
      </Module>

      <Module title="Undo window" footer="Shown after crimes, shifts, buys, uses, equip, bank">
        <p className={hub.sub}>{UNDO_LIMITS_COPY}</p>
      </Module>

      <Module
        title="Save slots"
        footer="Three local snapshots (A/B/C) · separate from clipboard export · no prestige / NG+"
      >
        <p className={hub.sub} style={{ marginTop: 0 }}>
          Save copies your current run into a slot. Load replaces the live game with that snapshot. Switch is load after
          you save the run you want to keep. The autosave (`nightwire-save-v1`) always mirrors whatever is loaded.
        </p>
        {slotMsg ? (
          <div className={hub.chipRow} style={{ marginTop: 8, marginBottom: 8 }}>
            <span className={hub.chip}>{slotMsg}</span>
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {SAVE_SLOT_IDS.map((id) => {
            const meta = slots.find((m) => m.id === id) ?? {
              id,
              label: `Slot ${id.toUpperCase()}`,
              empty: true,
              savedAt: null,
              name: null,
              level: null,
              district: null,
            };
            const isActive = activeSlot === id;
            return (
              <div key={id} className={hub.panel} style={{ padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ color: "var(--text)" }}>
                      {meta.label}
                      {isActive ? " · active" : ""}
                    </strong>
                    <p className={hub.sub} style={{ margin: "4px 0 0" }}>
                      {meta.empty
                        ? "Empty"
                        : `${meta.name ?? "Operator"} · Lv ${meta.level ?? "?"} · ${formatSlotSavedAt(meta.savedAt)}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "flex-end" }}>
                    <GameButton
                      variant="secondary"
                      onClick={() => {
                        s.saveToSlot(id);
                        refreshSlots();
                        setSlotMsg(`Saved current run to ${meta.label}`);
                      }}
                    >
                      Save
                    </GameButton>
                    <GameButton
                      variant={isActive ? "primary" : "secondary"}
                      disabled={meta.empty}
                      onClick={() => {
                        const ok = s.loadFromSlot(id);
                        refreshSlots();
                        setSlotMsg(ok ? `Loaded ${meta.label}` : `Could not load ${meta.label}`);
                      }}
                    >
                      Load
                    </GameButton>
                    <GameButton
                      variant="danger"
                      disabled={meta.empty}
                      onClick={() => {
                        s.clearSlot(id);
                        refreshSlots();
                        setSlotMsg(`Cleared ${meta.label}`);
                      }}
                    >
                      Clear
                    </GameButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Module>

      <Module title="Save" footer="Clipboard JSON backup · use slots above for quick local switches">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <GameButton
            variant="secondary"
            onClick={() => {
              const json = s.exportSave();
              void navigator.clipboard.writeText(json);
              setDraft(json);
            }}
          >
            Export save
          </GameButton>
          <GameButton variant="danger" onClick={() => s.resetSave()}>
            Reset save
          </GameButton>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          style={{
            width: "100%",
            background: "var(--bg-inset)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            marginBottom: 8,
          }}
        />
        <GameButton variant="secondary" onClick={() => s.importSave(draft)}>
          Import save
        </GameButton>
      </Module>
    </div>
  );
}
