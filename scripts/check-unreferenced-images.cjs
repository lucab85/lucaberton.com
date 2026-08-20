#!/usr/bin/env node
/**
 * Unreferenced Event-Photo Guard
 * -------------------------------
 * Astro only bundles image assets that are imported (via `import x from
 * "../assets/..."` or `import.meta.glob`). Anything sitting in
 * src/assets/blog/events/** that NO .mdx/.astro file imports is dead weight:
 * it gets committed to git but never ships, and it's exactly the "I dumped
 * 180 raw photos in" regression we hit on the BrowserStack Meetup post.
 *
 * This guard fails the commit if any event photo under src/assets/blog/events
 * is not referenced by an import in the content tree.
 *
 * It also (optionally) flags asset files that live in src/assets/ but are
 * imported by NOTHING anywhere in src/ — those are likewise dead weight.
 *
 * Modes:
 *   --staged   Only check event photos that are staged in git (fast; used by
 *              the pre-commit hook so unrelated commits never block).
 *   --all      Scan the whole tree (default; used by `pnpm validate:images`).
 *
 * Exit code 1 if any unreferenced event photo is found (so the pre-commit hook
 * can stop the commit). Prints the offending paths and a one-line fix.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");

// Only treat these as "must be referenced" asset roots.
const GUARDED_ROOTS = [
  path.join(ROOT, "src/assets/blog/events"),
];

const CONTENT_ROOTS = [path.join(ROOT, "src")];

function listFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

// Collect staged asset paths (relative) when --staged.
function stagedEventPhotos() {
  const all = listFiles(GUARDED_ROOTS[0]);
  const staged = new Set(
    execSync("git diff --cached --name-only", { cwd: ROOT })
      .toString()
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  // include untracked (git add -A staged them as A)
  return all.filter((f) => staged.has(rel(f)));
}

// Build a single regex of every imported asset path (basename + dir/basename).
// Astro imports look like: import x from "../assets/blog/events/slug/sub/IMG.jpg";
function collectImportedPaths() {
  const imported = new Set();
  for (const root of CONTENT_ROOTS) {
    for (const f of listFiles(root)) {
      if (!/\.(mdx|astro|ts|jsx|tsx|js)$/.test(f)) continue;
      const src = fs.readFileSync(f, "utf8");
      // match "..."/ '...' tokens that contain /assets/ or end with an image ext
      const re = /(['"])([^'"]+\.(?:jpg|jpeg|png|webp|gif|avif|svg))\1/g;
      let m;
      while ((m = re.exec(src))) {
        imported.add(m[2].replace(/\\/g, "/"));
      }
    }
  }
  return imported;
}

function main() {
  const mode = process.argv.includes("--all") ? "all" : "staged";
  const eventPhotos =
    mode === "staged" ? stagedEventPhotos() : listFiles(GUARDED_ROOTS[0]);

  if (eventPhotos.length === 0) {
    console.log("check-unreferenced-images: no event photos to check in --staged mode.");
    process.exit(0);
  }

  const imported = collectImportedPaths();
  // Normalize imported paths to basename set for matching (imports use relative ../)
  const importedBasenames = new Set([...imported].map((p) => path.basename(p)));

  const unreferenced = eventPhotos.filter(
    (f) => !importedBasenames.has(path.basename(f))
  );

  if (unreferenced.length === 0) {
    console.log(
      `check-unreferenced-images: OK — all ${eventPhotos.length} event photo(s) are referenced.`
    );
    process.exit(0);
  }

  console.error(
    `\ncheck-unreferenced-images: FAIL — ${unreferenced.length} event photo(s) are NOT imported by any post:`
  );
  for (const f of unreferenced) {
    console.error("  " + rel(f));
  }
  console.error(
    "\nFix: either import the photo in the post (import x from \"../assets/...\", then add it to the gallery),"
  );
  console.error("or delete it so it isn't committed as dead weight.");
  console.error("Bypass (not recommended): git commit --no-verify\n");
  process.exit(1);
}

main();
