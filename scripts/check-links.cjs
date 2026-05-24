#!/usr/bin/env node
/**
 * Broken Internal Link Checker for Astro MDX blog + .astro pages/components
 * Scans .mdx and .astro files for /blog/<slug>/ links and verifies the target exists.
 * Exit code 1 if broken links found (fails CI pipeline).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const COMPONENTS_DIR = path.join(ROOT, 'src', 'components');
const LAYOUTS_DIR = path.join(ROOT, 'src', 'layouts');

// Collect all valid blog slugs (lowercase for case-insensitive matching;
// macOS preserves case in readdir while Linux CI is case-sensitive)
const blogFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
const validSlugs = new Set(blogFiles.map(f => f.replace('.mdx', '').toLowerCase()));

// Collect all valid page routes
const validPages = new Set(['books', 'courses', 'about', 'contact', 'services', 'blog', 'conference-speaking-journey', 'kubecon', 'book-signing', 'talk', 'network']);

// Scan pages directory recursively for .astro files
function scanPages(dir, prefix = '') {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      validPages.add(prefix + entry.name);
      scanPages(path.join(dir, entry.name), prefix + entry.name + '/');
    }
  }
}
scanPages(PAGES_DIR);

// Static asset directories and non-post sub-routes under /blog/ — these are not blog posts
const assetDirs = new Set(['events', 'proteinlens', 'openclaw', 'thumbnails', 'books', 'courses', 'conferences', 'categories', 'tags', 'search']);

const linkRegex = /\]\(\/blog\/([a-zA-Z0-9_-]+)\//g;
const hrefRegex = /href=["'`{]?\/blog\/([a-zA-Z0-9_-]+)\//g;

// Collect files to scan: all .mdx blog files + all .astro files in pages/components/layouts
function collectAstroFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectAstroFiles(p));
    } else if (entry.name.endsWith('.astro')) {
      out.push(p);
    }
  }
  return out;
}

const filesToScan = [
  ...blogFiles.map(f => ({ path: path.join(BLOG_DIR, f), label: `src/content/blog/${f}` })),
  ...collectAstroFiles(PAGES_DIR).map(p => ({ path: p, label: path.relative(ROOT, p) })),
  ...collectAstroFiles(COMPONENTS_DIR).map(p => ({ path: p, label: path.relative(ROOT, p) })),
  ...collectAstroFiles(LAYOUTS_DIR).map(p => ({ path: p, label: path.relative(ROOT, p) })),
];

let totalBroken = 0;
const broken = {};

for (const { path: fp, label } of filesToScan) {
  const content = fs.readFileSync(fp, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip frontmatter image paths
    if (line.trim().startsWith('src:')) continue;
    if (line.trim().startsWith('alt:')) continue;

    for (const regex of [linkRegex, hrefRegex]) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        const slug = match[1];
        const slugLower = slug.toLowerCase();
        // Skip dynamic template expressions (e.g. ${slug}, {slug})
        if (slug.includes('$') || slug.includes('{')) continue;
        if (!validSlugs.has(slugLower) && !assetDirs.has(slugLower)) {
          if (!broken[label]) broken[label] = [];
          broken[label].push({ line: i + 1, slug });
          totalBroken++;
        }
      }
    }
  }
}

if (totalBroken > 0) {
  console.error(`\n❌ Found ${totalBroken} broken internal blog links:\n`);
  for (const [file, links] of Object.entries(broken)) {
    for (const { line, slug } of links) {
      console.error(`  ${file}:${line} → /blog/${slug}/ (no matching .mdx)`);
    }
  }
  console.error(`\nFix these before deploying.\n`);
  process.exit(1);
} else {
  console.log(`✅ All internal blog links verified (${filesToScan.length} files scanned)`);
  process.exit(0);
}
