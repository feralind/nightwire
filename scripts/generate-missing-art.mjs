/**
 * Generate missing Nightwire atmospheric WebP art (original noir look — no Torn assets).
 * Uses sharp + SVG composites. Skips files that already exist unless --force.
 *
 * Usage: node scripts/generate-missing-art.mjs [--force]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/art");
const FORCE = process.argv.includes("--force");

/** District / family accent palettes */
const PAL = {
  glassrow: { deep: "#0a0c12", mid: "#1a2438", accent: "#4a90d9", glow: "#6ab0ff", warm: "#c45c7a" },
  millstone: { deep: "#0c0a08", mid: "#2a2418", accent: "#a08040", glow: "#d4a84a", warm: "#8a6040" },
  docksreach: { deep: "#060c10", mid: "#143040", accent: "#3a90b0", glow: "#5ec0d8", warm: "#2a6070" },
  ashcourt: { deep: "#080e12", mid: "#183038", accent: "#40c0c8", glow: "#70e0e8", warm: "#508090" },
  spireyard: { deep: "#0a0810", mid: "#241838", accent: "#9060c0", glow: "#b888e8", warm: "#d4a017" },
  oldcommons: { deep: "#100808", mid: "#3a1520", accent: "#e05050", glow: "#ff7070", warm: "#a04030" },
  petty: { deep: "#101014", mid: "#243048", accent: "#6a8caf", glow: "#8ab0d0", warm: "#c9a227" },
  street: { deep: "#100c10", mid: "#3a1828", accent: "#c45c7a", glow: "#e07090", warm: "#e05050" },
  heavy: { deep: "#0c0c10", mid: "#2a2a38", accent: "#8890a8", glow: "#a8b0c8", warm: "#d4a017" },
  clinic: { deep: "#0a1014", mid: "#1a3038", accent: "#50b8c0", glow: "#80d8e0", warm: "#6090a0" },
  casino: { deep: "#120c06", mid: "#3a2810", accent: "#d4a017", glow: "#f0c040", warm: "#c07030" },
  civic: { deep: "#0c1018", mid: "#1c2838", accent: "#6080b0", glow: "#90b0d8", warm: "#8890a8" },
  safe: { deep: "#0a0a0e", mid: "#1a1e28", accent: "#7088a8", glow: "#98b0c8", warm: "#a08050" },
};

function noiseFilter(id = "n") {
  return `
    <filter id="${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" result="t"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.04  0 0 0 0 0.04  0 0 0 0 0.05  0 0 0 0.35 0" in="t"/>
    </filter>`;
}

function vignette(w, h, opacity = 0.72) {
  return `<radialGradient id="vig" cx="50%" cy="42%" r="72%">
    <stop offset="0%" stop-color="#000" stop-opacity="0"/>
    <stop offset="70%" stop-color="#000" stop-opacity="0.25"/>
    <stop offset="100%" stop-color="#000" stop-opacity="${opacity}"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#vig)"/>`;
}

function rain(w, h, color = "rgba(180,200,220,0.12)", count = 28) {
  let s = "";
  for (let i = 0; i < count; i++) {
    const x = ((i * 97) % w) + (i % 7) * 3;
    const y = (i * 53) % h;
    const len = 18 + (i % 5) * 6;
    s += `<line x1="${x}" y1="${y}" x2="${x + 4}" y2="${y + len}" stroke="${color}" stroke-width="1"/>`;
  }
  return s;
}

function neonBlob(cx, cy, r, color, opacity = 0.45) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}" filter="url(#blur)"/>`;
}

function skyline(w, h, groundY, color = "#050508", seed = 1) {
  const buildings = [];
  let x = -10;
  let i = 0;
  while (x < w + 40) {
    const bw = 28 + ((seed * 17 + i * 31) % 55);
    const bh = 60 + ((seed * 13 + i * 47) % Math.floor(h * 0.45));
    buildings.push(`<rect x="${x}" y="${groundY - bh}" width="${bw}" height="${bh}" fill="${color}"/>`);
    // windows
    for (let wy = groundY - bh + 10; wy < groundY - 12; wy += 14) {
      for (let wx = x + 6; wx < x + bw - 8; wx += 10) {
        if ((wx + wy + i) % 3 !== 0) continue;
        const lit = (seed + i + wx) % 5 === 0;
        buildings.push(
          `<rect x="${wx}" y="${wy}" width="4" height="5" fill="${lit ? "#c9a060" : "#1a2030"}" opacity="${lit ? 0.7 : 0.35}"/>`
        );
      }
    }
    x += bw + 4 + (i % 3);
    i++;
  }
  return buildings.join("");
}

function figure(cx, cy, scale, fill = "#0a0a0c", accent) {
  const s = scale;
  return `
    <ellipse cx="${cx}" cy="${cy - 38 * s}" rx="${10 * s}" ry="${12 * s}" fill="${fill}"/>
    <path d="M${cx - 14 * s} ${cy - 24 * s} Q${cx} ${cy - 30 * s} ${cx + 14 * s} ${cy - 24 * s}
             L${cx + 16 * s} ${cy + 8 * s} L${cx - 16 * s} ${cy + 8 * s} Z" fill="${fill}"/>
    <rect x="${cx - 12 * s}" y="${cy + 6 * s}" width="${10 * s}" height="${22 * s}" fill="${fill}"/>
    <rect x="${cx + 2 * s}" y="${cy + 6 * s}" width="${10 * s}" height="${22 * s}" fill="${fill}"/>
    ${accent ? `<circle cx="${cx + 6 * s}" cy="${cy - 18 * s}" r="${3 * s}" fill="${accent}" opacity="0.55"/>` : ""}
  `;
}

async function writeWebp(rel, svg, width, height) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (!FORCE && fs.existsSync(out)) {
    return { rel, skipped: true };
  }
  const buf = await sharp(Buffer.from(svg))
    .resize(width, height, { fit: "fill" })
    .webp({ quality: 84, effort: 5 })
    .toBuffer();
  fs.writeFileSync(out, buf);
  return { rel, bytes: buf.length, skipped: false };
}

function sceneSvg(w, h, pal, opts = {}) {
  const {
    ground = 0.72,
    blobs = [],
    extras = "",
    figureAt = null,
    seed = 3,
    rainOn = true,
    labelHint = "",
  } = opts;
  const gy = Math.floor(h * ground);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${noiseFilter("grain")}
    <filter id="blur"><feGaussianBlur stdDeviation="28"/></filter>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${pal.deep}"/>
      <stop offset="45%" stop-color="${pal.mid}"/>
      <stop offset="100%" stop-color="${pal.deep}"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${blobs.map(([x, y, r, c, o]) => neonBlob(x, y, r, c || pal.glow, o ?? 0.4)).join("")}
  ${skyline(w, h, gy, "#050508", seed)}
  <rect x="0" y="${gy}" width="${w}" height="${h - gy}" fill="#08080a"/>
  <rect x="0" y="${gy - 2}" width="${w}" height="3" fill="${pal.accent}" opacity="0.25"/>
  ${extras}
  ${figureAt ? figure(figureAt[0], figureAt[1], figureAt[2] ?? 1.2, "#08080c", pal.glow) : ""}
  ${rainOn ? rain(w, h) : ""}
  <rect width="${w}" height="${h}" fill="url(#floor)"/>
  ${vignette(w, h)}
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.55"/>
  ${
    labelHint
      ? `<text x="24" y="${h - 22}" fill="${pal.accent}" fill-opacity="0.22" font-family="monospace" font-size="11" letter-spacing="3">${labelHint}</text>`
      : ""
  }
</svg>`;
}

function portraitSvg(w, h, pal, kind = "civilian") {
  const torsoY = Math.floor(h * 0.62);
  const headR = Math.floor(w * 0.16);
  const extras =
    kind === "guard"
      ? `<rect x="${w * 0.35}" y="${h * 0.28}" width="${w * 0.3}" height="${h * 0.06}" fill="${pal.accent}" opacity="0.35"/>
         <rect x="${w * 0.42}" y="${h * 0.34}" width="${w * 0.16}" height="${h * 0.08}" fill="#12141a"/>`
      : kind === "runner"
        ? `<path d="M${w * 0.2} ${h * 0.45} Q${w * 0.5} ${h * 0.35} ${w * 0.8} ${h * 0.48}" fill="none" stroke="${pal.glow}" stroke-width="3" opacity="0.35"/>`
        : kind === "exec"
          ? `<rect x="${w * 0.38}" y="${h * 0.55}" width="${w * 0.24}" height="${h * 0.12}" fill="#0c0c10" stroke="${pal.warm}" stroke-width="2" opacity="0.7"/>`
          : kind === "thug"
            ? `<circle cx="${w * 0.62}" cy="${h * 0.42}" r="6" fill="${pal.accent}" opacity="0.5"/>`
            : `<circle cx="${w * 0.58}" cy="${h * 0.4}" r="4" fill="${pal.glow}" opacity="0.45"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${noiseFilter("grain")}
    <filter id="blur"><feGaussianBlur stdDeviation="22"/></filter>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.mid}"/>
      <stop offset="55%" stop-color="${pal.deep}"/>
      <stop offset="100%" stop-color="#040406"/>
    </linearGradient>
    <radialGradient id="face" cx="50%" cy="35%" r="45%">
      <stop offset="0%" stop-color="${pal.glow}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${neonBlob(w * 0.2, h * 0.2, 90, pal.accent, 0.28)}
  ${neonBlob(w * 0.85, h * 0.3, 70, pal.glow, 0.22)}
  <rect width="${w}" height="${h}" fill="url(#face)"/>
  <!-- shoulders -->
  <ellipse cx="${w / 2}" cy="${torsoY + 40}" rx="${w * 0.38}" ry="${h * 0.28}" fill="#0a0a0e"/>
  <path d="M${w * 0.18} ${torsoY} Q${w / 2} ${torsoY - 30} ${w * 0.82} ${torsoY}
           L${w * 0.92} ${h} L${w * 0.08} ${h} Z" fill="#101018"/>
  <!-- head (upper third for object-position: center top) -->
  <ellipse cx="${w / 2}" cy="${h * 0.34}" rx="${headR}" ry="${headR * 1.12}" fill="#1a1c22"/>
  <ellipse cx="${w / 2}" cy="${h * 0.34}" rx="${headR * 0.92}" ry="${headR}" fill="#252830"/>
  <!-- hair / hood silhouette -->
  <path d="M${w / 2 - headR} ${h * 0.34} Q${w / 2} ${h * 0.12} ${w / 2 + headR} ${h * 0.34}
           Q${w / 2} ${h * 0.22} ${w / 2 - headR} ${h * 0.34}" fill="#0c0c10" opacity="0.9"/>
  ${extras}
  ${rain(w, h, "rgba(200,210,230,0.08)", 16)}
  ${vignette(w, h, 0.65)}
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5"/>
</svg>`;
}

function interiorSvg(w, h, pal, props = {}) {
  const { shelves = true, window = true, object = "", seed = 2 } = props;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${noiseFilter("grain")}
    <filter id="blur"><feGaussianBlur stdDeviation="20"/></filter>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.mid}"/>
      <stop offset="100%" stop-color="${pal.deep}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#wall)"/>
  ${neonBlob(w * 0.7, h * 0.25, 100, pal.glow, 0.3)}
  ${window ? `<rect x="${w * 0.55}" y="${h * 0.12}" width="${w * 0.32}" height="${h * 0.28}" fill="#0a1218" stroke="${pal.accent}" stroke-width="2" opacity="0.8"/>
    <rect x="${w * 0.55}" y="${h * 0.12}" width="${w * 0.32}" height="${h * 0.28}" fill="${pal.glow}" opacity="0.08"/>
    <line x1="${w * 0.71}" y1="${h * 0.12}" x2="${w * 0.71}" y2="${h * 0.4}" stroke="${pal.accent}" stroke-opacity="0.35"/>
    <line x1="${w * 0.55}" y1="${h * 0.26}" x2="${w * 0.87}" y2="${h * 0.26}" stroke="${pal.accent}" stroke-opacity="0.35"/>` : ""}
  ${
    shelves
      ? Array.from({ length: 4 }, (_, i) => {
          const y = h * 0.45 + i * 28;
          return `<rect x="${w * 0.08}" y="${y}" width="${w * 0.4}" height="3" fill="${pal.accent}" opacity="0.25"/>
            <rect x="${w * 0.1 + (i + seed) % 3 * 18}" y="${y - 18}" width="22" height="16" fill="#12141a" opacity="0.8"/>`;
        }).join("")
      : ""
  }
  ${object}
  <rect x="0" y="${h * 0.78}" width="${w}" height="${h * 0.22}" fill="#060608"/>
  ${vignette(w, h)}
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5"/>
</svg>`;
}

/** Crime-specific extra SVG fragments (no readable words) */
const CRIME_EXTRAS = {
  parking_meter: (w, h, p) =>
    `<rect x="${w * 0.42}" y="${h * 0.38}" width="28" height="90" rx="4" fill="#1a1c20" stroke="${p.accent}" stroke-width="2"/>
     <circle cx="${w * 0.455}" cy="${h * 0.48}" r="14" fill="#0e1014" stroke="${p.glow}" stroke-width="2"/>`,
  fake_charity: (w, h, p) =>
    `<ellipse cx="${w * 0.5}" cy="${h * 0.62}" rx="36" ry="14" fill="#12141a" stroke="${p.warm}" stroke-width="2"/>
     <rect x="${w * 0.47}" y="${h * 0.48}" width="24" height="28" fill="#181a22"/>`,
  delivery_package: (w, h, p) =>
    `<rect x="${w * 0.38}" y="${h * 0.55}" width="70" height="50" fill="#1a1410" stroke="${p.warm}" stroke-width="2"/>
     <line x1="${w * 0.38}" y1="${h * 0.62}" x2="${w * 0.38 + 70}" y2="${h * 0.62}" stroke="${p.accent}" opacity="0.5"/>`,
  basic_lock: (w, h, p) =>
    `<rect x="${w * 0.46}" y="${h * 0.4}" width="40" height="55" rx="6" fill="#14161c" stroke="${p.accent}" stroke-width="2"/>
     <circle cx="${w * 0.5}" cy="${h * 0.55}" r="8" fill="none" stroke="${p.glow}" stroke-width="2"/>`,
  street_sign: (w, h, p) =>
    `<rect x="${w * 0.48}" y="${h * 0.25}" width="8" height="160" fill="#1a1c20"/>
     <rect x="${w * 0.35}" y="${h * 0.32}" width="90" height="28" fill="${p.accent}" opacity="0.35"/>`,
  short_change: (w, h, p) =>
    `<rect x="${w * 0.3}" y="${h * 0.5}" width="100" height="40" fill="#12141a" stroke="${p.warm}" stroke-width="1"/>
     <circle cx="${w * 0.4}" cy="${h * 0.58}" r="8" fill="${p.glow}" opacity="0.4"/>
     <circle cx="${w * 0.52}" cy="${h * 0.58}" r="8" fill="${p.glow}" opacity="0.3"/>`,
  cafe_phone: (w, h, p) =>
    `<rect x="${w * 0.25}" y="${h * 0.55}" width="160" height="12" fill="#1a1410"/>
     <rect x="${w * 0.55}" y="${h * 0.48}" width="22" height="38" rx="3" fill="#0e1014" stroke="${p.glow}" stroke-width="1.5"/>`,
  coinop_scam: (w, h, p) =>
    `<rect x="${w * 0.4}" y="${h * 0.35}" width="70" height="120" rx="4" fill="#141018" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.45}" y="${h * 0.42}" width="50" height="30" fill="${p.glow}" opacity="0.2"/>`,
  laundry_pouch: (w, h, p) =>
    `<ellipse cx="${w * 0.5}" cy="${h * 0.58}" rx="40" ry="28" fill="#16141a" stroke="${p.warm}" stroke-width="2"/>
     <path d="M${w * 0.42} ${h * 0.5} Q${w * 0.5} ${h * 0.42} ${w * 0.58} ${h * 0.5}" fill="none" stroke="${p.accent}" stroke-width="2"/>`,
  bus_pass: (w, h, p) =>
    `<rect x="${w * 0.35}" y="${h * 0.45}" width="90" height="55" rx="4" fill="#121820" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.4}" y="${h * 0.52}" width="50" height="8" fill="${p.glow}" opacity="0.35"/>`,
  atm_surf: (w, h, p) =>
    `<rect x="${w * 0.38}" y="${h * 0.28}" width="90" height="140" rx="6" fill="#10141a" stroke="${p.glow}" stroke-width="2"/>
     <rect x="${w * 0.44}" y="${h * 0.36}" width="60" height="40" fill="${p.accent}" opacity="0.25"/>`,
  construction_skip: (w, h, p) =>
    `<rect x="${w * 0.25}" y="${h * 0.5}" width="180" height="70" fill="#1a1610" stroke="${p.warm}" stroke-width="2"/>
     <rect x="${w * 0.3}" y="${h * 0.42}" width="40" height="20" fill="${p.accent}" opacity="0.3"/>`,
  courier_hijack: (w, h, p) =>
    `<ellipse cx="${w * 0.55}" cy="${h * 0.68}" rx="55" ry="12" fill="#0a0a0c"/>
     <circle cx="${w * 0.42}" cy="${h * 0.66}" r="22" fill="none" stroke="${p.accent}" stroke-width="3"/>
     <circle cx="${w * 0.68}" cy="${h * 0.66}" r="22" fill="none" stroke="${p.accent}" stroke-width="3"/>`,
  race_skim: (w, h, p) =>
    `<path d="M${w * 0.1} ${h * 0.7} Q${w * 0.4} ${h * 0.5} ${w * 0.9} ${h * 0.65}" fill="none" stroke="${p.glow}" stroke-width="4" opacity="0.5"/>
     <rect x="${w * 0.55}" y="${h * 0.48}" width="70" height="28" rx="4" fill="#12141a" stroke="${p.warm}" stroke-width="2"/>`,
  advanced_lock: (w, h, p) =>
    `<rect x="${w * 0.42}" y="${h * 0.35}" width="55" height="70" rx="8" fill="#101218" stroke="${p.glow}" stroke-width="2"/>
     <circle cx="${w * 0.5}" cy="${h * 0.55}" r="12" fill="none" stroke="${p.accent}" stroke-width="3"/>
     <circle cx="${w * 0.5}" cy="${h * 0.55}" r="4" fill="${p.glow}" opacity="0.6"/>`,
  catalytic: (w, h, p) =>
    `<ellipse cx="${w * 0.5}" cy="${h * 0.62}" rx="90" ry="28" fill="#12141a"/>
     <rect x="${w * 0.35}" y="${h * 0.55}" width="80" height="18" rx="6" fill="${p.warm}" opacity="0.35"/>`,
  badge_clone: (w, h, p) =>
    `<rect x="${w * 0.42}" y="${h * 0.4}" width="50" height="70" rx="4" fill="#141820" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.46}" y="${h * 0.48}" width="34" height="22" fill="${p.glow}" opacity="0.2"/>
     <circle cx="${w * 0.55}" cy="${h * 0.78}" r="6" fill="${p.warm}" opacity="0.5"/>`,
  drop_swap: (w, h, p) =>
    `<rect x="${w * 0.3}" y="${h * 0.52}" width="50" height="40" fill="#12141a" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.55}" y="${h * 0.52}" width="50" height="40" fill="#12141a" stroke="${p.glow}" stroke-width="2"/>
     <path d="M${w * 0.42} ${h * 0.45} L${w * 0.58} ${h * 0.45}" stroke="${p.warm}" stroke-width="2" stroke-dasharray="4 3"/>`,
  arson_scout: (w, h, p) =>
    `<path d="M${w * 0.48} ${h * 0.55} Q${w * 0.5} ${h * 0.35} ${w * 0.55} ${h * 0.55} Z" fill="${p.warm}" opacity="0.55"/>
     <path d="M${w * 0.45} ${h * 0.6} Q${w * 0.52} ${h * 0.4} ${w * 0.58} ${h * 0.62} Z" fill="${p.accent}" opacity="0.35"/>`,
  food_truck: (w, h, p) =>
    `<rect x="${w * 0.25}" y="${h * 0.42}" width="160" height="70" rx="6" fill="#14161c" stroke="${p.warm}" stroke-width="2"/>
     <rect x="${w * 0.35}" y="${h * 0.48}" width="70" height="28" fill="${p.glow}" opacity="0.15"/>
     <circle cx="${w * 0.35}" cy="${h * 0.72}" r="14" fill="#0a0a0c" stroke="${p.accent}" stroke-width="2"/>
     <circle cx="${w * 0.7}" cy="${h * 0.72}" r="14" fill="#0a0a0c" stroke="${p.accent}" stroke-width="2"/>`,
  jewel_case: (w, h, p) =>
    `<rect x="${w * 0.35}" y="${h * 0.4}" width="100" height="70" fill="#101218" stroke="${p.glow}" stroke-width="2"/>
     <polygon points="${w * 0.5},${h * 0.48} ${w * 0.56},${h * 0.58} ${w * 0.44},${h * 0.58}" fill="${p.warm}" opacity="0.55"/>`,
  meter_maid: (w, h, p) =>
    `<rect x="${w * 0.4}" y="${h * 0.45}" width="55" height="40" rx="4" fill="#141820" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.44}" y="${h * 0.5}" width="30" height="8" fill="${p.glow}" opacity="0.35"/>`,
  dock_pierce: (w, h, p) =>
    `<rect x="${w * 0.28}" y="${h * 0.4}" width="120" height="90" fill="#12181e" stroke="${p.accent}" stroke-width="2"/>
     <line x1="${w * 0.28}" y1="${h * 0.55}" x2="${w * 0.28 + 120}" y2="${h * 0.55}" stroke="${p.glow}" opacity="0.4"/>
     <circle cx="${w * 0.7}" cy="${h * 0.48}" r="8" fill="none" stroke="${p.warm}" stroke-width="2"/>`,
  hotel_safe: (w, h, p) =>
    `<rect x="${w * 0.38}" y="${h * 0.35}" width="90" height="100" rx="4" fill="#10141a" stroke="${p.glow}" stroke-width="2"/>
     <circle cx="${w * 0.55}" cy="${h * 0.55}" r="16" fill="none" stroke="${p.accent}" stroke-width="3"/>
     <circle cx="${w * 0.55}" cy="${h * 0.55}" r="4" fill="${p.warm}"/>`,
  evidence_room: (w, h, p) =>
    `<rect x="${w * 0.2}" y="${h * 0.35}" width="50" height="120" fill="#12161c" opacity="0.9"/>
     <rect x="${w * 0.4}" y="${h * 0.35}" width="50" height="120" fill="#12161c" opacity="0.85"/>
     <rect x="${w * 0.6}" y="${h * 0.35}" width="50" height="120" fill="#12161c" opacity="0.9"/>
     <rect x="${w * 0.45}" y="${h * 0.5}" width="20" height="14" fill="${p.glow}" opacity="0.3"/>`,
  private_vault: (w, h, p) =>
    `<circle cx="${w * 0.5}" cy="${h * 0.5}" r="70" fill="#101218" stroke="${p.glow}" stroke-width="4"/>
     <circle cx="${w * 0.5}" cy="${h * 0.5}" r="40" fill="none" stroke="${p.accent}" stroke-width="3"/>
     <circle cx="${w * 0.5}" cy="${h * 0.5}" r="8" fill="${p.warm}"/>`,
  evidence_swap: (w, h, p) =>
    `<rect x="${w * 0.32}" y="${h * 0.42}" width="60" height="45" fill="#141820" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.52}" y="${h * 0.48}" width="60" height="45" fill="#141820" stroke="${p.glow}" stroke-width="2"/>
     <path d="M${w * 0.48} ${h * 0.4} L${w * 0.58} ${h * 0.38}" stroke="${p.warm}" stroke-width="2"/>`,
  museum: (w, h, p) =>
    `<rect x="${w * 0.2}" y="${h * 0.45}" width="80" height="50" fill="#12141a" stroke="${p.glow}" stroke-width="1"/>
     <rect x="${w * 0.55}" y="${h * 0.4}" width="70" height="60" fill="#12141a" stroke="${p.accent}" stroke-width="1"/>
     <circle cx="${w * 0.35}" cy="${h * 0.55}" r="12" fill="${p.warm}" opacity="0.25"/>`,
  gang_stash: (w, h, p) =>
    `<rect x="${w * 0.35}" y="${h * 0.48}" width="90" height="55" fill="#141018" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.42}" y="${h * 0.55}" width="30" height="20" fill="${p.warm}" opacity="0.35"/>
     <rect x="${w * 0.58}" y="${h * 0.55}" width="30" height="20" fill="${p.glow}" opacity="0.25"/>`,
  chop_shop: (w, h, p) =>
    `<rect x="${w * 0.2}" y="${h * 0.5}" width="140" height="45" fill="#12141a"/>
     <circle cx="${w * 0.35}" cy="${h * 0.7}" r="18" fill="none" stroke="${p.warm}" stroke-width="3"/>
     <circle cx="${w * 0.65}" cy="${h * 0.7}" r="18" fill="none" stroke="${p.warm}" stroke-width="3"/>
     <line x1="${w * 0.25}" y1="${h * 0.4}" x2="${w * 0.55}" y2="${h * 0.52}" stroke="${p.accent}" stroke-width="2" opacity="0.5"/>`,
  bond_fraud: (w, h, p) =>
    `<rect x="${w * 0.3}" y="${h * 0.4}" width="120" height="80" fill="#121820" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.38}" y="${h * 0.48}" width="80" height="8" fill="${p.glow}" opacity="0.3"/>
     <rect x="${w * 0.38}" y="${h * 0.58}" width="55" height="8" fill="${p.glow}" opacity="0.2"/>`,
  substation_copper: (w, h, p) =>
    `<rect x="${w * 0.35}" y="${h * 0.3}" width="80" height="120" fill="#12141a" stroke="${p.warm}" stroke-width="2"/>
     <line x1="${w * 0.4}" y1="${h * 0.4}" x2="${w * 0.55}" y2="${h * 0.55}" stroke="${p.glow}" stroke-width="3" opacity="0.5"/>
     <line x1="${w * 0.55}" y1="${h * 0.4}" x2="${w * 0.4}" y2="${h * 0.55}" stroke="${p.accent}" stroke-width="3" opacity="0.4"/>`,
  hospital_vault: (w, h, p) =>
    `<rect x="${w * 0.35}" y="${h * 0.35}" width="100" height="110" rx="4" fill="#101820" stroke="${p.glow}" stroke-width="2"/>
     <rect x="${w * 0.48}" y="${h * 0.48}" width="20" height="6" fill="${p.accent}" opacity="0.5"/>
     <rect x="${w * 0.525}" y="${h * 0.44}" width="6" height="20" fill="${p.accent}" opacity="0.5"/>`,
  airport_cargo: (w, h, p) =>
    `<rect x="${w * 0.2}" y="${h * 0.45}" width="70" height="50" fill="#12181e" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.45}" y="${h * 0.4}" width="70" height="55" fill="#12181e" stroke="${p.glow}" stroke-width="2"/>
     <rect x="${w * 0.7}" y="${h * 0.48}" width="70" height="47" fill="#12181e" stroke="${p.warm}" stroke-width="2"/>`,
  aide_blackmail: (w, h, p) =>
    `<rect x="${w * 0.4}" y="${h * 0.42}" width="70" height="50" fill="#141820" stroke="${p.accent}" stroke-width="2"/>
     <circle cx="${w * 0.55}" cy="${h * 0.55}" r="10" fill="none" stroke="${p.glow}" stroke-width="2"/>
     <path d="M${w * 0.35} ${h * 0.35} L${w * 0.45} ${h * 0.42}" stroke="${p.warm}" stroke-width="2" opacity="0.5"/>`,
  train_arms: (w, h, p) =>
    `<rect x="${w * 0.15}" y="${h * 0.45}" width="200" height="55" fill="#12141a" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.4}" y="${h * 0.52}" width="50" height="25" fill="${p.warm}" opacity="0.3"/>
     <circle cx="${w * 0.3}" cy="${h * 0.72}" r="12" fill="#0a0a0c"/>
     <circle cx="${w * 0.7}" cy="${h * 0.72}" r="12" fill="#0a0a0c"/>`,
};

const CRIME_META = {
  parking_meter: { pal: "petty", seed: 11, ground: 0.7 },
  fake_charity: { pal: "glassrow", seed: 12, figureAt: [0.48, 0.72, 1.1] },
  delivery_package: { pal: "oldcommons", seed: 13 },
  basic_lock: { pal: "millstone", seed: 14 },
  street_sign: { pal: "millstone", seed: 15 },
  short_change: { pal: "glassrow", seed: 16 },
  cafe_phone: { pal: "spireyard", seed: 17 },
  coinop_scam: { pal: "glassrow", seed: 18 },
  laundry_pouch: { pal: "ashcourt", seed: 19 },
  bus_pass: { pal: "ashcourt", seed: 20 },
  atm_surf: { pal: "spireyard", seed: 21 },
  construction_skip: { pal: "millstone", seed: 22 },
  courier_hijack: { pal: "street", seed: 23, figureAt: [0.35, 0.7, 1] },
  race_skim: { pal: "oldcommons", seed: 24 },
  advanced_lock: { pal: "spireyard", seed: 25 },
  catalytic: { pal: "millstone", seed: 26 },
  badge_clone: { pal: "ashcourt", seed: 27 },
  drop_swap: { pal: "docksreach", seed: 28 },
  arson_scout: { pal: "street", seed: 29 },
  food_truck: { pal: "oldcommons", seed: 30 },
  jewel_case: { pal: "glassrow", seed: 31 },
  meter_maid: { pal: "ashcourt", seed: 32, figureAt: [0.6, 0.72, 1] },
  dock_pierce: { pal: "docksreach", seed: 33 },
  hotel_safe: { pal: "spireyard", seed: 34 },
  evidence_room: { pal: "ashcourt", seed: 35 },
  private_vault: { pal: "spireyard", seed: 36 },
  evidence_swap: { pal: "ashcourt", seed: 37 },
  museum: { pal: "heavy", seed: 38 },
  gang_stash: { pal: "oldcommons", seed: 39 },
  chop_shop: { pal: "millstone", seed: 40 },
  bond_fraud: { pal: "civic", seed: 41 },
  substation_copper: { pal: "millstone", seed: 42 },
  hospital_vault: { pal: "clinic", seed: 43 },
  airport_cargo: { pal: "docksreach", seed: 44 },
  aide_blackmail: { pal: "civic", seed: 45 },
  train_arms: { pal: "heavy", seed: 46 },
};

const JOBS = {
  warehouse: { pal: "millstone", object: (w, h, p) => `<rect x="${w * 0.2}" y="${h * 0.4}" width="60" height="80" fill="#12141a"/><rect x="${w * 0.45}" y="${h * 0.45}" width="60" height="75" fill="#14161c"/><rect x="${w * 0.7}" y="${h * 0.35}" width="50" height="85" fill="#101218" stroke="${p.accent}" stroke-width="1"/>` },
  orderly: { pal: "clinic", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="90" height="50" fill="#121820" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.48}" y="${h * 0.48}" width="18" height="5" fill="${p.accent}" opacity="0.5"/><rect x="${w * 0.52}" y="${h * 0.44}" width="5" height="18" fill="${p.accent}" opacity="0.5"/>` },
  casino: { pal: "casino", object: (w, h, p) => `<ellipse cx="${w * 0.5}" cy="${h * 0.55}" rx="70" ry="40" fill="#1a1408" stroke="${p.glow}" stroke-width="2"/><circle cx="${w * 0.42}" cy="${h * 0.55}" r="8" fill="${p.accent}" opacity="0.5"/><circle cx="${w * 0.55}" cy="${h * 0.52}" r="8" fill="${p.warm}" opacity="0.45"/>` },
  citydesk: { pal: "civic", object: (w, h, p) => `<rect x="${w * 0.25}" y="${h * 0.5}" width="140" height="12" fill="#1a1c22"/><rect x="${w * 0.4}" y="${h * 0.35}" width="50" height="40" fill="#12141a" stroke="${p.accent}" stroke-width="1"/><rect x="${w * 0.55}" y="${h * 0.42}" width="35" height="25" fill="${p.glow}" opacity="0.15"/>` },
};

const NPCS = {
  ac_intern: { pal: "ashcourt", kind: "civilian" },
  ac_security: { pal: "ashcourt", kind: "guard" },
  sy_exec: { pal: "spireyard", kind: "exec" },
  sy_guard: { pal: "spireyard", kind: "guard" },
  oc_thug: { pal: "oldcommons", kind: "thug" },
  oc_runner: { pal: "oldcommons", kind: "runner" },
};

const PROPERTIES = {
  ac_studio: { pal: "ashcourt", floors: 3, wide: 0.35 },
  ac_wardflat: { pal: "ashcourt", floors: 5, wide: 0.45 },
  sy_condo: { pal: "spireyard", floors: 8, wide: 0.4, glass: true },
  sy_pent: { pal: "spireyard", floors: 10, wide: 0.5, glass: true },
  oc_room: { pal: "oldcommons", floors: 2, wide: 0.3 },
  oc_walkup: { pal: "oldcommons", floors: 4, wide: 0.38 },
};

const DISTRICTS = {
  ashcourt: {
    pal: "ashcourt",
    seed: 51,
    extras: (w, h, p) =>
      `<rect x="${w * 0.55}" y="${h * 0.25}" width="${w * 0.28}" height="${h * 0.4}" fill="#101820" stroke="${p.glow}" stroke-width="2" opacity="0.85"/>
       <rect x="${w * 0.66}" y="${h * 0.35}" width="18" height="5" fill="${p.accent}" opacity="0.55"/>
       <rect x="${w * 0.695}" y="${h * 0.32}" width="5" height="18" fill="${p.accent}" opacity="0.55"/>`,
  },
  spireyard: {
    pal: "spireyard",
    seed: 52,
    extras: (w, h, p) =>
      `<polygon points="${w * 0.62},${h * 0.15} ${w * 0.72},${h * 0.55} ${w * 0.52},${h * 0.55}" fill="#0c0814" stroke="${p.glow}" stroke-width="2" opacity="0.9"/>
       <rect x="${w * 0.58}" y="${h * 0.35}" width="8" height="12" fill="${p.warm}" opacity="0.45"/>`,
  },
  oldcommons: {
    pal: "oldcommons",
    seed: 53,
    extras: (w, h, p) =>
      `<rect x="${w * 0.15}" y="${h * 0.4}" width="${w * 0.25}" height="${h * 0.28}" fill="#140a0c" stroke="${p.accent}" stroke-width="1"/>
       <path d="M${w * 0.5} ${h * 0.55} Q${w * 0.7} ${h * 0.45} ${w * 0.9} ${h * 0.58}" fill="none" stroke="${p.glow}" stroke-width="2" opacity="0.35"/>`,
  },
};

const SAFEHOUSE_ROOMS = {
  vault: {
    pal: "safe",
    object: (w, h, p) =>
      `<rect x="${w * 0.35}" y="${h * 0.35}" width="90" height="110" rx="6" fill="#101218" stroke="${p.glow}" stroke-width="3"/>
       <circle cx="${w * 0.55}" cy="${h * 0.55}" r="18" fill="none" stroke="${p.accent}" stroke-width="3"/>`,
  },
  cot: {
    pal: "safe",
    object: (w, h, p) =>
      `<rect x="${w * 0.2}" y="${h * 0.55}" width="180" height="40" fill="#14161c" stroke="${p.accent}" stroke-width="2"/>
       <rect x="${w * 0.25}" y="${h * 0.48}" width="50" height="20" fill="#1a1c22"/>`,
  },
  study: {
    pal: "civic",
    object: (w, h, p) =>
      `<rect x="${w * 0.25}" y="${h * 0.55}" width="150" height="14" fill="#1a1c22"/>
       <rect x="${w * 0.45}" y="${h * 0.35}" width="40" height="50" fill="#12141a" stroke="${p.glow}" stroke-width="1"/>
       <circle cx="${w * 0.7}" cy="${h * 0.4}" r="20" fill="${p.warm}" opacity="0.25"/>`,
  },
  armory: {
    pal: "street",
    object: (w, h, p) =>
      `<rect x="${w * 0.3}" y="${h * 0.35}" width="120" height="100" fill="#121018" stroke="${p.accent}" stroke-width="2"/>
       <line x1="${w * 0.4}" y1="${h * 0.45}" x2="${w * 0.4}" y2="${h * 0.7}" stroke="${p.glow}" stroke-width="3"/>
       <line x1="${w * 0.55}" y1="${h * 0.45}" x2="${w * 0.55}" y2="${h * 0.7}" stroke="${p.warm}" stroke-width="3"/>
       <line x1="${w * 0.7}" y1="${h * 0.45}" x2="${w * 0.7}" y2="${h * 0.7}" stroke="${p.accent}" stroke-width="3"/>`,
  },
  garage: {
    pal: "millstone",
    object: (w, h, p) =>
      `<rect x="${w * 0.2}" y="${h * 0.35}" width="160" height="100" fill="#101218" stroke="${p.warm}" stroke-width="2"/>
       <rect x="${w * 0.35}" y="${h * 0.5}" width="90" height="35" fill="#14161c"/>
       <circle cx="${w * 0.4}" cy="${h * 0.75}" r="14" fill="#0a0a0c" stroke="${p.accent}" stroke-width="2"/>
       <circle cx="${w * 0.7}" cy="${h * 0.75}" r="14" fill="#0a0a0c" stroke="${p.accent}" stroke-width="2"/>`,
  },
};

function propertySvg(w, h, pal, meta) {
  const bw = w * meta.wide;
  const bx = (w - bw) / 2;
  const floorH = (h * 0.55) / meta.floors;
  const by = h * 0.25;
  let floors = "";
  for (let i = 0; i < meta.floors; i++) {
    const y = by + i * floorH;
    floors += `<rect x="${bx + 8}" y="${y + 6}" width="${bw - 16}" height="${floorH - 10}" fill="${meta.glass ? pal.glow : "#1a2030"}" opacity="${meta.glass ? 0.12 : 0.25}"/>`;
    if (!meta.glass) {
      for (let wx = bx + 14; wx < bx + bw - 20; wx += 18) {
        floors += `<rect x="${wx}" y="${y + 10}" width="8" height="10" fill="${(i + wx) % 5 === 0 ? pal.warm : "#0e1218"}" opacity="0.55"/>`;
      }
    }
  }
  return sceneSvg(w, h, pal, {
    seed: meta.floors * 7,
    ground: 0.78,
    rainOn: true,
    blobs: [
      [w * 0.2, h * 0.2, 100, pal.accent, 0.3],
      [w * 0.8, h * 0.25, 80, pal.glow, 0.25],
    ],
    extras: `<rect x="${bx}" y="${by}" width="${bw}" height="${h * 0.55}" fill="#0c0c10" stroke="${pal.accent}" stroke-width="2"/>
      ${floors}
      <rect x="${bx + bw * 0.4}" y="${by + h * 0.55 - 40}" width="${bw * 0.2}" height="40" fill="#08080c"/>`,
  });
}

async function main() {
  const results = [];
  const W = 1280;
  const H = 853;

  // Crimes
  for (const [id, meta] of Object.entries(CRIME_META)) {
    const pal = PAL[meta.pal];
    const fig = meta.figureAt
      ? [meta.figureAt[0] * W, meta.figureAt[1] * H, meta.figureAt[2] ?? 1.2]
      : null;
    const extraFn = CRIME_EXTRAS[id];
    const svg = sceneSvg(W, H, pal, {
      seed: meta.seed,
      ground: meta.ground ?? 0.72,
      figureAt: fig,
      blobs: [
        [W * 0.25, H * 0.22, 120, pal.glow, 0.35],
        [W * 0.78, H * 0.3, 90, pal.accent, 0.28],
      ],
      extras: extraFn ? extraFn(W, H, pal) : "",
      labelHint: "",
    });
    results.push(await writeWebp(`crimes/${id}.webp`, svg, W, H));
  }

  // Jobs 1024
  for (const [id, meta] of Object.entries(JOBS)) {
    const pal = PAL[meta.pal];
    const svg = interiorSvg(1024, 1024, pal, {
      object: meta.object(1024, 1024, pal),
      seed: id.length,
    });
    results.push(await writeWebp(`jobs/${id}.webp`, svg, 1024, 1024));
  }

  // NPCs 640
  for (const [id, meta] of Object.entries(NPCS)) {
    const pal = PAL[meta.pal];
    const svg = portraitSvg(640, 640, pal, meta.kind);
    results.push(await writeWebp(`npcs/${id}.webp`, svg, 640, 640));
  }

  // Properties 1024
  for (const [id, meta] of Object.entries(PROPERTIES)) {
    const pal = PAL[meta.pal];
    const svg = propertySvg(1024, 1024, pal, meta);
    results.push(await writeWebp(`properties/${id}.webp`, svg, 1024, 1024));
  }

  // Districts 1280x853
  for (const [id, meta] of Object.entries(DISTRICTS)) {
    const pal = PAL[meta.pal];
    const svg = sceneSvg(W, H, pal, {
      seed: meta.seed,
      ground: 0.7,
      rainOn: true,
      blobs: [
        [W * 0.3, H * 0.2, 140, pal.glow, 0.4],
        [W * 0.75, H * 0.28, 100, pal.accent, 0.3],
      ],
      extras: meta.extras(W, H, pal),
    });
    results.push(await writeWebp(`districts/${id}.webp`, svg, W, H));
  }

  // Campus school banners + hero
  const CAMPUS = {
    hero: { pal: "civic", seed: 80 },
    street: { pal: "street", seed: 81 },
    commerce: { pal: "spireyard", seed: 82 },
    harbor: { pal: "docksreach", seed: 83 },
    med: { pal: "clinic", seed: 84 },
    locks: { pal: "millstone", seed: 85 },
  };
  for (const [id, meta] of Object.entries(CAMPUS)) {
    const pal = PAL[meta.pal];
    const svg = interiorSvg(W, H, pal, {
      shelves: id === "commerce" || id === "locks",
      window: id === "med" || id === "hero",
      seed: meta.seed,
      object:
        id === "med"
          ? `<rect x="${W * 0.35}" y="${H * 0.4}" width="90" height="50" fill="#121820" stroke="${pal.glow}" stroke-width="2"/>
             <rect x="${W * 0.48}" y="${H * 0.48}" width="18" height="5" fill="${pal.accent}" opacity="0.5"/>
             <rect x="${W * 0.52}" y="${H * 0.44}" width="5" height="18" fill="${pal.accent}" opacity="0.5"/>`
          : id === "locks"
            ? `<rect x="${W * 0.4}" y="${H * 0.38}" width="70" height="90" fill="#121018" stroke="${pal.accent}" stroke-width="2"/>
               <circle cx="${W * 0.55}" cy="${H * 0.55}" r="12" fill="none" stroke="${pal.glow}" stroke-width="3"/>`
            : id === "harbor"
              ? `<rect x="${W * 0.25}" y="${H * 0.45}" width="50" height="70" fill="#101820"/><rect x="${W * 0.45}" y="${H * 0.4}" width="50" height="75" fill="#12141a" stroke="${pal.glow}" stroke-width="1"/><rect x="${W * 0.65}" y="${H * 0.48}" width="50" height="65" fill="#0e1418"/>`
              : `<rect x="${W * 0.3}" y="${H * 0.45}" width="140" height="14" fill="#1a1c22"/><rect x="${W * 0.45}" y="${H * 0.32}" width="40" height="50" fill="#12141a" stroke="${pal.glow}" stroke-width="1"/>`,
    });
    results.push(await writeWebp(`campus/${id}.webp`, svg, W, H));
  }

  // New campus gigs
  for (const [id, palKey] of Object.entries({ clinic_aide: "clinic", locksmith_call: "millstone" })) {
    const pal = PAL[palKey];
    const svg = interiorSvg(1024, 1024, pal, {
      seed: id.length * 3,
      object:
        id === "clinic_aide"
          ? `<rect x="360" y="400" width="120" height="70" fill="#121820" stroke="${pal.glow}" stroke-width="2"/><rect x="410" y="425" width="20" height="6" fill="${pal.accent}" opacity="0.5"/><rect x="417" y="415" width="6" height="20" fill="${pal.accent}" opacity="0.5"/>`
          : `<rect x="380" y="360" width="80" height="110" fill="#121018" stroke="${pal.accent}" stroke-width="2"/><circle cx="440" cy="520" r="16" fill="none" stroke="${pal.glow}" stroke-width="3"/>`,
    });
    results.push(await writeWebp(`gigs/${id}.webp`, svg, 1024, 1024));
  }

  // Heist hero + per-board thumbs
  {
    const pal = PAL.heavy;
    const svg = sceneSvg(W, H, pal, {
      seed: 70,
      ground: 0.68,
      figureAt: [W * 0.4, H * 0.72, 1.3],
      blobs: [
        [W * 0.2, H * 0.2, 130, pal.glow, 0.35],
        [W * 0.8, H * 0.25, 110, PAL.street.accent, 0.3],
      ],
      extras: `<rect x="${W * 0.55}" y="${H * 0.35}" width="140" height="90" fill="#101218" stroke="${pal.accent}" stroke-width="2" opacity="0.85"/>
        <rect x="${W * 0.6}" y="${H * 0.42}" width="80" height="8" fill="${pal.glow}" opacity="0.3"/>
        <rect x="${W * 0.6}" y="${H * 0.52}" width="55" height="8" fill="${pal.glow}" opacity="0.2"/>`,
    });
    results.push(await writeWebp("heists/hero.webp", svg, W, H));
  }

  const heistBoards = {
    tram_skim: "glassrow",
    yard_boost: "millstone",
    commons_sweep: "oldcommons",
    bay_pierce: "docksreach",
    ward_diversion: "ashcourt",
    spire_float: "spireyard",
    soft_house_run: "docksreach",
    bond_desk: "spireyard",
    neon_till: "glassrow",
    gallery_wire: "glassrow",
    loft_mail: "glassrow",
    pallet_ghost: "millstone",
    substation_siphon: "millstone",
    chop_lane: "millstone",
    crane_blind: "docksreach",
    cold_chain: "docksreach",
    ambulance_divert: "ashcourt",
    evidence_soft: "ashcourt",
    clinic_ledger: "ashcourt",
    courier_swap: "spireyard",
    penthouse_skim: "spireyard",
    stoop_tax: "oldcommons",
    race_bag: "oldcommons",
    alley_stash: "oldcommons",
  };
  for (const [id, dist] of Object.entries(heistBoards)) {
    const pal = PAL[dist];
    const svg = sceneSvg(W, H, pal, {
      seed: id.length * 9,
      ground: 0.7,
      blobs: [
        [W * 0.25, H * 0.22, 110, pal.glow, 0.35],
        [W * 0.75, H * 0.3, 90, pal.accent, 0.28],
      ],
      extras: `<rect x="${W * 0.38}" y="${H * 0.4}" width="100" height="70" fill="#101218" stroke="${pal.accent}" stroke-width="2"/>
        <circle cx="${W * 0.55}" cy="${H * 0.55}" r="10" fill="${pal.glow}" opacity="0.35"/>`,
      figureAt: [W * 0.3, H * 0.72, 1.1],
    });
    results.push(await writeWebp(`heists/${id}.webp`, svg, W, H));
  }

  // Safehouse hero + rooms
  {
    const pal = PAL.safe;
    const svg = interiorSvg(W, H, pal, {
      shelves: true,
      window: true,
      object: `<rect x="${W * 0.15}" y="${H * 0.5}" width="200" height="80" fill="#12141a" stroke="${pal.accent}" stroke-width="2"/>
        <rect x="${W * 0.55}" y="${H * 0.45}" width="70" height="90" fill="#101218" stroke="${pal.glow}" stroke-width="2"/>`,
      seed: 8,
    });
    results.push(await writeWebp("safehouse/hero.webp", svg, W, H));
  }
  for (const [id, meta] of Object.entries(SAFEHOUSE_ROOMS)) {
    const pal = PAL[meta.pal];
    const svg = interiorSvg(1024, 1024, pal, {
      shelves: id === "vault" || id === "study",
      window: id === "cot" || id === "study",
      object: meta.object(1024, 1024, pal),
      seed: id.length,
    });
    results.push(await writeWebp(`safehouse/${id}.webp`, svg, 1024, 1024));
  }

  // Contact portraits 640
  const CONTACT_PORTRAITS = {
    reed: { pal: "glassrow", kind: "civilian" },
    mara: { pal: "civic", kind: "exec" },
    kilo: { pal: "docksreach", kind: "runner" },
    ivy: { pal: "millstone", kind: "civilian" },
    nix: { pal: "street", kind: "thug" },
    soot: { pal: "millstone", kind: "guard" },
    wren: { pal: "oldcommons", kind: "thug" },
    calder: { pal: "clinic", kind: "civilian" },
    quill: { pal: "spireyard", kind: "exec" },
    joss: { pal: "glassrow", kind: "runner" },
    haze: { pal: "docksreach", kind: "civilian" },
    pike: { pal: "oldcommons", kind: "guard" },
    vex: { pal: "street", kind: "thug" },
  };
  for (const [id, meta] of Object.entries(CONTACT_PORTRAITS)) {
    const pal = PAL[meta.pal];
    const svg = portraitSvg(640, 640, pal, meta.kind);
    results.push(await writeWebp(`contacts/${id}.webp`, svg, 640, 640));
  }

  // Lore heroes
  {
    const pal = PAL.civic;
    const svg = interiorSvg(W, H, pal, {
      shelves: true,
      window: true,
      object: `<rect x="${W * 0.2}" y="${H * 0.35}" width="90" height="120" fill="#12141a" stroke="${pal.accent}" stroke-width="2"/>
        <rect x="${W * 0.38}" y="${H * 0.4}" width="90" height="110" fill="#101218" stroke="${pal.glow}" stroke-width="2"/>
        <rect x="${W * 0.56}" y="${H * 0.38}" width="90" height="115" fill="#14161c" stroke="${pal.accent}" stroke-width="2"/>`,
      seed: 21,
    });
    results.push(await writeWebp("codex/hero.webp", svg, W, H));
  }
  {
    const pal = PAL.glassrow;
    const svg = sceneSvg(W, H, pal, {
      seed: 44,
      ground: 0.68,
      rainOn: true,
      figureAt: [W * 0.28, H * 0.72, 1.15],
      blobs: [
        [W * 0.22, H * 0.2, 120, pal.glow, 0.35],
        [W * 0.78, H * 0.28, 100, pal.warm, 0.28],
      ],
      extras: `<rect x="${W * 0.48}" y="${H * 0.32}" width="160" height="110" fill="#0e1014" stroke="${pal.accent}" stroke-width="2"/>
        <rect x="${W * 0.52}" y="${H * 0.4}" width="120" height="6" fill="${pal.glow}" opacity="0.35"/>
        <rect x="${W * 0.52}" y="${H * 0.5}" width="90" height="6" fill="${pal.glow}" opacity="0.25"/>
        <rect x="${W * 0.52}" y="${H * 0.6}" width="70" height="6" fill="${pal.glow}" opacity="0.2"/>`,
    });
    results.push(await writeWebp("newspaper/hero.webp", svg, W, H));
  }
  {
    const pal = PAL.spireyard;
    const svg = sceneSvg(W, H, pal, {
      seed: 55,
      ground: 0.7,
      blobs: [
        [W * 0.3, H * 0.22, 110, pal.glow, 0.35],
        [W * 0.7, H * 0.3, 90, pal.accent, 0.28],
      ],
      extras: `<line x1="${W * 0.2}" y1="${H * 0.35}" x2="${W * 0.2}" y2="${H * 0.75}" stroke="${pal.accent}" stroke-width="2"/>
        <circle cx="${W * 0.2}" cy="${H * 0.4}" r="6" fill="${pal.glow}" opacity="0.5"/>
        <circle cx="${W * 0.2}" cy="${H * 0.55}" r="6" fill="${pal.glow}" opacity="0.4"/>
        <circle cx="${W * 0.2}" cy="${H * 0.7}" r="6" fill="${pal.glow}" opacity="0.35"/>
        <rect x="${W * 0.28}" y="${H * 0.37}" width="140" height="10" fill="#12141a" stroke="${pal.accent}" stroke-width="1"/>
        <rect x="${W * 0.28}" y="${H * 0.52}" width="180" height="10" fill="#12141a" stroke="${pal.accent}" stroke-width="1"/>
        <rect x="${W * 0.28}" y="${H * 0.67}" width="110" height="10" fill="#12141a" stroke="${pal.accent}" stroke-width="1"/>`,
    });
    results.push(await writeWebp("timeline/hero.webp", svg, W, H));
  }

  const made = results.filter((r) => !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  console.log(
    JSON.stringify(
      {
        generated: made.length,
        skipped: skipped.length,
        totalBytes: made.reduce((a, r) => a + (r.bytes || 0), 0),
        files: made.map((r) => r.rel),
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
