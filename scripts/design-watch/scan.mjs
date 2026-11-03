#!/usr/bin/env node
/**
 * design-watch/scan.mjs — scans the key pages of Luca's eight sites with
 * Impeccable (impeccable.style) and fails when a live page has a "quality"
 * finding: low contrast, undersized text, long lines, stragglers, overflow and
 * the like. "Slop" findings (gradient text, kicker labels, icon tiles…) are
 * brand choices: they are counted in the report, never failed on.
 * Run daily by .github/workflows/design-watch.yml.
 *
 *   node scripts/design-watch/scan.mjs                      # every page in urls.txt
 *   node scripts/design-watch/scan.mjs --only udienza.com   # one site
 *   node scripts/design-watch/scan.mjs --report out.md      # also write the Markdown report
 *
 * Needs npx and a Chrome (IMPECCABLE_BROWSER, or an installed Chrome).
 * accepted.json lists findings left on purpose, each with its reason.
 *
 * Exit 0: no unaccepted quality findings. Exit 1: at least one.
 * Exit 2: more than half the scans failed, so the watch itself is broken.
 * A page that fails to scan (Impeccable's fixed 30 s navigation timeout, a network blip)
 * gets three tries, then a warning in the report. ansiblepilot.com/articles needs ~20 s even
 * from Europe, so the slower runners sometimes miss it.
 *
 * Background: the Nov 3, 2026 audit took the eight sites from 1,579 findings
 * to 346, all style but one accepted layout choice. This keeps it that way.
 */
import { spawn } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const IMPECCABLE = 'impeccable@4.8.0';
const VIEWPORTS = ['1280x800', '390x844'];

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt('--only');
const reportPath = opt('--report');

const pages = readFileSync(join(HERE, 'urls.txt'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => {
    const [site, url] = line.split(/\s+/);
    return { site, url };
  })
  .filter((p) => !only || p.site === only);
const accepted = JSON.parse(readFileSync(join(HERE, 'accepted.json'), 'utf8')).accepted;

function detect(url, viewport) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['-y', IMPECCABLE, 'detect', url, '--json', '--no-advisory', '--viewport', viewport], {
      env: { ...process.env, IMPECCABLE_NO_TELEMETRY: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => child.kill('SIGKILL'), 240_000);
    child.on('close', (code) => {
      clearTimeout(timer);
      // 0 = clean, 2 = findings, anything else = the page could not be scanned
      if (code !== 0 && code !== 2) {
        const last = err.trim().split('\n').pop() || `exit ${code}`;
        return resolve({ error: last.slice(0, 200) });
      }
      try {
        const data = JSON.parse(out);
        resolve({ findings: Array.isArray(data) ? data : data.findings || [] });
      } catch {
        resolve({ error: 'unreadable JSON output' });
      }
    });
  });
}

const acceptedBy = (page, viewport, f) =>
  accepted.find(
    (a) =>
      a.url === page.url &&
      a.rule === f.antipattern &&
      (!a.viewport || a.viewport === viewport) &&
      (!a.selector || (f.selector || '').includes(a.selector)),
  );

const sites = new Map(); // site -> { quality, style }
const failures = [];
const kept = [];
const errors = [];
let scans = 0;

// One at a time: the first npx call installs Impeccable, and the pages are small.
for (const page of pages) {
  if (!sites.has(page.site)) sites.set(page.site, { quality: 0, style: 0 });
  const tally = sites.get(page.site);
  for (const viewport of VIEWPORTS) {
    scans++;
    let res = await detect(page.url, viewport);
    for (let attempt = 2; res.error && attempt <= 3; attempt++) res = await detect(page.url, viewport);
    if (res.error) {
      errors.push({ ...page, viewport, error: res.error });
      console.log(`::warning::Could not scan ${page.url} at ${viewport}: ${res.error}`);
      continue;
    }
    const seen = new Set();
    for (const f of res.findings) {
      const key = `${f.antipattern}|${f.selector}|${f.snippet}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (f.category !== 'quality') {
        tally.style++;
        continue;
      }
      const ok = acceptedBy(page, viewport, f);
      if (ok) {
        kept.push({ ...page, viewport, f, reason: ok.reason });
        continue;
      }
      tally.quality++;
      failures.push({ ...page, viewport, f });
    }
    console.log(`${page.site} ${viewport} ${page.url}: ${res.findings.length} finding(s)`);
  }
}

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/`/g, "'");
const runUrl = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : '';
const lines = [
  `## Design watch, ${new Date().toISOString().slice(0, 10)}`,
  '',
  `${failures.length ? `**${failures.length} quality finding(s)**` : 'No quality findings'} on ${pages.length} pages × ${VIEWPORTS.length} viewports` +
    (kept.length ? ` · ${kept.length} accepted` : '') +
    (errors.length ? ` · ${errors.length} scan(s) failed` : '') +
    (runUrl ? ` · [run](${runUrl})` : ''),
  '',
  '| Site | Quality (fails the run) | Style (brand choices, not checked) |',
  '|---|---|---|',
  ...[...sites].map(([site, t]) => `| ${site} | ${t.quality} | ${t.style} |`),
];
if (failures.length) {
  lines.push('', '### Quality findings', '');
  for (const { site, url, viewport, f } of failures) {
    lines.push(`- **${site}** \`${f.antipattern}\` (${esc(f.name)}), ${url} at ${viewport}`, `  \`${esc(f.selector)}\`: ${esc(f.snippet)}`);
  }
  lines.push(
    '',
    'Fix recipes: the `impeccable-site-audit` skill in lucab85/claude-skills (`references/fix-recipes.md`). ' +
      'To accept a finding on purpose, add it with a reason to `scripts/design-watch/accepted.json`.',
  );
}
if (kept.length) {
  lines.push('', '### Accepted', '');
  for (const { site, viewport, f, reason } of kept) lines.push(`- ${site} \`${f.antipattern}\` at ${viewport}: ${esc(reason)}`);
}
if (errors.length) {
  lines.push('', '### Scans that failed', '');
  for (const e of errors) lines.push(`- ${e.url} at ${e.viewport}: ${esc(e.error)}`);
}
const report = lines.join('\n') + '\n';
console.log('\n' + report);
if (reportPath) writeFileSync(reportPath, report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);

if (errors.length * 2 > scans) process.exit(2);
process.exit(failures.length ? 1 : 0);
