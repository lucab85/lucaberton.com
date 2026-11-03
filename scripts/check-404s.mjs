#!/usr/bin/env node
/**
 * check-404s.mjs — turns a list of URLs that Google reports as 404 into
 * redirect lines for static/_redirects.
 *
 *   node scripts/check-404s.mjs Not-found-404.csv          # Search Console export
 *   node scripts/check-404s.mjs urls.txt --min 0.8         # one URL per line
 *
 * Input: Search Console → Pages → "Not found (404)" → Export (CSV or the
 * "Table.csv" inside the zip), or any file with one URL per line; the first
 * lucaberton.com URL on each line is used.
 *
 * For each URL it reads the live status. For each one still answering 404 it
 * finds the closest page in the live sitemap by slug similarity (character
 * bigrams and words, ignoring years) and prints:
 *   - ready-to-paste _redirects lines (both slash forms) when the match is clear;
 *   - the unclear ones with their two best candidates, for a human to decide.
 * Leave a URL as 404 when no page is clearly what it meant: a redirect to the
 * wrong page is a soft 404 to Google anyway.
 *
 * Learned Nov 3, 2026 (#341): the 404s Search Console lists for this site come
 * from outside (typos in other sites' links and AI answers, old slugs without
 * the year, "/blog/lucaberton.com/blog/<post>/"), not from the site itself.
 * No dependencies (Node 18+ fetch). Reads production only.
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const minIdx = args.indexOf('--min');
const MIN = minIdx >= 0 ? Number(args[minIdx + 1]) : 0.85;
const BASE = 'https://lucaberton.com';
if (!file) {
  console.error('usage: node scripts/check-404s.mjs <export.csv | urls.txt> [--min 0.85]');
  process.exit(2);
}

const urls = [...new Set(
  fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .map((line) => (line.match(/https?:\/\/(?:www\.)?lucaberton\.com[^\s",]*/) || [])[0])
    .filter(Boolean),
)];

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

console.log(`${urls.length} URL(s) read; ${fixed} already answer 200 or redirect; ${gone.length} still 404/410.\n`);
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
