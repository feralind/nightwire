import fs from "node:fs";
import path from "node:path";

function walk(dir, base = "public", out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, base, out);
    else out.push("/" + path.relative(base, p).replace(/\\/g, "/"));
  }
  return out;
}

function scanSrc(dir, refs = new Set()) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) scanSrc(p, refs);
    else if (/\.(ts|tsx|css|js|jsx)$/.test(ent.name)) {
      const t = fs.readFileSync(p, "utf8");
      for (const m of t.matchAll(/["'`](\/art\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g))["'`]/g)) {
        refs.add(m[1]);
      }
    }
  }
  return refs;
}

const existing = new Set(walk("public"));
const refs = scanSrc("src");
const missing = [...refs].filter((r) => !existing.has(r)).sort();
const present = [...refs].filter((r) => existing.has(r)).sort();
const orphanArt = [...existing].filter((x) => x.startsWith("/art/") && !refs.has(x)).sort();

fs.writeFileSync("art-missing.txt", missing.join("\n"));
fs.writeFileSync(
  "art-existing.txt",
  [...existing].filter((x) => x.startsWith("/art/")).sort().join("\n")
);
fs.writeFileSync("art-orphans.txt", orphanArt.join("\n"));

console.log(JSON.stringify({ refs: refs.size, present: present.length, missing: missing.length, orphans: orphanArt.length }, null, 2));
console.log("MISSING:\n" + missing.join("\n"));
