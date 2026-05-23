#!/usr/bin/env node
/**
 * Auto-fix SEO meta issues flagged in the audit:
 *  - META_DESCRIPTION_TOO_LONG  -> trim snippet to ~155 chars at word boundary
 *  - META_DESCRIPTION_TOO_SHORT -> pad snippet from description field when longer & better; else leave
 *  - TITLE_TOO_LONG             -> trim title to ~60 chars at word boundary
 *  - DUPLICATE_TITLE            -> append " — <year>" disambiguator if year in slug
 *
 * Frontmatter fields touched: title, snippet, description
 */
const fs = require("fs");
const path = require("path");

const BLOG_DIR = path.join(__dirname, "..", "src", "content", "blog");

const SHORT_MIN = 120;
const DESC_MAX = 160;
const DESC_TARGET = 155;
const TITLE_MAX = 60;
const TITLE_TARGET = 58;

function readList(p) {
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

const tooLong = new Set(readList("/tmp/too-long.txt").map(urlToSlug));
const tooShort = new Set(readList("/tmp/too-short.txt").map(urlToSlug));
const titleLong = new Set(readList("/tmp/title-long.txt").map(urlToSlug));
const dupTitle = new Set(readList("/tmp/dup-title.txt").map(urlToSlug));

function urlToSlug(u) {
  const m = u.match(/\/blog\/([^/?#]+)/);
  return m ? m[1] : null;
}

function trimAtWord(s, target, max) {
  if (s.length <= max) return s;
  let out = s.slice(0, target);
  const lastSpace = out.lastIndexOf(" ");
  if (lastSpace > target - 30) out = out.slice(0, lastSpace);
  out = out.replace(/[\s,;:.\-—]+$/, "");
  return out + ".";
}

// Parse a quoted or unquoted YAML scalar value
function parseScalar(raw) {
  let v = raw.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}
function quote(v) {
  return '"' + v.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

const stats = {
  scanned: 0,
  trimDesc: 0,
  trimTitle: 0,
  padDesc: 0,
  dupResolved: 0,
  skipped: [],
};

const files = fs.readdirSync(BLOG_DIR).filter((f) => /\.(md|mdx)$/.test(f));
for (const file of files) {
  const slug = file.replace(/\.(md|mdx)$/, "");
  const isLong = tooLong.has(slug);
  const isShort = tooShort.has(slug);
  const isTitleLong = titleLong.has(slug);
  const isDup = dupTitle.has(slug);
  if (!isLong && !isShort && !isTitleLong && !isDup) continue;

  const full = path.join(BLOG_DIR, file);
  const src = fs.readFileSync(full, "utf8");
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) {
    stats.skipped.push(`${file}: no frontmatter`);
    continue;
  }
  stats.scanned++;
  let fm = m[1];
  let changed = false;

  // Extract current title / snippet / description
  const titleM = fm.match(/^title:\s*(.+)$/m);
  const snippetM = fm.match(/^snippet:\s*(.+)$/m);
  const descM = fm.match(/^description:\s*(.+)$/m);

  const title = titleM ? parseScalar(titleM[1]) : "";
  const snippet = snippetM ? parseScalar(snippetM[1]) : "";
  const description = descM ? parseScalar(descM[1]) : "";

  // ---- Title too long ----
  if (isTitleLong && title.length > TITLE_MAX) {
    let nt = trimAtWord(title, TITLE_TARGET, TITLE_MAX);
    // Don't end title with period
    nt = nt.replace(/\.+$/, "");
    if (nt && nt !== title) {
      fm = fm.replace(/^title:\s*.+$/m, `title: ${quote(nt)}`);
      changed = true;
      stats.trimTitle++;
    }
  }

  // ---- Meta description too long ----
  if (isLong && snippet.length > DESC_MAX) {
    const ns = trimAtWord(snippet, DESC_TARGET, DESC_MAX);
    if (ns && ns !== snippet) {
      fm = fm.replace(/^snippet:\s*.+$/m, `snippet: ${quote(ns)}`);
      changed = true;
      stats.trimDesc++;
    }
  }

  // ---- Meta description too short: try to use description if longer & in range ----
  if (isShort && snippet.length < SHORT_MIN && description && description !== snippet) {
    let candidate = description;
    if (candidate.length > DESC_MAX) candidate = trimAtWord(candidate, DESC_TARGET, DESC_MAX);
    if (candidate.length >= SHORT_MIN && candidate.length <= DESC_MAX) {
      fm = fm.replace(/^snippet:\s*.+$/m, `snippet: ${quote(candidate)}`);
      changed = true;
      stats.padDesc++;
    } else {
      stats.skipped.push(`${slug}: snippet ${snippet.length}c, description ${description.length}c — manual`);
    }
  }

  // ---- Duplicate title across pages ----
  if (isDup) {
    const yearM = slug.match(/-(20\d{2})(?:-|$)/);
    if (yearM && !title.includes(yearM[1])) {
      const nt = `${title.replace(/\.+$/, "")} (${yearM[1]})`;
      const finalTitle = nt.length > TITLE_MAX ? trimAtWord(nt, TITLE_TARGET, TITLE_MAX).replace(/\.+$/, "") : nt;
      fm = fm.replace(/^title:\s*.+$/m, `title: ${quote(finalTitle)}`);
      changed = true;
      stats.dupResolved++;
    } else {
      stats.skipped.push(`${slug}: duplicate title needs manual disambiguation`);
    }
  }

  if (changed) {
    const out = src.replace(/^---\r?\n[\s\S]*?\r?\n---/, `---\n${fm}\n---`);
    fs.writeFileSync(full, out);
  }
}

console.log(JSON.stringify(stats, null, 2));
