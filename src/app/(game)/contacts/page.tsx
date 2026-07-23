"use client";

import { useCallback, useEffect, useState } from "react";
import { CONTACTS } from "@/content/catalog";
import {
  actionReasons,
  activeTipSummary,
  canContactAction,
  contactProgress,
  contactUnlockReasons,
  isContactUnlocked,
} from "@/game/contacts";
import { rivalFlagCount } from "@/game/rival";
import { formatMoney } from "@/game/formulas";
import { fetchLifeBeat } from "@/game/lifeAi";
import { contactBlurb } from "@/game/persona";
import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero, CONTACT_ART, VEX_ART } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import type { ContactActionId } from "@/game/types";
import styles from "../tables.module.css";
import contactStyles from "./contacts.module.css";

export default function ContactsPage() {
  const s = useGame();
  const tips = activeTipSummary(s.contactTips ?? []);
  const unlocked = CONTACTS.filter((c) => isContactUnlocked(c, s));
  const locked = CONTACTS.filter((c) => !isContactUnlocked(c, s));
  const flags = rivalFlagCount(s);
  const [rivalAi, setRivalAi] = useState<{ text: string; source: "ai" | "fallback" } | null>(null);
  const [flavor, setFlavor] = useState<Record<string, { text: string; source: "ai" | "fallback" }>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const loadRivalAi = useCallback(
    async (force = false) => {
      if (!s.aiLife) {
        setRivalAi(null);
        return;
      }
      setBusy("rival");
      try {
        const beat = await fetchLifeBeat(
          {
            kind: "rival",
            district: s.district,
            heat: s.heat,
            level: s.level,
            playerName: s.name,
            lastEvents: [s.rivalLast].filter(Boolean),
            adultNpc: s.adultNpc,
          },
          { enabled: true, seed: s.seed || "nw", force, adultNpc: s.adultNpc }
        );
        setRivalAi(beat);
      } finally {
        setBusy(null);
      }
    },
    [s.aiLife, s.adultNpc, s.district, s.heat, s.level, s.name, s.rivalLast, s.seed]
  );

  useEffect(() => {
    void loadRivalAi(false);
  }, [loadRivalAi]);

  const askContactLine = async (contactId: string, force = false) => {
    if (!s.aiLife) return;
    setBusy(contactId);
    try {
      const beat = await fetchLifeBeat(
        {
          kind: "contact",
          contactId,
          district: s.district,
          heat: s.heat,
          level: s.level,
          playerName: s.name,
          adultNpc: s.adultNpc,
        },
        { enabled: true, seed: s.seed || "nw", force, adultNpc: s.adultNpc }
      );
      setFlavor((prev) => ({ ...prev, [contactId]: beat }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHero
        title="Contacts"
        subtitle="People on the wire. Tips change odds; favors cool cases and nerves. Vex watches from the other end."
        tone="city"
        image="/art/contacts/hero.webp"
        tall
      />

      <Module title="Active tips" footer="Tips expire. Crime odds show Contact tip when live.">
        {tips.length === 0 ? (
          <p className={styles.sub}>No live intel. Buy a tip from Kilo, Nix, or Wren when unlocked.</p>
        ) : (
          <ul>
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </Module>

      <Module
        title="Rival — Vex"
        footer={`${flags}/10 scripted beats fired · Score ${s.rivalScore}${s.aiLife ? " · optional Grok mood" : ""}`}
      >
        <div className={contactStyles.rivalRow}>
          <div className={contactStyles.rivalArt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={VEX_ART} alt="" className={contactStyles.rivalPortrait} />
          </div>
          <div>
            <p className={styles.sub} style={{ marginTop: 0 }}>
              {s.rivalLast}
            </p>
            {s.aiLife ? (
              <>
                <p className={styles.sub} style={{ marginBottom: 6 }}>
                  {rivalAi?.text ?? (busy === "rival" ? "Listening on the rival channel…" : "")}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <GameButton
                    variant="secondary"
                    disabled={busy === "rival"}
                    onClick={() => void loadRivalAi(true)}
                  >
                    {busy === "rival" ? "…" : "Refresh mood"}
                  </GameButton>
                  {rivalAi ? (
                    <span className={styles.sub}>{rivalAi.source === "ai" ? "Grok" : "Fallback"}</span>
                  ) : null}
                </div>
              </>
            ) : (
              <p className={styles.sub}>
                Soft pressure: stress/happy hits on beats; away ticks can skim street cash.
              </p>
            )}
          </div>
        </div>
      </Module>

      <Module title="Dossier">
        {unlocked.length === 0 ? (
          <p className={styles.sub}>Nobody answers yet.</p>
        ) : (
          <div className={contactStyles.grid}>
            {unlocked.map((c) => {
              const prog = contactProgress(s, c.id);
              const portrait = CONTACT_ART[c.id] ?? "/art/contacts/hero.webp";
              const line = flavor[c.id];
              return (
                <article key={c.id} className={contactStyles.card}>
                  <div className={contactStyles.art}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={portrait} alt="" className={contactStyles.portrait} />
                    <div className={contactStyles.artShade} />
                    <div className={contactStyles.artTitle}>
                      <strong>{c.name}</strong>
                      <span>
                        Favor {prog.favor}/5 · {prog.uses} uses
                      </span>
                    </div>
                  </div>
                  <div className={contactStyles.body}>
                    <p className={contactStyles.role}>
                      {c.role} · {contactBlurb(c, s.adultNpc)}
                    </p>
                    {s.aiLife ? (
                      <div className={contactStyles.action}>
                        {line ? <p className={styles.sub}>{line.text}</p> : null}
                        <GameButton
                          variant="secondary"
                          disabled={busy === c.id}
                          onClick={() => void askContactLine(c.id, true)}
                        >
                          {busy === c.id ? "…" : line ? "Ask tip again" : "Ask tip"}
                        </GameButton>
                        {line ? (
                          <span className={styles.sub} style={{ marginLeft: 8 }}>
                            {line.source === "ai" ? "Grok" : "Fallback"}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    <div className={contactStyles.actions}>
                      {c.actions.map((a) => {
                        const ok = canContactAction(c, a.id, s);
                        const reasons = actionReasons(c, a.id, s);
                        const costBits = [
                          a.cleanCost ? `${formatMoney(a.cleanCost)} clean` : null,
                          a.streetCost ? `${formatMoney(a.streetCost)} street` : null,
                          a.favorCost ? `favor ${a.favorCost}` : null,
                        ].filter(Boolean);
                        return (
                          <div key={a.id} className={contactStyles.action}>
                            <div className={styles.sub} style={{ margin: "0 0 2px" }}>
                              {a.blurb}
                              {costBits.length ? ` · ${costBits.join(" · ")}` : ""}
                            </div>
                            {!ok && <RequirementsBox reasons={reasons} />}
                            <GameButton
                              disabled={!ok}
                              onClick={() => s.interactContact(c.id, a.id as ContactActionId)}
                            >
                              {a.label}
                            </GameButton>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Module>

      {locked.length > 0 && (
        <Module title="Not on the line yet">
          <div className={contactStyles.grid}>
            {locked.map((c) => {
              const portrait = CONTACT_ART[c.id] ?? "/art/ui/locked.webp";
              return (
                <article key={c.id} className={`${contactStyles.card} ${contactStyles.locked}`}>
                  <div className={contactStyles.art}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={portrait} alt="" className={contactStyles.portrait} />
                    <div className={contactStyles.artShade} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/art/ui/locked.webp" alt="" className={contactStyles.lockIcon} />
                    <div className={contactStyles.artTitle}>
                      <strong>{c.name}</strong>
                      <span>{c.role}</span>
                    </div>
                  </div>
                  <div className={contactStyles.body}>
                    <RequirementsBox reasons={contactUnlockReasons(c, s)} />
                  </div>
                </article>
              );
            })}
          </div>
        </Module>
      )}
    </div>
  );
}
