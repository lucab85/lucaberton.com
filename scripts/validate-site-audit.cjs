#!/usr/bin/env node
/**
 * Site audit validator — checks the same issue classes surfaced in reports/audit-issues.json:
 *   1. Broken internal links (any /path/ href or markdown link with no matching route)
 *   2. Orphan top-level pages (a page under src/pages with zero internal inbound links)
 *   3. Heading-order skips (Hn -> Hn+2 or steeper) in rendered page/post markup
 *
 * Static/source-level checks only — no live crawl, no network calls.
 * Exit code 1 if any issue found (fails CI pipeline).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const COMPONENTS_DIR = path.join(ROOT, 'src', 'components');
const LAYOUTS_DIR = path.join(ROOT, 'src', 'layouts');

const args = process.argv.slice(2);
const only = args.find(a => a.startsWith('--only='))?.split('=')[1]?.split(',');
const runCheck = (name) => !only || only.includes(name);

let exitCode = 0;

// ---------------------------------------------------------------------------
// Shared file collection helpers
// ---------------------------------------------------------------------------

function collectFiles(dir, extensions) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(p, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      out.push(p);
    }
  }
  return out;
}

const blogFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
const astroPageFiles = collectFiles(PAGES_DIR, ['.astro']);
const allAstroFiles = [
  ...astroPageFiles,
  ...collectFiles(COMPONENTS_DIR, ['.astro']),
  ...collectFiles(LAYOUTS_DIR, ['.astro']),
];
const allContentFiles = [
  ...blogFiles.map(f => path.join(BLOG_DIR, f)),
  ...allAstroFiles,
];

// ---------------------------------------------------------------------------
// Route table: every internal path the site actually serves
// ---------------------------------------------------------------------------

const validSlugs = new Set(blogFiles.map(f => f.replace(/\.mdx?$/, '').toLowerCase()));

// Non-content routes known to exist outside src/pages file-routing (dynamic
// [slug].astro pages, hand-authored redirects, etc.)
const extraRoutes = new Set([
  'books', 'courses', 'about', 'contact', 'services', 'blog',
  'conference-speaking-journey', 'kubecon', 'book-signing', 'talk', 'network',
]);

// Sub-routes under /blog/ that are not blog posts (static asset dirs, category/tag hubs)
const blogAssetDirs = new Set([
  'events', 'proteinlens', 'openclaw', 'thumbnails', 'books', 'courses',
  'conferences', 'categories', 'tags', 'search', 'promo',
]);

const pageRoutes = new Set();
function scanPageRoutes(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      pageRoutes.add(prefix + entry.name);
      scanPageRoutes(path.join(dir, entry.name), prefix + entry.name + '/');
    } else if (entry.name.endsWith('.astro') && !entry.name.startsWith('[') && entry.name !== 'index.astro') {
      pageRoutes.add(prefix + entry.name.replace(/\.astro$/, ''));
    }
  }
}
scanPageRoutes(PAGES_DIR);

for (const r of extraRoutes) pageRoutes.add(r);

// ---------------------------------------------------------------------------
// Check 1: broken internal links
// ---------------------------------------------------------------------------

function checkBrokenLinks() {
  const linkRegex = /\]\(\/([a-zA-Z0-9_\-/]+)\/?\)/g;
  const hrefRegex = /href=["'`{]?\/([a-zA-Z0-9_\-/]+)\/?["'`}]/g;

  const broken = [];

  for (const fp of allContentFiles) {
    const label = path.relative(ROOT, fp);
    const lines = fs.readFileSync(fp, 'utf-8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('src:') || line.trim().startsWith('alt:')) continue;

      for (const regex of [linkRegex, hrefRegex]) {
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(line)) !== null) {
          const raw = match[1];
          if (raw.includes('$') || raw.includes('{')) continue; // dynamic template expr
          if (/\.(png|jpg|jpeg|webp|svg|gif|xml|txt|pdf|ico|json)$/i.test(raw)) continue; // static asset

          const segments = raw.split('/').filter(Boolean);
          const first = segments[0]?.toLowerCase();

          if (first === 'blog') {
            const second = segments[1]?.toLowerCase();
            if (!second) continue;
            if (validSlugs.has(second) || blogAssetDirs.has(second)) continue;
            broken.push({ label, line: i + 1, target: `/${raw}/` });
            continue;
          }

          if (!first) continue;
          if (pageRoutes.has(first) || pageRoutes.has(segments.join('/'))) continue;

          broken.push({ label, line: i + 1, target: `/${raw}/` });
        }
      }
    }
  }

  if (broken.length > 0) {
    console.error(`\n❌ [broken-links] ${broken.length} broken internal link(s):\n`);
    for (const { label, line, target } of broken) {
      console.error(`  ${label}:${line} → ${target}`);
    }
    exitCode = 1;
  } else {
    console.log(`✅ [broken-links] no broken internal links found (${allContentFiles.length} files scanned)`);
  }
}

// ---------------------------------------------------------------------------
// Check 2: orphan pages (top-level pages with zero inbound internal links)
// ---------------------------------------------------------------------------

function checkOrphanPages() {
  // Top-level standalone pages only — index/utility/system/dynamic routes excluded.
  const excluded = new Set([
    'index', '404', 'rss.xml', 'video-sitemap.xml', 'blog', 'blog-old',
  ]);

  // Redirect/vanity stubs (QR-code landing pages, retired-page 301s) are
  // deliberately not linked from anywhere on the site — they're external
  // entry points, not content that needs internal discovery.
  function isRedirectStub(fp) {
    const source = fs.readFileSync(fp, 'utf-8');
    return /Astro\.redirect\(/.test(source) || /http-equiv=["']refresh["']/.test(source);
  }

  const topLevelPages = fs.readdirSync(PAGES_DIR, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.astro'))
    .map(e => e.name.replace(/\.astro$/, ''))
    .filter(slug => !excluded.has(slug))
    .filter(slug => !isRedirectStub(path.join(PAGES_DIR, `${slug}.astro`)));

  // Build a haystack of all link targets referenced anywhere in content/components/layouts
  const haystack = allContentFiles.map(fp => fs.readFileSync(fp, 'utf-8')).join('\n');

  const orphans = topLevelPages.filter(slug => {
    const pattern = new RegExp(`["'\`(]/${slug}/`, 'g');
    return !pattern.test(haystack);
  });

  if (orphans.length > 0) {
    console.error(`\n❌ [orphan-pages] ${orphans.length} page(s) with no inbound internal link:\n`);
    for (const slug of orphans) {
      console.error(`  /${slug}/  (src/pages/${slug}.astro)`);
    }
    exitCode = 1;
  } else {
    console.log(`✅ [orphan-pages] no orphan pages found (${topLevelPages.length} top-level pages checked)`);
  }
}

// ---------------------------------------------------------------------------
// Check 3: heading-order skips (Hn -> Hn+2 or steeper)
// ---------------------------------------------------------------------------

function stripFencedCodeBlocks(source) {
  // Remove ``` / ~~~ fenced blocks so shell comments like "# foo" aren't
  // mistaken for markdown ATX headings.
  return source.replace(/^([ \t]*)(```|~~~)[^\n]*\n[\s\S]*?^\1\2[ \t]*$/gm, '');
}

function extractHeadingLevels(source) {
  const levels = [];
  const withoutCode = stripFencedCodeBlocks(source);
  // Markdown ATX headings (blog post bodies)
  for (const m of withoutCode.matchAll(/^(#{1,6})\s+\S/gm)) {
    levels.push(m[1].length);
  }
  // JSX/HTML heading tags (.astro components/layouts)
  for (const m of withoutCode.matchAll(/<h([1-6])[\s>]/g)) {
    levels.push(Number(m[1]));
  }
  return levels;
}

function checkHeadingOrder() {
  const skips = [];

  for (const fp of allContentFiles) {
    const label = path.relative(ROOT, fp);
    const source = fs.readFileSync(fp, 'utf-8');
    const levels = extractHeadingLevels(source);

    for (let i = 1; i < levels.length; i++) {
      const prev = levels[i - 1];
      const curr = levels[i];
      if (curr > prev + 1) {
        skips.push({ label, from: prev, to: curr, index: i });
      }
    }
  }

  if (skips.length > 0) {
    console.error(`\n❌ [heading-order] ${skips.length} heading level skip(s):\n`);
    for (const { label, from, to } of skips) {
      console.error(`  ${label}: H${from} → H${to} (skips H${from + 1})`);
    }
    console.error(`\nNote: this checks each file in isolation. A file whose headings look`);
    console.error(`fine alone can still skip levels once composed into a page (e.g. a`);
    console.error(`layout's H3 CTA following a post body that ends on H2) — cross-check`);
    console.error(`shared layouts/components manually when in doubt.\n`);
    exitCode = 1;
  } else {
    console.log(`✅ [heading-order] no heading-order skips found (${allContentFiles.length} files scanned)`);
  }
}

// ---------------------------------------------------------------------------

if (runCheck('broken-links')) checkBrokenLinks();
if (runCheck('orphan-pages')) checkOrphanPages();
if (runCheck('heading-order')) checkHeadingOrder();

if (exitCode !== 0) {
  console.error(`\nFix the issues above before deploying.\n`);
} else {
  console.log(`\n✅ Site audit checks passed.\n`);
}

process.exit(exitCode);
