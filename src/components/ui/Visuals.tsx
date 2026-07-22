"use client";

import type { CSSProperties, ReactNode } from "react";

/** Procedural atmospheric art panels — original Nightwire look, no Torn assets */

const SCENES: Record<string, { bg: string; accent: string; label: string }> = {
  shoplift: { bg: "linear-gradient(145deg,#1a1218 0%,#3a1828 40%,#0e0e10 100%)", accent: "#c45c7a", label: "corner store" },
  pickpocket: { bg: "linear-gradient(160deg,#12161e 0%,#243048 45%,#0e0e10 100%)", accent: "#6a8caf", label: "tram line" },
  vending: { bg: "linear-gradient(135deg,#101410 0%,#1e3a28 50%,#0e0e10 100%)", accent: "#4caf70", label: "vending" },
  bicycle: { bg: "linear-gradient(150deg,#141210 0%,#3a2e18 45%,#0e0e10 100%)", accent: "#c9a227", label: "bike rack" },
  mug: { bg: "linear-gradient(160deg,#120e10 0%,#3a1520 40%,#1a0a10 100%)", accent: "#e05050", label: "alley" },
  car_breakin: { bg: "linear-gradient(140deg,#0e1014 0%,#1a2838 50%,#0e0e10 100%)", accent: "#4a90d9", label: "parking" },
  warehouse: { bg: "linear-gradient(155deg,#101010 0%,#2a2418 45%,#0e0e10 100%)", accent: "#a08040", label: "warehouse" },
  pharmacy: { bg: "linear-gradient(145deg,#0e1214 0%,#183038 50%,#0e0e10 100%)", accent: "#40c0c8", label: "pharmacy" },
  armored: { bg: "linear-gradient(150deg,#101014 0%,#2a2a38 40%,#0c0c10 100%)", accent: "#8890a8", label: "lobby" },
  casino_cage: { bg: "linear-gradient(160deg,#140e08 0%,#3a2810 45%,#100c08 100%)", accent: "#d4a017", label: "cage" },
  harbor: { bg: "linear-gradient(150deg,#0a1014 0%,#143040 50%,#0a0e12 100%)", accent: "#3a90b0", label: "container" },
  courier: { bg: "linear-gradient(145deg,#100c14 0%,#281838 45%,#0c0a10 100%)", accent: "#9060c0", label: "courier" },
};

/** Generated crime card art where available; procedural SVG fallback otherwise */
const CRIME_ART: Record<string, string> = {
  shoplift: "/art/crimes/shoplift.webp",
  pickpocket: "/art/crimes/pickpocket.webp",
  vending: "/art/crimes/vending.webp",
  bicycle: "/art/crimes/bicycle.webp",
  mug: "/art/crimes/mug.webp",
  car_breakin: "/art/crimes/car_breakin.webp",
  warehouse: "/art/crimes/warehouse.webp",
  pharmacy: "/art/crimes/pharmacy.webp",
  armored: "/art/crimes/armored.webp",
  casino_cage: "/art/crimes/casino_cage.webp",
  harbor: "/art/crimes/harbor.webp",
  courier: "/art/crimes/courier.webp",
};

export const NPC_ART: Record<string, string> = {
  gr_courier: "/art/npcs/gr_courier.webp",
  gr_bouncer: "/art/npcs/gr_bouncer.webp",
  gr_tourist: "/art/npcs/gr_tourist.webp",
  ms_loader: "/art/npcs/ms_loader.webp",
  ms_scout: "/art/npcs/ms_scout.webp",
  ms_foreman: "/art/npcs/ms_foreman.webp",
  dr_smuggler: "/art/npcs/dr_smuggler.webp",
  dr_longshore: "/art/npcs/dr_longshore.webp",
  dr_lookout: "/art/npcs/dr_lookout.webp",
};

export const CONTACT_ART: Record<string, string> = {
  reed: "/art/contacts/reed.webp",
  mara: "/art/contacts/mara.webp",
  kilo: "/art/contacts/kilo.webp",
  ivy: "/art/contacts/ivy.webp",
  nix: "/art/contacts/nix.webp",
  soot: "/art/contacts/soot.webp",
  vex: "/art/contacts/vex.webp",
};

/** Career board thumbs — keyed by job career id */
export const JOB_ART: Record<string, string> = {
  retail: "/art/jobs/retail.webp",
  kitchen: "/art/jobs/kitchen.webp",
  dockhand: "/art/jobs/dockhand.webp",
  driver: "/art/jobs/driver.webp",
};

/** Gym track strips — keyed by store stat */
export const GYM_TRACK_ART: Record<string, string> = {
  str: "/art/gym/str.webp",
  def: "/art/gym/def.webp",
  spd: "/art/gym/spd.webp",
  dex: "/art/gym/dex.webp",
};

export const PROPERTY_ART: Record<string, string> = {
  gr_walkup: "/art/properties/gr_walkup.webp",
  gr_loft: "/art/properties/gr_loft.webp",
  ms_flat: "/art/properties/ms_flat.webp",
  ms_row: "/art/properties/ms_row.webp",
  ms_shed: "/art/properties/ms_shed.webp",
  dr_cot: "/art/properties/dr_cot.webp",
  dr_bay: "/art/properties/dr_bay.webp",
  dr_safe: "/art/properties/dr_safe.webp",
};

export const AWARD_CAT_ART: Record<string, string> = {
  crime: "/art/awards/crime.webp",
  work: "/art/awards/work.webp",
  money: "/art/awards/money.webp",
  body: "/art/awards/body.webp",
  city: "/art/awards/city.webp",
  story: "/art/awards/story.webp",
};

export const GIG_ART: Record<string, string> = {
  courier_drop: "/art/gigs/courier_drop.webp",
  data_entry: "/art/gigs/data_entry.webp",
  night_watch: "/art/gigs/night_watch.webp",
  tutoring: "/art/gigs/tutoring.webp",
  pier_walk: "/art/gigs/pier_walk.webp",
  campus_filing: "/art/gigs/campus_filing.webp",
  freight_assist: "/art/gigs/freight_assist.webp",
  civic_clipboard: "/art/gigs/civic_clipboard.webp",
};

export const VEX_ART = "/art/contacts/vex.webp";

export function CrimeArt({ crimeId, locked }: { crimeId: string; locked?: boolean }) {
  const photo = CRIME_ART[crimeId];
  const scene = SCENES[crimeId] ?? {
    bg: "linear-gradient(145deg,#121212,#1a1a22)",
    accent: "#666",
    label: "op",
  };

  return (
    <div
      style={{
        position: "relative",
        height: 128,
        background: photo
          ? `center/cover no-repeat url(${photo}), ${scene.bg}`
          : scene.bg,
        overflow: "hidden",
        opacity: locked ? 0.5 : 1,
        filter: locked ? "grayscale(0.75) brightness(0.7)" : undefined,
      }}
    >
      {!photo && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(-45deg,transparent,transparent 2px,rgba(255,255,255,0.02) 2px,rgba(255,255,255,0.02) 3px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -10,
              width: 80,
              height: 160,
              background: `linear-gradient(180deg,${scene.accent}55,transparent)`,
              transform: "rotate(18deg)",
              filter: "blur(1px)",
            }}
          />
          <svg viewBox="0 0 200 110" width="100%" height="100%" style={{ position: "absolute", inset: 0 }} aria-hidden>
            <rect x="10" y="50" width="40" height="60" fill="rgba(0,0,0,0.45)" />
            <rect x="55" y="35" width="28" height="75" fill="rgba(0,0,0,0.5)" />
            <rect x="130" y="40" width="50" height="70" fill="rgba(0,0,0,0.4)" />
            <circle cx="160" cy="30" r="18" fill={`${scene.accent}33`} />
            <path d="M0 90 Q50 70 100 85 T200 75 L200 110 L0 110 Z" fill="rgba(0,0,0,0.35)" />
          </svg>
        </>
      )}
      {/* bottom vignette for photo readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.72) 100%)",
          pointerEvents: "none",
        }}
      />
      {locked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/ui/locked.webp" alt="" width={48} height={48} style={{ objectFit: "cover", borderRadius: 2, opacity: 0.9 }} />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 8,
          bottom: 6,
          fontSize: 9,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.65)",
          textShadow: "0 1px 2px #000",
        }}
      >
        {scene.label}
      </div>
    </div>
  );
}

export function PageHero({
  title,
  subtitle,
  tone = "default",
  image,
  tall,
  children,
}: {
  title: string;
  subtitle?: string;
  tone?: "default" | "crime" | "gym" | "city" | "casino" | "hospital" | "jail" | "campus";
  image?: string;
  tall?: boolean;
  children?: ReactNode;
}) {
  const tones: Record<string, string> = {
    default: "linear-gradient(120deg,#1a1a22 0%,#121218 60%,#0e0e10 100%)",
    crime: "linear-gradient(120deg,#1c1014 0%,#2a1520 40%,#0e0e10 100%)",
    gym: "linear-gradient(120deg,#101418 0%,#1a2830 45%,#0e0e10 100%)",
    city: "linear-gradient(120deg,#12141c 0%,#1c2438 45%,#0e0e10 100%)",
    casino: "linear-gradient(120deg,#1a1408 0%,#3a2810 40%,#0e0e10 100%)",
    hospital: "linear-gradient(120deg,#0e1418 0%,#183038 45%,#0e0e10 100%)",
    jail: "linear-gradient(120deg,#121418 0%,#1a2228 45%,#0e0e10 100%)",
    campus: "linear-gradient(120deg,#14161c 0%,#243048 40%,#0e0e10 100%)",
  };

  const style: CSSProperties = {
    position: "relative",
    margin: "-6px -12px 12px",
    padding: tall ? "48px 18px 20px" : "22px 16px 16px",
    minHeight: tall ? 168 : image ? 120 : undefined,
    background: image
      ? `linear-gradient(105deg,rgba(8,8,10,0.92) 0%,rgba(8,8,10,0.55) 45%,rgba(8,8,10,0.75) 100%), center/cover no-repeat url(${image})`
      : tones[tone],
    borderBottom: "1px solid var(--border)",
    overflow: "hidden",
  };

  return (
    <div style={style}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(255,255,255,0.015) 3px,rgba(255,255,255,0.015) 4px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", maxWidth: 640 }}>
        <h1
          style={{
            margin: 0,
            fontSize: tall ? 26 : 22,
            letterSpacing: "0.04em",
            fontWeight: 700,
            textShadow: image ? "0 2px 8px rgba(0,0,0,0.85)" : undefined,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--text-dim)",
              fontSize: 12,
              lineHeight: 1.45,
              textShadow: image ? "0 1px 4px rgba(0,0,0,0.9)" : undefined,
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

/** Full-bleed scene panel used to kill empty voids */
export function SceneBanner({
  image,
  title,
  subtitle,
  height = 160,
  footer,
}: {
  image: string;
  title?: string;
  subtitle?: string;
  height?: number;
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        height,
        border: "1px solid var(--border)",
        borderRadius: "var(--r1)",
        overflow: "hidden",
        background: `center/cover no-repeat url(${image}), #121218`,
        marginBottom: 12,
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.45)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.25) 55%,rgba(0,0,0,0.5) 100%)",
        }}
      />
      <div style={{ position: "relative", padding: 14, maxWidth: 420 }}>
        {title && (
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.03em" }}>{title}</div>
        )}
        {subtitle && (
          <p style={{ margin: "4px 0 0", color: "var(--text-dim)", fontSize: 12 }}>{subtitle}</p>
        )}
        {footer}
      </div>
    </div>
  );
}

export function ArtTile({
  image,
  title,
  subtitle,
  locked,
  badge,
  children,
  onClick,
  disabled,
}: {
  image: string;
  title: string;
  subtitle?: string;
  locked?: boolean;
  badge?: string;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <article
      style={{
        border: "1px solid var(--border)",
        background: "linear-gradient(165deg,#222228 0%,var(--bg-panel) 100%)",
        borderRadius: "var(--r1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: locked || disabled ? 0.72 : 1,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 120,
          background: `center/cover no-repeat url(${image}), #151518`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg,transparent 35%,rgba(0,0,0,0.78))",
          }}
        />
        {locked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(0,0,0,0.45)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/ui/locked.webp" alt="" width={44} height={44} style={{ objectFit: "cover", borderRadius: 2 }} />
          </div>
        )}
        {badge && (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontSize: 10,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 6px",
              border: "1px solid var(--border-strong)",
              background: "rgba(0,0,0,0.65)",
              color: locked ? "var(--text-dim)" : "var(--text)",
            }}
          >
            {badge}
          </span>
        )}
        <div style={{ position: "absolute", left: 10, bottom: 8, right: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13, textShadow: "0 1px 3px #000" }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "rgba(220,220,220,0.75)", marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
      </div>
      {children && (
        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>{children}</div>
      )}
      {onClick && (
        <div style={{ padding: "0 10px 10px" }}>
          <button
            type="button"
            disabled={disabled || locked}
            onClick={onClick}
            style={{
              width: "100%",
              height: 26,
              cursor: disabled || locked ? "not-allowed" : "pointer",
              border: "1px solid var(--border-strong)",
              background: locked ? "var(--bg-inset)" : "linear-gradient(180deg,#2e2e36,var(--bg-inset))",
              color: "var(--text)",
              fontSize: 12,
            }}
          >
            {locked ? "Locked" : "Play"}
          </button>
        </div>
      )}
    </article>
  );
}

export const DISTRICT_ART: Record<string, string> = {
  glassrow: "/art/districts/glassrow.webp",
  millstone: "/art/districts/millstone.webp",
  docksreach: "/art/districts/docksreach.webp",
};

export const SCHOOL_ART: Record<string, string> = {
  "Street Electives": "/art/campus/street.webp",
  "Commerce & Finance": "/art/campus/commerce.webp",
  "Harbor & Logistics": "/art/campus/harbor.webp",
};
