#!/usr/bin/env node
/**
 * Broken Markdown Table Checker for Astro MDX blog posts.
 *
 * Catches tables that were generated with literal "\n" escape sequences
 * instead of real newlines, e.g.:
 *   || Metric | Value |\n||---|---|\n|| Attendees | 2,000+ |\n...
 * This renders as raw text instead of a table (see
 * agntcon-mcpcon-europe-2026-recap-takeaways.mdx, fixed 2026-09-21).
 *
 * Detection: a table-row line (starts with `|`) that contains a literal
 * backslash-n sequence, or starts with a doubled leading pipe `||`.
 * Fenced code blocks (``` ... ```) are skipped, since bash `||` inside a
 * code block is a valid OR operator, not a broken table row.
 * Exit code 1 if any broken tables found (fails CI pipeline).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');

const args = process.argv.slice(2);
const stagedOnly = args.includes('--staged');

const { execSync } = require('child_process');

function getStagedMdxFiles() {
  const out = execSync('git diff --cached --diff-filter=ACM --name-only', { cwd: ROOT })
    .toString()
    .split('\n')
    .filter(Boolean);
  return out
    .filter(f => f.startsWith('src/content/blog/') && (f.endsWith('.mdx') || f.endsWith('.md')))
    .map(f => path.join(ROOT, f));
}

function getAllMdxFiles() {
  return fs
    .readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .map(f => path.join(BLOG_DIR, f));
}

const files = stagedOnly ? getStagedMdxFiles() : getAllMdxFiles();

let totalBroken = 0;
const broken = {};

for (const fp of files) {
  if (!fs.existsSync(fp)) continue;
  const label = path.relative(ROOT, fp);
  const content = fs.readFileSync(fp, 'utf-8');
  const lines = content.split('\n');

  let inCodeFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    if (!trimmed.startsWith('|')) continue;

    const hasLiteralNewline = /\\n/.test(line);
    const hasDoubledLeadingPipe = /^\|\|/.test(trimmed);

    if (hasLiteralNewline || hasDoubledLeadingPipe) {
      if (!broken[label]) broken[label] = [];
      broken[label].push({ line: i + 1, reason: hasLiteralNewline ? 'literal \\n in table row' : 'doubled leading pipe (||)' });
      totalBroken++;
    }
  }
}

if (totalBroken > 0) {
  console.error(`\n❌ Found ${totalBroken} broken markdown table row(s):\n`);
  for (const [file, issues] of Object.entries(broken)) {
    for (const { line, reason } of issues) {
      console.error(`  ${file}:${line} → ${reason}`);
    }
  }
  console.error(`\nThese tables render as raw text instead of a table. Replace literal "\\n" with real newlines and remove doubled "||".\n`);
  process.exit(1);
} else {
  console.log(`✅ No broken markdown tables found (${files.length} files scanned)`);
  process.exit(0);
}
