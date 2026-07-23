"use client";

import Link from "next/link";
import {
  LEISURE_ACTIONS,
  leisureReasons,
  stressBand,
  woundCrimeOddsPenalty,
  woundEffectLines,
  woundSlotLabel,
} from "@/game/body";
import { formatMmSs, formatMoney, stressOddsPenalty } from "@/game/formulas";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { GameButton } from "@/components/ui/GameButton";
import { InfoRow, InfoRowBlock } from "@/components/ui/InfoRow";
import { RequirementsBox } from "@/components/ui/RequirementsBox";
import { PageHero } from "@/components/ui/Visuals";
import { useGame } from "@/store/gameStore";
import hub from "../hub.module.css";
import styles from "./body.module.css";

export default function BodyPage() {
  const s = useGame();
  const now = Date.now();
  const band = stressBand(s.stress);
  const oddsHit = stressOddsPenalty(s.stress);
  const woundPts = woundCrimeOddsPenalty(s.wounds);
  const coolLeft =
    s.leisureUntil && now < s.leisureUntil ? (s.leisureUntil - now) / 1000 : 0;
  const armHurt = s.wounds.arm > 0;
  const legHurt = s.wounds.leg > 0;

  return (
    <div className={hub.wrap}>
      <PageHero
        title="Body"
        subtitle="Stress bands, wound slots, and cheap ways to bleed pressure off."
        tone="hospital"
        image="/art/hospital/ward.webp"
        tall
      >
        <div className={hub.chipRow}>
          <span className={hub.chip}>
            Stress {Math.floor(s.stress)} · {band.label}
          </span>
          <span className={hub.chip}>Happy {Math.floor(s.happy)}/{s.happyMax}</span>
          <span className={hub.chip}>
            Life {Math.floor(s.life)}/{s.lifeMax}
          </span>
          {coolLeft > 0 ? (
            <span className={hub.chip}>Leisure CD {formatMmSs(coolLeft)}</span>
          ) : null}
        </div>
      </PageHero>

      <div className={hub.grid2}>
        <CollapsiblePanel title="Status diagram" footer="Dots mark soft debuffs — hospital or leisure clears them">
          <div className={styles.diagram}>
            <div className={styles.silhouette} aria-hidden>
              <div className={styles.head} />
              <div className={styles.torso} />
              <div className={styles.armL} />
              <div className={styles.armR} />
              <div className={styles.legL} />
              <div className={styles.legR} />
              <span className={`${styles.dot} ${styles.dotArmL} ${armHurt ? styles.dotHurt : styles.dotOk}`} />
              <span className={`${styles.dot} ${styles.dotArmR} ${armHurt ? styles.dotHurt : styles.dotOk}`} />
              <span className={`${styles.dot} ${styles.dotLegL} ${legHurt ? styles.dotHurt : styles.dotOk}`} />
              <span className={`${styles.dot} ${styles.dotLegR} ${legHurt ? styles.dotHurt : styles.dotOk}`} />
            </div>
            <InfoRowBlock>
              <InfoRow label="Stress band" value={band.label} tone={band.id === "breaking" || band.id === "frayed" ? "warn" : "default"} />
              <InfoRow label="Band effect" value={band.effect} />
              <InfoRow
                label="Crime odds"
                value={
                  oddsHit || woundPts
                    ? `Stress −${oddsHit}${woundPts ? ` · Wounds −${woundPts}` : ""}`
                    : "Clear"
                }
              />
              <InfoRow label="Arm" value={woundSlotLabel("arm", s.wounds.arm)} tone={armHurt ? "warn" : "default"} />
              <InfoRow label="Leg" value={woundSlotLabel("leg", s.wounds.leg)} tone={legHurt ? "warn" : "default"} />
              <div className={styles.bandBar} title={`Stress ${Math.floor(s.stress)}`}>
                <div className={styles.bandFill} style={{ width: `${Math.min(100, s.stress)}%` }} />
              </div>
              <p className={hub.sub}>
                {woundEffectLines(s.wounds).join(" · ")}. Ward discharge and garage bench also clear notches.{" "}
                <Link href="/hospital">Hospital →</Link> · <Link href="/safehouse">Safehouse →</Link>
              </p>
            </InfoRowBlock>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel title="Pressure map" defaultOpen footer="Soft only — no hard action locks yet">
          <InfoRowBlock>
            <InfoRow label="Sources" value="Crime fails · jail clock · gym overtrain · rival / casino loss" />
            <InfoRow label="Relief" value="Leisure · cot · clinic · therapy · painkillers · pier walk gig" />
            <InfoRow label="Happy floor" value={s.happy < 500 ? "Dragging crime odds + study" : "Stable"} />
            <InfoRow
              label="Study drag"
              value={s.stress > 50 ? "Stress slows courses" : "Courses at pace"}
            />
          </InfoRowBlock>
        </CollapsiblePanel>
      </div>

      <CollapsiblePanel title="Leisure & relief" footer="Shared cooldown — pick one, then breathe">
        <div className={styles.leisureGrid}>
          {LEISURE_ACTIONS.map((a) => {
            const reasons = leisureReasons(a.id, s, now);
            const ok = reasons.length === 0;
            const cost =
              a.clean > 0
                ? `${formatMoney(a.clean)} clean`
                : a.street > 0
                  ? `${formatMoney(a.street)} street`
                  : "Free (cot)";
            return (
              <article key={a.id} className={styles.leisureCard}>
                <h3 className={styles.leisureName}>{a.name}</h3>
                <p className={styles.meta}>
                  {cost} · −{a.id === "cot_rest" ? "cot-scaled" : a.stressRelief} stress · +
                  {a.id === "cot_rest" ? "cot-scaled" : a.happyGain} happy
                  {a.woundEase ? " · wound −1" : ""}
                </p>
                <p className={hub.sub} style={{ marginBottom: 8 }}>
                  {a.blurb}
                </p>
                {!ok ? <RequirementsBox reasons={reasons} /> : null}
                <GameButton disabled={!ok} onClick={() => s.doLeisure(a.id)}>
                  {a.name}
                </GameButton>
              </article>
            );
          })}
        </div>
      </CollapsiblePanel>
    </div>
  );
}
