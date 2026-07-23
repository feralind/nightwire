/** Original SVG nav icons — Nightwire set, not Torn assets */

type IconProps = { className?: string; title?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconCity(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M2 14V6l3-2 3 2v8M8 14V4l3-2 3 2v10M2 14h12" {...stroke} />
    </svg>
  );
}
export function IconTravel(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M2 8h12M10 4l4 4-4 4" {...stroke} />
    </svg>
  );
}
export function IconMap(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M2 3l4 1.5L10 3l4 1.5v9l-4-1.5L6 13l-4-1.5V3z" {...stroke} />
    </svg>
  );
}
export function IconCrime(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M8 2v4M5 5l6 6M11 5L5 11M3 13h10" {...stroke} />
      <circle cx="8" cy="9" r="2" {...stroke} />
    </svg>
  );
}
export function IconLock(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <rect x="3" y="7" width="10" height="7" rx="1" {...stroke} />
      <path d="M5 7V5a3 3 0 016 0v2" {...stroke} />
    </svg>
  );
}
export function IconGym(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M2 6v4M4 5v6M6 7v2h4V7M12 5v6M14 6v4" {...stroke} />
    </svg>
  );
}
export function IconStats(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M3 13V7M7 13V3M11 13v-5M14 13H2" {...stroke} />
    </svg>
  );
}
export function IconEdu(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M1 7l7-3 7 3-7 3-7-3zM3 8.5V12l5 2 5-2V8.5" {...stroke} />
    </svg>
  );
}
export function IconHospital(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M3 14V4h10v10M6 7h4M8 5v4" {...stroke} />
    </svg>
  );
}
export function IconBody(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <circle cx="8" cy="3.5" r="1.5" {...stroke} />
      <path d="M8 5.5v5M5 7.5h6M5.5 14L8 10.5 10.5 14" {...stroke} />
    </svg>
  );
}
export function IconJail(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M3 3h10v11H3zM6 3v11M10 3v11" {...stroke} />
    </svg>
  );
}
export function IconJob(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M5 5V4a2 2 0 014 0v1M2 5h12v8H2z" {...stroke} />
    </svg>
  );
}
export function IconBank(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M2 6l6-3 6 3v1H2zM3 8v5M8 8v5M13 8v5M2 13h12" {...stroke} />
    </svg>
  );
}
export function IconShop(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M2 6l1-3h10l1 3M3 6v7h10V6M6 9h4" {...stroke} />
    </svg>
  );
}
export function IconInv(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M3 5h10v9H3zM5 5V3.5A3 3 0 018 2a3 3 0 013 1.5V5" {...stroke} />
    </svg>
  );
}
export function IconAttack(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M3 13L12 4M10 4h3v3M4 9l3 3" {...stroke} />
    </svg>
  );
}
export function IconCasino(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <rect x="2" y="3" width="12" height="10" rx="1" {...stroke} />
      <path d="M5 8h.01M8 6h.01M8 10h.01M11 8h.01" {...stroke} />
    </svg>
  );
}
export function IconSocial(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <circle cx="6" cy="6" r="2.5" {...stroke} />
      <circle cx="11" cy="7" r="2" {...stroke} />
      <path d="M2 13c0-2 2-3 4-3s4 1 4 3M9 13c.5-1.5 2-2.2 3.5-2.2" {...stroke} />
    </svg>
  );
}
export function IconProfile(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <circle cx="8" cy="5" r="2.5" {...stroke} />
      <path d="M3 13c0-2.5 2.2-4 5-4s5 1.5 5 4" {...stroke} />
    </svg>
  );
}
export function IconStar(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M8 2l1.5 4H14l-3.5 2.5L12 13 8 10.5 4 13l1.5-4.5L2 6h4.5z" {...stroke} />
    </svg>
  );
}
export function IconSettings(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <circle cx="8" cy="8" r="2.5" {...stroke} />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M12.8 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4" {...stroke} />
    </svg>
  );
}
export function IconMail(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <rect x="2" y="4" width="12" height="9" rx="1" {...stroke} />
      <path d="M2 5l6 4 6-4" {...stroke} />
    </svg>
  );
}
export function IconHome(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M2 8l6-5 6 5v6H9v-3H7v3H2z" {...stroke} />
    </svg>
  );
}
export function IconPower(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M8 2v7M5 5a5 5 0 105.5 0" {...stroke} />
    </svg>
  );
}
export function IconBook(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M3 3h5a2 2 0 012 2v8H5a2 2 0 00-2 2V3zM8 3h5v10a2 2 0 01-2 2H8" {...stroke} />
    </svg>
  );
}
export function IconPaper(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M4 2h6l3 3v9H4V2zM10 2v3h3M6 7h5M6 10h5M6 13h3" {...stroke} />
    </svg>
  );
}
export function IconTimeline(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M3 3v10M3 5h5M3 8h8M3 11h4" {...stroke} />
      <circle cx="3" cy="5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3" cy="8" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="3" cy="11" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconRace(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <circle cx="5" cy="11" r="2" {...stroke} />
      <circle cx="12" cy="11" r="2" {...stroke} />
      <path d="M2 11h1M7 11h3M3 8l3-4h4l2 4" {...stroke} />
    </svg>
  );
}
export function IconBounty(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <circle cx="8" cy="8" r="5" {...stroke} />
      <circle cx="8" cy="8" r="2" {...stroke} />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" {...stroke} />
    </svg>
  );
}
export function IconFaction(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M8 2l5 2v4c0 3-2.5 5-5 6-2.5-1-5-3-5-6V4z" {...stroke} />
    </svg>
  );
}
export function IconProperty(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M2 13V7l6-4 6 4v6H9v-3H7v3z" {...stroke} />
    </svg>
  );
}
export function IconGig(p: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={p.className}>
      <path d="M2 10l3-6h6l3 6H2zM5 10v3h6v-3" {...stroke} />
    </svg>
  );
}

const MAP: Record<string, (p: IconProps) => JSX.Element> = {
  "/city": IconCity,
  "/travel": IconTravel,
  "/map": IconMap,
  "/crimes": IconCrime,
  "/organized": IconCrime,
  "/wanted": IconBounty,
  "/gym": IconGym,
  "/stats": IconStats,
  "/education": IconEdu,
  "/hospital": IconHospital,
  "/body": IconBody,
  "/jail": IconJail,
  "/jobs": IconJob,
  "/gigs": IconGig,
  "/bank": IconBank,
  "/business": IconProperty,
  "/bazaar": IconShop,
  "/shops": IconShop,
  "/properties": IconProperty,
  "/safehouse": IconProperty,
  "/inventory": IconInv,
  "/attack": IconAttack,
  "/bounties": IconBounty,
  "/casino": IconCasino,
  "/raceway": IconRace,
  "/contacts": IconSocial,
  "/faction": IconFaction,
  "/messages": IconMail,
  "/profile": IconProfile,
  "/awards": IconStar,
  "/power": IconPower,
  "/codex": IconBook,
  "/newspaper": IconPaper,
  "/timeline": IconTimeline,
  "/settings": IconSettings,
};

export function NavIcon({ href }: { href: string }) {
  const Comp = MAP[href] ?? IconCity;
  return <Comp />;
}
