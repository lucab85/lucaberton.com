#!/usr/bin/env node
/**
 * live-watch/lighthouse.mjs — Lighthouse (mobile) on key pages of the group's sites,
 * with the budgets learned in the Nov 2026 audits.
 *
 *   node scripts/live-watch/lighthouse.mjs [--only site,site] [--report out.md]
 *
 * Pages: scripts/live-watch/pages.txt ("site url" lines). Needs Chrome (CHROME_PATH,
 * or an installed Chrome) and npx; runs lighthouse@13 one page at a time.
 *
 * FAIL (exit 1):
 * - accessibility, best practices or SEO under 90;
 * - the LCP element is an image with loading="lazy" (ansiblebyexample.com's top
 *   banner: LCP 7-8 s, fixed in #161).
 * WARN (reported, never fails the run):
 * - performance under 50;
 * - LCP element render delay over 1.5 s: the element waited for JavaScript, e.g. a
 *   fade-in from opacity 0 (openempower.com's hero, LCP 9.1 s, fixed in #93) or
 *   client-side rendering (ansiblepilot.com/articles);
 * - CLS over 0.25.
 * The benchmarkIndex range is printed: under ~1000 the runner was busy and
 * performance reads low.
 */
import { execFile } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const only = opt('--only')?.split(',');
const reportPath = opt('--report');

const pages = readFileSync(join(HERE, 'pages.txt'), 'utf8').split('\n')
  .map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => { const [site, url] = l.split(/\s+/); return { site, url }; })
  .filter((p) => !only || only.includes(p.site));

const tmp = mkdtempSync(join(tmpdir(), 'lh-'));
const run = (url, out) => new Promise((resolve) => {
  execFile('npx', ['-y', 'lighthouse@13.6.0', url, '--quiet', '--output=json', `--output-path=${out}`,
    '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new --no-sandbox'],
  { timeout: 240_000, maxBuffer: 1 << 26 }, (err) => resolve(err ? String(err.message).split('\n')[0] : null));
});

// LCP element snippet and its "Element render delay" from Lighthouse 13's lcp-breakdown-insight.
function lcpInfo(audits) {
  let node = '';
  let renderDelay = 0;
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (!x || typeof x !== 'object') return;
    if (typeof x.snippet === 'string' && !node) node = x.snippet;
    const label = x.label || x.subpart || '';
    if (/render delay/i.test(label) && typeof x.duration === 'number') renderDelay = x.duration;
    Object.values(x).forEach(walk);
  };
  walk(audits['lcp-breakdown-insight']?.details);
  return { node, renderDelay };
}

const rows = [];
const fails = [];
const warns = [];
const bench = [];
for (const p of pages) {
  const out = join(tmp, `${rows.length}.json`);
  const err = await run(p.url, out);
  let d = null;
  try { d = JSON.parse(readFileSync(out, 'utf8')); } catch { /* reported below */ }
  if (!d || d.runtimeError) {
    warns.push(`${p.url}: Lighthouse did not run (${err || d?.runtimeError?.code || 'no report'})`);
    continue;
  }
  bench.push(d.environment.benchmarkIndex);
  const c = (k) => Math.round((d.categories[k]?.score ?? 0) * 100);
  const a = d.audits;
  const { node, renderDelay } = lcpInfo(a);
  const cls = a['cumulative-layout-shift']?.numericValue ?? 0;
  const row = { ...p, perf: c('performance'), a11y: c('accessibility'), best: c('best-practices'), seo: c('seo'),
    lcp: a['largest-contentful-paint']?.displayValue || '-', delay: Math.round(renderDelay), cls };
  rows.push(row);
  for (const [k, name] of [['a11y', 'accessibility'], ['best', 'best practices'], ['seo', 'SEO']]) {
    if (row[k] < 90) fails.push(`${p.url}: ${name} ${row[k]} (budget 90)`);
  }
  if (/^<img\b/i.test(node) && /loading\s*=\s*["']?lazy/i.test(node)) fails.push(`${p.url}: the LCP image is lazy-loaded (${node.slice(0, 90)})`);
  if (row.perf < 50) warns.push(`${p.url}: performance ${row.perf}`);
  if (renderDelay > 1500) warns.push(`${p.url}: LCP element waited ${row.delay} ms to render (hidden until JavaScript?): ${node.slice(0, 90)}`);
  if (cls > 0.25) warns.push(`${p.url}: CLS ${cls.toFixed(2)}`);
  console.log(`${p.site} ${p.url}: perf ${row.perf} a11y ${row.a11y} best ${row.best} seo ${row.seo} LCP ${row.lcp}`);
}
rmSync(tmp, { recursive: true, force: true });

const lines = [
  `### Lighthouse (mobile), ${rows.length} page(s)` + (bench.length ? `, benchmarkIndex ${Math.min(...bench).toFixed(0)}-${Math.max(...bench).toFixed(0)}` : ''),
  '',
  '| Page | Perf | A11y | Best | SEO | LCP | Render delay |',
  '|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.url.replace(/^https?:\/\//, '')} | ${r.perf} | ${r.a11y} | ${r.best} | ${r.seo} | ${r.lcp} | ${r.delay} ms |`),
];
if (fails.length) lines.push('', '**Over budget:**', ...fails.map((f) => `- ${f}`));
if (warns.length) lines.push('', 'Warnings:', ...warns.map((w) => `- ${w}`));
const report = lines.join('\n') + '\n';
console.log('\n' + report);
if (reportPath) writeFileSync(reportPath, report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
process.exit(fails.length ? 1 : 0);
