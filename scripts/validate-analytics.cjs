#!/usr/bin/env node
/**
 * Analytics taxonomy validator
 * ----------------------------
 * Catches tracking mistakes at commit/CI time instead of in GA4 weeks later.
 * Source of truth: src/config/analytics-taxonomy.json (+ topic clusters from
 * src/utils/topicCluster.ts and target offers derived from serviceMatches.ts).
 *
 * Checks (FAIL blocks the commit, WARN does not):
 *   1. data-track-event / -pageview- / -start- / -submit-event values are known events  FAIL
 *   2. data-tp-* params: required present, values in vocabulary/pattern                FAIL
 *      unknown param for that event                                                    WARN
 *   3. Spec-style attributes the tracker cannot read (data-target-offer, ...)          FAIL
 *   4. data-tp-* on an element with no tracking event (dead attributes)                WARN
 *   5. Calendly links in components/pages/layouts without tracking                     FAIL
 *      (spread attributes / dynamic data-track-event cannot be verified)              WARN
 *   6. <BlogPromoCard variant="..."> must be a variant the component defines           FAIL
 *   7. src/utils/blogConsultingCtas.ts (per-post consulting offers): offer/variant
 *      values valid, every key is a real post slug                                     FAIL
 *   8. role="button" on tracked <a> links                                              WARN
 *   9. docs/analytics-events.md drift vs the taxonomy (events, positions)              WARN
 *
 * The markup scanner is quote- and brace-aware (JSX expressions, arrows and
 * '>' inside values do not end a tag), understands unquoted and boolean
 * attributes and {...spreads}, and ignores comments, <script>/<style> bodies,
 * Astro frontmatter and code in posts.
 *
 * Modes: --all (default) scans src/; --staged scans only staged files
 * (derived vocabularies are always loaded from the full tree).
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const STAGED = process.argv.includes("--staged");
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const taxonomy = JSON.parse(fs.readFileSync(path.join(SRC, "config/analytics-taxonomy.json"), "utf8"));

const results = [];
const record = (level, check, detail = "") => results.push({ level, check, detail });
const rel = (p) => path.relative(ROOT, p);

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(astro|mdx|md|tsx|jsx|ts|js)$/.test(e.name)) out.push(p);
  }
  return out;
}
const allFiles = walk(SRC);

let scanFiles = allFiles;
if (STAGED) {
  let stdout = "";
  try {
    stdout = execSync("git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMR", { cwd: ROOT, encoding: "utf8" });
  } catch { /* not a git checkout: fall back to full scan */ }
  const staged = new Set(stdout.split("\n").map((s) => s.trim()).filter(Boolean).map((s) => path.join(ROOT, s)));
  scanFiles = allFiles.filter((f) => staged.has(f));
}

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------
const EVENTS = taxonomy.events;
const PARAMS = taxonomy.params;
const PAGEVIEW_EVENTS = new Set(["email_signup", "booked_call"]);
const isEvent = (name) => typeof name === "string" && hasOwn(EVENTS, name);

const topicClusterSrc = fs.readFileSync(path.join(SRC, "utils/topicCluster.ts"), "utf8");
const TOPIC_CLUSTERS = new Set(["general", ...[...topicClusterSrc.matchAll(/cluster:\s*['"]([a-z0-9_]+)['"]/g)].map((m) => m[1])]);

const serviceMatchesSrc = fs.readFileSync(path.join(SRC, "utils/serviceMatches.ts"), "utf8");
const slugOfUrl = (u) => u.replace(/[/-]/g, "_").replace(/^_+|_+$/g, "");
const TARGET_OFFERS = new Set([
  ...PARAMS.target_offer.values,
  ...[...serviceMatchesSrc.matchAll(/url:\s*['"]([^'"]+)['"]/g)].map((m) => slugOfUrl(m[1])),
]);

const promoCardSrc = fs.readFileSync(path.join(SRC, "components/BlogPromoCard.astro"), "utf8");
const promoUnion = promoCardSrc.match(/variant\?:\s*([\s\S]*?);/);
const PROMO_VARIANTS = new Set(promoUnion ? [...promoUnion[1].matchAll(/['"]([A-Za-z0-9_]+)['"]/g)].map((m) => m[1]) : []);

const ctaConfigPath = path.join(SRC, "utils/blogConsultingCtas.ts");
const ctaConfigSrc = fs.existsSync(ctaConfigPath) ? fs.readFileSync(ctaConfigPath, "utf8") : "";
// Top-level entries of `blogConsultingCtas` only (2-space indent), not nested keys.
const CTA_KEYS = new Map([...ctaConfigSrc.matchAll(/^ {2}['"]([^'"]+)['"]:\s*\{/gm)].map((m) => [m[1], m.index]));

const SPEC_STYLE_ATTRS = [
  "data-topic-cluster", "data-target-offer", "data-cta-position", "data-cta-variant",
  "data-source-page", "data-destination-url", "data-audience", "data-market-priority",
  "data-company", "data-offer-id",
];

function validateParam(name, value, where) {
  if (!hasOwn(PARAMS, name)) return; // unknown params are reported per event
  const spec = PARAMS[name];
  if (name === "topic_cluster") {
    if (!TOPIC_CLUSTERS.has(value)) record("FAIL", "topic_cluster", `${where}: '${value}' is not a cluster in src/utils/topicCluster.ts`);
    return;
  }
  if (name === "target_offer") {
    if (!TARGET_OFFERS.has(value)) record("FAIL", "target_offer", `${where}: '${value}' — add it to analytics-taxonomy.json or serviceMatches.ts`);
    return;
  }
  if (spec.values && spec.values.includes(value)) return;
  if (spec.forbidden && spec.forbidden.includes(value)) {
    record("FAIL", name, `${where}: '${value}' describes layout, not a copy/offer experiment`);
    return;
  }
  if (spec.pattern) {
    if (!new RegExp(spec.pattern).test(value)) record("FAIL", name, `${where}: '${value}' does not match ${spec.pattern}`);
    return;
  }
  if (spec.values) record("FAIL", name, `${where}: '${value}' not in [${spec.values.join(", ")}]`);
}

function validateTrackedElement(eventName, params, where, { pageview = false } = {}) {
  if (!isEvent(eventName)) {
    record("FAIL", "event name", `${where}: '${eventName}' is not a canonical event (${Object.keys(EVENTS).join(", ")})`);
    return;
  }
  if (pageview && !PAGEVIEW_EVENTS.has(eventName)) {
    record("FAIL", "pageview event", `${where}: '${eventName}' cannot be a pageview conversion (only ${[...PAGEVIEW_EVENTS].join(", ")})`);
  }
  const spec = EVENTS[eventName];
  const known = new Set([...spec.required, ...spec.optional]);
  for (const req of spec.required) {
    if (!hasOwn(params, req)) record("FAIL", "missing param", `${where}: ${eventName} requires data-tp-${req.replace(/_/g, "-")}`);
  }
  for (const [name, value] of Object.entries(params)) {
    if (!known.has(name)) record("WARN", "unknown param", `${where}: data-tp-${name.replace(/_/g, "-")} is not a documented param of ${eventName}`);
    if (value === null) continue; // dynamic expression — cannot validate statically
    validateParam(name, value, where);
  }
}

// ---------------------------------------------------------------------------
// Source preprocessing — blank out non-markup regions, preserving newlines so
// reported line numbers stay correct.
// ---------------------------------------------------------------------------
const blank = (s) => s.replace(/[^\n]/g, " ");

function stripForMarkup(src, file) {
  let out = src;
  const ext = path.extname(file);
  if (ext === ".astro") out = out.replace(/^---\n[\s\S]*?\n---(?=\n|$)/, blank); // frontmatter is TS, not markup
  out = out.replace(/<!--[\s\S]*?-->/g, blank);
  out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, blank);
  out = out.replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi, (m, a, b, c) => a + blank(b) + c);
  out = out.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (m, a, b, c) => a + blank(b) + c);
  if (ext === ".mdx" || ext === ".md") {
    if (out.startsWith("---\n")) out = out.replace(/^---\n[\s\S]*?\n---(?=\n|$)/, blank);
    // Fenced code: a fence closes only with the same char and at least the same length.
    const lines = out.split("\n");
    let fence = null;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\s*(`{3,}|~{3,})/);
      if (fence) {
        if (m && m[1][0] === fence[0] && m[1].length >= fence.length && /^\s*[`~]+\s*$/.test(lines[i])) fence = null;
        lines[i] = blank(lines[i]);
      } else if (m) {
        fence = m[1];
        lines[i] = blank(lines[i]);
      }
    }
    out = lines.join("\n");
    // Indented code blocks exist in Markdown but not in MDX.
    if (ext === ".md") out = out.replace(/(^|\n\n)((?: {4}|\t)[^\n]*(?:\n(?: {4}|\t)[^\n]*)*)/g, (m, a, b) => a + blank(b));
    // Inline code spans (single or multiple backticks, may span one line break).
    out = out.replace(/(`+)(?!`)([\s\S]*?[^`])\1(?!`)/g, (m) => (m.split("\n").length <= 2 ? blank(m) : m));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Quote/brace-aware tag scanner
// ---------------------------------------------------------------------------
function scanTags(src) {
  const tags = [];
  const re = /<([A-Za-z][\w.:-]*)/g;
  let m;
  while ((m = re.exec(src))) {
    const tagName = m[1];
    let i = m.index + m[0].length;
    if (!/[\s/>]/.test(src[i] || "")) continue;
    const attrs = {};
    const dynamic = {}; // attribute name -> expression text, for {expr} values
    const spreads = [];
    let closed = false;
    while (i < src.length) {
      while (/\s/.test(src[i])) i++;
      if (src[i] === ">") { closed = true; i++; break; }
      if (src[i] === "/" && src[i + 1] === ">") { closed = true; i += 2; break; }
      if (src[i] === "<") break; // malformed / stray '<' — stop this tag
      if (src[i] === "{") {
        const end = matchBrace(src, i);
        if (end < 0) break;
        const expr = src.slice(i + 1, end).trim();
        if (expr.startsWith("...")) spreads.push(expr.slice(3).trim());
        i = end + 1;
        continue;
      }
      const nm = src.slice(i).match(/^[^\s=/>"'{}<]+/);
      if (!nm) { i++; continue; }
      const name = nm[0].toLowerCase();
      i += nm[0].length;
      let j = i;
      while (/\s/.test(src[j])) j++;
      if (src[j] !== "=") { attrs[name] = ""; continue; } // boolean attribute
      j++;
      while (/\s/.test(src[j])) j++;
      const q = src[j];
      if (q === '"' || q === "'") {
        const end = src.indexOf(q, j + 1);
        if (end < 0) break;
        attrs[name] = src.slice(j + 1, end);
        i = end + 1;
      } else if (q === "{") {
        const end = matchBrace(src, j);
        if (end < 0) break;
        const lit = literalOf(src.slice(j + 1, end));
        attrs[name] = lit;
        if (lit === null) dynamic[name] = src.slice(j + 1, end);
        i = end + 1;
      } else {
        const uv = src.slice(j).match(/^[^\s>"'=<`]+/);
        attrs[name] = uv ? uv[0] : "";
        i = j + (uv ? uv[0].length : 0);
      }
    }
    if (closed) tags.push({ tagName, attrs, dynamic, spreads, index: m.index });
    re.lastIndex = Math.max(re.lastIndex, i);
  }
  return tags;
}

// Returns the index of the '}' matching the '{' at `start`, skipping strings,
// template literals (with nested ${}) and nested braces; -1 if unbalanced.
function matchBrace(src, start) {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'") {
      const end = src.indexOf(c, i + 1);
      if (end < 0) return -1;
      i = end;
    } else if (c === "`") {
      for (i++; i < src.length && src[i] !== "`"; i++) {
        if (src[i] === "\\") i++;
        else if (src[i] === "$" && src[i + 1] === "{") {
          const end = matchBrace(src, i + 1);
          if (end < 0) return -1;
          i = end;
        }
      }
    } else if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function literalOf(expr) {
  const m = expr.trim().match(/^(?:"([^"]*)"|'([^']*)'|`([^`$]*)`)$/);
  return m ? (m[1] ?? m[2] ?? m[3]) : null;
}

const lineOf = (src, idx) => src.slice(0, idx).split("\n").length;

// ---------------------------------------------------------------------------
// 1-8: scan files
// ---------------------------------------------------------------------------
const MARKUP_EXT = new Set([".astro", ".mdx", ".md", ".tsx", ".jsx"]);
let tagsChecked = 0;

for (const file of scanFiles) {
  const raw = fs.readFileSync(file, "utf8");
  const ext = path.extname(file);
  const isContent = file.startsWith(path.join(SRC, "content"));

  // Tracking objects built in frontmatter / TS (e.g. BlogPromoCard's trackingAttrs).
  for (const m of raw.matchAll(/(['"])data-track-event\1\s*:\s*(['"])([^'"]+)\2/g)) {
    if (!isEvent(m[3])) record("FAIL", "event name", `${rel(file)}:${lineOf(raw, m.index)}: '${m[3]}' is not a canonical event`);
  }
  for (const m of raw.matchAll(/(['"])data-tp-([a-z-]+)\1\s*:\s*(['"])([^'"]+)\3/g)) {
    validateParam(m[2].replace(/-/g, "_"), m[4], `${rel(file)}:${lineOf(raw, m.index)}`);
  }

  if (!MARKUP_EXT.has(ext)) continue;
  const src = stripForMarkup(raw, file);

  for (const tag of scanTags(src)) {
    const { tagName, attrs, dynamic, spreads } = tag;
    if (/^(script|style)$/i.test(tagName)) continue;
    const where = `${rel(file)}:${lineOf(src, tag.index)}`;

    // 6. BlogPromoCard variants
    if (tagName === "BlogPromoCard" && hasOwn(attrs, "variant") && attrs.variant !== null && !PROMO_VARIANTS.has(attrs.variant)) {
      record("FAIL", "promo variant", `${where}: <BlogPromoCard variant="${attrs.variant}"> — known: ${[...PROMO_VARIANTS].join(", ")}`);
    }


    const tpParams = {};
    for (const [name, value] of Object.entries(attrs)) {
      if (name.startsWith("data-tp-")) tpParams[name.slice(8).replace(/-/g, "_")] = value;
    }
    const EVENT_ATTRS = ["data-track-event", "data-track-pageview-event", "data-track-start-event", "data-track-submit-event"];
    const hasTracking = EVENT_ATTRS.some((a) => hasOwn(attrs, a));

    // 3. spec-style attribute names the tracker cannot read
    const specStyle = SPEC_STYLE_ATTRS.filter((n) => hasOwn(attrs, n));
    if (specStyle.length && (hasTracking || Object.keys(tpParams).length)) {
      record("FAIL", "attribute style", `${where}: ${specStyle.join(", ")} are ignored by ConversionTracker — use data-tp-* (e.g. data-tp-target-offer)`);
    }

    // 4. dead data-tp-* attributes
    if (!hasTracking && !spreads.length && Object.keys(tpParams).length) {
      record("WARN", "dead params", `${where}: data-tp-* present but no data-track-event on the element`);
    }

    // 5. Calendly links outside post bodies must be tracked
    if (!isContent && tagName.toLowerCase() === "a" && hasOwn(attrs, "href")) {
      const hrefText = attrs.href !== null ? attrs.href : dynamic.href || "";
      const isCalendly = /calendly\.com/i.test(hrefText) || (attrs.href === null && /bookingUrl/.test(hrefText));
      if (isCalendly && !hasOwn(attrs, "data-calendly-native")) {
        if (hasOwn(attrs, "data-track-event")) {
          if (attrs["data-track-event"] === null) record("WARN", "calendly link", `${where}: Calendly link with a dynamic data-track-event — cannot verify it is consulting_cta_click`);
          else if (attrs["data-track-event"] !== "consulting_cta_click") record("FAIL", "calendly link", `${where}: Calendly link tracked as '${attrs["data-track-event"]}' — use consulting_cta_click`);
        } else if (spreads.length) {
          record("WARN", "calendly link", `${where}: Calendly link with {...${spreads[0]}} — cannot verify its tracking attributes statically`);
        } else {
          record("FAIL", "calendly link", `${where}: Calendly link without data-track-event="consulting_cta_click" (would be reported as cta_position=unlabeled)`);
        }
      }
    }

    if (!hasTracking) continue;
    tagsChecked++;

    const trackEvent = attrs["data-track-event"];
    if (trackEvent !== undefined) {
      if (trackEvent === null) record("WARN", "dynamic event", `${where}: data-track-event is a dynamic expression; cannot validate`);
      else validateTrackedElement(trackEvent, tpParams, where);
    }
    const pageviewEvent = attrs["data-track-pageview-event"];
    if (pageviewEvent !== undefined) {
      if (pageviewEvent === null) record("WARN", "dynamic event", `${where}: data-track-pageview-event is a dynamic expression; cannot validate`);
      else validateTrackedElement(pageviewEvent, tpParams, where, { pageview: true });
    }
    for (const a of ["data-track-start-event", "data-track-submit-event"]) {
      const ev = attrs[a];
      if (ev === undefined) continue;
      if (ev === null) record("WARN", "dynamic event", `${where}: ${a} is a dynamic expression; cannot validate`);
      else validateTrackedElement(ev, tpParams, where);
    }

    // 8. links must stay links
    if (tagName.toLowerCase() === "a" && attrs.role === "button") record("WARN", "a11y", `${where}: role="button" on a tracked <a>; keep links as links`);
  }
}
record("PASS", "tracked elements", `${tagsChecked} tracked element(s) in ${scanFiles.length} file(s)${STAGED ? " (staged)" : ""}`);

// ---------------------------------------------------------------------------
// 7. Per-post consulting offers (src/utils/blogConsultingCtas.ts)
// ---------------------------------------------------------------------------
if (ctaConfigSrc) {
  const configRel = rel(ctaConfigPath);
  const keyMap = { targetOffer: "target_offer", ctaPosition: "cta_position", ctaVariant: "cta_variant", topicCluster: "topic_cluster" };
  let fields = 0;
  for (const m of ctaConfigSrc.matchAll(/\b(topicCluster|targetOffer|ctaPosition|ctaVariant)\s*:\s*(?:"([^"]*)"|'([^']*)')/g)) {
    fields++;
    validateParam(keyMap[m[1]], m[2] ?? m[3], `${configRel}:${lineOf(ctaConfigSrc, m.index)}`);
  }
  for (const [slug, idx] of CTA_KEYS) {
    const where = `${configRel}:${lineOf(ctaConfigSrc, idx)}`;
    const exists = fs.existsSync(path.join(SRC, "content/blog", `${slug}.mdx`)) || fs.existsSync(path.join(SRC, "content/blog", `${slug}.md`));
    if (!exists) record("FAIL", "cta config slug", `${where}: no post with slug '${slug}'`);
  }
  record("PASS", "blogConsultingCtas config", `${CTA_KEYS.size} entr${CTA_KEYS.size === 1 ? "y" : "ies"}, ${fields} analytics field(s) checked`);
}

// ---------------------------------------------------------------------------
// 9. Docs drift
// ---------------------------------------------------------------------------
const docsPath = path.join(ROOT, "docs/analytics-events.md");
if (fs.existsSync(docsPath)) {
  const docs = fs.readFileSync(docsPath, "utf8");
  const documented = new Set([...docs.matchAll(/^\|\s*`([a-z_]+)`\s*\|/gm)].map((m) => m[1]).filter((n) => !hasOwn(PARAMS, n)));
  for (const ev of Object.keys(EVENTS)) if (!documented.has(ev)) record("WARN", "docs drift", `docs/analytics-events.md does not document event '${ev}'`);
  for (const ev of documented) if (!isEvent(ev)) record("WARN", "docs drift", `docs/analytics-events.md documents '${ev}' which is not in analytics-taxonomy.json`);
  const setLine = docs.match(/`cta_position` controlled set:([\s\S]*?)\n\n/);
  if (setLine) {
    const docPositions = new Set([...setLine[1].matchAll(/`([a-z0-9_]+)`/g)].map((m) => m[1]));
    for (const p of PARAMS.cta_position.values) if (!docPositions.has(p)) record("WARN", "docs drift", `cta_position '${p}' missing from the docs controlled set`);
    for (const p of docPositions) if (!PARAMS.cta_position.values.includes(p)) record("WARN", "docs drift", `docs list cta_position '${p}' which is not in analytics-taxonomy.json`);
  }
  record("PASS", "docs cross-check", `${documented.size} documented event(s)`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const counts = { PASS: 0, WARN: 0, FAIL: 0 };
console.log("Analytics taxonomy validation — lucaberton.com" + (STAGED ? " (staged)" : ""));
console.log("======================================");
for (const r of results) {
  counts[r.level]++;
  const mark = r.level === "PASS" ? "✓" : r.level === "WARN" ? "!" : "✗";
  console.log(`  ${mark} [${r.level}] ${r.check} — ${r.detail}`);
}
console.log("\n======================================");
console.log(`PASS ${counts.PASS}   WARN ${counts.WARN}   FAIL ${counts.FAIL}\n`);
if (counts.FAIL) {
  console.error("Fix the [FAIL] items above (vocabularies: src/config/analytics-taxonomy.json, docs/analytics-events.md).\n");
  process.exit(1);
}
console.log("Analytics taxonomy validated successfully.\n");
