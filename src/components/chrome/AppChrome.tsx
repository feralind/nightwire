"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { DISTRICTS, HEADLINES, RANK_TITLES, COURSES } from "@/content/catalog";
import { formatMmSs, formatMoney, heatBand } from "@/game/formulas";
import { useGame } from "@/store/gameStore";
import { GameButton } from "@/components/ui/GameButton";
import { ResultModal } from "@/components/chrome/ResultModal";
import { AwardModal } from "@/components/chrome/AwardModal";
import { IconMail, IconSettings, IconStar, NavIcon } from "@/components/ui/Icons";
import { VEX_ART } from "@/components/ui/Visuals";
import styles from "./AppChrome.module.css";

const NAV: {
  section: string;
  links: { href: string; label: string; locked?: boolean }[];
}[] = [
  {
    section: "AREAS",
    links: [
      { href: "/city", label: "City" },
      { href: "/travel", label: "Travel" },
      { href: "/map", label: "Map" },
    ],
  },
  {
    section: "CRIME",
    links: [
      { href: "/crimes", label: "Crimes" },
      { href: "/organized", label: "Organized" },
      { href: "/wanted", label: "Wanted" },
    ],
  },
  {
    section: "TRAINING",
    links: [
      { href: "/gym", label: "Gym" },
      { href: "/stats", label: "Stats" },
      { href: "/education", label: "Courses" },
    ],
  },
  {
    section: "INSTITUTIONS",
    links: [
      { href: "/education", label: "Education" },
      { href: "/licenses", label: "Licenses" },
      { href: "/hospital", label: "Hospital" },
      { href: "/body", label: "Body" },
      { href: "/jail", label: "Jail" },
    ],
  },
  {
    section: "ECONOMY",
    links: [
      { href: "/jobs", label: "Job" },
      { href: "/gigs", label: "Gigs" },
      { href: "/bank", label: "Bank" },
      { href: "/business", label: "Business" },
      { href: "/bazaar", label: "Bazaar" },
      { href: "/shops", label: "Shops" },
      { href: "/properties", label: "Properties" },
      { href: "/safehouse", label: "Safehouse" },
      { href: "/inventory", label: "Inventory" },
    ],
  },
  {
    section: "COMBAT",
    links: [
      { href: "/attack", label: "Attack" },
      { href: "/bounties", label: "Bounties" },
    ],
  },
  {
    section: "LEISURE",
    links: [
      { href: "/casino", label: "Casino" },
      { href: "/raceway", label: "Raceway" },
    ],
  },
  {
    section: "SOCIAL",
    links: [
      { href: "/contacts", label: "Contacts" },
      { href: "/faction", label: "Faction" },
      { href: "/messages", label: "Messages" },
    ],
  },
  {
    section: "META",
    links: [
      { href: "/profile", label: "Profile" },
      { href: "/awards", label: "Awards" },
      { href: "/power", label: "Power Tracks" },
      { href: "/codex", label: "Codex" },
      { href: "/newspaper", label: "Newspaper" },
      { href: "/timeline", label: "Timeline" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

function ResourceBar({
  label,
  cur,
  max,
  color,
  deep,
  nextIn,
}: {
  label: string;
  cur: number;
  max: number;
  color: string;
  deep: string;
  nextIn: string;
}) {
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));
  const full = max > 0 && Math.floor(cur) >= max;
  return (
    <div className={styles.barCell} aria-label={`${label} ${cur} of ${max}`} style={{ ["--bar-color" as string]: color, ["--bar-deep" as string]: deep }}>
      <div className={styles.barTop}>
        <span className={styles.barLabel} style={{ color }}>
          {label}
        </span>
        {full && <span className={styles.barFull}>FULL</span>}
      </div>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{
            width: `${pct}%`,
          }}
        />
        <div className={styles.barGloss} />
      </div>
      <div className={styles.barMeta}>
        <span className={`tabular ${styles.barNums}`}>
          {Math.floor(cur)}/{max}
        </span>
        <span className={styles.barSub}>+1 in {nextIn}</span>
      </div>
    </div>
  );
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const tick = useGame((st) => st.tick);
  const s = useGame(
    useShallow((st) => ({
      name: st.name,
      playerId: st.playerId,
      identitySubtitle: st.identitySubtitle,
      district: st.district,
      density: st.density,
      life: st.life,
      lifeMax: st.lifeMax,
      energy: st.energy,
      energyMax: st.energyMax,
      nerve: st.nerve,
      nerveMax: st.nerveMax,
      happy: st.happy,
      happyMax: st.happyMax,
      clean: st.clean,
      street: st.street,
      bank: st.bank,
      level: st.level,
      xp: st.xp,
      hospitalUntil: st.hospitalUntil,
      jailUntil: st.jailUntil,
      travelUntil: st.travelUntil,
      laylowUntil: st.laylowUntil,
      investigation: st.investigation,
      investigationDeadline: st.investigationDeadline,
      activeCourseId: st.activeCourseId,
      courseProgressHours: st.courseProgressHours,
      heat: st.heat,
      stress: st.stress,
      wounds: st.wounds,
      completedCourses: st.completedCourses,
      jobId: st.jobId,
      shiftsThisWeek: st.shiftsThisWeek,
      ritual: st.ritual,
      ritualBonus: st.ritualBonus,
      logs: st.logs,
      rankIndex: st.rankIndex,
      rivalLast: st.rivalLast,
      rivalScore: st.rivalScore,
      rivalFlags: st.rivalFlags,
      power: st.power,
      awayModal: st.awayModal,
      callRitual: st.callRitual,
      dismissAway: st.dismissAway,
      payMedical: st.payMedical,
      payBail: st.payBail,
    }))
  );
  const [omnibox, setOmnibox] = useState("");
  const [showOmni, setShowOmni] = useState(false);
  const [moneyMode, setMoneyMode] = useState<"combined" | "clean" | "street">("combined");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    tick();
    const tickId = window.setInterval(() => tick(), 1000);
    const clockId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(tickId);
      window.clearInterval(clockId);
    };
  }, [tick]);

  useEffect(() => {
    document.documentElement.dataset.density = s.density;
  }, [s.density]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setShowOmni(true);
      }
      if (e.key === "Escape") setShowOmni(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const districtName = DISTRICTS.find((d) => d.id === s.district)?.name ?? s.district;
  const clock = new Date(now).toLocaleTimeString();
  const regen = "4:59";

  const statusPills: string[] = [];
  if (s.hospitalUntil && now < s.hospitalUntil) statusPills.push(`Hospital ${formatMmSs((s.hospitalUntil - now) / 1000)}`);
  if (s.jailUntil && now < s.jailUntil) statusPills.push(`Jail ${formatMmSs((s.jailUntil - now) / 1000)}`);
  if (s.travelUntil && now < s.travelUntil) statusPills.push(`Travel ${formatMmSs((s.travelUntil - now) / 1000)}`);
  if (s.laylowUntil && now < s.laylowUntil) statusPills.push(`Lay-low ${formatMmSs((s.laylowUntil - now) / 1000)}`);
  if (s.investigation >= 3 && s.investigationDeadline) statusPills.push(`CASE ${formatMmSs((s.investigationDeadline - now) / 1000)}`);
  if (s.activeCourseId) {
    const course = COURSES.find((c) => c.id === s.activeCourseId);
    const pct = course ? Math.min(100, Math.round((s.courseProgressHours / course.hours) * 100)) : 0;
    statusPills.push(`Study ${course?.name ?? "course"} ${pct}%`);
  }
  if (s.heat > 40) statusPills.push(`Heat ${heatBand(s.heat)}`);
  if (s.stress > 50) statusPills.push(`Stress ${Math.floor(s.stress)}`);
  if (s.wounds.arm > 0 || s.wounds.leg > 0) {
    statusPills.push(
      `Wound ${[s.wounds.arm ? "arm" : null, s.wounds.leg ? "leg" : null].filter(Boolean).join("/")}`
    );
  }

  const headline = HEADLINES[Math.floor(now / 15000) % HEADLINES.length];

  const nextUnlock = useMemo(() => {
    if (s.level < 5) return { label: `Heavy crimes at Level 5 (now ${s.level})`, href: "/crimes" };
    if (!s.completedCourses.includes("se1")) return { label: "Street Electives I unlocks warehouse/pharmacy", href: "/education" };
    if (!s.jobId) return { label: "Apply for a job for clean income", href: "/jobs" };
    return { label: "Raise mastery or buy territory influence", href: "/power" };
  }, [s.level, s.completedCourses, s.jobId]);

  /** Real actionable nav dots only — unset = no badge */
  const navBadge: Record<string, boolean> = {
    "/gym": s.energy >= 5 && !(s.hospitalUntil && now < s.hospitalUntil) && !(s.jailUntil && now < s.jailUntil) && !(s.laylowUntil && now < s.laylowUntil),
    "/jobs":
      Boolean(s.jobId) &&
      s.shiftsThisWeek < 40 &&
      s.energy >= 5 &&
      !(s.hospitalUntil && now < s.hospitalUntil) &&
      !(s.jailUntil && now < s.jailUntil) &&
      !(s.laylowUntil && now < s.laylowUntil),
  };

  const takeover =
    (s.hospitalUntil && now < s.hospitalUntil && pathname !== "/hospital") ||
    (s.jailUntil && now < s.jailUntil && pathname !== "/jail") ||
    (s.travelUntil && now < s.travelUntil && pathname !== "/travel") ||
    (s.laylowUntil && now < s.laylowUntil && pathname !== "/travel" && pathname !== "/profile");

  const omniTargets = NAV.flatMap((n) => n.links).filter((l) => !l.locked);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.rowA}>
          <Link href="/city" className={styles.wordmark}>
            NIGHTWIRE
          </Link>
          <span className={styles.identity}>
            {s.name} [{s.playerId}]
            <span className={styles.sub}>{s.identitySubtitle}</span>
          </span>
          <span>{districtName}</span>
          <span className="tabular">{clock}</span>
          <span className={styles.icons}>
            <Link href="/messages">
              <IconMail /> Mail
            </Link>
            <Link href="/awards">
              <IconStar /> Awards
            </Link>
            <Link href="/settings">
              <IconSettings /> Settings
            </Link>
          </span>
        </div>
        <div className={styles.rowB}>
          <ResourceBar label="Life" cur={s.life} max={s.lifeMax} color="var(--life)" deep="var(--life-deep)" nextIn={regen} />
          <ResourceBar label="Energy" cur={s.energy} max={s.energyMax} color="var(--energy)" deep="var(--energy-deep)" nextIn={regen} />
          <ResourceBar label="Nerve" cur={s.nerve} max={s.nerveMax} color="var(--nerve)" deep="var(--nerve-deep)" nextIn={regen} />
          <ResourceBar label="Happy" cur={s.happy} max={s.happyMax} color="var(--happy)" deep="var(--happy-deep)" nextIn="—" />
        </div>
        <div className={styles.rowC}>
          <button type="button" className={styles.moneyToggle} onClick={() => setMoneyMode((m) => (m === "combined" ? "clean" : m === "clean" ? "street" : "combined"))}>
            <span className="tabular money-pos">
              {moneyMode === "clean" && formatMoney(s.clean)}
              {moneyMode === "street" && formatMoney(s.street)}
              {moneyMode === "combined" && formatMoney(s.clean + s.street)}
            </span>
            <span className={styles.moneyMode}>{moneyMode}</span>
          </button>
          <Link href="/bank">Bank {formatMoney(s.bank)}</Link>
          <div className={styles.xp}>
            Lv {s.level}
            <div className={styles.xpTrack}>
              <div
                className={styles.xpFill}
                style={{ width: `${Math.min(100, (s.xp / (100 * Math.pow(s.level, 1.45))) * 100)}%` }}
              />
            </div>
          </div>
          <div className={styles.pills}>
            {statusPills.map((p) => (
              <span key={p} className={styles.pill}>
                {p}
              </span>
            ))}
          </div>
          {s.ritual && (
            <div className={styles.ritual}>
              <span>{s.ritual.text}</span>
              <span className="tabular">
                {s.ritual.kind === "study"
                  ? `${s.ritual.current.toFixed(1)}/${s.ritual.target}`
                  : `${Math.floor(s.ritual.current)}/${s.ritual.target}`}
              </span>
              <GameButton
                variant="secondary"
                disabled={s.ritual.rewardClaimed}
                onClick={() => s.callRitual()}
                title={
                  s.ritual.current >= s.ritual.target
                    ? "Claim completion bonus (+cash, +5% on next 3 matching)"
                    : "Call it early — +15 happy, no cash bonus"
                }
              >
                {s.ritual.rewardClaimed ? "Called" : "Call it"}
              </GameButton>
            </div>
          )}
          {s.ritualBonus && s.ritualBonus.remaining > 0 && (
            <div className={styles.ritual}>
              <span>
                Ritual edge: +5% {s.ritualBonus.kind} cash ×{s.ritualBonus.remaining}
              </span>
            </div>
          )}
        </div>
        <div className={styles.ticker}>{headline}</div>
      </header>

      <div className={styles.body}>
        <nav className={styles.nav} aria-label="City">
          {NAV.map((group) => (
            <div key={group.section} className={styles.navSection}>
              <div className={styles.navHead}>{group.section}</div>
              {group.links.map((link) => {
                const active = pathname === link.href;
                const badge = !link.locked && navBadge[link.href];
                return (
                  <Link
                    key={link.href + link.label}
                    href={link.locked ? "#" : link.href}
                    className={[styles.navLink, active ? styles.active : "", link.locked ? styles.locked : ""].join(" ")}
                    aria-disabled={link.locked}
                    onClick={(e) => {
                      if (link.locked) e.preventDefault();
                    }}
                  >
                    <NavIcon href={link.href} />
                    <span className={styles.navLabel}>
                      {link.label}
                      {link.locked ? " [locked]" : ""}
                    </span>
                    {badge ? <span className={styles.navBadge} aria-label="Action ready" /> : <span className={styles.navBadgeSlot} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <main className={styles.main}>
          {takeover ? (
            <div className={styles.takeover}>
              <h1>
                {s.hospitalUntil && now < s.hospitalUntil && "HOSPITALIZED"}
                {s.jailUntil && now < s.jailUntil && "JAILED"}
                {s.travelUntil && now < s.travelUntil && "TRAVELING"}
                {s.laylowUntil && now < s.laylowUntil && !(s.hospitalUntil && now < s.hospitalUntil) && !(s.jailUntil && now < s.jailUntil) && !(s.travelUntil && now < s.travelUntil) && "LAYING LOW"}
              </h1>
              <p className={`tabular ${styles.takeoverTimer}`}>
                {s.hospitalUntil && now < s.hospitalUntil && formatMmSs((s.hospitalUntil - now) / 1000)}
                {s.jailUntil && now < s.jailUntil && formatMmSs((s.jailUntil - now) / 1000)}
                {s.travelUntil && now < s.travelUntil && formatMmSs((s.travelUntil - now) / 1000)}
                {s.laylowUntil && now < s.laylowUntil && !(s.hospitalUntil && now < s.hospitalUntil) && !(s.jailUntil && now < s.jailUntil) && !(s.travelUntil && now < s.travelUntil) && formatMmSs((s.laylowUntil - now) / 1000)}
              </p>
              <p>
                {s.laylowUntil && now < s.laylowUntil && !(s.hospitalUntil && now < s.hospitalUntil)
                  ? "Street actions blocked. Travel to another district to shed investigation, or wait it out."
                  : "Actions are blocked until this status ends."}
              </p>
              <div className={styles.takeoverActions}>
                {s.hospitalUntil && now < s.hospitalUntil && (
                  <GameButton onClick={() => s.payMedical()}>Pay medical</GameButton>
                )}
                {s.jailUntil && now < s.jailUntil && (
                  <GameButton onClick={() => s.payBail()}>Pay bail</GameButton>
                )}
                <Link
                  href={
                    s.hospitalUntil && now < s.hospitalUntil
                      ? "/hospital"
                      : s.jailUntil && now < s.jailUntil
                        ? "/jail"
                        : "/travel"
                  }
                >
                  Open status page
                </Link>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        <aside className={styles.rail}>
          <div className={styles.railBox}>
            <div className={styles.railTitle}>User</div>
            <div>{s.name}</div>
            <div className={styles.dim}>{RANK_TITLES[s.rankIndex]}</div>
            <div className={styles.dim}>{s.identitySubtitle}</div>
            <div className={styles.dim}>
              {districtName} · Lv {s.level}
            </div>
          </div>
          <div className={styles.railBox}>
            <div className={styles.railTitle}>Next unlock</div>
            <Link href={nextUnlock.href}>{nextUnlock.label}</Link>
          </div>
          {s.ritual && (
            <div className={styles.railBox}>
              <div className={styles.railTitle}>Daily ritual</div>
              <div>{s.ritual.text}</div>
              <div className={styles.progress}>
                <div
                  style={{
                    width: `${Math.min(100, (s.ritual.current / s.ritual.target) * 100)}%`,
                  }}
                />
              </div>
              <div className={styles.dim} style={{ marginTop: 4 }}>
                {s.ritual.rewardClaimed
                  ? "Called for the night"
                  : s.ritual.current >= s.ritual.target
                    ? "Ready — Call it for +cash and +5% matching payouts"
                    : "Call it early for happy (no cash bonus)"}
              </div>
              {s.ritualBonus && s.ritualBonus.remaining > 0 && (
                <div className={styles.dim} style={{ marginTop: 4 }}>
                  Active: +5% {s.ritualBonus.kind} ×{s.ritualBonus.remaining}
                </div>
              )}
            </div>
          )}
          <div className={styles.railBox}>
            <div className={styles.railTitle}>Event log</div>
            <ul className={styles.log}>
              {s.logs.slice(0, 10).map((l) => (
                <li key={l.id}>{l.text}</li>
              ))}
              {!s.logs.length && <li className={styles.dim}>No events yet.</li>}
            </ul>
            <Link href="/events">View full log</Link>
          </div>
          <div className={styles.railBox}>
            <div className={styles.railTitle}>Rival — Vex</div>
            <div className={styles.rivalRow}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={VEX_ART} alt="" className={styles.rivalPortrait} />
              <div>
                <div className={styles.dim}>{s.rivalLast}</div>
                <div className="tabular">
                  Score {s.rivalScore} · {Object.keys(s.rivalFlags).length}/10
                </div>
              </div>
            </div>
            <Link href="/contacts">Contacts & tips</Link>
          </div>
        </aside>
      </div>

      <footer className={styles.footer}>
        Nightwire offline · dens {s.density} · press / to search · Inv {s.investigation} · Respect {s.power.respect}
      </footer>

      <ResultModal />
      <AwardModal />

      {s.awayModal && (
        <div className={styles.backdrop}>
          <div className={styles.away}>
            <h2>While you were away</h2>
            <p>{s.awayModal.hours.toFixed(1)} hours passed</p>
            <h3>Legal</h3>
            <ul>{s.awayModal.legal.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3>Street</h3>
            <ul>{s.awayModal.street.length ? s.awayModal.street.map((x) => <li key={x}>{x}</li>) : <li>None</li>}</ul>
            <h3>City</h3>
            <ul>{s.awayModal.city.length ? s.awayModal.city.map((x) => <li key={x}>{x}</li>) : <li>Quiet</li>}</ul>
            <h3>Progress</h3>
            <ul>{s.awayModal.progress.length ? s.awayModal.progress.map((x) => <li key={x}>{x}</li>) : <li>None</li>}</ul>
            <GameButton onClick={() => s.dismissAway()}>Continue</GameButton>
          </div>
        </div>
      )}

      {showOmni && (
        <div className={styles.backdrop} onClick={() => setShowOmni(false)}>
          <div className={styles.omni} onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={omnibox}
              onChange={(e) => setOmnibox(e.target.value)}
              placeholder="Jump to…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const hit = omniTargets.find((t) => t.label.toLowerCase().includes(omnibox.toLowerCase()));
                  if (hit) {
                    router.push(hit.href);
                    setShowOmni(false);
                    setOmnibox("");
                  }
                }
              }}
            />
            <ul>
              {omniTargets
                .filter((t) => t.label.toLowerCase().includes(omnibox.toLowerCase()))
                .slice(0, 8)
                .map((t) => (
                  <li key={t.href}>
                    <button
                      type="button"
                      onClick={() => {
                        router.push(t.href);
                        setShowOmni(false);
                      }}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
