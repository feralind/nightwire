/**
 * Compress Nightwire public/art for the web.
 * Converts PNG → WebP (q≈82), resizes scenes to ≤1280w and portraits to ≤640w,
 * then removes the original PNG. Re-run after dropping new PNG sources.
 *
 * Usage: npm run compress-art
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/art");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(png|jpe?g|webp)$/i.test(ent.name)) out.push(p);
  }
  return out;
}

function maxWidthFor(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel.startsWith("npcs/") || (rel.startsWith("contacts/") && !/hero\./.test(rel))) {
    return 640;
  }
  if (rel.startsWith("ui/")) return 256;
  return 1280;
}

async function compressOne(file) {
  const before = fs.statSync(file).size;
  const maxW = maxWidthFor(file);
  const meta = await sharp(file).metadata();
  const needsResize = (meta.width ?? 0) > maxW;
  const outPath = file.replace(/\.(png|jpe?g|webp)$/i, ".webp");

  let pipeline = sharp(file).rotate();
  if (needsResize) {
    pipeline = pipeline.resize({ width: maxW, withoutEnlargement: true });
  }

  const buf = await pipeline
    .webp({
      quality: 82,
      alphaQuality: 90,
      effort: 5,
    })
    .toBuffer();

  fs.writeFileSync(outPath, buf);
  if (path.resolve(outPath) !== path.resolve(file)) {
    fs.unlinkSync(file);
  }

  const after = fs.statSync(outPath).size;
  return {
    file: path.relative(ROOT, outPath).replace(/\\/g, "/"),
    before,
    after,
    maxW,
    resized: needsResize,
  };
}

const files = walk(ROOT).filter((f) => !f.toLowerCase().endsWith(".webp") || true);
// Prefer compressing remaining PNG/JPEG; also recompress existing webp once
const targets = walk(ROOT).filter((f) => /\.(png|jpe?g)$/i.test(f) || /\.webp$/i.test(f));
// Deduplicate: if both png and webp exist, only process png (webp deleted after)
const pngs = targets.filter((f) => /\.(png|jpe?g)$/i.test(f));
const webpsOnly = targets.filter(
  (f) => /\.webp$/i.test(f) && !fs.existsSync(f.replace(/\.webp$/i, ".png")),
);
const queue = [...pngs, ...webpsOnly];

let totalBefore = 0;
let totalAfter = 0;

for (const file of queue) {
  const r = await compressOne(file);
  totalBefore += r.before;
  totalAfter += r.after;
  const pct = r.before ? (((r.before - r.after) / r.before) * 100).toFixed(0) : "0";
  console.log(
    `${r.file.padEnd(36)} ${(r.before / 1024).toFixed(0).padStart(6)}KB → ${(r.after / 1024).toFixed(0).padStart(5)}KB  (−${pct}%)  maxW=${r.maxW}${r.resized ? " resized" : ""}`,
  );
}

console.log("---");
console.log(
  `TOTAL  ${(totalBefore / 1024 / 1024).toFixed(2)} MB → ${(totalAfter / 1024 / 1024).toFixed(2)} MB  (−${totalBefore ? (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0) : 0}%)`,
);
console.log(`Processed: ${queue.length}`);
