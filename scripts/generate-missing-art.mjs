/**
 * Generate missing Nightwire atmospheric WebP art (original noir look — no Torn assets).
 * Uses sharp + SVG composites. Skips files that already exist unless --force.
 * AI-protected paths (npcs/, contacts/, campus/, courses/, business/, factions/,
 * raceway/, bounties/, leisure/, crimes/, heists/, districts/, properties/,
 * safehouse/, city/, jobs/) are never overwritten by SVG recipes — even with --force.
 *
 * Usage: node scripts/generate-missing-art.mjs [--force]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/art");
const FORCE = process.argv.includes("--force");

/**
 * AI photoreal plates — never overwrite with procedural SVG portraits/scenes,
 * even when --force is passed. Regenerate these via GenerateImage + sharp convert.
 */
const AI_PROTECTED_PREFIXES = [
  "npcs/",
  "contacts/",
  "campus/",
  "courses/",
  "business/",
  "factions/",
  "raceway/",
  "bounties/",
  "leisure/",
  // Photoreal plates — never wipe back to SVG with --force
  "crimes/",
  "heists/",
  "districts/",
  "properties/",
  "safehouse/",
  "city/",
  "jobs/",
];

function isAiProtected(rel) {
  const norm = rel.replace(/\\/g, "/");
  return AI_PROTECTED_PREFIXES.some((p) => {
    if (p.endsWith("/")) return norm.startsWith(p) || norm === p.slice(0, -1);
    return norm === p || norm.startsWith(p + "/");
  });
}

async function writeWebp(rel, svg, width, height) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (isAiProtected(rel)) {
    return { rel, skipped: true, protected: true };
  }
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

function skyline(w, h, groundY, color = "#050508", seed = 1, density = 1) {
  const buildings = [];
  let x = -10;
  let i = 0;
  const maxH = Math.floor(h * (0.28 + (seed % 5) * 0.04));
  while (x < w + 40) {
    const bw = 18 + ((seed * 17 + i * 31) % Math.floor(40 + density * 30));
    const bh = 40 + ((seed * 13 + i * 47) % maxH);
    const taper = (seed + i) % 4 === 0;
    if (taper) {
      buildings.push(
        `<polygon points="${x},${groundY} ${x + bw * 0.15},${groundY - bh} ${x + bw * 0.85},${groundY - bh} ${x + bw},${groundY}" fill="${color}"/>`
      );
    } else {
      buildings.push(`<rect x="${x}" y="${groundY - bh}" width="${bw}" height="${bh}" fill="${color}"/>`);
      if ((seed + i) % 3 === 0) {
        buildings.push(
          `<rect x="${x + 4}" y="${groundY - bh - 14}" width="${bw * 0.35}" height="14" fill="${color}" opacity="0.9"/>`
        );
      }
    }
    for (let wy = groundY - bh + 8; wy < groundY - 10; wy += 12 + (i % 3) * 2) {
      for (let wx = x + 5; wx < x + bw - 6; wx += 9 + (seed % 3)) {
        if ((wx + wy + i) % 3 !== 0) continue;
        const lit = (seed + i + wx) % 5 === 0;
        buildings.push(
          `<rect x="${wx}" y="${wy}" width="3" height="4" fill="${lit ? "#c9a060" : "#1a2030"}" opacity="${lit ? 0.7 : 0.35}"/>`
        );
      }
    }
    x += bw + 3 + (i % 4) * density;
    i++;
  }
  return buildings.join("");
}

/** Distant low silhouettes only — for yard / pier / closeup variety */
function distantRidge(w, groundY, color = "#050508", seed = 1) {
  let d = "";
  let x = 0;
  let i = 0;
  while (x < w) {
    const bw = 50 + ((seed * 11 + i * 29) % 80);
    const bh = 18 + ((seed + i * 17) % 35);
    d += `<rect x="${x}" y="${groundY - bh}" width="${bw}" height="${bh}" fill="${color}" opacity="0.7"/>`;
    x += bw + 8;
    i++;
  }
  return d;
}

function alleyWalls(w, h, pal, seed = 1) {
  const leftW = 90 + (seed % 40);
  const rightW = 70 + ((seed * 3) % 50);
  return `
    <polygon points="0,0 ${leftW},0 ${leftW * 0.55},${h} 0,${h}" fill="#0a0a0e"/>
    <polygon points="${w},0 ${w - rightW},0 ${w - rightW * 0.5},${h} ${w},${h}" fill="#08080c"/>
    <line x1="${leftW * 0.7}" y1="0" x2="${leftW * 0.4}" y2="${h}" stroke="${pal.accent}" stroke-opacity="0.15" stroke-width="2"/>
    <rect x="${w * 0.42}" y="${h * 0.2}" width="18" height="28" fill="${pal.glow}" opacity="0.12"/>
  `;
}

function pierWater(w, h, gy, pal) {
  return `
    <rect x="0" y="${gy}" width="${w}" height="${h - gy}" fill="#060e14"/>
    <path d="M0 ${gy + 8} Q${w * 0.25} ${gy - 6} ${w * 0.5} ${gy + 10} T${w} ${gy + 4}" fill="none" stroke="${pal.glow}" stroke-opacity="0.25" stroke-width="2"/>
    <path d="M0 ${gy + 22} Q${w * 0.3} ${gy + 12} ${w * 0.6} ${gy + 24} T${w} ${gy + 18}" fill="none" stroke="${pal.accent}" stroke-opacity="0.18" stroke-width="2"/>
    <rect x="0" y="${gy - 10}" width="${w}" height="12" fill="#121820" opacity="0.85"/>
  `;
}

function interiorShell(w, h, pal, opts = {}) {
  const { beams = true, backWall = 0.35 } = opts;
  return `
    <rect width="${w}" height="${h}" fill="${pal.deep}"/>
    <rect x="0" y="0" width="${w}" height="${h * backWall}" fill="${pal.mid}" opacity="0.55"/>
    <polygon points="0,0 0,${h * 0.55} ${w * 0.12},${h * 0.35}" fill="#060608" opacity="0.5"/>
    <polygon points="${w},0 ${w},${h * 0.55} ${w * 0.88},${h * 0.35}" fill="#060608" opacity="0.5"/>
    ${
      beams
        ? `<line x1="0" y1="${h * 0.18}" x2="${w}" y2="${h * 0.14}" stroke="${pal.accent}" stroke-opacity="0.2" stroke-width="3"/>
           <line x1="0" y1="${h * 0.28}" x2="${w}" y2="${h * 0.24}" stroke="${pal.accent}" stroke-opacity="0.12" stroke-width="2"/>`
        : ""
    }
    <rect x="0" y="${h * 0.72}" width="${w}" height="${h * 0.28}" fill="#050508"/>
    <rect x="0" y="${h * 0.72}" width="${w}" height="3" fill="${pal.accent}" opacity="0.3"/>
  `;
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

function sceneSvg(w, h, pal, opts = {}) {
  const {
    layout = "street", // street | alley | pier | interior | closeup | yard | corridor | counter
    ground = 0.72,
    blobs = [],
    extras = "",
    figureAt = null,
    seed = 3,
    rainOn = true,
    labelHint = "",
    density = 1,
  } = opts;
  const gy = Math.floor(h * ground);

  let backdrop = "";
  if (layout === "interior" || layout === "counter" || layout === "corridor") {
    backdrop = interiorShell(w, h, pal, { beams: layout !== "corridor", backWall: layout === "corridor" ? 0.5 : 0.32 });
    if (layout === "corridor") {
      backdrop += `
        <polygon points="${w * 0.28},${h * 0.2} ${w * 0.72},${h * 0.2} ${w * 0.9},${h * 0.72} ${w * 0.1},${h * 0.72}" fill="#0a0c10" opacity="0.9"/>
        <rect x="${w * 0.44}" y="${h * 0.28}" width="${w * 0.12}" height="${h * 0.32}" fill="#12141a" stroke="${pal.accent}" stroke-width="1" opacity="0.7"/>
        <line x1="${w * 0.5}" y1="${h * 0.2}" x2="${w * 0.5}" y2="${h * 0.72}" stroke="${pal.glow}" stroke-opacity="0.12"/>`;
    }
    if (layout === "counter") {
      backdrop += `
        <rect x="0" y="${h * 0.52}" width="${w}" height="${h * 0.12}" fill="#14161c"/>
        <rect x="0" y="${h * 0.52}" width="${w}" height="4" fill="${pal.accent}" opacity="0.35"/>
        <rect x="${w * 0.08}" y="${h * 0.22}" width="${w * 0.35}" height="${h * 0.28}" fill="#101218" opacity="0.8"/>`;
    }
  } else if (layout === "alley") {
    backdrop = `
      <rect width="${w}" height="${h}" fill="url(#sky)"/>
      ${distantRidge(w, gy, "#050508", seed)}
      ${alleyWalls(w, h, pal, seed)}
      <rect x="0" y="${gy}" width="${w}" height="${h - gy}" fill="#08080a"/>
      <rect x="0" y="${gy - 2}" width="${w}" height="3" fill="${pal.accent}" opacity="0.2"/>`;
  } else if (layout === "pier") {
    backdrop = `
      <rect width="${w}" height="${h}" fill="url(#sky)"/>
      ${distantRidge(w, Math.floor(h * 0.45), "#050508", seed + 2)}
      ${pierWater(w, h, gy, pal)}
      <rect x="${w * 0.72}" y="${h * 0.08}" width="10" height="${gy - h * 0.08}" fill="#12141a"/>
      <rect x="${w * 0.55}" y="${h * 0.12}" width="${w * 0.35}" height="8" fill="#1a2030" opacity="0.8"/>
      <line x1="${w * 0.77}" y1="${h * 0.12}" x2="${w * 0.9}" y2="${h * 0.35}" stroke="${pal.glow}" stroke-width="3" opacity="0.35"/>`;
  } else if (layout === "yard") {
    backdrop = `
      <rect width="${w}" height="${h}" fill="url(#sky)"/>
      ${distantRidge(w, Math.floor(h * 0.5), "#050508", seed)}
      <rect x="0" y="${gy}" width="${w}" height="${h - gy}" fill="#0a0a0c"/>
      <rect x="0" y="${gy - 2}" width="${w}" height="3" fill="${pal.warm}" opacity="0.25"/>
      <line x1="0" y1="${h * 0.55}" x2="${w}" y2="${h * 0.55}" stroke="${pal.accent}" stroke-opacity="0.2" stroke-width="2" stroke-dasharray="10 8"/>
      <line x1="0" y1="${h * 0.55}" x2="${w}" y2="${h * 0.55}" stroke="${pal.accent}" stroke-opacity="0.12" stroke-width="14"/>`;
  } else if (layout === "closeup") {
    backdrop = `
      <rect width="${w}" height="${h}" fill="url(#sky)"/>
      <rect x="0" y="${gy}" width="${w}" height="${h - gy}" fill="#08080a" opacity="0.9"/>`;
  } else {
    // street — full skyline but varied density
    backdrop = `
      <rect width="${w}" height="${h}" fill="url(#sky)"/>
      ${skyline(w, h, gy, "#050508", seed, density)}
      <rect x="0" y="${gy}" width="${w}" height="${h - gy}" fill="#08080a"/>
      <rect x="0" y="${gy - 2}" width="${w}" height="3" fill="${pal.accent}" opacity="0.25"/>`;
  }

  const useSkyGrad = !["interior", "counter", "corridor"].includes(layout);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${noiseFilter("grain")}
    <filter id="blur"><feGaussianBlur stdDeviation="28"/></filter>
    <linearGradient id="sky" x1="0" y1="0" x2="${layout === 'alley' ? 0 : 1}" y2="1">
      <stop offset="0%" stop-color="${pal.deep}"/>
      <stop offset="45%" stop-color="${pal.mid}"/>
      <stop offset="100%" stop-color="${pal.deep}"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.85"/>
    </linearGradient>
  </defs>
  ${useSkyGrad ? "" : ""}
  ${backdrop}
  ${blobs.map(([x, y, r, c, o]) => neonBlob(x, y, r, c || pal.glow, o ?? 0.4)).join("")}
  ${extras}
  ${figureAt ? figure(figureAt[0], figureAt[1], figureAt[2] ?? 1.2, "#08080c", pal.glow) : ""}
  ${rainOn && layout !== "interior" && layout !== "counter" ? rain(w, h) : ""}
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

/** @deprecated Circle-head silhouette — DO NOT use for live NPC/contact art.
 * Live portraits are AI photoreal under public/art/npcs and contacts (AI-protected).
 * Kept only so legacy recipe loops can no-op via isAiProtected. */
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

/** Crime-specific extra SVG fragments (no readable words) — unique subject per crime */
const CRIME_EXTRAS = {
  shoplift: (w, h, p) =>
    `<rect x="${w * 0.55}" y="${h * 0.28}" width="${w * 0.32}" height="${h * 0.5}" fill="#12141a" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.58}" y="${h * 0.35}" width="${w * 0.1}" height="40" fill="${p.glow}" opacity="0.2"/>
     <rect x="${w * 0.72}" y="${h * 0.42}" width="${w * 0.1}" height="50" fill="${p.warm}" opacity="0.18"/>
     <rect x="${w * 0.2}" y="${h * 0.55}" width="70" height="45" fill="#1a1410" opacity="0.85"/>`,
  pickpocket: (w, h, p) =>
    `<rect x="${w * 0.15}" y="${h * 0.35}" width="${w * 0.7}" height="18" fill="#1a2030" opacity="0.7"/>
     <circle cx="${w * 0.35}" cy="${h * 0.55}" r="8" fill="none" stroke="${p.glow}" stroke-width="2"/>
     <path d="M${w * 0.55} ${h * 0.48} Q${w * 0.62} ${h * 0.42} ${w * 0.68} ${h * 0.5}" fill="none" stroke="${p.accent}" stroke-width="2"/>`,
  bicycle: (w, h, p) =>
    `<circle cx="${w * 0.38}" cy="${h * 0.62}" r="32" fill="none" stroke="${p.accent}" stroke-width="4"/>
     <circle cx="${w * 0.62}" cy="${h * 0.62}" r="32" fill="none" stroke="${p.accent}" stroke-width="4"/>
     <line x1="${w * 0.38}" y1="${h * 0.62}" x2="${w * 0.55}" y2="${h * 0.42}" stroke="${p.glow}" stroke-width="3"/>
     <line x1="${w * 0.62}" y1="${h * 0.62}" x2="${w * 0.55}" y2="${h * 0.42}" stroke="${p.glow}" stroke-width="3"/>
     <rect x="${w * 0.2}" y="${h * 0.35}" width="14" height="90" fill="#1a1c20"/>`,
  parking_meter: (w, h, p) =>
    `<rect x="${w * 0.42}" y="${h * 0.38}" width="28" height="90" rx="4" fill="#1a1c20" stroke="${p.accent}" stroke-width="2"/>
     <circle cx="${w * 0.455}" cy="${h * 0.48}" r="14" fill="#0e1014" stroke="${p.glow}" stroke-width="2"/>`,
  fake_charity: (w, h, p) =>
    `<ellipse cx="${w * 0.5}" cy="${h * 0.62}" rx="36" ry="14" fill="#12141a" stroke="${p.warm}" stroke-width="2"/>
     <rect x="${w * 0.47}" y="${h * 0.48}" width="24" height="28" fill="#181a22"/>`,
  vending: (w, h, p) =>
    `<rect x="${w * 0.35}" y="${h * 0.22}" width="110" height="180" rx="6" fill="#101810" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.4}" y="${h * 0.3}" width="80" height="50" fill="${p.glow}" opacity="0.15"/>
     <circle cx="${w * 0.55}" cy="${h * 0.55}" r="10" fill="${p.warm}" opacity="0.4"/>
     <rect x="${w * 0.42}" y="${h * 0.65}" width="60" height="8" fill="${p.accent}" opacity="0.3"/>`,
  delivery_package: (w, h, p) =>
    `<rect x="${w * 0.38}" y="${h * 0.55}" width="70" height="50" fill="#1a1410" stroke="${p.warm}" stroke-width="2"/>
     <line x1="${w * 0.38}" y1="${h * 0.62}" x2="${w * 0.38 + 70}" y2="${h * 0.62}" stroke="${p.accent}" opacity="0.5"/>
     <rect x="${w * 0.55}" y="${h * 0.35}" width="50" height="70" fill="#14161c" opacity="0.6"/>`,
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
     <rect x="${w * 0.55}" y="${h * 0.48}" width="22" height="38" rx="3" fill="#0e1014" stroke="${p.glow}" stroke-width="1.5"/>
     <ellipse cx="${w * 0.35}" cy="${h * 0.48}" rx="28" ry="10" fill="${p.warm}" opacity="0.2"/>`,
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
  mug: (w, h, p) =>
    `<rect x="${w * 0.15}" y="${h * 0.2}" width="${w * 0.2}" height="${h * 0.55}" fill="#0a080c" opacity="0.9"/>
     <rect x="${w * 0.7}" y="${h * 0.15}" width="${w * 0.25}" height="${h * 0.6}" fill="#0c0a0e" opacity="0.85"/>
     <circle cx="${w * 0.55}" cy="${h * 0.4}" r="16" fill="${p.accent}" opacity="0.15"/>`,
  car_breakin: (w, h, p) =>
    `<ellipse cx="${w * 0.5}" cy="${h * 0.58}" rx="110" ry="35" fill="#12141a"/>
     <rect x="${w * 0.28}" y="${h * 0.4}" width="140" height="45" rx="8" fill="#1a2030" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.55}" y="${h * 0.44}" width="40" height="28" fill="${p.glow}" opacity="0.2"/>
     <circle cx="${w * 0.32}" cy="${h * 0.68}" r="16" fill="#0a0a0c" stroke="${p.warm}" stroke-width="2"/>
     <circle cx="${w * 0.68}" cy="${h * 0.68}" r="16" fill="#0a0a0c" stroke="${p.warm}" stroke-width="2"/>`,
  warehouse: (w, h, p) =>
    `<rect x="${w * 0.15}" y="${h * 0.35}" width="70" height="100" fill="#12141a"/>
     <rect x="${w * 0.4}" y="${h * 0.3}" width="70" height="105" fill="#14161c" stroke="${p.accent}" stroke-width="1"/>
     <rect x="${w * 0.65}" y="${h * 0.4}" width="70" height="95" fill="#101218"/>
     <rect x="${w * 0.45}" y="${h * 0.5}" width="30" height="20" fill="${p.glow}" opacity="0.2"/>`,
  courier_hijack: (w, h, p) =>
    `<ellipse cx="${w * 0.55}" cy="${h * 0.68}" rx="55" ry="12" fill="#0a0a0c"/>
     <circle cx="${w * 0.42}" cy="${h * 0.66}" r="22" fill="none" stroke="${p.accent}" stroke-width="3"/>
     <circle cx="${w * 0.68}" cy="${h * 0.66}" r="22" fill="none" stroke="${p.accent}" stroke-width="3"/>`,
  pharmacy: (w, h, p) =>
    `<rect x="${w * 0.3}" y="${h * 0.3}" width="140" height="100" fill="#101820" stroke="${p.glow}" stroke-width="2"/>
     <rect x="${w * 0.48}" y="${h * 0.42}" width="20" height="6" fill="${p.accent}" opacity="0.55"/>
     <rect x="${w * 0.525}" y="${h * 0.38}" width="6" height="20" fill="${p.accent}" opacity="0.55"/>
     <rect x="${w * 0.35}" y="${h * 0.55}" width="100" height="12" fill="#1a1c22"/>`,
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
  armored: (w, h, p) =>
    `<rect x="${w * 0.2}" y="${h * 0.35}" width="${w * 0.6}" height="${h * 0.35}" fill="#14161c" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.35}" y="${h * 0.42}" width="80" height="50" fill="#1a1c24" stroke="${p.glow}" stroke-width="2"/>
     <circle cx="${w * 0.3}" cy="${h * 0.55}" r="12" fill="#0a0a0c"/>
     <circle cx="${w * 0.7}" cy="${h * 0.55}" r="12" fill="#0a0a0c"/>`,
  casino_cage: (w, h, p) =>
    `<rect x="${w * 0.25}" y="${h * 0.3}" width="${w * 0.5}" height="${h * 0.4}" fill="#1a1408" stroke="${p.glow}" stroke-width="3"/>
     <line x1="${w * 0.35}" y1="${h * 0.3}" x2="${w * 0.35}" y2="${h * 0.7}" stroke="${p.warm}" stroke-width="2" opacity="0.4"/>
     <line x1="${w * 0.5}" y1="${h * 0.3}" x2="${w * 0.5}" y2="${h * 0.7}" stroke="${p.warm}" stroke-width="2" opacity="0.4"/>
     <line x1="${w * 0.65}" y1="${h * 0.3}" x2="${w * 0.65}" y2="${h * 0.7}" stroke="${p.warm}" stroke-width="2" opacity="0.4"/>
     <circle cx="${w * 0.45}" cy="${h * 0.55}" r="10" fill="${p.accent}" opacity="0.45"/>`,
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
  harbor: (w, h, p) =>
    `<rect x="${w * 0.18}" y="${h * 0.35}" width="90" height="110" fill="#12181e" stroke="${p.accent}" stroke-width="2"/>
     <rect x="${w * 0.4}" y="${h * 0.28}" width="90" height="117" fill="#101820" stroke="${p.glow}" stroke-width="2"/>
     <rect x="${w * 0.62}" y="${h * 0.4}" width="90" height="105" fill="#0e1418" stroke="${p.warm}" stroke-width="2"/>
     <line x1="${w * 0.18}" y1="${h * 0.55}" x2="${w * 0.72}" y2="${h * 0.55}" stroke="${p.glow}" opacity="0.3"/>`,
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
  courier: (w, h, p) =>
    `<rect x="${w * 0.35}" y="${h * 0.4}" width="80" height="55" fill="#141018" stroke="${p.glow}" stroke-width="2"/>
     <rect x="${w * 0.42}" y="${h * 0.48}" width="40" height="8" fill="${p.accent}" opacity="0.35"/>
     <path d="M${w * 0.2} ${h * 0.7} Q${w * 0.5} ${h * 0.55} ${w * 0.85} ${h * 0.68}" fill="none" stroke="${p.warm}" stroke-width="3" opacity="0.4"/>`,
};

const CRIME_META = {
  shoplift: { pal: "glassrow", seed: 1, layout: "counter", ground: 0.78 },
  pickpocket: { pal: "petty", seed: 2, layout: "street", figureAt: [0.55, 0.72, 1.1], density: 1.2 },
  bicycle: { pal: "millstone", seed: 3, layout: "street", ground: 0.7 },
  parking_meter: { pal: "petty", seed: 11, layout: "street", ground: 0.7 },
  fake_charity: { pal: "glassrow", seed: 12, layout: "street", figureAt: [0.48, 0.72, 1.1] },
  vending: { pal: "millstone", seed: 4, layout: "corridor", rainOn: false },
  delivery_package: { pal: "oldcommons", seed: 13, layout: "street" },
  basic_lock: { pal: "millstone", seed: 14, layout: "closeup", rainOn: false },
  street_sign: { pal: "millstone", seed: 15, layout: "street", density: 0.7 },
  short_change: { pal: "glassrow", seed: 16, layout: "counter" },
  cafe_phone: { pal: "spireyard", seed: 17, layout: "interior", rainOn: false },
  coinop_scam: { pal: "glassrow", seed: 18, layout: "closeup", rainOn: false },
  laundry_pouch: { pal: "ashcourt", seed: 19, layout: "alley" },
  bus_pass: { pal: "ashcourt", seed: 20, layout: "closeup", rainOn: false },
  atm_surf: { pal: "spireyard", seed: 21, layout: "street", density: 1.4 },
  construction_skip: { pal: "millstone", seed: 22, layout: "yard" },
  mug: { pal: "street", seed: 5, layout: "alley", figureAt: [0.5, 0.72, 1.25] },
  car_breakin: { pal: "street", seed: 6, layout: "street", ground: 0.68 },
  warehouse: { pal: "millstone", seed: 7, layout: "interior", rainOn: false },
  courier_hijack: { pal: "street", seed: 23, layout: "street", figureAt: [0.35, 0.7, 1] },
  pharmacy: { pal: "clinic", seed: 8, layout: "interior", rainOn: false },
  race_skim: { pal: "oldcommons", seed: 24, layout: "street", ground: 0.68 },
  advanced_lock: { pal: "spireyard", seed: 25, layout: "closeup", rainOn: false },
  catalytic: { pal: "millstone", seed: 26, layout: "closeup", ground: 0.75 },
  badge_clone: { pal: "ashcourt", seed: 27, layout: "closeup", rainOn: false },
  drop_swap: { pal: "docksreach", seed: 28, layout: "pier", ground: 0.7 },
  arson_scout: { pal: "street", seed: 29, layout: "alley" },
  food_truck: { pal: "oldcommons", seed: 30, layout: "street" },
  jewel_case: { pal: "glassrow", seed: 31, layout: "closeup", rainOn: false },
  meter_maid: { pal: "ashcourt", seed: 32, layout: "street", figureAt: [0.6, 0.72, 1] },
  dock_pierce: { pal: "docksreach", seed: 33, layout: "pier", ground: 0.68 },
  hotel_safe: { pal: "spireyard", seed: 34, layout: "interior", rainOn: false },
  armored: { pal: "heavy", seed: 9, layout: "street", density: 1.5 },
  casino_cage: { pal: "casino", seed: 10, layout: "interior", rainOn: false },
  evidence_room: { pal: "ashcourt", seed: 35, layout: "corridor", rainOn: false },
  private_vault: { pal: "spireyard", seed: 36, layout: "closeup", rainOn: false },
  evidence_swap: { pal: "ashcourt", seed: 37, layout: "interior", rainOn: false },
  harbor: { pal: "docksreach", seed: 47, layout: "pier", ground: 0.65 },
  museum: { pal: "heavy", seed: 38, layout: "interior", rainOn: false },
  gang_stash: { pal: "oldcommons", seed: 39, layout: "alley" },
  chop_shop: { pal: "millstone", seed: 40, layout: "yard" },
  bond_fraud: { pal: "civic", seed: 41, layout: "interior", rainOn: false },
  substation_copper: { pal: "millstone", seed: 42, layout: "yard" },
  hospital_vault: { pal: "clinic", seed: 43, layout: "corridor", rainOn: false },
  airport_cargo: { pal: "docksreach", seed: 44, layout: "yard" },
  aide_blackmail: { pal: "civic", seed: 45, layout: "interior", rainOn: false },
  train_arms: { pal: "heavy", seed: 46, layout: "yard" },
  courier: { pal: "spireyard", seed: 48, layout: "street", figureAt: [0.4, 0.72, 1.15] },
};

/** Per-job-id recipes — unique layout + subject per rank (not career palette only) */
const JOBS = {
  retail_1: {
    pal: "glassrow",
    layout: "counter",
    seed: 101,
    object: (w, h, p) =>
      `<rect x="${w * 0.55}" y="${h * 0.25}" width="${w * 0.35}" height="${h * 0.4}" fill="#12141a" stroke="${p.accent}" stroke-width="1"/>
       <rect x="${w * 0.2}" y="${h * 0.58}" width="90" height="35" fill="#1a1410" stroke="${p.warm}" stroke-width="1"/>
       <circle cx="${w * 0.35}" cy="${h * 0.65}" r="6" fill="${p.glow}" opacity="0.4"/>`,
  },
  retail_2: {
    pal: "glassrow",
    layout: "interior",
    seed: 102,
    object: (w, h, p) =>
      `<rect x="${w * 0.15}" y="${h * 0.3}" width="40" height="80" fill="#101218"/>
       <rect x="${w * 0.55}" y="${h * 0.28}" width="70" height="90" fill="#0e1014" stroke="${p.accent}" stroke-width="2"/>
       <rect x="${w * 0.35}" y="${h * 0.45}" width="50" height="60" fill="#14161c"/>
       <line x1="${w * 0.62}" y1="${h * 0.35}" x2="${w * 0.62}" y2="${h * 0.55}" stroke="${p.glow}" stroke-width="2" opacity="0.5"/>`,
  },
  retail_3: {
    pal: "glassrow",
    layout: "street",
    seed: 103,
    density: 1.4,
    figureAt: [0.35, 0.72, 1.1],
    object: (w, h, p) =>
      `<rect x="${w * 0.5}" y="${h * 0.35}" width="${w * 0.4}" height="${h * 0.35}" fill="#12141a" stroke="${p.glow}" stroke-width="2" opacity="0.85"/>
       <rect x="${w * 0.55}" y="${h * 0.42}" width="30" height="40" fill="${p.accent}" opacity="0.15"/>
       <rect x="${w * 0.7}" y="${h * 0.42}" width="30" height="40" fill="${p.warm}" opacity="0.12"/>`,
  },
  kitchen_1: {
    pal: "millstone",
    layout: "interior",
    seed: 111,
    object: (w, h, p) =>
      `<rect x="${w * 0.2}" y="${h * 0.45}" width="160" height="50" fill="#14161c" stroke="${p.warm}" stroke-width="2"/>
       <ellipse cx="${w * 0.35}" cy="${h * 0.55}" rx="28" ry="12" fill="#0a0c10" stroke="${p.accent}" stroke-width="2"/>
       <rect x="${w * 0.55}" y="${h * 0.5}" width="50" height="28" fill="#1a1810" opacity="0.8"/>`,
  },
  kitchen_2: {
    pal: "millstone",
    layout: "counter",
    seed: 112,
    object: (w, h, p) =>
      `<rect x="${w * 0.25}" y="${h * 0.4}" width="180" height="20" fill="#1a1c22"/>
       <path d="M${w * 0.4} ${h * 0.4} Q${w * 0.45} ${h * 0.28} ${w * 0.5} ${h * 0.4}" fill="${p.warm}" opacity="0.55"/>
       <path d="M${w * 0.52} ${h * 0.4} Q${w * 0.58} ${h * 0.25} ${w * 0.62} ${h * 0.4}" fill="${p.accent}" opacity="0.4"/>
       <rect x="${w * 0.7}" y="${h * 0.48}" width="40" height="50" fill="#12141a"/>`,
  },
  kitchen_3: {
    pal: "millstone",
    layout: "corridor",
    seed: 113,
    object: (w, h, p) =>
      `<rect x="${w * 0.62}" y="${h * 0.3}" width="80" height="110" fill="#101218" stroke="${p.glow}" stroke-width="2"/>
       <rect x="${w * 0.2}" y="${h * 0.55}" width="70" height="40" fill="#14161c" stroke="${p.warm}" stroke-width="1"/>
       <circle cx="${w * 0.75}" cy="${h * 0.55}" r="8" fill="${p.accent}" opacity="0.45"/>`,
  },
  warehouse_1: {
    pal: "millstone",
    layout: "interior",
    seed: 121,
    object: (w, h, p) =>
      `<rect x="${w * 0.15}" y="${h * 0.4}" width="70" height="90" fill="#12141a"/>
       <rect x="${w * 0.4}" y="${h * 0.35}" width="70" height="95" fill="#14161c"/>
       <rect x="${w * 0.65}" y="${h * 0.45}" width="70" height="85" fill="#101218" stroke="${p.accent}" stroke-width="1"/>`,
  },
  warehouse_2: {
    pal: "millstone",
    layout: "closeup",
    seed: 122,
    object: (w, h, p) =>
      `<rect x="${w * 0.3}" y="${h * 0.35}" width="120" height="80" fill="#12141a" stroke="${p.glow}" stroke-width="2"/>
       <rect x="${w * 0.38}" y="${h * 0.42}" width="70" height="12" fill="${p.accent}" opacity="0.35"/>
       <rect x="${w * 0.38}" y="${h * 0.58}" width="50" height="12" fill="${p.warm}" opacity="0.3"/>
       <rect x="${w * 0.55}" y="${h * 0.55}" width="40" height="55" fill="#0e1014"/>`,
  },
  warehouse_3: {
    pal: "millstone",
    layout: "yard",
    seed: 123,
    figureAt: [0.3, 0.72, 1.15],
    object: (w, h, p) =>
      `<rect x="${w * 0.5}" y="${h * 0.25}" width="100" height="140" fill="#101218" stroke="${p.warm}" stroke-width="2"/>
       <rect x="${w * 0.55}" y="${h * 0.4}" width="35" height="80" fill="#0a0a0c"/>
       <circle cx="${w * 0.75}" cy="${h * 0.3}" r="14" fill="${p.glow}" opacity="0.35"/>`,
  },
  dock_1: {
    pal: "docksreach",
    layout: "pier",
    seed: 131,
    ground: 0.68,
    object: (w, h, p) =>
      `<rect x="${w * 0.2}" y="${h * 0.48}" width="70" height="55" fill="#12181e" stroke="${p.accent}" stroke-width="2"/>
       <rect x="${w * 0.4}" y="${h * 0.45}" width="70" height="58" fill="#101820"/>
       <rect x="${w * 0.6}" y="${h * 0.5}" width="70" height="53" fill="#0e1418" stroke="${p.glow}" stroke-width="1"/>`,
  },
  dock_2: {
    pal: "docksreach",
    layout: "pier",
    seed: 132,
    ground: 0.7,
    object: (w, h, p) =>
      `<rect x="${w * 0.15}" y="${h * 0.1}" width="14" height="${h * 0.55}" fill="#12141a"/>
       <rect x="${w * 0.1}" y="${h * 0.12}" width="${w * 0.45}" height="10" fill="#1a2030"/>
       <line x1="${w * 0.22}" y1="${h * 0.22}" x2="${w * 0.55}" y2="${h * 0.55}" stroke="${p.glow}" stroke-width="4" opacity="0.4"/>
       <rect x="${w * 0.55}" y="${h * 0.5}" width="90" height="50" fill="#12181e" stroke="${p.accent}" stroke-width="2"/>`,
  },
  dock_3: {
    pal: "docksreach",
    layout: "yard",
    seed: 133,
    object: (w, h, p) =>
      `<rect x="${w * 0.15}" y="${h * 0.3}" width="80" height="120" fill="#12181e" stroke="${p.accent}" stroke-width="2"/>
       <rect x="${w * 0.4}" y="${h * 0.25}" width="80" height="125" fill="#101820" stroke="${p.glow}" stroke-width="2"/>
       <rect x="${w * 0.65}" y="${h * 0.35}" width="80" height="115" fill="#0e1418"/>
       <rect x="${w * 0.7}" y="${h * 0.55}" width="50" height="35" fill="#14161c" stroke="${p.warm}" stroke-width="1"/>`,
  },
  driver_1: {
    pal: "street",
    layout: "street",
    seed: 141,
    object: (w, h, p) =>
      `<ellipse cx="${w * 0.5}" cy="${h * 0.62}" rx="100" ry="28" fill="#12141a"/>
       <rect x="${w * 0.3}" y="${h * 0.45}" width="130" height="40" rx="6" fill="#1a2030" stroke="${p.accent}" stroke-width="2"/>
       <circle cx="${w * 0.35}" cy="${h * 0.7}" r="14" fill="#0a0a0c"/>
       <circle cx="${w * 0.65}" cy="${h * 0.7}" r="14" fill="#0a0a0c"/>`,
  },
  driver_2: {
    pal: "street",
    layout: "alley",
    seed: 142,
    figureAt: [0.55, 0.72, 1],
    object: (w, h, p) =>
      `<ellipse cx="${w * 0.4}" cy="${h * 0.65}" rx="50" ry="14" fill="${p.glow}" opacity="0.2"/>
       <rect x="${w * 0.25}" y="${h * 0.5}" width="100" height="35" rx="4" fill="#14161c" stroke="${p.warm}" stroke-width="2"/>
       <circle cx="${w * 0.35}" cy="${h * 0.58}" r="8" fill="${p.accent}" opacity="0.5"/>`,
  },
  driver_3: {
    pal: "civic",
    layout: "interior",
    seed: 143,
    object: (w, h, p) =>
      `<rect x="${w * 0.2}" y="${h * 0.5}" width="180" height="16" fill="#1a1c22"/>
       <rect x="${w * 0.35}" y="${h * 0.3}" width="90" height="70" fill="#12141a" stroke="${p.accent}" stroke-width="2"/>
       <circle cx="${w * 0.7}" cy="${h * 0.4}" r="18" fill="${p.glow}" opacity="0.2"/>
       <rect x="${w * 0.42}" y="${h * 0.4}" width="50" height="8" fill="${p.warm}" opacity="0.35"/>
       <rect x="${w * 0.42}" y="${h * 0.52}" width="35" height="8" fill="${p.glow}" opacity="0.25"/>`,
  },
  orderly_1: {
    pal: "clinic",
    layout: "corridor",
    seed: 151,
    object: (w, h, p) =>
      `<rect x="${w * 0.25}" y="${h * 0.5}" width="140" height="30" fill="#141820" stroke="${p.glow}" stroke-width="2"/>
       <circle cx="${w * 0.35}" cy="${h * 0.65}" r="12" fill="#0a0a0c"/>
       <circle cx="${w * 0.6}" cy="${h * 0.65}" r="12" fill="#0a0a0c"/>
       <rect x="${w * 0.7}" y="${h * 0.35}" width="40" height="70" fill="#101820" opacity="0.7"/>`,
  },
  orderly_2: {
    pal: "clinic",
    layout: "interior",
    seed: 152,
    object: (w, h, p) =>
      `<rect x="${w * 0.4}" y="${h * 0.28}" width="120" height="90" fill="#101820" stroke="${p.glow}" stroke-width="2"/>
       <rect x="${w * 0.48}" y="${h * 0.4}" width="18" height="5" fill="${p.accent}" opacity="0.55"/>
       <rect x="${w * 0.525}" y="${h * 0.36}" width="5" height="18" fill="${p.accent}" opacity="0.55"/>
       <rect x="${w * 0.15}" y="${h * 0.5}" width="70" height="50" fill="#12141a"/>`,
  },
  orderly_3: {
    pal: "clinic",
    layout: "corridor",
    seed: 153,
    figureAt: [0.35, 0.72, 1.05],
    object: (w, h, p) =>
      `<rect x="${w * 0.55}" y="${h * 0.4}" width="100" height="70" fill="#121820" stroke="${p.accent}" stroke-width="2"/>
       <rect x="${w * 0.62}" y="${h * 0.5}" width="40" height="8" fill="${p.glow}" opacity="0.3"/>
       <circle cx="${w * 0.75}" cy="${h * 0.62}" r="8" fill="${p.warm}" opacity="0.4"/>`,
  },
  casino_1: {
    pal: "casino",
    layout: "interior",
    seed: 161,
    object: (w, h, p) =>
      `<ellipse cx="${w * 0.5}" cy="${h * 0.55}" rx="90" ry="45" fill="#1a1408" stroke="${p.glow}" stroke-width="2"/>
       <circle cx="${w * 0.4}" cy="${h * 0.55}" r="10" fill="${p.accent}" opacity="0.5"/>
       <circle cx="${w * 0.55}" cy="${h * 0.52}" r="10" fill="${p.warm}" opacity="0.45"/>
       <circle cx="${w * 0.6}" cy="${h * 0.58}" r="8" fill="${p.glow}" opacity="0.35"/>`,
  },
  casino_2: {
    pal: "casino",
    layout: "closeup",
    seed: 162,
    object: (w, h, p) =>
      `<rect x="${w * 0.25}" y="${h * 0.4}" width="200" height="80" rx="8" fill="#1a1408" stroke="${p.glow}" stroke-width="2"/>
       <rect x="${w * 0.4}" y="${h * 0.48}" width="60" height="40" fill="#0e0c08" stroke="${p.warm}" stroke-width="1"/>
       <circle cx="${w * 0.35}" cy="${h * 0.55}" r="12" fill="${p.accent}" opacity="0.4"/>
       <circle cx="${w * 0.7}" cy="${h * 0.55}" r="12" fill="${p.warm}" opacity="0.35"/>`,
  },
  casino_3: {
    pal: "casino",
    layout: "interior",
    seed: 163,
    object: (w, h, p) =>
      `<rect x="${w * 0.3}" y="${h * 0.28}" width="${w * 0.4}" height="${h * 0.4}" fill="#141018" stroke="${p.glow}" stroke-width="3"/>
       <line x1="${w * 0.4}" y1="${h * 0.28}" x2="${w * 0.4}" y2="${h * 0.68}" stroke="${p.warm}" opacity="0.4"/>
       <line x1="${w * 0.5}" y1="${h * 0.28}" x2="${w * 0.5}" y2="${h * 0.68}" stroke="${p.warm}" opacity="0.4"/>
       <line x1="${w * 0.6}" y1="${h * 0.28}" x2="${w * 0.6}" y2="${h * 0.68}" stroke="${p.warm}" opacity="0.4"/>
       <circle cx="${w * 0.55}" cy="${h * 0.55}" r="14" fill="${p.accent}" opacity="0.4"/>`,
  },
  citydesk_1: {
    pal: "civic",
    layout: "interior",
    seed: 171,
    object: (w, h, p) =>
      `<rect x="${w * 0.2}" y="${h * 0.3}" width="40" height="100" fill="#12141a"/>
       <rect x="${w * 0.35}" y="${h * 0.3}" width="40" height="100" fill="#14161c"/>
       <rect x="${w * 0.5}" y="${h * 0.3}" width="40" height="100" fill="#12141a"/>
       <rect x="${w * 0.65}" y="${h * 0.3}" width="40" height="100" fill="#101218" stroke="${p.accent}" stroke-width="1"/>
       <rect x="${w * 0.38}" y="${h * 0.5}" width="20" height="12" fill="${p.glow}" opacity="0.25"/>`,
  },
  citydesk_2: {
    pal: "civic",
    layout: "counter",
    seed: 172,
    object: (w, h, p) =>
      `<rect x="${w * 0.4}" y="${h * 0.35}" width="70" height="50" fill="#12141a" stroke="${p.accent}" stroke-width="2"/>
       <circle cx="${w * 0.55}" cy="${h * 0.48}" r="14" fill="none" stroke="${p.glow}" stroke-width="3"/>
       <rect x="${w * 0.65}" y="${h * 0.42}" width="50" height="35" fill="${p.warm}" opacity="0.15"/>`,
  },
  citydesk_3: {
    pal: "civic",
    layout: "corridor",
    seed: 173,
    object: (w, h, p) =>
      `<rect x="${w * 0.15}" y="${h * 0.3}" width="55" height="110" fill="#12141a" stroke="${p.accent}" stroke-width="1"/>
       <rect x="${w * 0.35}" y="${h * 0.28}" width="55" height="112" fill="#101218" stroke="${p.glow}" stroke-width="1"/>
       <rect x="${w * 0.55}" y="${h * 0.32}" width="55" height="108" fill="#14161c"/>
       <rect x="${w * 0.72}" y="${h * 0.45}" width="50" height="60" fill="#0e1014" stroke="${p.warm}" stroke-width="2"/>`,
  },
};

const NPCS = {
  gr_courier: { pal: "glassrow", kind: "runner" },
  gr_bouncer: { pal: "glassrow", kind: "guard" },
  gr_tourist: { pal: "glassrow", kind: "civilian" },
  ms_loader: { pal: "millstone", kind: "civilian" },
  ms_scout: { pal: "millstone", kind: "runner" },
  ms_foreman: { pal: "millstone", kind: "guard" },
  dr_smuggler: { pal: "docksreach", kind: "thug" },
  dr_longshore: { pal: "docksreach", kind: "civilian" },
  dr_lookout: { pal: "docksreach", kind: "runner" },
  ac_intern: { pal: "ashcourt", kind: "civilian" },
  ac_security: { pal: "ashcourt", kind: "guard" },
  sy_exec: { pal: "spireyard", kind: "exec" },
  sy_guard: { pal: "spireyard", kind: "guard" },
  oc_thug: { pal: "oldcommons", kind: "thug" },
  oc_runner: { pal: "oldcommons", kind: "runner" },
  np_dealer: { pal: "glassrow", kind: "civilian" },
  np_bouncer: { pal: "glassrow", kind: "guard" },
  rc_orderly: { pal: "clinic", kind: "civilian" },
  rc_security: { pal: "clinic", kind: "guard" },
};

const PROPERTIES = {
  gr_walkup: { pal: "glassrow", floors: 4, wide: 0.38 },
  gr_loft: { pal: "glassrow", floors: 3, wide: 0.48, glass: true },
  ms_flat: { pal: "millstone", floors: 3, wide: 0.36 },
  ms_row: { pal: "millstone", floors: 2, wide: 0.55 },
  ms_shed: { pal: "millstone", floors: 1, wide: 0.42 },
  dr_cot: { pal: "docksreach", floors: 2, wide: 0.32 },
  dr_bay: { pal: "docksreach", floors: 1, wide: 0.5 },
  dr_safe: { pal: "docksreach", floors: 3, wide: 0.4 },
  ac_studio: { pal: "ashcourt", floors: 3, wide: 0.35 },
  ac_wardflat: { pal: "ashcourt", floors: 5, wide: 0.45 },
  sy_condo: { pal: "spireyard", floors: 8, wide: 0.4, glass: true },
  sy_pent: { pal: "spireyard", floors: 10, wide: 0.5, glass: true },
  oc_room: { pal: "oldcommons", floors: 2, wide: 0.3 },
  oc_walkup: { pal: "oldcommons", floors: 4, wide: 0.38 },
  np_booth: { pal: "glassrow", floors: 1, wide: 0.36 },
  np_loft: { pal: "glassrow", floors: 3, wide: 0.48, glass: true },
  rc_bunk: { pal: "clinic", floors: 2, wide: 0.34 },
  rc_suite: { pal: "clinic", floors: 4, wide: 0.42, glass: true },
};

const DISTRICTS = {
  glassrow: {
    pal: "glassrow",
    seed: 48,
    layout: "street",
    density: 1.5,
    extras: (w, h, p) =>
      `<rect x="${w * 0.55}" y="${h * 0.2}" width="${w * 0.3}" height="${h * 0.5}" fill="#10141a" stroke="${p.glow}" stroke-width="2" opacity="0.85"/>
       <rect x="${w * 0.6}" y="${h * 0.3}" width="40" height="50" fill="${p.accent}" opacity="0.15"/>
       <rect x="${w * 0.72}" y="${h * 0.35}" width="30" height="40" fill="${p.warm}" opacity="0.12"/>`,
  },
  millstone: {
    pal: "millstone",
    seed: 49,
    layout: "yard",
    extras: (w, h, p) =>
      `<rect x="${w * 0.2}" y="${h * 0.35}" width="${w * 0.35}" height="${h * 0.4}" fill="#121018" stroke="${p.warm}" stroke-width="2"/>
       <rect x="${w * 0.6}" y="${h * 0.4}" width="80" height="70" fill="#14161c"/>
       <circle cx="${w * 0.75}" cy="${h * 0.3}" r="18" fill="${p.glow}" opacity="0.25"/>`,
  },
  docksreach: {
    pal: "docksreach",
    seed: 50,
    layout: "pier",
    extras: (w, h, p) =>
      `<rect x="${w * 0.15}" y="${h * 0.35}" width="70" height="90" fill="#12181e"/>
       <rect x="${w * 0.4}" y="${h * 0.3}" width="70" height="95" fill="#101820" stroke="${p.glow}" stroke-width="1"/>
       <rect x="${w * 0.65}" y="${h * 0.38}" width="70" height="87" fill="#0e1418"/>`,
  },
  ashcourt: {
    pal: "ashcourt",
    seed: 51,
    layout: "street",
    extras: (w, h, p) =>
      `<rect x="${w * 0.55}" y="${h * 0.25}" width="${w * 0.28}" height="${h * 0.4}" fill="#101820" stroke="${p.glow}" stroke-width="2" opacity="0.85"/>
       <rect x="${w * 0.66}" y="${h * 0.35}" width="18" height="5" fill="${p.accent}" opacity="0.55"/>
       <rect x="${w * 0.695}" y="${h * 0.32}" width="5" height="18" fill="${p.accent}" opacity="0.55"/>`,
  },
  spireyard: {
    pal: "spireyard",
    seed: 52,
    layout: "street",
    density: 1.6,
    extras: (w, h, p) =>
      `<polygon points="${w * 0.62},${h * 0.15} ${w * 0.72},${h * 0.55} ${w * 0.52},${h * 0.55}" fill="#0c0814" stroke="${p.glow}" stroke-width="2" opacity="0.9"/>
       <rect x="${w * 0.58}" y="${h * 0.35}" width="8" height="12" fill="${p.warm}" opacity="0.45"/>`,
  },
  oldcommons: {
    pal: "oldcommons",
    seed: 53,
    layout: "alley",
    extras: (w, h, p) =>
      `<rect x="${w * 0.15}" y="${h * 0.4}" width="${w * 0.25}" height="${h * 0.28}" fill="#140a0c" stroke="${p.accent}" stroke-width="1"/>
       <path d="M${w * 0.5} ${h * 0.55} Q${w * 0.7} ${h * 0.45} ${w * 0.9} ${h * 0.58}" fill="none" stroke="${p.glow}" stroke-width="2" opacity="0.35"/>`,
  },
  neonpier: {
    pal: "glassrow",
    seed: 54,
    layout: "pier",
    extras: (w, h, p) =>
      `<rect x="${w * 0.55}" y="${h * 0.25}" width="${w * 0.3}" height="${h * 0.35}" fill="#10141a" stroke="${p.glow}" stroke-width="2" opacity="0.9"/>
       <circle cx="${w * 0.7}" cy="${h * 0.35}" r="18" fill="${p.warm}" opacity="0.35"/>
       <circle cx="${w * 0.78}" cy="${h * 0.42}" r="12" fill="${p.accent}" opacity="0.3"/>
       <rect x="${w * 0.2}" y="${h * 0.55}" width="100" height="18" fill="#141820" stroke="${p.glow}" stroke-width="1"/>`,
  },
  redclinic: {
    pal: "clinic",
    seed: 55,
    layout: "street",
    extras: (w, h, p) =>
      `<rect x="${w * 0.5}" y="${h * 0.22}" width="${w * 0.35}" height="${h * 0.45}" fill="#101820" stroke="${p.glow}" stroke-width="2"/>
       <rect x="${w * 0.64}" y="${h * 0.35}" width="22" height="6" fill="${p.accent}" opacity="0.55"/>
       <rect x="${w * 0.69}" y="${h * 0.31}" width="6" height="22" fill="${p.accent}" opacity="0.55"/>
       <rect x="${w * 0.2}" y="${h * 0.5}" width="90" height="40" fill="#12141a"/>`,
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
  const layout = meta.floors <= 1 ? "yard" : meta.glass ? "street" : "street";
  return sceneSvg(w, h, pal, {
    layout,
    seed: meta.floors * 7 + Math.floor(meta.wide * 20),
    ground: 0.78,
    density: meta.glass ? 1.4 : 0.9,
    rainOn: true,
    blobs: [
      [w * 0.2, h * 0.2, 100, pal.accent, 0.3],
      [w * 0.8, h * 0.25, 80, pal.glow, 0.25],
    ],
    extras: `<rect x="${bx}" y="${by}" width="${bw}" height="${h * 0.55}" fill="#0c0c10" stroke="${pal.accent}" stroke-width="2"/>
      ${floors}
      <rect x="${bx + bw * 0.4}" y="${by + h * 0.55 - 40}" width="${bw * 0.2}" height="40" fill="#08080c"/>
      ${
        meta.floors === 1
          ? `<rect x="${bx - 20}" y="${by + h * 0.35}" width="16" height="${h * 0.25}" fill="#12141a"/><rect x="${bx + bw + 4}" y="${by + h * 0.3}" width="20" height="${h * 0.3}" fill="#101218"/>`
          : ""
      }`,
  });
}

async function main() {
  const results = [];
  const W = 1280;
  const H = 853;

  // Crimes — all 48 with distinct layouts
  for (const [id, meta] of Object.entries(CRIME_META)) {
    const pal = PAL[meta.pal];
    const fig = meta.figureAt
      ? [meta.figureAt[0] * W, meta.figureAt[1] * H, meta.figureAt[2] ?? 1.2]
      : null;
    const extraFn = CRIME_EXTRAS[id];
    const svg = sceneSvg(W, H, pal, {
      layout: meta.layout ?? "street",
      seed: meta.seed,
      ground: meta.ground ?? 0.72,
      density: meta.density ?? 1,
      rainOn: meta.rainOn !== false,
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

  // Jobs — unique art per job id (24)
  for (const [id, meta] of Object.entries(JOBS)) {
    const pal = PAL[meta.pal];
    const fig = meta.figureAt
      ? [meta.figureAt[0] * 1024, meta.figureAt[1] * 1024, meta.figureAt[2] ?? 1.15]
      : null;
    const svg = sceneSvg(1024, 1024, pal, {
      layout: meta.layout ?? "interior",
      seed: meta.seed,
      ground: meta.ground ?? 0.74,
      density: meta.density ?? 1,
      rainOn: !["interior", "counter", "corridor", "closeup"].includes(meta.layout),
      figureAt: fig,
      blobs: [
        [1024 * 0.22, 1024 * 0.2, 110, pal.glow, 0.32],
        [1024 * 0.8, 1024 * 0.28, 85, pal.accent, 0.25],
      ],
      extras: meta.object(1024, 1024, pal),
    });
    results.push(await writeWebp(`jobs/${id}.webp`, svg, 1024, 1024));
  }

  // Legacy career filenames still referenced by heroes / fallbacks — regenerate as aliases of rank-1
  const CAREER_ALIASES = {
    retail: "retail_1",
    kitchen: "kitchen_1",
    warehouse: "warehouse_1",
    dockhand: "dock_1",
    driver: "driver_1",
    orderly: "orderly_1",
    casino: "casino_1",
    citydesk: "citydesk_1",
  };
  for (const [career, jobId] of Object.entries(CAREER_ALIASES)) {
    const src = path.join(ROOT, `jobs/${jobId}.webp`);
    const dest = path.join(ROOT, `jobs/${career}.webp`);
    if (FORCE || !fs.existsSync(dest)) {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        results.push({ rel: `jobs/${career}.webp`, bytes: fs.statSync(dest).size, skipped: false });
      }
    }
  }

  // Job board hero
  {
    const pal = PAL.civic;
    const svg = sceneSvg(W, H, pal, {
      layout: "street",
      seed: 200,
      density: 1.3,
      ground: 0.7,
      figureAt: [W * 0.32, H * 0.72, 1.2],
      blobs: [
        [W * 0.2, H * 0.2, 130, pal.glow, 0.35],
        [W * 0.75, H * 0.25, 100, pal.accent, 0.28],
      ],
      extras: `<rect x="${W * 0.48}" y="${H * 0.35}" width="160" height="100" fill="#12141a" stroke="${pal.accent}" stroke-width="2"/>
        <rect x="${W * 0.55}" y="${H * 0.45}" width="80" height="10" fill="${pal.glow}" opacity="0.3"/>
        <rect x="${W * 0.55}" y="${H * 0.55}" width="55" height="10" fill="${pal.glow}" opacity="0.2"/>`,
    });
    results.push(await writeWebp("jobs/hero.webp", svg, W, H));
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
      layout: meta.layout ?? "street",
      seed: meta.seed,
      ground: 0.7,
      density: meta.density ?? 1,
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
    systems: { pal: "spireyard", seed: 86 },
  };
  for (const [id, meta] of Object.entries(CAMPUS)) {
    const pal = PAL[meta.pal];
    const svg = interiorSvg(W, H, pal, {
      shelves: id === "commerce" || id === "locks" || id === "systems",
      window: id === "med" || id === "hero" || id === "systems",
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
              : id === "systems"
                ? `<rect x="${W * 0.3}" y="${H * 0.35}" width="140" height="90" fill="#12141a" stroke="${pal.glow}" stroke-width="2"/>
                   <circle cx="${W * 0.45}" cy="${H * 0.5}" r="14" fill="${pal.accent}" opacity="0.4"/>
                   <circle cx="${W * 0.6}" cy="${H * 0.55}" r="10" fill="${pal.warm}" opacity="0.35"/>
                   <line x1="${W * 0.35}" y1="${H * 0.7}" x2="${W * 0.7}" y2="${H * 0.7}" stroke="${pal.glow}" stroke-width="2" opacity="0.4"/>`
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

  // V2/V3 gig pack expand — unique subject per gig
  const MORE_GIGS = {
    bike_courier: { pal: "glassrow", layout: "street", object: (w, h, p) => `<circle cx="${w * 0.4}" cy="${h * 0.62}" r="28" fill="none" stroke="${p.accent}" stroke-width="4"/><circle cx="${w * 0.62}" cy="${h * 0.62}" r="28" fill="none" stroke="${p.accent}" stroke-width="4"/><line x1="${w * 0.4}" y1="${h * 0.62}" x2="${w * 0.55}" y2="${h * 0.42}" stroke="${p.glow}" stroke-width="3"/>` },
    market_stall: { pal: "oldcommons", layout: "counter", object: (w, h, p) => `<rect x="${w * 0.2}" y="${h * 0.4}" width="200" height="60" fill="#141018" stroke="${p.warm}" stroke-width="2"/><rect x="${w * 0.3}" y="${h * 0.28}" width="40" height="30" fill="${p.accent}" opacity="0.25"/><rect x="${w * 0.5}" y="${h * 0.3}" width="40" height="28" fill="${p.glow}" opacity="0.2"/>` },
    trash_route: { pal: "millstone", layout: "alley", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.45}" width="80" height="70" fill="#12141a" stroke="${p.warm}" stroke-width="2"/><ellipse cx="${w * 0.55}" cy="${h * 0.48}" rx="30" ry="10" fill="#1a1c22"/>` },
    neon_flyer: { pal: "glassrow", layout: "street", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.35}" width="50" height="70" fill="#141018" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.44}" y="${h * 0.42}" width="30" height="8" fill="${p.accent}" opacity="0.4"/>` },
    ward_errands: { pal: "clinic", layout: "corridor", object: (w, h, p) => `<rect x="${w * 0.55}" y="${h * 0.4}" width="70" height="50" fill="#121820" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.65}" y="${h * 0.48}" width="18" height="5" fill="${p.accent}" opacity="0.5"/>` },
    spire_reception: { pal: "spireyard", layout: "counter", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.4}" width="140" height="40" fill="#12141a" stroke="${p.glow}" stroke-width="2"/><circle cx="${w * 0.7}" cy="${h * 0.35}" r="20" fill="${p.warm}" opacity="0.25"/>` },
    ledger_audit: { pal: "spireyard", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.4}" width="120" height="80" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.38}" y="${h * 0.5}" width="70" height="6" fill="${p.glow}" opacity="0.3"/><rect x="${w * 0.38}" y="${h * 0.6}" width="50" height="6" fill="${p.glow}" opacity="0.2"/>` },
    container_count: { pal: "docksreach", layout: "pier", object: (w, h, p) => `<rect x="${w * 0.25}" y="${h * 0.4}" width="60" height="80" fill="#12181e"/><rect x="${w * 0.45}" y="${h * 0.35}" width="60" height="85" fill="#101820" stroke="${p.glow}" stroke-width="1"/><rect x="${w * 0.65}" y="${h * 0.42}" width="60" height="78" fill="#0e1418"/>` },
    lab_cleanup: { pal: "clinic", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="100" height="60" fill="#101820" stroke="${p.glow}" stroke-width="2"/><circle cx="${w * 0.5}" cy="${h * 0.55}" r="16" fill="none" stroke="${p.accent}" stroke-width="2"/>` },
    parking_patrol: { pal: "civic", layout: "street", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.4}" width="40" height="70" fill="#141820" stroke="${p.accent}" stroke-width="2"/><circle cx="${w * 0.48}" cy="${h * 0.5}" r="10" fill="${p.glow}" opacity="0.3"/>` },
    moving_crew: { pal: "millstone", layout: "yard", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.45}" width="90" height="60" fill="#12141a" stroke="${p.warm}" stroke-width="2"/><rect x="${w * 0.55}" y="${h * 0.4}" width="70" height="65" fill="#14161c"/>` },
    food_runner: { pal: "glassrow", layout: "street", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.45}" width="50" height="40" fill="#141018" stroke="${p.warm}" stroke-width="2"/><ellipse cx="${w * 0.55}" cy="${h * 0.68}" rx="40" ry="10" fill="#0a0a0c"/>` },
    library_shelve: { pal: "civic", layout: "interior", object: (w, h, p) => Array.from({ length: 5 }, (_, i) => `<rect x="${w * 0.15}" y="${h * 0.3 + i * 28}" width="${w * 0.55}" height="4" fill="${p.accent}" opacity="0.25"/><rect x="${w * 0.2 + (i % 3) * 20}" y="${h * 0.3 + i * 28 - 18}" width="18" height="16" fill="#12141a"/>`).join("") },
    ferry_ticket: { pal: "docksreach", layout: "pier", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.4}" width="80" height="50" rx="4" fill="#121820" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.48}" y="${h * 0.5}" width="40" height="8" fill="${p.glow}" opacity="0.35"/>` },
    event_setup: { pal: "spireyard", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.25}" y="${h * 0.5}" width="160" height="12" fill="#1a1c22"/><polygon points="${w * 0.5},${h * 0.3} ${w * 0.65},${h * 0.55} ${w * 0.35},${h * 0.55}" fill="${p.glow}" opacity="0.2"/>` },
    blood_drive: { pal: "clinic", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.35}" width="70" height="90" fill="#121820" stroke="${p.glow}" stroke-width="2"/><path d="M${w * 0.55} ${h * 0.5} Q${w * 0.58} ${h * 0.42} ${w * 0.6} ${h * 0.5}" fill="${p.warm}" opacity="0.45"/>` },
    yard_sweep: { pal: "millstone", layout: "yard", object: (w, h, p) => `<line x1="${w * 0.3}" y1="${h * 0.4}" x2="${w * 0.35}" y2="${h * 0.7}" stroke="${p.accent}" stroke-width="4"/><rect x="${w * 0.5}" y="${h * 0.5}" width="80" height="40" fill="#12141a"/>` },
    translate_desk: { pal: "glassrow", layout: "counter", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="100" height="60" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.42}" y="${h * 0.5}" width="50" height="6" fill="${p.glow}" opacity="0.3"/>` },
    cold_storage: { pal: "docksreach", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.28}" width="140" height="130" fill="#101820" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.45}" y="${h * 0.5}" width="40" height="60" fill="#0a1014"/>` },
    shelter_shift: { pal: "oldcommons", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.2}" y="${h * 0.5}" width="100" height="30" fill="#14161c" stroke="${p.accent}" stroke-width="1"/><rect x="${w * 0.55}" y="${h * 0.5}" width="100" height="30" fill="#12141a"/>` },
    press_run: { pal: "civic", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.4}" width="140" height="70" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><circle cx="${w * 0.45}" cy="${h * 0.55}" r="18" fill="#0a0a0c" stroke="${p.glow}" stroke-width="2"/><circle cx="${w * 0.65}" cy="${h * 0.55}" r="18" fill="#0a0a0c" stroke="${p.glow}" stroke-width="2"/>` },
    tool_lend: { pal: "millstone", layout: "interior", object: (w, h, p) => Array.from({ length: 4 }, (_, i) => `<line x1="${w * 0.3 + i * 40}" y1="${h * 0.35}" x2="${w * 0.3 + i * 40}" y2="${h * 0.65}" stroke="${i % 2 ? p.warm : p.accent}" stroke-width="4"/>`).join("") },
    museum_rope: { pal: "glassrow", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.4}" width="100" height="60" fill="#12141a" stroke="${p.glow}" stroke-width="1"/><line x1="${w * 0.25}" y1="${h * 0.7}" x2="${w * 0.75}" y2="${h * 0.7}" stroke="${p.warm}" stroke-width="3" opacity="0.5"/>` },
    ambulance_stock: { pal: "clinic", layout: "street", object: (w, h, p) => `<rect x="${w * 0.25}" y="${h * 0.4}" width="160" height="70" rx="6" fill="#141820" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.48}" y="${h * 0.5}" width="20" height="6" fill="${p.accent}" opacity="0.5"/><rect x="${w * 0.525}" y="${h * 0.46}" width="6" height="20" fill="${p.accent}" opacity="0.5"/>` },
    invoice_match: { pal: "spireyard", layout: "closeup", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.35}" width="100" height="70" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.5}" y="${h * 0.42}" width="100" height="70" fill="#14161c" stroke="${p.glow}" stroke-width="2"/>` },
  };
  for (const [id, meta] of Object.entries(MORE_GIGS)) {
    const pal = PAL[meta.pal] || PAL.civic;
    const svg = sceneSvg(1024, 1024, pal, {
      layout: meta.layout ?? "interior",
      seed: id.length * 7 + 11,
      ground: 0.74,
      rainOn: !["interior", "counter", "corridor", "closeup"].includes(meta.layout),
      blobs: [
        [220, 200, 100, pal.glow, 0.3],
        [800, 280, 80, pal.accent, 0.25],
      ],
      extras: meta.object(1024, 1024, pal),
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
    tram_skim: { pal: "glassrow", layout: "street", object: (w, h, p) => `<rect x="${w * 0.2}" y="${h * 0.4}" width="${w * 0.6}" height="40" fill="#1a2030" opacity="0.8"/><circle cx="${w * 0.35}" cy="${h * 0.7}" r="14" fill="#0a0a0c"/>` },
    yard_boost: { pal: "millstone", layout: "yard", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="90" height="70" fill="#12141a" stroke="${p.warm}" stroke-width="2"/>` },
    commons_sweep: { pal: "oldcommons", layout: "alley", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.5}" width="70" height="45" fill="#141018" stroke="${p.accent}" stroke-width="2"/>` },
    bay_pierce: { pal: "docksreach", layout: "pier", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="100" height="80" fill="#12181e" stroke="${p.glow}" stroke-width="2"/>` },
    ward_diversion: { pal: "ashcourt", layout: "corridor", object: (w, h, p) => `<rect x="${w * 0.55}" y="${h * 0.4}" width="70" height="50" fill="#121820" stroke="${p.glow}" stroke-width="2"/>` },
    spire_float: { pal: "spireyard", layout: "street", density: 1.5, object: (w, h, p) => `<polygon points="${w * 0.55},${h * 0.2} ${w * 0.7},${h * 0.55} ${w * 0.4},${h * 0.55}" fill="#0c0814" stroke="${p.glow}" stroke-width="2"/>` },
    soft_house_run: { pal: "docksreach", layout: "pier", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.45}" width="120" height="50" fill="#101820" stroke="${p.accent}" stroke-width="2"/>` },
    bond_desk: { pal: "spireyard", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.4}" width="140" height="70" fill="#12141a" stroke="${p.accent}" stroke-width="2"/>` },
    neon_till: { pal: "glassrow", layout: "counter", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.45}" width="70" height="40" fill="#141018" stroke="${p.glow}" stroke-width="2"/><circle cx="${w * 0.5}" cy="${h * 0.55}" r="8" fill="${p.warm}" opacity="0.4"/>` },
    gallery_wire: { pal: "glassrow", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.4}" width="80" height="55" fill="#12141a" stroke="${p.glow}" stroke-width="1"/><rect x="${w * 0.55}" y="${h * 0.38}" width="70" height="60" fill="#12141a"/>` },
    loft_mail: { pal: "glassrow", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="50" height="70" fill="#12141a"/><rect x="${w * 0.5}" y="${h * 0.4}" width="50" height="70" fill="#14161c" stroke="${p.accent}" stroke-width="1"/>` },
    pallet_ghost: { pal: "millstone", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.25}" y="${h * 0.45}" width="70" height="60" fill="#12141a"/><rect x="${w * 0.5}" y="${h * 0.4}" width="70" height="65" fill="#14161c"/>` },
    substation_siphon: { pal: "millstone", layout: "yard", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.3}" width="70" height="110" fill="#12141a" stroke="${p.warm}" stroke-width="2"/><line x1="${w * 0.45}" y1="${h * 0.4}" x2="${w * 0.6}" y2="${h * 0.55}" stroke="${p.glow}" stroke-width="3"/>` },
    chop_lane: { pal: "millstone", layout: "yard", object: (w, h, p) => `<circle cx="${w * 0.4}" cy="${h * 0.65}" r="20" fill="none" stroke="${p.warm}" stroke-width="3"/><circle cx="${w * 0.65}" cy="${h * 0.65}" r="20" fill="none" stroke="${p.warm}" stroke-width="3"/>` },
    crane_blind: { pal: "docksreach", layout: "pier", object: (w, h, p) => `<rect x="${w * 0.2}" y="${h * 0.1}" width="12" height="${h * 0.55}" fill="#12141a"/><line x1="${w * 0.26}" y1="${h * 0.15}" x2="${w * 0.7}" y2="${h * 0.45}" stroke="${p.glow}" stroke-width="4" opacity="0.4"/>` },
    cold_chain: { pal: "docksreach", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.3}" width="130" height="120" fill="#101820" stroke="${p.glow}" stroke-width="2"/>` },
    ambulance_divert: { pal: "ashcourt", layout: "street", object: (w, h, p) => `<rect x="${w * 0.25}" y="${h * 0.42}" width="150" height="55" rx="6" fill="#141820" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.48}" y="${h * 0.5}" width="18" height="5" fill="${p.accent}" opacity="0.5"/>` },
    evidence_soft: { pal: "ashcourt", layout: "corridor", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="50" height="80" fill="#12161c"/><rect x="${w * 0.5}" y="${h * 0.4}" width="50" height="80" fill="#12161c"/>` },
    clinic_ledger: { pal: "ashcourt", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="100" height="60" fill="#121820" stroke="${p.accent}" stroke-width="2"/>` },
    courier_swap: { pal: "spireyard", layout: "street", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.45}" width="60" height="40" fill="#141018" stroke="${p.glow}" stroke-width="2"/>` },
    penthouse_skim: { pal: "spireyard", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.45}" y="${h * 0.25}" width="${w * 0.35}" height="${h * 0.4}" fill="#101218" stroke="${p.glow}" stroke-width="2" opacity="0.85"/>` },
    stoop_tax: { pal: "oldcommons", layout: "street", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.5}" width="120" height="40" fill="#141018"/><rect x="${w * 0.4}" y="${h * 0.35}" width="40" height="50" fill="#12141a"/>` },
    race_bag: { pal: "oldcommons", layout: "street", object: (w, h, p) => `<path d="M${w * 0.15} ${h * 0.7} Q${w * 0.5} ${h * 0.5} ${w * 0.9} ${h * 0.65}" fill="none" stroke="${p.glow}" stroke-width="4" opacity="0.45"/><rect x="${w * 0.45}" y="${h * 0.48}" width="50" height="30" fill="#12141a" stroke="${p.warm}" stroke-width="2"/>` },
    alley_stash: { pal: "oldcommons", layout: "alley", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.5}" width="80" height="50" fill="#141018" stroke="${p.accent}" stroke-width="2"/>` },
  };
  for (const [id, meta] of Object.entries(heistBoards)) {
    const pal = PAL[meta.pal];
    const svg = sceneSvg(W, H, pal, {
      layout: meta.layout ?? "street",
      seed: id.length * 9 + 3,
      ground: 0.7,
      density: meta.density ?? 1,
      rainOn: !["interior", "counter", "corridor", "closeup"].includes(meta.layout),
      blobs: [
        [W * 0.25, H * 0.22, 110, pal.glow, 0.35],
        [W * 0.75, H * 0.3, 90, pal.accent, 0.28],
      ],
      extras: meta.object(W, H, pal),
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

  // Contacts board hero
  {
    const pal = PAL.civic;
    const svg = sceneSvg(W, H, pal, {
      seed: 88,
      ground: 0.7,
      figureAt: [W * 0.35, H * 0.72, 1.15],
      blobs: [
        [W * 0.2, H * 0.22, 120, pal.glow, 0.35],
        [W * 0.78, H * 0.28, 90, pal.accent, 0.28],
      ],
      extras: `<rect x="${W * 0.5}" y="${H * 0.35}" width="140" height="90" fill="#12141a" stroke="${pal.accent}" stroke-width="2"/>
        <circle cx="${W * 0.62}" cy="${H * 0.48}" r="22" fill="#1a1c22" stroke="${pal.glow}" stroke-width="2"/>
        <rect x="${W * 0.55}" y="${H * 0.7}" width="80" height="8" fill="${pal.glow}" opacity="0.25"/>`,
    });
    results.push(await writeWebp("contacts/hero.webp", svg, W, H));
  }

  // Early gigs (V0 pack) — unique subjects; regenerates older files under --force
  const EARLY_GIGS = {
    courier_drop: { pal: "glassrow", layout: "street", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.42}" width="70" height="50" fill="#141018" stroke="${p.glow}" stroke-width="2"/><path d="M${w * 0.2} ${h * 0.7} Q${w * 0.5} ${h * 0.55} ${w * 0.85} ${h * 0.68}" fill="none" stroke="${p.warm}" stroke-width="3" opacity="0.4"/>` },
    data_entry: { pal: "civic", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.4}" width="140" height="70" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.4}" y="${h * 0.5}" width="80" height="6" fill="${p.glow}" opacity="0.3"/><rect x="${w * 0.4}" y="${h * 0.6}" width="55" height="6" fill="${p.glow}" opacity="0.2"/>` },
    night_watch: { pal: "millstone", layout: "corridor", object: (w, h, p) => `<rect x="${w * 0.55}" y="${h * 0.35}" width="80" height="100" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><circle cx="${w * 0.7}" cy="${h * 0.45}" r="14" fill="${p.glow}" opacity="0.35"/>` },
    tutoring: { pal: "civic", layout: "counter", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="100" height="60" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.42}" y="${h * 0.5}" width="40" height="8" fill="${p.glow}" opacity="0.35"/><circle cx="${w * 0.7}" cy="${h * 0.4}" r="16" fill="${p.warm}" opacity="0.25"/>` },
    pier_walk: { pal: "docksreach", layout: "pier", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.55}" width="160" height="12" fill="#141820"/><ellipse cx="${w * 0.55}" cy="${h * 0.7}" rx="80" ry="14" fill="${p.glow}" opacity="0.15"/>` },
    campus_filing: { pal: "civic", layout: "interior", object: (w, h, p) => Array.from({ length: 4 }, (_, i) => `<rect x="${w * 0.2}" y="${h * 0.35 + i * 30}" width="${w * 0.5}" height="4" fill="${p.accent}" opacity="0.25"/><rect x="${w * 0.25 + (i % 3) * 18}" y="${h * 0.35 + i * 30 - 16}" width="16" height="14" fill="#12141a"/>`).join("") },
    freight_assist: { pal: "docksreach", layout: "yard", object: (w, h, p) => `<rect x="${w * 0.25}" y="${h * 0.4}" width="70" height="80" fill="#12181e"/><rect x="${w * 0.45}" y="${h * 0.35}" width="70" height="85" fill="#101820" stroke="${p.glow}" stroke-width="1"/><rect x="${w * 0.65}" y="${h * 0.42}" width="70" height="78" fill="#0e1418"/>` },
    civic_clipboard: { pal: "ashcourt", layout: "street", object: (w, h, p) => `<rect x="${w * 0.42}" y="${h * 0.4}" width="50" height="70" fill="#141820" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.46}" y="${h * 0.48}" width="30" height="8" fill="${p.glow}" opacity="0.35"/>` },
  };
  for (const [id, meta] of Object.entries(EARLY_GIGS)) {
    const pal = PAL[meta.pal];
    const svg = sceneSvg(1024, 1024, pal, {
      layout: meta.layout ?? "interior",
      seed: id.length * 11 + 5,
      ground: 0.74,
      rainOn: !["interior", "counter", "corridor", "closeup"].includes(meta.layout),
      blobs: [
        [220, 200, 100, pal.glow, 0.3],
        [800, 280, 80, pal.accent, 0.25],
      ],
      extras: meta.object(1024, 1024, pal),
    });
    results.push(await writeWebp(`gigs/${id}.webp`, svg, 1024, 1024));
  }

  // Business fronts + hero (unique — do not reuse crime/property art)
  {
    const pal = PAL.civic;
    const svg = sceneSvg(W, H, pal, {
      seed: 91,
      layout: "street",
      density: 1.3,
      ground: 0.7,
      blobs: [
        [W * 0.25, H * 0.2, 120, pal.glow, 0.35],
        [W * 0.75, H * 0.28, 100, pal.warm, 0.28],
      ],
      extras: `<rect x="${W * 0.45}" y="${H * 0.3}" width="180" height="120" fill="#12141a" stroke="${pal.accent}" stroke-width="2"/>
        <rect x="${W * 0.52}" y="${H * 0.42}" width="60" height="50" fill="${pal.glow}" opacity="0.15"/>
        <rect x="${W * 0.7}" y="${H * 0.42}" width="40" height="50" fill="${pal.warm}" opacity="0.12"/>`,
    });
    results.push(await writeWebp("business/hero.webp", svg, W, H));
  }
  const BUSINESS = {
    corner_laundry: { pal: "ashcourt", layout: "interior", object: (w, h, p) => `<ellipse cx="${w * 0.45}" cy="${h * 0.55}" rx="50" ry="40" fill="#16141a" stroke="${p.glow}" stroke-width="2"/><ellipse cx="${w * 0.65}" cy="${h * 0.55}" rx="50" ry="40" fill="#16141a" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.35}" y="${h * 0.35}" width="120" height="14" fill="#1a1c22"/>` },
    courier_front: { pal: "glassrow", layout: "counter", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.4}" width="140" height="50" fill="#12141a" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.45}" y="${h * 0.48}" width="50" height="30" fill="#141018" stroke="${p.warm}" stroke-width="1"/><path d="M${w * 0.2} ${h * 0.75} Q${w * 0.5} ${h * 0.65} ${w * 0.85} ${h * 0.72}" fill="none" stroke="${p.accent}" stroke-width="3" opacity="0.35"/>` },
    pawn_consortium: { pal: "millstone", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.35}" width="100" height="80" fill="#101218" stroke="${p.glow}" stroke-width="2"/><polygon points="${w * 0.45},${h * 0.45} ${w * 0.52},${h * 0.58} ${w * 0.38},${h * 0.58}" fill="${p.warm}" opacity="0.5"/><rect x="${w * 0.55}" y="${h * 0.4}" width="80" height="90" fill="#12141a" stroke="${p.accent}" stroke-width="1"/>` },
    holding_co: { pal: "spireyard", layout: "street", density: 1.5, object: (w, h, p) => `<polygon points="${w * 0.55},${h * 0.15} ${w * 0.72},${h * 0.55} ${w * 0.38},${h * 0.55}" fill="#0c0814" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.45}" y="${h * 0.58}" width="100" height="50" fill="#12141a" stroke="${p.warm}" stroke-width="1"/>` },
  };
  for (const [id, meta] of Object.entries(BUSINESS)) {
    const pal = PAL[meta.pal];
    const svg = sceneSvg(1024, 1024, pal, {
      layout: meta.layout ?? "interior",
      seed: id.length * 13 + 7,
      ground: 0.74,
      density: meta.density ?? 1,
      rainOn: !["interior", "counter", "corridor", "closeup"].includes(meta.layout),
      blobs: [
        [220, 200, 110, pal.glow, 0.32],
        [800, 280, 85, pal.accent, 0.25],
      ],
      extras: meta.object(1024, 1024, pal),
    });
    results.push(await writeWebp(`business/${id}.webp`, svg, 1024, 1024));
  }

  // Factions
  {
    const pal = PAL.street;
    const svg = sceneSvg(W, H, pal, {
      seed: 92,
      layout: "alley",
      figureAt: [W * 0.4, H * 0.72, 1.2],
      blobs: [
        [W * 0.25, H * 0.22, 120, pal.glow, 0.35],
        [W * 0.75, H * 0.3, 90, pal.accent, 0.28],
      ],
      extras: `<rect x="${W * 0.55}" y="${H * 0.35}" width="120" height="90" fill="#121018" stroke="${pal.accent}" stroke-width="2"/>
        <rect x="${W * 0.62}" y="${H * 0.45}" width="50" height="8" fill="${pal.glow}" opacity="0.3"/>`,
    });
    results.push(await writeWebp("factions/hero.webp", svg, W, H));
  }
  const FACTIONS = {
    glass_syndicate: { pal: "glassrow", layout: "street", density: 1.4, object: (w, h, p) => `<rect x="${w * 0.5}" y="${h * 0.28}" width="${w * 0.35}" height="${h * 0.4}" fill="#10141a" stroke="${p.glow}" stroke-width="2"/><circle cx="${w * 0.7}" cy="${h * 0.45}" r="16" fill="${p.warm}" opacity="0.35"/>` },
    mill_iron: { pal: "millstone", layout: "yard", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.4}" width="100" height="70" fill="#121018" stroke="${p.warm}" stroke-width="2"/><line x1="${w * 0.35}" y1="${h * 0.35}" x2="${w * 0.35}" y2="${h * 0.7}" stroke="${p.accent}" stroke-width="4"/>` },
    dock_covenant: { pal: "docksreach", layout: "pier", object: (w, h, p) => `<rect x="${w * 0.25}" y="${h * 0.35}" width="70" height="90" fill="#12181e"/><rect x="${w * 0.45}" y="${h * 0.3}" width="70" height="95" fill="#101820" stroke="${p.glow}" stroke-width="1"/>` },
    civic_veil: { pal: "ashcourt", layout: "corridor", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.35}" width="100" height="90" fill="#121820" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.55}" y="${h * 0.48}" width="20" height="6" fill="${p.accent}" opacity="0.5"/>` },
  };
  for (const [id, meta] of Object.entries(FACTIONS)) {
    const pal = PAL[meta.pal];
    const svg = sceneSvg(W, H, pal, {
      layout: meta.layout ?? "street",
      seed: id.length * 17 + 3,
      ground: 0.7,
      density: meta.density ?? 1,
      rainOn: !["interior", "counter", "corridor"].includes(meta.layout),
      blobs: [
        [W * 0.25, H * 0.22, 110, pal.glow, 0.35],
        [W * 0.75, H * 0.3, 90, pal.accent, 0.28],
      ],
      extras: meta.object(W, H, pal),
      figureAt: [W * 0.32, H * 0.72, 1.1],
    });
    results.push(await writeWebp(`factions/${id}.webp`, svg, W, H));
  }

  // Raceway
  {
    const pal = PAL.oldcommons;
    const svg = sceneSvg(W, H, pal, {
      seed: 93,
      layout: "street",
      ground: 0.68,
      blobs: [
        [W * 0.2, H * 0.2, 120, pal.glow, 0.35],
        [W * 0.8, H * 0.28, 100, pal.warm, 0.3],
      ],
      extras: `<path d="M${W * 0.1} ${H * 0.7} Q${W * 0.4} ${H * 0.5} ${W * 0.9} ${H * 0.65}" fill="none" stroke="${pal.glow}" stroke-width="5" opacity="0.5"/>
        <ellipse cx="${W * 0.55}" cy="${H * 0.58}" rx="70" ry="22" fill="#12141a" stroke="${pal.accent}" stroke-width="2"/>`,
    });
    results.push(await writeWebp("raceway/hero.webp", svg, W, H));
  }
  const RACES = {
    alley_dash: { pal: "oldcommons", layout: "alley", object: (w, h, p) => `<path d="M${w * 0.2} ${h * 0.7} Q${w * 0.5} ${h * 0.55} ${w * 0.8} ${h * 0.68}" fill="none" stroke="${p.glow}" stroke-width="4" opacity="0.45"/><ellipse cx="${w * 0.5}" cy="${h * 0.6}" rx="40" ry="12" fill="#12141a"/>` },
    harbor_loop: { pal: "docksreach", layout: "pier", object: (w, h, p) => `<path d="M${w * 0.15} ${h * 0.65} Q${w * 0.5} ${h * 0.45} ${w * 0.9} ${h * 0.6}" fill="none" stroke="${p.glow}" stroke-width="4"/><rect x="${w * 0.7}" y="${h * 0.2}" width="10" height="${h * 0.4}" fill="#12141a"/>` },
    commons_drift: { pal: "oldcommons", layout: "street", object: (w, h, p) => `<path d="M${w * 0.1} ${h * 0.7} Q${w * 0.45} ${h * 0.5} ${w * 0.9} ${h * 0.72}" fill="none" stroke="${p.accent}" stroke-width="4" opacity="0.5"/><rect x="${w * 0.35}" y="${h * 0.4}" width="40" height="60" fill="#141018"/>` },
    pier_sprint: { pal: "glassrow", layout: "pier", object: (w, h, p) => `<circle cx="${w * 0.4}" cy="${h * 0.35}" r="20" fill="${p.warm}" opacity="0.4"/><circle cx="${w * 0.55}" cy="${h * 0.4}" r="14" fill="${p.accent}" opacity="0.35"/><path d="M${w * 0.2} ${h * 0.7} Q${w * 0.55} ${h * 0.5} ${w * 0.9} ${h * 0.65}" fill="none" stroke="${p.glow}" stroke-width="4"/>` },
    spire_invite: { pal: "spireyard", layout: "street", density: 1.5, object: (w, h, p) => `<polygon points="${w * 0.55},${h * 0.15} ${w * 0.7},${h * 0.55} ${w * 0.4},${h * 0.55}" fill="#0c0814" stroke="${p.glow}" stroke-width="2"/><ellipse cx="${w * 0.45}" cy="${h * 0.65}" rx="50" ry="14" fill="#12141a" stroke="${p.warm}" stroke-width="1"/>` },
    mill_night: { pal: "millstone", layout: "yard", object: (w, h, p) => `<rect x="${w * 0.25}" y="${h * 0.35}" width="90" height="100" fill="#121018" stroke="${p.warm}" stroke-width="2"/><path d="M${w * 0.5} ${h * 0.7} Q${w * 0.7} ${h * 0.5} ${w * 0.9} ${h * 0.65}" fill="none" stroke="${p.glow}" stroke-width="4"/>` },
  };
  for (const [id, meta] of Object.entries(RACES)) {
    const pal = PAL[meta.pal];
    const svg = sceneSvg(W, H, pal, {
      layout: meta.layout ?? "street",
      seed: id.length * 19 + 4,
      ground: 0.68,
      density: meta.density ?? 1,
      rainOn: true,
      blobs: [
        [W * 0.25, H * 0.22, 110, pal.glow, 0.35],
        [W * 0.75, H * 0.3, 90, pal.accent, 0.28],
      ],
      extras: meta.object(W, H, pal),
    });
    results.push(await writeWebp(`raceway/${id}.webp`, svg, W, H));
  }

  // Bounties board hero
  {
    const pal = PAL.street;
    const svg = sceneSvg(W, H, pal, {
      seed: 94,
      layout: "alley",
      figureAt: [W * 0.5, H * 0.72, 1.25],
      blobs: [
        [W * 0.25, H * 0.2, 110, pal.glow, 0.35],
        [W * 0.75, H * 0.28, 90, pal.accent, 0.3],
      ],
      extras: `<rect x="${W * 0.55}" y="${H * 0.32}" width="100" height="120" fill="#121018" stroke="${pal.accent}" stroke-width="2"/>
        <circle cx="${W * 0.7}" cy="${H * 0.48}" r="28" fill="#1a1c22" stroke="${pal.glow}" stroke-width="2"/>
        <rect x="${W * 0.6}" y="${H * 0.72}" width="70" height="8" fill="${pal.warm}" opacity="0.35"/>`,
    });
    results.push(await writeWebp("bounties/hero.webp", svg, W, H));
  }

  // Awards category badges + hero
  {
    const pal = PAL.civic;
    const svg = sceneSvg(W, H, pal, {
      seed: 95,
      ground: 0.7,
      blobs: [
        [W * 0.3, H * 0.22, 120, pal.glow, 0.4],
        [W * 0.7, H * 0.3, 100, pal.warm, 0.3],
      ],
      extras: `<circle cx="${W * 0.5}" cy="${H * 0.45}" r="70" fill="#12141a" stroke="${pal.glow}" stroke-width="4"/>
        <circle cx="${W * 0.5}" cy="${H * 0.45}" r="40" fill="none" stroke="${pal.accent}" stroke-width="3"/>
        <polygon points="${W * 0.5},${H * 0.32} ${W * 0.55},${H * 0.42} ${W * 0.45},${H * 0.42}" fill="${pal.warm}" opacity="0.55"/>`,
    });
    results.push(await writeWebp("awards/hero.webp", svg, W, H));
  }
  const AWARD_CATS = {
    crime: { pal: "street", mark: (w, h, p) => `<path d="M${w * 0.35} ${h * 0.55} L${w * 0.5} ${h * 0.35} L${w * 0.65} ${h * 0.55} Z" fill="${p.accent}" opacity="0.5"/><circle cx="${w * 0.5}" cy="${h * 0.6}" r="30" fill="none" stroke="${p.glow}" stroke-width="3"/>` },
    work: { pal: "civic", mark: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="120" height="80" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.42}" y="${h * 0.5}" width="70" height="8" fill="${p.glow}" opacity="0.35"/>` },
    money: { pal: "casino", mark: (w, h, p) => `<circle cx="${w * 0.5}" cy="${h * 0.5}" r="55" fill="#1a1408" stroke="${p.glow}" stroke-width="3"/><circle cx="${w * 0.5}" cy="${h * 0.5}" r="28" fill="${p.warm}" opacity="0.35"/>` },
    body: { pal: "clinic", mark: (w, h, p) => `<rect x="${w * 0.42}" y="${h * 0.35}" width="60" height="100" fill="#121820" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.48}" y="${h * 0.48}" width="20" height="6" fill="${p.accent}" opacity="0.55"/><rect x="${w * 0.525}" y="${h * 0.44}" width="6" height="20" fill="${p.accent}" opacity="0.55"/>` },
    city: { pal: "glassrow", mark: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.45}" width="40" height="70" fill="#10141a"/><rect x="${w * 0.45}" y="${h * 0.35}" width="40" height="80" fill="#12141a" stroke="${p.glow}" stroke-width="1"/><rect x="${w * 0.6}" y="${h * 0.4}" width="40" height="75" fill="#0e1014"/>` },
    story: { pal: "spireyard", mark: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.35}" width="120" height="90" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.42}" y="${h * 0.45}" width="80" height="6" fill="${p.glow}" opacity="0.35"/><rect x="${w * 0.42}" y="${h * 0.55}" width="55" height="6" fill="${p.glow}" opacity="0.25"/>` },
  };
  for (const [id, meta] of Object.entries(AWARD_CATS)) {
    const pal = PAL[meta.pal];
    const svg = sceneSvg(640, 640, pal, {
      layout: "closeup",
      seed: id.length * 21,
      ground: 0.78,
      rainOn: false,
      blobs: [
        [160, 140, 100, pal.glow, 0.4],
        [480, 200, 80, pal.accent, 0.3],
      ],
      extras: meta.mark(640, 640, pal),
    });
    results.push(await writeWebp(`awards/${id}.webp`, svg, 640, 640));
  }

  // Gym tracks + hero
  {
    const pal = PAL.millstone;
    const svg = interiorSvg(W, H, pal, {
      shelves: false,
      window: true,
      seed: 96,
      object: `<rect x="${W * 0.25}" y="${H * 0.45}" width="160" height="20" fill="#1a1c22"/><rect x="${W * 0.55}" y="${H * 0.35}" width="40" height="100" fill="#12141a" stroke="${pal.accent}" stroke-width="2"/>`,
    });
    results.push(await writeWebp("gym/hero.webp", svg, W, H));
  }
  const GYM = {
    str: { pal: "street", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.45}" width="120" height="16" fill="#1a1c22"/><circle cx="${w * 0.35}" cy="${h * 0.53}" r="22" fill="#12141a" stroke="${p.accent}" stroke-width="3"/><circle cx="${w * 0.65}" cy="${h * 0.53}" r="22" fill="#12141a" stroke="${p.accent}" stroke-width="3"/>` },
    def: { pal: "clinic", object: (w, h, p) => `<rect x="${w * 0.38}" y="${h * 0.35}" width="90" height="110" fill="#121820" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.45}" y="${h * 0.5}" width="50" height="50" fill="#101218" stroke="${p.accent}" stroke-width="2"/>` },
    spd: { pal: "glassrow", object: (w, h, p) => `<path d="M${w * 0.25} ${h * 0.6} Q${w * 0.5} ${h * 0.35} ${w * 0.8} ${h * 0.55}" fill="none" stroke="${p.glow}" stroke-width="5" opacity="0.55"/><ellipse cx="${w * 0.55}" cy="${h * 0.65}" rx="40" ry="12" fill="#12141a"/>` },
    dex: { pal: "spireyard", object: (w, h, p) => `<rect x="${w * 0.4}" y="${h * 0.4}" width="70" height="90" fill="#121018" stroke="${p.glow}" stroke-width="2"/><circle cx="${w * 0.55}" cy="${h * 0.55}" r="16" fill="none" stroke="${p.accent}" stroke-width="3"/>` },
  };
  for (const [id, meta] of Object.entries(GYM)) {
    const pal = PAL[meta.pal];
    const svg = interiorSvg(1024, 1024, pal, {
      shelves: false,
      window: false,
      seed: id.length * 9,
      object: meta.object(1024, 1024, pal),
    });
    results.push(await writeWebp(`gym/${id}.webp`, svg, 1024, 1024));
  }

  // Casino lobby + tables
  {
    const pal = PAL.casino;
    const svg = interiorSvg(W, H, pal, {
      shelves: false,
      window: false,
      seed: 97,
      object: `<ellipse cx="${W * 0.5}" cy="${H * 0.55}" rx="160" ry="70" fill="#1a1408" stroke="${pal.glow}" stroke-width="3"/>
        <circle cx="${W * 0.4}" cy="${H * 0.55}" r="14" fill="${pal.accent}" opacity="0.5"/>
        <circle cx="${W * 0.55}" cy="${H * 0.52}" r="14" fill="${pal.warm}" opacity="0.45"/>
        <circle cx="${W * 0.65}" cy="${H * 0.58}" r="12" fill="${pal.glow}" opacity="0.4"/>`,
    });
    results.push(await writeWebp("casino/lobby.webp", svg, W, H));
  }
  const CASINO_TABLES = {
    slots: { object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.28}" width="110" height="160" rx="6" fill="#141018" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.4}" y="${h * 0.38}" width="30" height="50" fill="${p.accent}" opacity="0.25"/><rect x="${w * 0.52}" y="${h * 0.38}" width="30" height="50" fill="${p.warm}" opacity="0.25"/><rect x="${w * 0.4}" y="${h * 0.7}" width="70" height="12" fill="${p.glow}" opacity="0.3"/>` },
    blackjack: { object: (w, h, p) => `<ellipse cx="${w * 0.5}" cy="${h * 0.55}" rx="120" ry="55" fill="#1a1408" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.42}" y="${h * 0.45}" width="35" height="45" fill="#12141a" stroke="${p.accent}" stroke-width="1"/><rect x="${w * 0.55}" y="${h * 0.48}" width="35" height="45" fill="#12141a" stroke="${p.warm}" stroke-width="1"/>` },
    highlow: { object: (w, h, p) => `<rect x="${w * 0.38}" y="${h * 0.4}" width="50" height="70" fill="#12141a" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.52}" y="${h * 0.35}" width="50" height="70" fill="#14161c" stroke="${p.glow}" stroke-width="2"/><path d="M${w * 0.45} ${h * 0.7} L${w * 0.6} ${h * 0.28}" stroke="${p.warm}" stroke-width="3" opacity="0.45"/>` },
    roulette: { object: (w, h, p) => `<circle cx="${w * 0.5}" cy="${h * 0.5}" r="80" fill="#141018" stroke="${p.glow}" stroke-width="4"/><circle cx="${w * 0.5}" cy="${h * 0.5}" r="45" fill="none" stroke="${p.warm}" stroke-width="3"/><circle cx="${w * 0.5}" cy="${h * 0.5}" r="10" fill="${p.accent}" opacity="0.55"/>` },
    poker: { object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.35}" width="140" height="110" rx="8" fill="#1a1408" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.4}" y="${h * 0.48}" width="30" height="40" fill="#12141a"/><rect x="${w * 0.55}" y="${h * 0.48}" width="30" height="40" fill="#12141a"/><circle cx="${w * 0.5}" cy="${h * 0.7}" r="12" fill="${p.warm}" opacity="0.4"/>` },
  };
  for (const [id, meta] of Object.entries(CASINO_TABLES)) {
    const pal = PAL.casino;
    const svg = interiorSvg(1024, 1024, pal, {
      shelves: false,
      window: false,
      seed: id.length * 15,
      object: meta.object(1024, 1024, pal),
    });
    results.push(await writeWebp(`casino/${id}.webp`, svg, 1024, 1024));
  }

  // Bank / city / UI / hospital / jail / profile heroes (referenced by pages)
  {
    const pal = PAL.civic;
    const svg = interiorSvg(W, H, pal, {
      shelves: true,
      window: true,
      seed: 98,
      object: `<rect x="${W * 0.35}" y="${H * 0.4}" width="120" height="90" fill="#12141a" stroke="${pal.glow}" stroke-width="2"/>
        <circle cx="${W * 0.55}" cy="${H * 0.55}" r="22" fill="none" stroke="${pal.accent}" stroke-width="3"/>
        <circle cx="${W * 0.55}" cy="${H * 0.55}" r="6" fill="${pal.warm}"/>`,
    });
    results.push(await writeWebp("bank/hero.webp", svg, W, H));
  }
  {
    const pal = PAL.glassrow;
    const svg = sceneSvg(W, H, pal, {
      seed: 99,
      layout: "street",
      density: 1.6,
      ground: 0.7,
      blobs: [
        [W * 0.25, H * 0.2, 140, pal.glow, 0.4],
        [W * 0.75, H * 0.28, 110, pal.accent, 0.3],
      ],
      extras: `<rect x="${W * 0.55}" y="${H * 0.2}" width="${W * 0.3}" height="${H * 0.5}" fill="#10141a" stroke="${pal.glow}" stroke-width="2" opacity="0.85"/>`,
    });
    results.push(await writeWebp("city/skyline.webp", svg, W, H));
  }
  {
    const pal = PAL.safe;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#0a0a0e"/>
  <rect x="70" y="90" width="116" height="90" rx="8" fill="#12141a" stroke="${pal.accent}" stroke-width="3"/>
  <circle cx="128" cy="135" r="18" fill="none" stroke="${pal.glow}" stroke-width="3"/>
  <rect x="118" y="150" width="20" height="18" fill="${pal.warm}" opacity="0.5"/>
  <rect x="100" y="60" width="56" height="40" rx="6" fill="#101218" stroke="${pal.accent}" stroke-width="2"/>
</svg>`;
    results.push(await writeWebp("ui/locked.webp", svg, 256, 256));
  }
  {
    const pal = PAL.clinic;
    const svg = interiorSvg(W, H, pal, {
      shelves: false,
      window: true,
      seed: 100,
      object: `<rect x="${W * 0.35}" y="${H * 0.4}" width="140" height="80" fill="#121820" stroke="${pal.glow}" stroke-width="2"/>
        <rect x="${W * 0.55}" y="${H * 0.52}" width="22" height="6" fill="${pal.accent}" opacity="0.55"/>
        <rect x="${W * 0.6}" y="${H * 0.48}" width="6" height="22" fill="${pal.accent}" opacity="0.55"/>`,
    });
    results.push(await writeWebp("hospital/hero.webp", svg, W, H));
    results.push(await writeWebp("hospital/ward.webp", svg, W, H));
  }
  {
    const pal = PAL.civic;
    const svg = sceneSvg(W, H, pal, {
      seed: 101,
      layout: "corridor",
      rainOn: false,
      extras: `<rect x="${W * 0.35}" y="${H * 0.35}" width="40" height="120" fill="#12141a" stroke="${pal.accent}" stroke-width="2"/>
        <rect x="${W * 0.55}" y="${H * 0.35}" width="40" height="120" fill="#101218" stroke="${pal.glow}" stroke-width="2"/>`,
    });
    results.push(await writeWebp("jail/hero.webp", svg, W, H));
    results.push(await writeWebp("jail/block.webp", svg, W, H));
  }

  // Leisure relief scenes
  const LEISURE = {
    dive_bar: { pal: "oldcommons", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.2}" y="${h * 0.5}" width="200" height="20" fill="#1a1c22"/><ellipse cx="${w * 0.4}" cy="${h * 0.45}" rx="20" ry="8" fill="${p.warm}" opacity="0.35"/><rect x="${w * 0.55}" y="${h * 0.35}" width="60" height="70" fill="#121018" stroke="${p.accent}" stroke-width="1"/>` },
    cafe_sit: { pal: "glassrow", layout: "counter", object: (w, h, p) => `<ellipse cx="${w * 0.4}" cy="${h * 0.48}" rx="28" ry="10" fill="${p.warm}" opacity="0.25"/><rect x="${w * 0.55}" y="${h * 0.4}" width="50" height="40" fill="#12141a" stroke="${p.glow}" stroke-width="1"/>` },
    clinic_chair: { pal: "clinic", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.35}" y="${h * 0.4}" width="120" height="70" fill="#121820" stroke="${p.glow}" stroke-width="2"/><rect x="${w * 0.48}" y="${h * 0.52}" width="20" height="6" fill="${p.accent}" opacity="0.5"/>` },
    therapy: { pal: "ashcourt", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.3}" y="${h * 0.5}" width="100" height="40" fill="#14161c" stroke="${p.accent}" stroke-width="1"/><rect x="${w * 0.55}" y="${h * 0.4}" width="70" height="60" fill="#12141a" stroke="${p.glow}" stroke-width="1"/>` },
    cot_rest: { pal: "safe", layout: "interior", object: (w, h, p) => `<rect x="${w * 0.2}" y="${h * 0.55}" width="180" height="40" fill="#14161c" stroke="${p.accent}" stroke-width="2"/><rect x="${w * 0.25}" y="${h * 0.48}" width="50" height="20" fill="#1a1c22"/>` },
  };
  for (const [id, meta] of Object.entries(LEISURE)) {
    const pal = PAL[meta.pal];
    const svg = sceneSvg(1024, 1024, pal, {
      layout: meta.layout ?? "interior",
      seed: id.length * 23 + 2,
      ground: 0.78,
      rainOn: false,
      blobs: [
        [220, 200, 100, pal.glow, 0.3],
        [800, 280, 80, pal.accent, 0.25],
      ],
      extras: meta.object(1024, 1024, pal),
    });
    results.push(await writeWebp(`leisure/${id}.webp`, svg, 1024, 1024));
  }

  {
    const pal = PAL.spireyard;
    const svg = portraitSvg(W, H, pal, "civilian");
    results.push(await writeWebp("profile/hero.webp", svg, W, H));
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
