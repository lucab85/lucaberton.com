#!/usr/bin/env node
/**
 * fix-sitemap-index-redirect.cjs
 * =====================================================================
 * Validates and (optionally) fixes the sitemap index URL redirect rule.
 *
 * BACKGROUND
 * ----------
 * The Astro site builds its sitemap index at /sitemap-index.xml (hyphen).
 * That is also the URL declared in robots.txt:
 *     Sitemap: https://lucaberton.com/sitemap-index.xml
 *
 * A common breakage is a stale/hand-written redirect that points the
 * "underscore" variant /sitemap_index.xml (or /sitemap.xml) at a dead URL.
 * Googlebot follows sitemaps exactly as advertised, so a 308 that lands on
 * a 404 silently drops the whole sitemap from indexing.
 *
 * WHAT THIS SCRIPT DOES
 * ---------------------
 *   1. FILE CHECK  - reads vercel.json and confirms a permanent (308) redirect
 *                    rule exists mapping every typo variant to /sitemap-index.xml.
 *   2. LIVE CHECK  - probes the production site (BASE_URL) to confirm the
 *                    canonical index resolves (HTTP 200, application/xml,
 *                    <sitemapindex> body) and each typo variant 308-redirects
 *                    to it.
 *   3. FIX (opt-in) - writes the correct redirect rule into vercel.json and
 *                    re-runs the live check (after a redeploy the live check
 *                    will pass).
 *
 * MODES (default: --check)
 *   --check    Validate only. Exit non-zero if anything is wrong.
 *   --fix      Write the correct redirect rule into vercel.json, then --check.
 *   --live     Probe the live BASE_URL only (no file changes).
 *
 * FLAGS
 *   --base-url <url>   Target site (default https://lucaberton.com)
 *   --no-color         Disable ANSI colors
 *   --json             Machine-readable output
 *
 * Examples:
 *   node scripts/fix-sitemap-index-redirect.cjs --check
 *   node scripts/fix-sitemap-index-redirect.cjs --fix
 *   node scripts/fix-sitemap-index-redirect.cjs --live --base-url https://lucaberton.com
 * =====================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERCEL_JSON = path.join(ROOT, 'vercel.json');
const ROBOTS_TXT = path.join(ROOT, 'static', 'robots.txt');

// Canonical sitemap index produced by @astrojs/sitemap (hyphen, no extension slash).
const CANONICAL = '/sitemap-index.xml';

// Typo / alternate forms that should permanently (308) redirect to CANONICAL.
const VARIANTS = [
  '/sitemap_index.xml', // the exact path in the original report
  '/sitemap.xml',       // the bogus 308 destination that was being returned
  '/sitemapindex.xml',
  '/sitemap_index',
  '/sitemap-index',     // missing .xml extension
];

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const mode = has('--fix') ? 'fix' : has('--live') ? 'live' : 'check';
const useColor = !has('--no-color');
const asJson = has('--json');
const baseUrlArg = (() => {
  const i = argv.indexOf('--base-url');
  return i !== -1 && argv[i + 1] ? argv[i + 1].replace(/\/+$/, '') : 'https://lucaberton.com';
})();

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------
const C = useColor
  ? { green: (s) => `\x1b[32m${s}\x1b[0m`, red: (s) => `\x1b[31m${s}\x1b[0m`, yellow: (s) => `\x1b[33m${s}\x1b[0m`, dim: (s) => `\x1b[2m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m` }
  : { green: (s) => s, red: (s) => s, yellow: (s) => s, dim: (s) => s, bold: (s) => s };

const log = (...a) => process.stdout.write(a.join(' ') + '\n');
const ok = (m) => log(`${C.green('[PASS]')} ${m}`);
const warn = (m) => log(`${C.yellow('[WARN]')} ${m}`);
const fail = (m) => log(`${C.red('[FAIL]')} ${m}`);
const info = (m) => log(`${C.dim('[INFO]')} ${m}`);

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------
const normPath = (u) => {
  try { return new URL(u, 'https://x').pathname; } catch { return String(u).split('?')[0]; }
};
const abs = (p) => `${baseUrlArg}${p}`;

// ---------------------------------------------------------------------------
// File checks (vercel.json redirects + robots.txt Sitemap line)
// ---------------------------------------------------------------------------
function loadVercelJson() {
  if (!fs.existsSync(VERCEL_JSON)) return { exists: false, data: null };
  try {
    return { exists: true, data: JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8')) };
  } catch (e) {
    return { exists: true, data: null, error: e.message };
  }
}

function fileChecks() {
  const results = { fileOk: true, details: [], correctSources: [], wrongRules: [] };
  const v = loadVercelJson();
  if (!v.exists) {
    results.fileOk = false;
    results.details.push({ level: 'fail', msg: `vercel.json not found at ${VERCEL_JSON}` });
    return results;
  }
  if (v.error) {
    results.fileOk = false;
    results.details.push({ level: 'fail', msg: `vercel.json is not valid JSON: ${v.error}` });
    return results;
  }

  const redirects = Array.isArray(v.data.redirects) ? v.data.redirects : [];
  if (redirects.length === 0) {
    results.fileOk = false;
    results.details.push({ level: 'fail', msg: 'vercel.json has no "redirects" array — typo sitemap variants will 404' });
    return results;
  }

  // Find correct + wrong rules referencing sitemap.
  for (const r of redirects) {
    const src = normPath(r.source || '');
    const dst = normPath(r.destination || '');
    const isSitemapRule = VARIANTS.includes(src) || /sitemap[-_]index\.xml?$/.test(src) || /sitemap[-_]index\.xml?$/.test(dst) || /\/sitemap\.xml$/.test(dst);
    if (!isSitemapRule) continue;
    const correct = VARIANTS.includes(src) && dst === CANONICAL && (r.statusCode === 308 || r.permanent === true);
    if (correct) {
      results.correctSources.push(src);
    } else {
      results.wrongRules.push({ source: r.source, destination: r.destination, statusCode: r.statusCode, permanent: r.permanent });
    }
  }

  if (results.correctSources.length === 0) {
    results.fileOk = false;
    results.details.push({ level: 'fail', msg: `no 308 redirect from any sitemap typo variant to ${CANONICAL} in vercel.json` });
  } else {
    const missing = VARIANTS.filter((s) => !results.correctSources.includes(s));
    if (missing.length === 0) {
      results.details.push({ level: 'ok', msg: `all ${VARIANTS.length} sitemap typo variants 308 -> ${CANONICAL}` });
    } else {
      results.fileOk = false;
      results.details.push({ level: 'fail', msg: `missing 308 redirect for: ${missing.join(', ')}` });
    }
  }

  if (results.wrongRules.length > 0) {
    results.fileOk = false;
    for (const w of results.wrongRules) {
      results.details.push({ level: 'fail', msg: `wrong sitemap redirect: ${w.source} -> ${w.destination} (status ${w.statusCode ?? (w.permanent ? 'perm' : '?')})` });
    }
  }

  // robots.txt Sitemap line sanity (non-fatal warning if off)
  if (fs.existsSync(ROBOTS_TXT)) {
    const robots = fs.readFileSync(ROBOTS_TXT, 'utf8');
    const smLines = robots.split('\n').filter((l) => /^sitemap:/i.test(l.trim()));
    const declaresCanonical = smLines.some((l) => normPath(l.split(/\s+/)[1]) === CANONICAL);
    if (smLines.length === 0) {
      results.details.push({ level: 'warn', msg: 'robots.txt declares no Sitemap: line' });
    } else if (!declaresCanonical) {
      results.details.push({ level: 'warn', msg: `robots.txt Sitemap line does not point to ${CANONICAL}: ${smLines.join(' | ')}` });
    } else {
      results.details.push({ level: 'ok', msg: `robots.txt declares canonical ${CANONICAL}` });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Live checks
// ---------------------------------------------------------------------------
async function probe(url, { follow = false } = {}) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: follow ? 'follow' : 'manual',
      headers: { 'User-Agent': 'lucaberton-sitemap-check/1.0' },
    });
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    return {
      ok: true,
      status: res.status,
      location: res.headers.get('location') || '',
      contentType: res.headers.get('content-type') || '',
      body,
    };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function liveChecks() {
  const results = { canonicalOk: false, variants: [], allOk: true };

  // Canonical index
  const can = await probe(abs(CANONICAL), { follow: true });
  if (!can.ok) {
    results.allOk = false;
    results.canonical = { error: can.error };
  } else {
    const isXml = /xml/.test(can.contentType);
    const hasIndex = /<sitemapindex/i.test(can.body);
    results.canonicalOk = can.status === 200 && isXml && hasIndex;
    results.allOk = results.allOk && results.canonicalOk;
    results.canonical = { status: can.status, contentType: can.contentType, hasIndex };
  }

  // Each typo variant: expect 308 -> canonical absolute URL
  for (const v of VARIANTS) {
    const r = await probe(abs(v), { follow: false });
    let good = false;
    let detail = '';
    if (!r.ok) {
      detail = `request error: ${r.error}`;
    } else {
      const locPath = r.location ? normPath(r.location) : '';
      good = r.status === 308 && locPath === CANONICAL;
      if (r.status === 301) {
        // Acceptable but not preferred (report flags 308 requested)
        good = locPath === CANONICAL;
        detail = `got 301 (not 308) -> ${r.location}`;
      } else if (!good) {
        detail = `status ${r.status}${r.location ? ` -> ${r.location}` : ' (no Location)'}`;
      }
    }
    results.allOk = results.allOk && good;
    results.variants.push({ variant: v, status: r.status, location: r.location, good, detail });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Fix: write correct redirect rule into vercel.json
// ---------------------------------------------------------------------------
function applyFix() {
  const v = loadVercelJson();
  if (!v.exists || v.error) {
    return { applied: false, msg: 'vercel.json missing or invalid — cannot write fix' };
  }
  const data = v.data;
  let redirects = Array.isArray(data.redirects) ? data.redirects.slice() : [];

  // Drop any existing sitemap-related wrong rules.
  redirects = redirects.filter((r) => {
    const src = normPath(r.source || '');
    const dst = normPath(r.destination || '');
    const isSitemap = VARIANTS.includes(src) || /sitemap[-_]index\.xml?$/.test(src) || /sitemap[-_]index\.xml?$/.test(dst) || /\/sitemap\.xml$/.test(dst);
    return !isSitemap;
  });

  // Add correct 308 rules for every variant.
  for (const vv of VARIANTS) {
    redirects.push({ source: vv, destination: CANONICAL, statusCode: 308 });
  }
  data.redirects = redirects;

  fs.writeFileSync(VERCEL_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return { applied: true, msg: `wrote ${VARIANTS.length} 308 redirect(s) -> ${CANONICAL} into vercel.json` };
}

// ---------------------------------------------------------------------------
// Reporters
// ---------------------------------------------------------------------------
function printFile(results) {
  for (const d of results.details) {
    if (d.level === 'ok') ok(d.msg);
    else if (d.level === 'warn') warn(d.msg);
    else fail(d.msg);
  }
}

function printLive(results) {
  if (results.canonical) {
    if (results.canonicalOk) ok(`${CANONICAL} -> 200, application/xml, <sitemapindex> present`);
    else fail(`${CANONICAL} -> ${results.canonical.status ?? 'ERR'} ${results.canonical.error ? `(${results.canonical.error})` : ''} ${results.canonical.hasIndex === false ? '(no <sitemapindex>)' : ''}`);
  }
  for (const vr of results.variants) {
    if (vr.good) ok(`${vr.variant} -> 308 ${CANONICAL}`);
    else fail(`${vr.variant} -> ${vr.detail || 'not 308 to canonical'}`);
  }
}

function printJson(fileR, liveR) {
  log(JSON.stringify({
    mode,
    baseUrl: baseUrlArg,
    canonical: CANONICAL,
    file: fileR ? { ok: fileR.fileOk, details: fileR.details } : null,
    live: liveR ? { canonicalOk: liveR.canonicalOk, variants: liveR.variants, canonical: liveR.canonical } : null,
  }, null, 2));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  let fileR = null;
  let liveR = null;
  let exitCode = 0;

  if (mode === 'live') {
    info(`Live check against ${baseUrlArg}`);
    liveR = await liveChecks();
    if (asJson) printJson(null, liveR); else printLive(liveR);
    exitCode = liveR.allOk ? 0 : 1;
    if (!liveR.allOk) fail('Live sitemap redirect check FAILED');
    else ok('Live sitemap redirect check PASSED');
    process.exit(exitCode);
  }

  // file-based (check or fix)
  if (mode === 'fix') {
    const fx = applyFix();
    if (fx.applied) ok(fx.msg);
    else { fail(fx.msg); process.exit(1); }
  }

  fileR = fileChecks();
  if (asJson) { /* print after live */ } else printFile(fileR);

  // After a fix (or standalone check), run the live check too for confirmation.
  info(`Live confirmation against ${baseUrlArg} (run after deploy for accurate result)`);
  liveR = await liveChecks();
  if (!asJson) printLive(liveR);

  const fileBroken = !fileR.fileOk;
  const liveBroken = !liveR.allOk;

  if (asJson) printJson(fileR, liveR);

  if (fileBroken) {
    fail('FILE CHECK FAILED — vercel.json redirect rule is missing or wrong.');
    exitCode = 1;
  } else {
    ok('FILE CHECK PASSED — vercel.json redirect rule is correct.');
  }

  if (mode === 'fix' && liveBroken) {
    warn('LIVE CHECK still failing — redeploy for the rule to take effect:');
    warn('    git add vercel.json && git commit -m "fix: 308 sitemap_index.xml -> sitemap-index.xml"');
    warn('    git push && <trigger Vercel deploy>   (or: vercel --prod)');
  } else if (!liveBroken) {
    ok('LIVE CHECK PASSED.');
  } else {
    warn('LIVE CHECK not yet passing (deploy the fix, then re-run --live).');
  }

  process.exit(exitCode);
}

main().catch((e) => {
  fail(`unexpected error: ${e.stack || e.message}`);
  process.exit(2);
});
