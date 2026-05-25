#!/usr/bin/env node
/**
 * Add trailing slash to internal markdown links missing one.
 * Pattern: ](/path/without/trailing/slash) -> ](/path/without/trailing/slash/)
 * Skips: asset files (.jpg|.png|.svg|.webp|.pdf|...), anchors (#), query (?), already-slashed.
 *
 * Usage:
 *   node scripts/fix-trailing-slash.cjs           # dry-run (no files modified)
 *   node scripts/fix-trailing-slash.cjs --write   # actually write changes
 */
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");

const DIRS = ["src/content/blog", "src/content"];
const ASSET_EXT = /\.(jpg|jpeg|png|svg|webp|gif|pdf|xml|txt|ico|css|js|mp4|json|md|mdx|ya?ml|csv|zip|tar|gz|woff2?|ttf|eot|wasm|map|html?)$/i;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(md|mdx|astro)$/i.test(e.name)) out.push(p);
  }
  return out;
}

let totalChanges = 0;
let filesChanged = 0;
const files = [...new Set(DIRS.flatMap((d) => walk(d)))];

for (const f of files) {
  let src = fs.readFileSync(f, "utf8");
  let changes = 0;
  // Markdown link: ](/internal-path) where path doesn't end in / or .ext, no # or ?
  src = src.replace(/\]\((\/[^)\s#?]*)\)/g, (m, urlPath) => {
    if (urlPath.endsWith("/")) return m;
    if (ASSET_EXT.test(urlPath)) return m;
    // Skip if path looks like a file (last segment contains a dot)
    const last = urlPath.split("/").pop();
    if (last.includes(".")) return m;
    changes++;
    return `](${urlPath}/)`;
  });
  if (changes > 0) {
    if (WRITE) fs.writeFileSync(f, src);
    totalChanges += changes;
    filesChanged++;
  }
}

console.log(JSON.stringify({
  mode: WRITE ? "write" : "dry-run",
  filesScanned: files.length,
  filesChanged,
  totalChanges,
  hint: WRITE ? undefined : "Re-run with --write to apply changes.",
}, null, 2));
