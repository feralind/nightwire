"use client";

import { Module } from "@/components/ui/Module";
import { GameButton } from "@/components/ui/GameButton";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero, CONTACT_ART } from "@/components/ui/Visuals";
import {
  MENTOR_REPLIES,
  canMentorReply,
  mentorReplyReasons,
} from "@/game/contacts";
import { useGame } from "@/store/gameStore";
import styles from "../tables.module.css";
import contactStyles from "../contacts/contacts.module.css";

export default function Page() {
  const s = useGame();
  const logs = s.logs.filter((l) => l.kind === "diegetic").slice(0, 20);
  const canReply = canMentorReply(s);
  const replyReasons = mentorReplyReasons(s);

  return (
    <div>
      <PageHero
        title="Messages"
        subtitle="Wire traffic. Mentor threads stay short — pick a lane, don’t write a novel."
        tone="city"
        image="/art/contacts/hero.webp"
      />

      <Module title="Mentor — Reed" footer="2–3 choice replies. Shares Reed’s cooldown.">
        <div className={contactStyles.rivalRow}>
          <div className={contactStyles.rivalArt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CONTACT_ART.reed}
              alt=""
              className={contactStyles.rivalPortrait}
            />
          </div>
          <div>
            <p className={styles.sub} style={{ marginTop: 0 }}>
              Reed: “Still on the line. What are you chasing this hour?”
            </p>
            {!canReply && <RequirementsBox reasons={replyReasons} />}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {MENTOR_REPLIES.map((r) => (
                <GameButton
                  key={r.id}
                  disabled={!canReply}
                  onClick={() => s.replyMentor(r.id)}
                >
                  {r.label}
                </GameButton>
              ))}
            </div>
            <p className={styles.sub} style={{ marginBottom: 0 }}>
              {MENTOR_REPLIES.map((r) => r.blurb).join(" · ")}
            </p>
          </div>
        </div>
      </Module>

      <Module title="Inbox">
        <ul>
          {logs.map((l) => (
            <li key={l.id}>{l.text}</li>
          ))}
          {!logs.length && <li>Inbox empty. Mentor will write soon.</li>}
        </ul>
      </Module>
    </div>
  );
}
