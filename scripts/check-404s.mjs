#!/usr/bin/env node
/**
 * check-404s.mjs — turns a list of URLs that Google reports as 404 into
 * redirect lines for static/_redirects, and keeps them fixed.
 *
 *   node scripts/check-404s.mjs Not-found-404.csv          # Search Console export
 *   node scripts/check-404s.mjs urls.txt --min 0.8         # one URL per line
 *   node scripts/check-404s.mjs --check scripts/search-console-404s.txt   # after the build (CI)
 *
 * Input: Search Console → Pages → "Not found (404)" → Export (CSV or the
 * "Table.csv" inside the zip), or any file with one URL per line; the first
 * lucaberton.com URL on each line is used. Lines starting with # are skipped,
 * and a line ending in "# 404: <reason>" marks a URL that stays 404 on purpose.
 *
 * Without --check it reads the live status of each URL. For each one still
 * answering 404 (and not marked) it finds the closest page in the live sitemap
 * by slug similarity (character bigrams and words, ignoring years) and prints:
 *   - ready-to-paste _redirects lines (both slash forms) when the match is clear;
 *   - the unclear ones with their two best candidates, for a human to decide.
 * Leave a URL as 404 when no page is clearly what it meant: a redirect to the
 * wrong page is a soft 404 to Google anyway.
 *
 * With --check it reads no network: every listed URL must reach a real page of
 * the build (--dir, default public/) through the site's own routes, the way
 * build-vercel-config.cjs translates them for Vercel: the page itself, a
 * meta-refresh stub, or the first matching rule in static/_redirects. A URL
 * that ends nowhere fails the run unless its line is marked "# 404: <reason>".
 * scripts/search-console-404s.txt holds every export so far, so a removed
 * redirect or a renamed post can't bring one of them back.
 *
 * Learned Nov 3, 2026 (#341): the 404s Search Console lists for this site come
 * from outside (typos in other sites' links and AI answers, old slugs without
 * the year, "/blog/lucaberton.com/blog/<post>/"), not from the site itself.
 * No dependencies (Node 18+ fetch).
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const file = args.find((a, i) => !a.startsWith('--') && !['--min', '--dir'].includes(args[i - 1]));
const MIN = Number(opt('--min', 0.85));
const CHECK = args.includes('--check');
const DIR = opt('--dir', 'public');
const BASE = 'https://lucaberton.com';
if (!file) {
  console.error('usage: node scripts/check-404s.mjs <export.csv | urls.txt> [--min 0.85]\n       node scripts/check-404s.mjs --check <urls.txt> [--dir public]');
  process.exit(2);
}

const entries = [];
for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
  if (line.trim().startsWith('#')) continue;
  const url = (line.match(/https?:\/\/(?:www\.)?lucaberton\.com[^\s",]*/) || [])[0];
  if (!url || entries.some((e) => e.url === url)) continue;
  entries.push({ url, keep404: (line.match(/#\s*404:\s*(.+)$/) || [])[1] });
}

if (CHECK) {
  const REFRESH_RE = /<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*>/i;
  const REFRESH_URL_RE = /content=["']?\s*0\s*;\s*url=([^"'>\s]+)/i;
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Same parsing and matching as build-vercel-config.cjs (Netlify semantics).
  const rules = [];
  for (const line of fs.readFileSync('static/_redirects', 'utf8').split('\n')) {
    const [from, to, status = '301'] = line.replace(/#.*/, '').trim().split(/\s+/);
    if (!from || !to || !/^30[1278]$/.test(status)) continue;
    const base = from.length > 1 ? from.replace(/\/$/, '') : from;
    rules.push({ re: new RegExp(`^${base.split('*').map(escapeRe).join('(.*)')}/?$`), to });
  }
  // A built file at that URL: null, a real page, or a stub with its target.
  const fileAt = (p) => {
    const rel = p.endsWith('/') ? `${p}index.html` : /\.[a-z0-9]+$/i.test(p) ? p : `${p}/index.html`;
    const f = path.join(DIR, rel);
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return null;
    if (!f.endsWith('.html')) return { stub: false };
    const tag = fs.readFileSync(f, 'utf8').slice(0, 4096).match(REFRESH_RE);
    const m = tag && tag[0].match(REFRESH_URL_RE);
    return m ? { stub: true, target: m[1].replace(/^https?:\/\/(www\.)?lucaberton\.com/i, '') || '/' } : { stub: false };
  };
  const resolve = (p, chain = []) => {
    if (chain.includes(p) || chain.length > 4) return { ok: false, chain: [...chain, p], why: 'redirect loop' };
    chain = [...chain, p];
    if (/^https?:\/\//.test(p)) return { ok: true, chain }; // another site
    const f = fileAt(p);
    if (f && !f.stub) return { ok: true, chain };
    if (f) { const r = resolve(f.target, chain); if (r.ok) return r; }
    const rule = rules.find((r) => r.re.test(p));
    if (rule) return resolve(rule.to.replace(/:splat/g, p.match(rule.re)[1] ?? ''), chain);
    return { ok: false, chain, why: f ? `stub to ${f.target}, not a page` : 'no page, stub or rule' };
  };

  if (!fs.existsSync(DIR)) { console.error(`check-404s: ${DIR}/ not found; run the build first.`); process.exit(1); }
  let fails = 0, kept = 0;
  for (const { url, keep404 } of entries) {
    let p;
    try { p = decodeURIComponent(new URL(url).pathname); } catch { p = new URL(url).pathname; }
    const r = resolve(p);
    if (r.ok && keep404) console.log(`[NOTE] ${p} reaches ${r.chain.at(-1)} now: drop its "# 404:" mark`);
    else if (keep404) kept++;
    else if (!r.ok) { fails++; console.log(`[FAIL] ${r.chain.join(' -> ')}: ${r.why}`); }
  }
  console.log(`check-404s: ${entries.length} URL(s) from ${file}; ${entries.length - fails - kept} reach a page, ${kept} stay 404 on purpose, ${fails} fail.`);
  if (fails) console.log('Add a redirect to static/_redirects, or mark the line "# 404: <reason>" when no page is clearly what it meant.');
  process.exit(fails ? 1 : 0);
}

async function status(url) {
  try {
    const r = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (compatible; check-404s/1.0; +https://lucaberton.com)' } });
    return r.status;
  } catch {
    return 0;
  }
}

async function sitemapPaths() {
  const out = new Set();
  const queue = [`${BASE}/sitemap-index.xml`];
  while (queue.length) {
    const r = await fetch(queue.shift());
    const xml = await r.text();
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
      if (/\.xml$/.test(m[1])) queue.push(m[1]);
      else out.add(new URL(m[1]).pathname);
    }
  }
  return [...out];
}

const slugOf = (p) => decodeURIComponent(p).replace(/\/+$/, '').split('/').pop().toLowerCase();
const words = (s) => new Set(s.split(/[^a-z0-9]+/).filter((w) => w && !/^20\d\d$/.test(w)));
const bigrams = (s) => { const b = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); b.set(g, (b.get(g) || 0) + 1); } return b; };
function dice(a, b) {
  const A = bigrams(a), B = bigrams(b);
  let inter = 0, total = 0;
  for (const [g, n] of A) { inter += Math.min(n, B.get(g) || 0); total += n; }
  for (const n of B.values()) total += n;
  return total ? (2 * inter) / total : 0;
}
function score(a, b) {
  const wa = words(a), wb = words(b);
  const jac = [...wa].filter((w) => wb.has(w)).length / Math.max(1, new Set([...wa, ...wb]).size);
  return Math.max(dice(a, b), jac);
}

const pool = async (items, n, fn) => { const q = [...items]; await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()); })); };

const urls = entries.filter((e) => !e.keep404).map((e) => e.url);
const live = await sitemapPaths();
const results = [];
await pool(urls, 8, async (u) => results.push({ u, status: await status(u) }));
const gone = results.filter((r) => r.status === 404 || r.status === 410).map((r) => new URL(r.u).pathname);
const fixed = results.length - gone.length;

const clear = [];
const unclear = [];
for (const p of gone.sort()) {
  const nested = p.match(/^\/blog\/(?:www\.)?lucaberton\.com\/blog\/(.+)$/); // covered by the wildcard rule
  if (nested) continue;
  const section = '/' + p.split('/')[1] + '/';
  const ranked = live
    .filter((lp) => lp.startsWith(section) && lp !== section)
    .map((lp) => [score(slugOf(p), slugOf(lp)), lp])
    .sort((a, b) => b[0] - a[0]);
  const [best, second] = ranked;
  if (best && best[0] >= MIN && (!second || best[0] - second[0] >= 0.05)) clear.push([p, best[1], best[0]]);
  else unclear.push([p, ranked.slice(0, 2)]);
}

const marked = entries.length - urls.length;
console.log(`${urls.length} URL(s) read${marked ? ` (and ${marked} marked "# 404:")` : ''}; ${fixed} already answer 200 or redirect; ${gone.length} still 404/410.\n`);
if (clear.length) {
  console.log(`# Clear matches (score >= ${MIN}): paste into static/_redirects`);
  for (const [from, to, s] of clear) {
    const f = from.replace(/\/$/, '');
    console.log(`# ${s.toFixed(2)}\n${f} ${to} 301\n${f}/ ${to} 301`);
  }
  console.log('');
}
if (unclear.length) {
  console.log('# Unclear: decide by hand, or leave as 404');
  for (const [from, cands] of unclear) console.log(`${from}\n    ${cands.map(([s, lp]) => `${s.toFixed(2)} ${lp}`).join('  |  ') || '(no page in that section)'}`);
}
