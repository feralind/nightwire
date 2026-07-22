"use client";

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
          <p className={styles.sub}>No live intel. Buy a tip from Kilo or Nix when unlocked.</p>
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
        footer={`${flags}/10 scripted beats fired · Score ${s.rivalScore}`}
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
            <p className={styles.sub}>
              Soft pressure: stress/happy hits on beats; away ticks can skim street cash.
            </p>
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
                      {c.role} · {c.blurb}
                    </p>
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
