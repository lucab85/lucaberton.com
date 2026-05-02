#!/usr/bin/env node
/**
 * Broken Internal Link Checker for Astro MDX blog
 * Scans all .mdx files for /blog/slug/ links and verifies the target exists.
 * Exit code 1 if broken links found (fails CI pipeline).
 */
const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'src', 'content', 'blog');
const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages');

// Collect all valid blog slugs
const blogFiles = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'));
const validSlugs = new Set(blogFiles.map(f => f.replace('.mdx', '')));

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

// Static asset directories under /blog/ — these are images, not pages
const assetDirs = new Set(['events', 'proteinlens', 'openclaw', 'thumbnails', 'books', 'courses', 'conferences']);

const linkRegex = /\]\(\/blog\/([a-zA-Z0-9_-]+)\//g;
const hrefRegex = /href=["']\/blog\/([a-zA-Z0-9_-]+)\//g;

let totalBroken = 0;
const broken = {};

for (const file of blogFiles) {
  const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
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
        if (!validSlugs.has(slug) && !assetDirs.has(slug)) {
          if (!broken[file]) broken[file] = [];
          broken[file].push({ line: i + 1, slug });
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
  console.log(`✅ All internal blog links verified (${blogFiles.length} files scanned)`);
  process.exit(0);
}
