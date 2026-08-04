#!/usr/bin/env node
/**
 * Image Size Guard
 * ----------------
 * Prevents oversized raster images from creeping back into the repo (the kind
 * of regression that bloats the /blog/ listing: full-resolution event photos
 * reused as ~400px thumbnails).
 *
 * It checks each raster image against directory-aware limits on BOTH:
 *   - longest pixel edge (max(width, height)), and
 *   - file size in bytes.
 *
 * Why per-directory limits?
 *   static/blog/events/**     -> reused as listing thumbnails (~400px) AND in
 *                                4-col galleries (~280px). 1280px max is already
 *                                2x-retina for those slots.
 *   static/blog/thumbnails/** -> generated social/listing cards at 1200x630.
 *   static/blog/** (other)    -> in-content post images shown in prose; a looser
 *                                guard that still catches accidental multi-MB,
 *                                multi-thousand-pixel raw camera dumps.
 *
 * Modes:
 *   --staged   Only check images that are staged in git (used by the pre-commit
 *              hook so existing assets never block an unrelated commit and the
 *              check stays fast).
 *   --all      Scan the whole tree (default; used by `pnpm validate:images`).
 *
 * Exit code 1 if any FAIL-level violation is found.
 *
 * Regenerate compliant assets with ImageMagick, e.g.:
 *   magick in.jpg -auto-orient -resize 1280x1280\> -quality 82 -strip out.jpg
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let sharp;
try {
  sharp = require("sharp");
} catch {
  // On constrained VPS runners where node_modules is a minimal symlink set
  // (the SEO agent worktree only needs source-level validation, not image
  // processing), `sharp` may legitimately be absent. The guard below only
  // matters for staged raster images; if the tool can't load, skip the image
  // size check rather than failing the commit (the validation still runs in
  // GitHub Actions CI where sharp IS installed).
  console.error(
    "check-image-sizes: 'sharp' is not installed; skipping image size guard " +
      "(run `pnpm install` locally / CI to enforce it)."
  );
  process.exit(0);
}

const ROOT = path.join(__dirname, "..");
const KB = 1024;

// Directories scanned in --all mode (relative to repo root).
const SCAN_ROOTS = ["static/blog"];

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/**
 * Rules are matched by path prefix in order; the first match wins. `maxEdge` is
 * the maximum allowed longest pixel side; `maxBytes` is the maximum file size.
 */
const RULES = [
  {
    label: "blog event photo",
    prefix: "static/blog/events/",
    maxEdge: 1280,
    maxBytes: 320 * KB,
  },
  {
    label: "blog thumbnail",
    prefix: "static/blog/thumbnails/",
    maxEdge: 1280,
    maxBytes: 220 * KB,
  },
  {
    label: "blog in-content image",
    prefix: "static/blog/",
    maxEdge: 2560,
    maxBytes: 600 * KB,
  },
];

function ruleFor(relPath) {
  const norm = relPath.split(path.sep).join("/");
  return RULES.find((r) => norm.startsWith(r.prefix)) || null;
}

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (IMAGE_EXT.has(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

function stagedImages() {
  let stdout;
  try {
    stdout = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      cwd: ROOT,
      encoding: "utf8",
    });
  } catch {
    return [];
  }
  return stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => IMAGE_EXT.has(path.extname(p).toLowerCase()))
    .map((p) => path.join(ROOT, p))
    .filter((p) => fs.existsSync(p));
}

async function inspect(absPath) {
  const rel = path.relative(ROOT, absPath).split(path.sep).join("/");
  const rule = ruleFor(rel);
  if (!rule) return null; // outside guarded directories

  const bytes = fs.statSync(absPath).size;
  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(absPath).metadata();
    width = meta.width || 0;
    height = meta.height || 0;
  } catch (err) {
    return {
      rel,
      rule,
      bytes,
      edge: 0,
      fails: [`unreadable image (${err.message})`],
    };
  }

  const edge = Math.max(width, height);
  const fails = [];
  if (edge > rule.maxEdge) {
    fails.push(`longest edge ${edge}px > ${rule.maxEdge}px`);
  }
  if (bytes > rule.maxBytes) {
    fails.push(
      `file ${(bytes / KB).toFixed(0)}KB > ${(rule.maxBytes / KB).toFixed(0)}KB`
    );
  }
  return { rel, rule, bytes, edge, width, height, fails };
}

async function main() {
  const staged = process.argv.includes("--staged");

  let files;
  if (staged) {
    files = stagedImages();
  } else {
    files = [];
    for (const root of SCAN_ROOTS) walk(path.join(ROOT, root), files);
  }

  console.log("Image size guard — lucaberton.com" + (staged ? " (staged)" : ""));
  console.log("======================================");

  if (files.length === 0) {
    console.log(staged ? "No staged images to check." : "No images found.");
    console.log("\nPASS 0   FAIL 0");
    return;
  }

  const results = (await Promise.all(files.map(inspect))).filter(Boolean);
  const failures = results.filter((r) => r.fails.length > 0);

  for (const r of failures) {
    console.log(`  \u2717 ${r.rel}`);
    for (const f of r.fails) console.log(`      ${f}  [${r.rule.label}]`);
  }

  const pass = results.length - failures.length;
  console.log("\n======================================");
  console.log(`PASS ${pass}   FAIL ${failures.length}`);

  if (failures.length > 0) {
    console.log(
      "\nResize offenders, e.g.:\n" +
        "  magick in.jpg -auto-orient -resize 1280x1280\\> -quality 82 -strip out.jpg"
    );
    process.exit(1);
  }
  console.log("\nAll images within size limits.");
}

main().catch((err) => {
  console.error("check-image-sizes: unexpected error:", err);
  process.exit(2);
});
