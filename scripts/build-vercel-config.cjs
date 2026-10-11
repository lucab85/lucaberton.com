#!/usr/bin/env node
/**
 * Vercel routing (redirects + headers) from the files the site already keeps.
 *
 * static/_redirects and static/_headers are the source of truth (the SEO
 * validator reads them), but they are Netlify / Cloudflare Pages syntax and
 * Vercel ignores both. This script translates them into vercel.json
 * `redirects` / `headers`, adds a real 301 for every meta-refresh redirect
 * stub found in the built site, and merges the result into vercel.json.
 *
 *   node scripts/build-vercel-config.cjs                  # check public/, print summary
 *   node scripts/build-vercel-config.cjs --write          # merge into ./vercel.json
 *   node scripts/build-vercel-config.cjs --dir public --out vercel.json --write
 *
 * Semantics kept from _redirects (Netlify): a rule never shadows a real page.
 * Vercel applies redirects BEFORE the filesystem, so rules whose pattern would
 * match a real built page are narrowed (wildcards) or dropped (exact paths).
 * Meta-refresh stubs are not real pages: their path always gets the 301.
 *
 * Trailing slashes: vercel.json `trailingSlash: true` runs before custom
 * redirects (/old -> /old/ -> /new = two hops). It is replaced by equivalent
 * rules appended AFTER the custom redirects, so every legacy URL is one hop.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const DIST = path.resolve(ROOT, opt("--dir", "public"));
const OUT = path.resolve(ROOT, opt("--out", "vercel.json"));
const WRITE = args.includes("--write");

// Delivered by the Cloudflare edge for the whole zone. Sending them from Vercel
// too would duplicate them; two CSP headers are BOTH enforced, and the stale
// CSP in _headers lacks r.lucaberton.com (PostHog) and Web3Forms.
const EDGE_OWNED_HEADERS = new Set([
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
]);
// Vercel rejects configs above this many routes; stay well under it.
const MAX_REDIRECTS = 1024;

const errors = [];
const notes = [];

// ---------------------------------------------------------------- built site

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const REFRESH_RE = /<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*>/i;
const REFRESH_URL_RE = /content=["']?\s*0\s*;\s*url=([^"'>\s]+)/i;

/** url path -> { stub: boolean, target?: string } for every built file. */
function scanDist() {
  const pages = new Map();
  for (const file of walk(DIST)) {
    const rel = path.relative(DIST, file).split(path.sep).join("/");
    const url = rel === "index.html" ? "/" : rel.endsWith("/index.html") ? `/${rel.slice(0, -10)}` : `/${rel}`;
    let stub = false;
    let target;
    if (rel.endsWith(".html") && rel !== "404.html") {
      const head = fs.readFileSync(file, "utf8").slice(0, 4096);
      const tag = head.match(REFRESH_RE);
      const m = tag && tag[0].match(REFRESH_URL_RE);
      if (m) {
        stub = true;
        target = m[1].replace(/^https?:\/\/(www\.)?lucaberton\.com/i, "") || "/";
      }
    }
    pages.set(url, { stub, target });
  }
  return pages;
}

// ----------------------------------------------------------------- redirects

/** Page-like destinations get a trailing slash so they land in one hop. */
function normalizeDestination(dest) {
  if (/^https?:\/\//.test(dest) || dest.includes("?") || dest.includes("#")) return dest;
  if (dest.endsWith("/") || /\.[a-z0-9]+$/i.test(dest)) return dest;
  return `${dest}/`;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// path-to-regexp treats these as syntax; escape them in literal segments.
const escapePtr = (s) => s.replace(/[(){}?+*:\\]/g, "\\$&");

/** Netlify pattern -> JS regex over a URL path (trailing slash optional). */
function netlifyToRegex(from) {
  const base = from.length > 1 ? from.replace(/\/$/, "") : from;
  return new RegExp(`^${base.split("*").map(escapeRe).join("(.*)")}/?$`);
}

/**
 * Netlify pattern -> Vercel (path-to-regexp) source. Splats become named
 * params; the first one carries `exclude` (regex fragments for path remainders
 * that must NOT match, i.e. real pages).
 */
function netlifyToSource(from, exclude = []) {
  const base = from.length > 1 ? from.replace(/\/$/, "") : from;
  const parts = base.split("*");
  if (parts.length === 1) return base === "/" ? "/" : `${escapePtr(base)}{/}?`;
  let src = escapePtr(parts[0]);
  for (let i = 1; i < parts.length; i++) {
    const name = i === 1 ? "splat" : `splat${i}`;
    const look = i === 1 && exclude.length ? `(?!(?:${exclude.join("|")}))` : "";
    // A trailing splat stops before an optional slash, so "/x/" captures "x"
    // and ":splat/" destinations never get a double slash.
    const last = i === parts.length - 1 && parts[i] === "";
    const lazy = parts.length === 2 ? ".+?" : ".*?"; // "/old/" itself is the bare rule
    src += last ? `:${name}(${look}${lazy}){/}?` : `:${name}(${look}.*)${escapePtr(parts[i])}`;
  }
  return src;
}

/** "/old/*" -> "/old": the URL a trailing splat matches with an empty capture. */
function bareSource(from) {
  const base = from.replace(/\/$/, "");
  if (!base.endsWith("*") || base.indexOf("*") !== base.length - 1) return null;
  const prefix = base.slice(0, -1).replace(/\/$/, "");
  return prefix ? `${escapePtr(prefix)}{/}?` : null;
}

function parseRedirects() {
  const rules = [];
  const lines = fs.readFileSync(path.join(ROOT, "static", "_redirects"), "utf8").split("\n");
  lines.forEach((line, i) => {
    const t = line.replace(/#.*/, "").trim();
    if (!t) return;
    const [from, to, status = "301"] = t.split(/\s+/);
    const code = parseInt(status, 10);
    if (!to || ![301, 302, 307, 308].includes(code)) {
      errors.push(`_redirects:${i + 1}: unsupported rule "${t}" (only 30x redirects translate)`);
      return;
    }
    rules.push({ from, to, code, line: i + 1 });
  });
  return rules;
}

function buildRedirects(pages) {
  const realPaths = [...pages].filter(([, p]) => !p.stub).map(([u]) => u);
  const out = [];
  const seen = new Set();
  const push = (source, destination, statusCode) => {
    if (seen.has(source)) return;
    seen.add(source);
    out.push({ source, destination, statusCode });
  };

  // Meta-refresh stubs first: under Netlify semantics an existing file beats
  // any _redirects rule, so the stub's own target is what visitors always got.
  let stubCount = 0;
  const stubTarget = new Map();
  for (const [u, p] of pages) {
    if (!p.stub || u === "/") continue;
    const dest = normalizeDestination(p.target);
    if (dest.replace(/\/$/, "") === u.replace(/\/$/, "")) continue;
    stubTarget.set(netlifyToSource(u), dest);
    push(netlifyToSource(u), dest, 301);
    stubCount++;
  }
  notes.push(`${stubCount} meta-refresh stub page(s) -> 301 to their own target`);
  const deadEnds = [...stubTarget].filter(([, d]) => !/^https?:/.test(d) && !d.includes(":") && !(pages.get(d) && !pages.get(d).stub));
  if (deadEnds.length) {
    notes.push(`${deadEnds.length} stub(s) point at a URL that is not a page (pre-existing 404s): ${deadEnds.slice(0, 4).map(([s, d]) => `${s.replace(/\{\/\}\?$/, "")} -> ${d}`).join(", ")}${deadEnds.length > 4 ? ", …" : ""}`);
  }

  let trailingOnly = 0;
  const reported = new Set();
  for (const r of parseRedirects()) {
    const re = netlifyToRegex(r.from);
    const destination = normalizeDestination(r.to);
    const shadowing = realPaths.filter((u) => re.test(u));
    const bare = bareSource(r.from);
    if (bare) {
      const page = pages.get(`${bare.replace(/\{\/\}\?$/, "")}/`);
      if (!page || page.stub) {
        push(bare, normalizeDestination(r.to.replace(/\/?:splat/g, "") || "/"), r.code);
      }
    }
    if (!r.from.includes("*")) {
      if (shadowing.length) {
        if (normalizeDestination(r.from) === destination) trailingOnly++; // covered by the slash rule
        else notes.push(`skip ${r.from} -> ${r.to} (real page ${shadowing[0]} exists; Netlify would not redirect)`);
        continue;
      }
      // Stub and explicit rule disagree: the explicit rule wins only when it
      // lands on a real page (it is usually the newer, more specific intent).
      const src = netlifyToSource(r.from);
      const stubDest = stubTarget.get(src);
      if (stubDest && stubDest !== destination && !reported.has(src)) {
        reported.add(src);
        const live = pages.get(destination);
        if (live && !live.stub) {
          out.find((x) => x.source === src).destination = destination;
          notes.push(`${r.from}: _redirects (-> ${destination}) wins over stub (-> ${stubDest})`);
        } else {
          notes.push(`${r.from}: stub (-> ${stubDest}) wins; _redirects target ${destination} is not a page`);
        }
      }
    } else if (shadowing.length) {
      // Exclude the real pages from the first splat's match.
      const prefix = r.from.split("*")[0];
      const firstSeg = new Set(shadowing.map((u) => u.slice(prefix.length).split("/")[0] + (u.slice(prefix.length).includes("/") ? "/" : "$")));
      const exclude = [...firstSeg].map((s) => (s.endsWith("$") ? `${escapeRe(s.slice(0, -1))}/?$` : escapeRe(s)));
      notes.push(`narrow ${r.from} to skip ${shadowing.length} real file(s): ${[...firstSeg].slice(0, 3).join(", ")}${firstSeg.size > 3 ? ", …" : ""}`);
      push(netlifyToSource(r.from, exclude), destination, r.code);
      continue;
    }
    push(netlifyToSource(r.from), destination, r.code);
  }

  if (trailingOnly) notes.push(`${trailingOnly} _redirects rule(s) only add a trailing slash (covered by the slash rule)`);

  // trailingSlash: true, re-expressed AFTER the custom redirects (one hop).
  push("/:path((?!\\.well-known/)(?:[^/]+/)*[^/.]+)", "/:path/", 308);
  push("/:path((?:[^/]+/)*[^/]+\\.\\w+)/", "/:path", 308);

  if (out.length > MAX_REDIRECTS) errors.push(`${out.length} redirects exceed the ${MAX_REDIRECTS} limit`);
  return out;
}

// ------------------------------------------------------------------- headers

function buildHeaders() {
  const blocks = [];
  let current = null;
  const lines = fs.readFileSync(path.join(ROOT, "static", "_headers"), "utf8").split("\n");
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: [] };
      blocks.push(current);
      continue;
    }
    const m = line.trim().match(/^([^:]+):\s*(.*)$/);
    if (!current || !m) {
      errors.push(`_headers: cannot parse "${line.trim()}"`);
      continue;
    }
    const key = m[1].trim();
    let value = m[2].trim();
    if (EDGE_OWNED_HEADERS.has(key.toLowerCase())) continue;
    // interest-cohort (FLoC) is dead; Chrome logs a console error for it,
    // which costs the Lighthouse best-practices score.
    if (key.toLowerCase() === "permissions-policy") value = value.replace(/,?\s*interest-cohort=\(\)/, "");
    current.headers.push({ key, value });
  }
  return blocks
    .filter((b) => b.headers.length)
    .map((b) => ({
      // "/x/*" must also match "/x/" and "/x/page/" (every page URL ends in a slash).
      source: b.pattern === "/*" ? "/(.*)" : b.pattern.endsWith("/*") ? `${escapePtr(b.pattern.slice(0, -2))}{/:path(.*)}?` : escapePtr(b.pattern),
      headers: b.headers,
    }));
}

// ---------------------------------------------------------------------- main

if (!fs.existsSync(DIST)) {
  console.error(`build-vercel-config: ${path.relative(ROOT, DIST)}/ not found; run the build first.`);
  process.exit(1);
}

const pages = scanDist();
const redirects = buildRedirects(pages);
const headers = buildHeaders();

const config = JSON.parse(fs.readFileSync(OUT, "utf8"));
const keep = (config.redirects || []).filter((r) => !redirects.some((x) => x.source.replace(/\{\/\}\?$/, "") === r.source));
delete config.trailingSlash;
config.redirects = [...keep.map((r) => ({ ...r, source: netlifyToSource(r.source) })), ...redirects];
config.headers = headers;

console.log(`build-vercel-config: ${pages.size} built files, ${[...pages.values()].filter((p) => p.stub).length} redirect stubs`);
console.log(`  redirects: ${config.redirects.length}   header rules: ${headers.length}`);
for (const n of notes) console.log(`  · ${n}`);
for (const e of errors) console.error(`  ✗ ${e}`);
if (errors.length) process.exit(1);

if (WRITE) {
  fs.writeFileSync(OUT, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`  wrote ${path.relative(ROOT, OUT)}`);
}
