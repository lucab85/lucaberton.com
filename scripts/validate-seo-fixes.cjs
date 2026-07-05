#!/usr/bin/env node
/**
 * SEO Fix Validation Suite
 * ------------------------
 * Verifies every SEO remediation applied to lucaberton.com:
 *
 *   1. Title length      <= 60 chars on indexable pages          (built HTML)
 *   2. Meta description   <= 160 chars on indexable pages         (built HTML)
 *   3. Title length      >= 30 chars (warn)                       (built HTML)
 *   4. Meta description  >= 120 chars (warn)                      (built HTML)
 *   5. og:url === canonical on indexable pages                   (built HTML)
 *   6. Video pages (VideoObject JSON-LD) expose a real <iframe>  (built HTML)
 *   7. robots.txt does NOT Disallow /slides/                     (source)
 *   8. /slides/* keeps the X-Robots-Tag: noindex header          (source)
 *   9. /blog/search facet links carry rel="nofollow"             (source)
 *  10. No outgoing links to deleted/renamed URLs                 (source)
 *  11. Renamed masterclass slug present, old slug absent         (source)
 *  12. No astro-embed <YouTube> facade imports remain            (source)
 *  13. Orphan pages each receive >= 1 incoming internal link     (source)
 *  14. Key 301 redirects exist in static/_redirects              (source)
 *
 * Checks 15+ automate the Ahrefs Site Audit (29 Jun 2026) and GSC coverage
 * (5 Jul 2026) report findings so they are caught at pre-commit time:
 *
 *  15. <img>/<Image>/<Picture> carry an alt attribute; markdown
 *      body images have non-empty alt text                       (source)  [Ahrefs: Missing alt text]
 *  16. rel=nofollow on INTERNAL links only toward /blog/search   (source)  [Ahrefs: nofollow outgoing internal links]
 *  17. Internal link hygiene: no http:// or www. self-links, no
 *      missing trailing slash, no uppercase in page paths        (source)  [GSC: Page with redirect / 404]
 *  18. Internal /blog/<slug>/ links resolve to a published post,
 *      a redirect stub, or a 301 (drafts/missing = FAIL)         (source)  [GSC: Not found 404]
 *  19. Generated category pages never collide with a 301 in
 *      static/_redirects; category links resolve; thin
 *      categories (< 3 posts) warned                             (source)  [Ahrefs: 5XX page in sitemap]
 *  20. Published post slugs never collide with a 301             (source)  [Ahrefs: redirect/sitemap conflicts]
 *  21. AI-crawler readiness: llms.txt + llms-full.txt exist,
 *      robots.txt allows GPTBot/ClaudeBot/anthropic-ai/
 *      Google-Extended, sitemaps declared, JSON-LD in layout     (source)  [AI/GEO optimization]
 *  22. Incoming dofollow internal-link graph: published posts
 *      with < 2 incoming links are warned                        (built HTML) [Ahrefs: only one dofollow incoming link]
 *
 * Source-only checks always run. HTML checks run when ./public exists
 * (run `pnpm build` first). Exits 1 if any FAIL-level check fails.
 *
 * NOT automatable here (documented for completeness): transient 5XX at the
 * edge, "Page and SERP titles do not match", referring-domain drops, and
 * IndexNow submission (see scripts/indexnow-submit.sh).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const BLOG_DIR = path.join(ROOT, "src", "content", "blog");

// `--source-only` skips checks that require a built ./public (used by the git
// pre-commit hook so commits stay fast and deterministic). Full HTML validation
// runs via `pnpm validate:seo` after a build (and in CI).
const SOURCE_ONLY = process.argv.includes("--source-only");

const MAX_TITLE = 60;
const MIN_TITLE = 30;
const MAX_DESC = 160;
const MIN_DESC = 120;
const MIN_WORDS = 300; // thin-content threshold for indexable listing pages

// Orphan pages that must now have incoming internal links.
const ORPHAN_SLUGS = [
  "tnw-conference-2025",
  "new-delhi-international-book-fair-2024",
  "london-book-fair-2024",
  "de-nederlandse-kubernetes-podcast",
];

// Non-blog pages that must have incoming internal links (path is the exact link
// target). /talk/ was flagged as an orphan by Ahrefs (no incoming links).
const NON_BLOG_ORPHAN_PATHS = [
  "/talk/",
];

// Outgoing-link targets that must no longer appear in source content/components.
const FORBIDDEN_LINK_PATTERNS = [
  "/booklist/",
  "claude-code-masterclass-udemy-free-course-2026",
  "claude-code-masterclass-free-udemy-course-ai-development",
  "/services/kubernetes-consulting/",
  "/services/platform-engineering/",
  "/services/ai-integration-green-code/",
  "/services/automation-strategy-consulting/",
  "/services/cloud-infrastructure-design/",
  "/services/kubernetes-containerization-workshops/",
  "/services/performance-optimization-custom-solutions/",
  "/blog/kcs_",
];

// Required 301 redirect source patterns in static/_redirects.
const REQUIRED_REDIRECTS = [
  "/booklist",
  "/tags/*",
  "/blog/claude-code-masterclass-udemy-free-course-2026",
  "/services/kubernetes-consulting",
  "/services/platform-engineering",
  "/blog/categories/kcs",
  "/blog/categories/wordpress",
];

const results = []; // { level: 'PASS'|'FAIL'|'WARN', check, detail }
const record = (level, check, detail = "") => results.push({ level, check, detail });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const read = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => fs.existsSync(p);

function walk(dir, predicate, out = []) {
  if (!exists(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, predicate, out);
    else if (predicate(p)) out.push(p);
  }
  return out;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;|&#38;|&#x26;/gi, "&")
    .replace(/&lt;|&#60;|&#x3c;/gi, "<")
    .replace(/&gt;|&#62;|&#x3e;/gi, ">")
    .replace(/&quot;|&#34;|&#x22;/gi, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .trim();
}

// Extract an attribute value, tolerating quoted or unquoted (minified) forms.
function getAttr(tag, name) {
  const m = tag.match(new RegExp("\\b" + name + "=(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? null) : null;
}

// Count visible words by stripping scripts, styles, tags, and entities.
function visibleWordCount(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
  return text.split(/\s+/).filter(Boolean).length;
}

// Return the first <tagName ...> whose text matches markerRe.
function findTag(html, tagName, markerRe) {
  const re = new RegExp("<" + tagName + "\\b[^>]*>", "gi");
  let m;
  while ((m = re.exec(html))) if (markerRe.test(m[0])) return m[0];
  return null;
}

function parsePage(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]) : null;

  const descTag = findTag(html, "meta", /\bname=["']?description\b/i);
  const description = descTag ? decodeEntities(getAttr(descTag, "content") || "") : null;

  const robotsTag = findTag(html, "meta", /\bname=["']?robots\b/i);
  const robots = robotsTag ? (getAttr(robotsTag, "content") || "") : "";
  const indexable = !/noindex/i.test(robots);

  const canonTag = findTag(html, "link", /\brel=["']?canonical\b/i);
  const canonical = canonTag ? getAttr(canonTag, "href") : null;

  const ogTag = findTag(html, "meta", /\bproperty=["']?og:url\b/i);
  const ogUrl = ogTag ? getAttr(ogTag, "content") : null;

  const hasVideoObject = /"@type":\s*"VideoObject"/.test(html);
  const hasRealEmbed = /<iframe\b[^>]*\bsrc=["']?https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[A-Za-z0-9_-]{11}/i.test(html);

  return { title, description, indexable, canonical, ogUrl, hasVideoObject, hasRealEmbed };
}

// ---------------------------------------------------------------------------
// SOURCE checks (no build required)
// ---------------------------------------------------------------------------
function sourceScanFiles() {
  return [
    ...walk(BLOG_DIR, (p) => p.endsWith(".mdx")),
    ...walk(path.join(ROOT, "src", "pages"), (p) => p.endsWith(".astro")),
    ...walk(path.join(ROOT, "src", "components"), (p) => p.endsWith(".astro")),
    ...walk(path.join(ROOT, "src", "layouts"), (p) => p.endsWith(".astro")),
  ];
}

function checkRobotsSlides() {
  const robots = read(path.join(ROOT, "static", "robots.txt"));
  if (/^\s*Disallow:\s*\/slides\/\s*$/im.test(robots)) {
    record("FAIL", "robots.txt /slides/", "still contains 'Disallow: /slides/' (blocks crawlers from seeing noindex header)");
  } else {
    record("PASS", "robots.txt /slides/", "no redundant Disallow: /slides/");
  }
}

function checkSlidesHeader() {
  const headers = read(path.join(ROOT, "static", "_headers"));
  const ok = /\/slides\/\*\s*\n\s*X-Robots-Tag:\s*noindex/i.test(headers);
  record(ok ? "PASS" : "FAIL", "_headers /slides/ noindex", ok ? "X-Robots-Tag: noindex present" : "missing noindex header for /slides/*");
}

function checkSearchNofollow() {
  const files = [
    "src/pages/blog/index.astro",
    "src/pages/blog/[page].astro",
    "src/layouts/BlogLayout.astro",
  ];
  for (const rel of files) {
    const fp = path.join(ROOT, rel);
    if (!exists(fp)) continue;
    const src = read(fp);
    // Every anchor that targets /blog/search must declare rel="nofollow".
    const anchors = src.match(/<a\b[^>]*\/blog\/search[^>]*>/gi) || [];
    const missing = anchors.filter((a) => !/rel=["'][^"']*nofollow/i.test(a));
    if (anchors.length === 0) {
      record("WARN", `nofollow ${rel}`, "no /blog/search anchors found");
    } else if (missing.length) {
      record("FAIL", `nofollow ${rel}`, `${missing.length}/${anchors.length} /blog/search link(s) missing rel=nofollow`);
    } else {
      record("PASS", `nofollow ${rel}`, `${anchors.length} /blog/search link(s) all rel=nofollow`);
    }
  }
}

function checkForbiddenLinks() {
  const files = sourceScanFiles();
  let violations = 0;
  for (const fp of files) {
    const src = read(fp);
    for (const pat of FORBIDDEN_LINK_PATTERNS) {
      // Only flag when it appears as a link target (href= or markdown link).
      const re = new RegExp("(href=[\"'`{]?|\\]\\()" + pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      if (re.test(src)) {
        violations++;
        record("FAIL", "forbidden link", `${path.relative(ROOT, fp)} links to ${pat}`);
      }
    }
  }
  if (!violations) record("PASS", "forbidden links", "no links to deleted/renamed URLs in source");
}

function checkMasterclassRename() {
  const newSlug = path.join(BLOG_DIR, "claude-code-masterclass-udemy-course-2026.mdx");
  const oldSlug = path.join(BLOG_DIR, "claude-code-masterclass-udemy-free-course-2026.mdx");
  record(exists(newSlug) ? "PASS" : "FAIL", "masterclass slug", exists(newSlug) ? "renamed post present" : "renamed post missing");
  record(!exists(oldSlug) ? "PASS" : "FAIL", "masterclass old slug", !exists(oldSlug) ? "old slug removed" : "old slug still present");
}

function checkNoAstroEmbed() {
  const offenders = walk(BLOG_DIR, (p) => p.endsWith(".mdx")).filter((p) =>
    /from\s+["']astro-embed["']/.test(read(p))
  );
  if (offenders.length) {
    record("FAIL", "video import swap", `${offenders.length} post(s) still import astro-embed: ${offenders.map((f) => path.basename(f)).join(", ")}`);
  } else {
    record("PASS", "video import swap", "no astro-embed <YouTube> facade imports remain");
  }
}

function checkOrphanIncomingLinks() {
  const files = sourceScanFiles();
  for (const slug of ORPHAN_SLUGS) {
    const target = `/blog/${slug}/`;
    const linkers = files.filter((fp) => {
      if (path.basename(fp) === `${slug}.mdx`) return false; // ignore self
      return read(fp).includes(target);
    });
    if (linkers.length) {
      record("PASS", `orphan ${slug}`, `${linkers.length} incoming link(s)`);
    } else {
      record("FAIL", `orphan ${slug}`, "no incoming internal links found");
    }
  }
  for (const target of NON_BLOG_ORPHAN_PATHS) {
    const linkers = files.filter((fp) => {
      // ignore the page's own source (e.g. /talk/ -> src/pages/talk.astro)
      const self = "src/pages" + target.replace(/\/$/, "") + ".astro";
      if (path.relative(ROOT, fp) === self) return false;
      return read(fp).includes(target);
    });
    record(linkers.length ? "PASS" : "FAIL", `orphan ${target}`,
      linkers.length ? `${linkers.length} incoming link(s)` : "no incoming internal links found");
  }
}

// Source guard: every local image referenced by a blog post — both the
// frontmatter `image.src` and absolute-path body images `![alt](/path)` — must
// exist on disk under static/. Catches "Page has broken image" / "Image broken"
// (404) before a crawl does. External (http/https), data:, and Astro-import
// (relative ../) references are skipped.
function checkBlogImagesExist() {
  const files = walk(BLOG_DIR, (p) => p.endsWith(".mdx"));
  const STATIC_DIR = path.join(ROOT, "static");
  let missing = 0;
  const localImg = (src) =>
    src && src.startsWith("/") && /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(src);
  const resolveOk = (src) => {
    const clean = src.split("#")[0].split("?")[0];
    return exists(path.join(STATIC_DIR, clean)) || exists(path.join(PUBLIC_DIR, clean));
  };
  for (const fp of files) {
    const src = read(fp);
    if (/^draft:\s*true\b/m.test(src)) continue; // drafts are noindex
    const rel = "blog/" + path.basename(fp, ".mdx");

    // Frontmatter image.src
    const fmImg = src.match(/^\s*src:\s*["']([^"']+)["']/m);
    if (fmImg && localImg(fmImg[1]) && !resolveOk(fmImg[1])) {
      missing++;
      record("FAIL", "broken frontmatter image", `${rel} -> ${fmImg[1]}`);
    }
    // Body markdown images ![alt](/path)
    const bodyRe = /!\[[^\]]*\]\((\/[^)\s]+)\)/g;
    let m;
    const seen = new Set();
    while ((m = bodyRe.exec(src))) {
      const url = m[1];
      if (seen.has(url) || !localImg(url) || resolveOk(url)) continue;
      seen.add(url);
      missing++;
      record("FAIL", "broken body image", `${rel} -> ${url}`);
    }
  }
  record(missing ? "FAIL" : "PASS", "blog images exist", `${missing} broken local image reference(s)`);
}

function checkRedirects() {
  const redirects = read(path.join(ROOT, "static", "_redirects"));
  for (const pat of REQUIRED_REDIRECTS) {
    const ok = redirects.split("\n").some((line) => line.trim().startsWith(pat) && /\b301\b/.test(line));
    record(ok ? "PASS" : "FAIL", "redirect", ok ? `301 for ${pat}` : `missing 301 for ${pat}`);
  }
}

// Source guard: any code path that LISTS blog posts (and links to them) must
// exclude drafts, or it will link to de-indexed posts that no longer build.
function checkDraftFilters() {
  const mustFilter = [
    "src/utils/getUniqueCategories.ts",
    "src/pages/blog/categories/[slug]/index.astro",
    "src/pages/blog/[slug].astro",
    "src/pages/video-sitemap.xml.ts",
    "src/pages/rss.xml.ts",
  ];
  let missing = 0;
  for (const rel of mustFilter) {
    const fp = path.join(ROOT, rel);
    if (!exists(fp)) continue;
    const src = read(fp);
    const hasFilteredGet = /getCollection\(\s*["']blog["']\s*,[\s\S]*?draft/.test(src);
    const hasArrayFilter = /\.filter\([\s\S]*?draft/.test(src);
    if (!hasFilteredGet && !hasArrayFilter) {
      missing++;
      record("FAIL", "draft filter missing", `${rel} lists blog posts without excluding drafts`);
    }
  }
  record(missing ? "FAIL" : "PASS", "draft filters on listings", `${missing} listing file(s) missing draft filter`);
}

// Source-side length guard for blog frontmatter, so over-length meta
// descriptions/titles are caught at pre-commit time (not only post-build in CI).
// The rendered meta description comes from `snippet`; the rendered <title> base
// is `seoTitle || title` (the " | Luca Berton" suffix is only appended when the
// total still fits in 60, so only a base title > 60 actually fails).
function checkSourceFrontmatterLength() {
  const files = walk(BLOG_DIR, (p) => p.endsWith(".mdx"));
  let descLong = 0, titleLong = 0;
  const fmValue = (fm, key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
    if (!m) return null;
    return m[1].replace(/^["']/, "").replace(/["']$/, "");
  };
  for (const fp of files) {
    const src = read(fp);
    const fmMatch = src.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];
    if (/^draft:\s*true\b/m.test(fm)) continue; // drafts are noindex
    const rel = "blog/" + path.basename(fp, ".mdx");

    const snippet = fmValue(fm, "snippet");
    if (snippet != null && snippet.length > MAX_DESC) {
      descLong++;
      record("FAIL", "meta>160 (source)", `${rel} (${snippet.length})`);
    }
    const baseTitle = fmValue(fm, "seoTitle") ?? fmValue(fm, "title");
    if (baseTitle != null && baseTitle.length > MAX_TITLE) {
      titleLong++;
      record("FAIL", "title>60 (source)", `${rel} (${baseTitle.length})`);
    }
  }
  record(descLong ? "FAIL" : "PASS", "source snippet <= 160", `${descLong} blog post(s) over 160 chars`);
  record(titleLong ? "FAIL" : "PASS", "source title <= 60", `${titleLong} blog post(s) over 60 chars`);
}

// ---------------------------------------------------------------------------
// BUILT HTML checks (require ./public)
// ---------------------------------------------------------------------------
function checkBuiltHtml() {
  const pages = walk(PUBLIC_DIR, (p) => path.basename(p) === "index.html");
  if (!pages.length) {
    record("WARN", "built HTML", "public/ has no pages — run `pnpm build` to enable HTML checks");
    return;
  }

  let titleLong = 0, titleShort = 0, descLong = 0, descShort = 0;
  let ogMismatch = 0, videoNoEmbed = 0, indexableCount = 0;

  for (const fp of pages) {
    const rel = path.relative(PUBLIC_DIR, fp).replace(/\/index\.html$/, "") || "/";
    const html = read(fp);
    const p = parsePage(html);

    // Video: any page asserting a VideoObject must expose a real iframe.
    if (p.hasVideoObject && !p.hasRealEmbed) {
      videoNoEmbed++;
      record("FAIL", "video watch page", `${rel}: VideoObject without a real <iframe> embed`);
    }

    if (!p.indexable) continue; // length/canonical rules apply to indexable pages only
    indexableCount++;

    if (p.title != null) {
      if (p.title.length > MAX_TITLE) { titleLong++; record("FAIL", "title>60", `${rel} (${p.title.length})`); }
      else if (p.title.length < MIN_TITLE) { titleShort++; record("WARN", "title<30", `${rel} (${p.title.length})`); }
    }
    if (p.description != null && p.description.length > 0) {
      if (p.description.length > MAX_DESC) { descLong++; record("FAIL", "meta>160", `${rel} (${p.description.length})`); }
      else if (p.description.length < MIN_DESC) { descShort++; record("WARN", "meta<120", `${rel} (${p.description.length})`); }
    }
    if (p.canonical && p.ogUrl && p.canonical !== p.ogUrl) {
      ogMismatch++;
      record("FAIL", "og:url≠canonical", `${rel}: ${p.ogUrl} vs ${p.canonical}`);
    }
  }

  record(titleLong ? "FAIL" : "PASS", "titles <= 60", `${titleLong} indexable page(s) over 60 chars`);
  record(descLong ? "FAIL" : "PASS", "meta <= 160", `${descLong} indexable page(s) over 160 chars`);
  record(ogMismatch ? "FAIL" : "PASS", "og:url = canonical", `${ogMismatch} mismatch(es)`);
  record(videoNoEmbed ? "FAIL" : "PASS", "video watch pages", `${videoNoEmbed} VideoObject page(s) without a real embed`);
  if (titleShort) record("WARN", "titles >= 30", `${titleShort} indexable page(s) under 30 chars`);
  if (descShort) record("WARN", "meta >= 120", `${descShort} indexable page(s) under 120 chars`);
  record("PASS", "indexable pages scanned", `${indexableCount} of ${pages.length} built pages`);
}

// Category listing pages must clear the thin-content threshold (>= 300 words).
function checkCategoryWordCount() {
  const dir = path.join(PUBLIC_DIR, "blog", "categories");
  const pages = walk(dir, (p) => path.basename(p) === "index.html");
  if (!pages.length) return; // no build or no category pages
  let thin = 0;
  for (const fp of pages) {
    const rel = path.relative(PUBLIC_DIR, fp).replace(/\/index\.html$/, "");
    const html = read(fp);
    if (!parsePage(html).indexable) continue;
    const words = visibleWordCount(html);
    if (words < MIN_WORDS) { thin++; record("FAIL", "category words<300", `${rel} (${words})`); }
  }
  record(thin ? "FAIL" : "PASS", "category pages >= 300 words", `${thin} thin category page(s)`);
}

// Built-HTML guard: category listing pages must not link to blog posts that
// no longer exist in the build (e.g. drafts), which would be broken links.
// NOTE: comparison is case-insensitive. Slugs come from lowercase source
// filenames, but a case-insensitive local FS (macOS) can preserve stale
// mixed-case build dirs; lowercasing both sides avoids that false positive
// while still catching genuinely-missing slugs.
function checkListingLinksResolve() {
  const blogDir = path.join(PUBLIC_DIR, "blog");
  if (!exists(blogDir)) return;
  const valid = new Set();
  for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
    if (entry.isDirectory() && exists(path.join(blogDir, entry.name, "index.html"))) {
      valid.add(entry.name.toLowerCase());
    }
  }
  const ignore = new Set(["categories", "tags", "search"]);
  const pages = walk(path.join(blogDir, "categories"), (p) => path.basename(p) === "index.html");
  const hrefRe = /href=(?:"|')?\/blog\/([A-Za-z0-9._-]+)\/(?:"|'|\s|>)/g;
  let broken = 0;
  for (const fp of pages) {
    const rel = path.relative(PUBLIC_DIR, fp).replace(/\/index\.html$/, "");
    const html = read(fp);
    const seen = new Set();
    let m;
    while ((m = hrefRe.exec(html))) {
      const seg = m[1].toLowerCase();
      if (ignore.has(seg) || /^\d+$/.test(seg) || seen.has(seg)) continue;
      seen.add(seg);
      if (!valid.has(seg)) { broken++; record("FAIL", "listing links to missing post", `${rel} -> /blog/${m[1]}/`); }
    }
  }
  record(broken ? "FAIL" : "PASS", "category listing links resolve", `${broken} link(s) to missing/draft posts`);
}

// Built-HTML guard: no meta-refresh stub redirect page (noindex,follow) may
// appear in the built sitemap, or crawlers flag "Noindex page in sitemap".
// Stub slugs are derived from src/pages/blog/<slug>/index.astro (same source
// astro.config.mjs uses to exclude them), then matched against sitemap-0.xml.
function checkSitemapNoStubs() {
  const sitemap = path.join(PUBLIC_DIR, "sitemap-0.xml");
  if (!exists(sitemap)) {
    record("WARN", "sitemap stub exclusion", "public/sitemap-0.xml not found — run `pnpm build`");
    return;
  }
  const blogPagesDir = path.join(ROOT, "src", "pages", "blog");
  const stubSlugs = new Set();
  if (exists(blogPagesDir)) {
    for (const entry of fs.readdirSync(blogPagesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const idx = path.join(blogPagesDir, entry.name, "index.astro");
      if (exists(idx) && /http-equiv=["']refresh["']/i.test(read(idx))) stubSlugs.add(entry.name);
    }
  }
  const xml = read(sitemap);
  let leaked = 0;
  for (const slug of stubSlugs) {
    if (xml.includes(`/blog/${slug}/`)) {
      leaked++;
      record("FAIL", "stub in sitemap", `/blog/${slug}/ (noindex redirect stub)`);
    }
  }
  record(leaked ? "FAIL" : "PASS", "sitemap excludes stubs", `${leaked} redirect stub(s) in sitemap of ${stubSlugs.size} total`);
}

// Built-HTML guard: inline client-side scripts that build hrefs with a template
// literal (e.g. `/blog/${post.slug}/`) leave the LITERAL placeholder in the page
// source after minification (var renamed → `/blog/${e.slug}/`). Google's URL
// extractor scrapes that literal as a real link and reports it as 404. Build the
// href via string concatenation instead ("/blog/" + slug + "/"). This check
// fails if any built page still contains a `/<seg>/${...}/` URL placeholder.
function checkNoLeakedTemplateUrls() {
  const pages = walk(PUBLIC_DIR, (p) => path.basename(p) === "index.html");
  if (!pages.length) {
    record("WARN", "leaked template URLs", "public/ has no pages — run `pnpm build`");
    return;
  }
  const re = /\/[a-z0-9-]+\/\$\{[^}]+\}\//i; // e.g. /blog/${e.slug}/
  let leaked = 0;
  for (const fp of pages) {
    const html = read(fp);
    const m = html.match(re);
    if (m) {
      leaked++;
      const rel = path.relative(PUBLIC_DIR, fp).replace(/\/index\.html$/, "") || "/";
      record("FAIL", "leaked template URL", `${rel}: ${m[0]} (use string concatenation, not a template literal, for client-side hrefs)`);
    }
  }
  record(leaked ? "FAIL" : "PASS", "no leaked template URLs", `${leaked} page(s) with literal /seg/$\{...\}/ URLs`);
}

// ---------------------------------------------------------------------------
// Report-driven checks (Ahrefs Site Audit 29 Jun 2026 / GSC coverage 5 Jul 2026)
// ---------------------------------------------------------------------------

// slugify must match src/utils/getUniqueCategories.ts ({ lower: true, strict: true }).
let slugifyFn;
try {
  slugifyFn = require("slugify");
  if (slugifyFn && slugifyFn.default) slugifyFn = slugifyFn.default;
} catch {
  slugifyFn = null;
}
const categorySlug = (name) =>
  slugifyFn
    ? slugifyFn(name, { lower: true, strict: true })
    : name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-");

// Frontmatter-only parse (never the body — posts embed YAML in code blocks).
function frontmatterOf(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : null;
}

// Strip fenced code blocks, inline code, and HTML comments so code samples
// (e.g. an XSS <img> demo) and commented-out markup are never flagged as
// real content. Replaced with spaces to keep the text scannable.
function stripNonContent(src) {
  return src
    .replace(/```[\s\S]*?```/g, (m) => " ".repeat(m.length))
    .replace(/`[^`\n]*`/g, (m) => " ".repeat(m.length))
    .replace(/<!--[\s\S]*?-->/g, (m) => " ".repeat(m.length));
}

// All published posts: { file, slug, fm }.
function publishedPosts() {
  return walk(BLOG_DIR, (p) => p.endsWith(".mdx"))
    .map((fp) => ({ file: fp, slug: path.basename(fp, ".mdx"), fm: frontmatterOf(read(fp)) }))
    .filter((p) => p.fm != null && !/^draft:\s*true\b/m.test(p.fm));
}

function draftSlugs() {
  return new Set(
    walk(BLOG_DIR, (p) => p.endsWith(".mdx"))
      .filter((fp) => {
        const fm = frontmatterOf(read(fp));
        return fm != null && /^draft:\s*true\b/m.test(fm);
      })
      .map((fp) => path.basename(fp, ".mdx"))
  );
}

// Categories of a post: `category: "X"` plus a frontmatter `categories:` list
// (inline [a, b] or block form) — mirrors getUniqueCategories.ts.
function postCategories(fm) {
  const out = [];
  const single = fm.match(/^category:\s*["']?([^"'\n]+?)["']?\s*$/m);
  const block = fm.match(/^categories:\s*(\[[^\]]*\])?\s*\n?((?:\s+-\s+.+\n?)*)/m);
  if (block) {
    if (block[1]) {
      for (const item of block[1].slice(1, -1).split(","))
        if (item.trim()) out.push(item.trim().replace(/^["']|["']$/g, ""));
    } else if (block[2]) {
      for (const line of block[2].split("\n")) {
        const m = line.match(/^\s+-\s+["']?(.+?)["']?\s*$/);
        if (m) out.push(m[1]);
      }
    }
  }
  if (!out.length && single) out.push(single[1].trim());
  return out;
}

// _redirects 301 source paths (first token of each 301 line).
function redirectSources() {
  const out = new Set();
  const redirects = read(path.join(ROOT, "static", "_redirects"));
  for (const line of redirects.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !/\b301\b/.test(t)) continue;
    out.add(t.split(/\s+/)[0]);
  }
  return out;
}

// 15. Every <img>/<Image>/<Picture> must carry an alt attribute, and markdown
// body images must have non-empty alt text. [Ahrefs: Missing alt text]
function checkImageAlt() {
  let bad = 0;
  for (const fp of sourceScanFiles()) {
    const src = stripNonContent(read(fp));
    const rel = path.relative(ROOT, fp);
    const tags = src.match(/<(?:img|Image|Picture)\b[^>]*>/g) || [];
    for (const tag of tags) {
      if (!/\balt\s*=/.test(tag)) {
        bad++;
        record("FAIL", "img missing alt", `${rel}: ${tag.replace(/\s+/g, " ").slice(0, 80)}…`);
      }
    }
    if (fp.endsWith(".mdx")) {
      const fm = frontmatterOf(src);
      if (fm && /^draft:\s*true\b/m.test(fm)) continue;
      const bodyRe = /!\[(\s*)\]\(([^)\s]+)\)/g;
      let m;
      while ((m = bodyRe.exec(src))) {
        bad++;
        record("FAIL", "markdown image empty alt", `${rel} -> ${m[2]}`);
      }
    }
  }
  record(bad ? "FAIL" : "PASS", "image alt text", `${bad} image(s) missing alt`);
}

// 16. rel=nofollow is allowed ONLY on internal links to /blog/search (search
// facets). Any other internal nofollow bleeds link equity.
// [Ahrefs: Page has nofollow outgoing internal links]
function checkInternalNofollowAllowlist() {
  let bad = 0;
  for (const fp of sourceScanFiles()) {
    const src = stripNonContent(read(fp));
    const rel = path.relative(ROOT, fp);
    const anchors = src.match(/<a\b[^>]*>/g) || [];
    for (const a of anchors) {
      if (!/rel=["'`][^"'`]*nofollow/i.test(a)) continue;
      const href = getAttr(a, "href") || "";
      const internal = href.startsWith("/") || href.includes("lucaberton.com");
      if (internal && !href.includes("/blog/search")) {
        bad++;
        record("FAIL", "internal nofollow", `${rel}: nofollow on ${href || "(dynamic href)"}`);
      }
    }
  }
  record(bad ? "FAIL" : "PASS", "internal nofollow allowlist", `${bad} internal nofollow link(s) outside /blog/search`);
}

// 17. Internal link hygiene: self-links must be relative https (never http://
// or www., which 301), page paths must end with a trailing slash (non-slash
// versions 301), and page paths must be lowercase (case mismatch 404s).
// [GSC: Page with redirect / Not found (404)]
function checkInternalUrlHygiene() {
  let bad = 0;
  const targetRe = /(?:\]\(|href=["'`])([^"'`)\s>]+)/g;
  for (const fp of sourceScanFiles()) {
    const src = stripNonContent(read(fp));
    const rel = path.relative(ROOT, fp);
    let m;
    while ((m = targetRe.exec(src))) {
      let url = m[1];
      if (/^(mailto:|tel:|#|data:|\{)/.test(url)) continue;
      if (/^https?:\/\//.test(url)) {
        if (/^http:\/\/(www\.)?lucaberton\.com/.test(url) || /^https?:\/\/www\.lucaberton\.com/.test(url)) {
          bad++;
          record("FAIL", "self-link via redirect host", `${rel} -> ${url}`);
          continue;
        }
        if (!/^https:\/\/lucaberton\.com/.test(url)) continue; // external
        url = url.replace(/^https:\/\/lucaberton\.com/, "") || "/";
      }
      if (!url.startsWith("/")) continue;
      const pathPart = url.split(/[?#]/)[0];
      if (pathPart === "/" || pathPart === "") continue;
      const last = pathPart.split("/").pop();
      if (last.includes(".")) continue; // asset / file
      if (!pathPart.endsWith("/")) {
        bad++;
        record("FAIL", "missing trailing slash", `${rel} -> ${url}`);
      }
      if (/[A-Z]/.test(pathPart)) {
        bad++;
        record("FAIL", "uppercase page path", `${rel} -> ${url}`);
      }
    }
  }
  record(bad ? "FAIL" : "PASS", "internal URL hygiene", `${bad} redirect/404-causing internal link(s)`);
}

// 18. Every internal /blog/<slug>/ link must resolve to a published post, a
// redirect stub page, or a 301 in static/_redirects. Links to drafts or
// missing posts become 404s in the build. [GSC: Not found (404)]
function checkBlogLinkTargets() {
  const published = new Set(publishedPosts().map((p) => p.slug.toLowerCase()));
  const drafts = new Set([...draftSlugs()].map((s) => s.toLowerCase()));
  const redirects = redirectSources();
  const stubs = new Set();
  const blogPagesDir = path.join(ROOT, "src", "pages", "blog");
  if (exists(blogPagesDir)) {
    for (const entry of fs.readdirSync(blogPagesDir, { withFileTypes: true })) {
      if (entry.isDirectory() && exists(path.join(blogPagesDir, entry.name, "index.astro"))) stubs.add(entry.name.toLowerCase());
    }
  }
  // Non-post sub-routes and asset dirs under /blog/.
  const skip = new Set(["categories", "tags", "search", "events", "proteinlens", "openclaw", "thumbnails", "books", "courses", "conferences"]);
  const linkRe = /(?:\]\(|href=["'`])\/blog\/([A-Za-z0-9._-]+)\//g;
  let bad = 0;
  for (const fp of sourceScanFiles()) {
    const src = stripNonContent(read(fp));
    const rel = path.relative(ROOT, fp);
    const seen = new Set();
    let m;
    while ((m = linkRe.exec(src))) {
      const seg = m[1].toLowerCase();
      if (skip.has(seg) || /^\d+$/.test(seg) || seen.has(seg)) continue;
      seen.add(seg);
      if (published.has(seg) || stubs.has(seg)) continue;
      if (redirects.has(`/blog/${seg}`) || redirects.has(`/blog/${seg}/`)) continue;
      bad++;
      record("FAIL", drafts.has(seg) ? "link to draft post" : "link to missing post", `${rel} -> /blog/${m[1]}/`);
    }
  }
  record(bad ? "FAIL" : "PASS", "blog link targets resolve", `${bad} link(s) to draft/missing posts without redirect`);
}

// 19. Category pages are generated from published-post frontmatter; none may
// also have a 301 in static/_redirects (page + redirect conflict = the
// "5XX page in sitemap" Ahrefs error for /blog/categories/data/). Category
// links in source must resolve, and near-empty categories are warned.
// [Ahrefs: 5XX page / 5XX page in sitemap]
function checkCategoryIntegrity() {
  const MIN_CATEGORY_POSTS = 3;
  const counts = new Map(); // slug -> post count
  for (const p of publishedPosts()) {
    for (const cat of postCategories(p.fm)) {
      const slug = categorySlug(cat);
      counts.set(slug, (counts.get(slug) || 0) + 1);
    }
  }
  const redirects = redirectSources();
  let conflicts = 0;
  for (const slug of counts.keys()) {
    if (redirects.has(`/blog/categories/${slug}`) || redirects.has(`/blog/categories/${slug}/`)) {
      conflicts++;
      record("FAIL", "category/redirect conflict", `/blog/categories/${slug}/ is generated (${counts.get(slug)} post(s)) AND 301-redirected — retire the category or drop the redirect`);
    }
  }
  // Category links in source must point at a generated or redirected slug.
  let brokenLinks = 0;
  const linkRe = /(?:\]\(|href=["'`])\/blog\/categories\/([A-Za-z0-9-]+)\//g;
  for (const fp of sourceScanFiles()) {
    const src = stripNonContent(read(fp));
    const rel = path.relative(ROOT, fp);
    const seen = new Set();
    let m;
    while ((m = linkRe.exec(src))) {
      const slug = m[1];
      if (seen.has(slug)) continue;
      seen.add(slug);
      if (counts.has(slug) || redirects.has(`/blog/categories/${slug}`) || redirects.has(`/blog/categories/${slug}/`)) continue;
      brokenLinks++;
      record("FAIL", "link to missing category", `${rel} -> /blog/categories/${slug}/`);
    }
  }
  const thin = [...counts.entries()].filter(([, n]) => n < MIN_CATEGORY_POSTS).map(([s, n]) => `${s}(${n})`);
  if (thin.length) record("WARN", "thin categories", `${thin.length} category page(s) with < ${MIN_CATEGORY_POSTS} posts: ${thin.join(", ")}`);
  record(conflicts || brokenLinks ? "FAIL" : "PASS", "category integrity", `${conflicts} redirect conflict(s), ${brokenLinks} broken category link(s), ${counts.size} categories`);
}

// 20. A published post slug must never also be a 301 source in _redirects —
// the sitemap would then advertise a URL the edge redirects (or errors) on.
function checkPostSlugRedirectConflict() {
  const redirects = redirectSources();
  let bad = 0;
  for (const p of publishedPosts()) {
    if (redirects.has(`/blog/${p.slug}`) || redirects.has(`/blog/${p.slug}/`)) {
      bad++;
      record("FAIL", "post/redirect conflict", `/blog/${p.slug}/ is published AND 301-redirected`);
    }
  }
  record(bad ? "FAIL" : "PASS", "post slugs vs redirects", `${bad} published post(s) shadowed by a 301`);
}

// 21. AI-crawler / GEO readiness: llms.txt + llms-full.txt exist, robots.txt
// explicitly allows the major AI crawlers, both sitemaps are declared, and
// the base layout ships JSON-LD structured data.
function checkAiReadiness() {
  for (const f of ["llms.txt", "llms-full.txt"]) {
    const fp = path.join(ROOT, "static", f);
    const ok = exists(fp) && read(fp).trim().length > 0;
    record(ok ? "PASS" : "FAIL", `AI: ${f}`, ok ? "present and non-empty" : `static/${f} missing or empty`);
  }
  const robots = read(path.join(ROOT, "static", "robots.txt"));
  // Split robots.txt into User-agent blocks.
  const blocks = new Map(); // agent -> block text
  let current = [];
  for (const line of robots.split("\n")) {
    const ua = line.match(/^User-agent:\s*(.+?)\s*$/i);
    if (ua) current = [ua[1]];
    else if (current.length) for (const agent of current) blocks.set(agent, (blocks.get(agent) || "") + line + "\n");
  }
  for (const bot of ["GPTBot", "ClaudeBot", "anthropic-ai", "Google-Extended"]) {
    const block = blocks.get(bot);
    const ok = block != null && /^Allow:\s*\/\s*$/m.test(block) && !/^Disallow:\s*\/\s*$/m.test(block);
    record(ok ? "PASS" : "FAIL", `AI: robots.txt ${bot}`, ok ? "explicitly allowed" : `no 'Allow: /' block for ${bot}`);
  }
  const star = blocks.get("*") || "";
  record(/^Disallow:\s*\/\s*$/m.test(star) ? "FAIL" : "PASS", "AI: robots.txt global", /^Disallow:\s*\/\s*$/m.test(star) ? "'User-agent: *' blocks the whole site" : "no global Disallow: /");
  for (const sm of ["sitemap-index.xml", "video-sitemap.xml"]) {
    const ok = new RegExp(`^Sitemap:\\s*https://lucaberton\\.com/${sm.replace(".", "\\.")}\\s*$`, "m").test(robots);
    record(ok ? "PASS" : "FAIL", `AI: robots.txt sitemap ${sm}`, ok ? "declared" : `Sitemap line for ${sm} missing`);
  }
  const layout = path.join(ROOT, "src", "layouts", "Layout.astro");
  const hasLd = exists(layout) && /application\/ld\+json/.test(read(layout));
  record(hasLd ? "PASS" : "FAIL", "AI: JSON-LD in layout", hasLd ? "structured data present" : "no application/ld+json in Layout.astro");
}

// 22. (built HTML) Incoming dofollow internal-link graph. Published posts with
// fewer than 2 incoming dofollow links from other pages match the Ahrefs
// "Page has only one dofollow incoming internal link" notice. WARN-level:
// fix by adding related-post/contextual links, not by blocking commits.
function checkIncomingDofollowLinks() {
  const pages = walk(PUBLIC_DIR, (p) => path.basename(p) === "index.html");
  if (!pages.length) {
    record("WARN", "incoming link graph", "public/ has no pages — run `pnpm build`");
    return;
  }
  const incoming = new Map(); // "/blog/<slug>/" -> Set of source pages
  const anchorRe = /<a\b[^>]*>/g;
  for (const fp of pages) {
    const from = "/" + path.relative(PUBLIC_DIR, path.dirname(fp)).replace(/\\/g, "/") + "/";
    const html = read(fp);
    let m;
    while ((m = anchorRe.exec(html))) {
      const tag = m[0];
      if (/rel=["'][^"']*nofollow/i.test(tag)) continue;
      let href = getAttr(tag, "href");
      if (!href) continue;
      href = href.replace(/^https:\/\/lucaberton\.com/, "");
      if (!href.startsWith("/")) continue;
      const target = href.split(/[?#]/)[0];
      if (!/^\/blog\/[a-z0-9._-]+\/$/.test(target)) continue;
      if (target === from) continue;
      if (!incoming.has(target)) incoming.set(target, new Set());
      incoming.get(target).add(from);
    }
  }
  const skip = new Set(["categories", "tags", "search", "events", "proteinlens", "openclaw", "thumbnails", "books", "courses", "conferences"]);
  const weak = [];
  const blogDir = path.join(PUBLIC_DIR, "blog");
  if (exists(blogDir)) {
    for (const entry of fs.readdirSync(blogDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || skip.has(entry.name) || /^\d+$/.test(entry.name)) continue;
      const idx = path.join(blogDir, entry.name, "index.html");
      if (!exists(idx) || !parsePage(read(idx)).indexable) continue;
      const n = (incoming.get(`/blog/${entry.name}/`) || new Set()).size;
      if (n < 2) weak.push(`/blog/${entry.name}/ (${n})`);
    }
  }
  if (weak.length) {
    record("WARN", "posts with < 2 incoming dofollow links", `${weak.length} post(s): ${weak.slice(0, 10).join(", ")}${weak.length > 10 ? ", …" : ""}`);
  }
  record("PASS", "incoming link graph", `${incoming.size} linked post URLs analyzed, ${weak.length} below threshold`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
console.log("\nSEO fix validation — lucaberton.com" + (SOURCE_ONLY ? " (source-only)" : "") + "\n" + "=".repeat(38));

checkRobotsSlides();
checkSlidesHeader();
checkSearchNofollow();
checkForbiddenLinks();
checkMasterclassRename();
checkNoAstroEmbed();
checkOrphanIncomingLinks();
checkBlogImagesExist();
checkRedirects();
checkDraftFilters();
checkSourceFrontmatterLength();
checkImageAlt();
checkInternalNofollowAllowlist();
checkInternalUrlHygiene();
checkBlogLinkTargets();
checkCategoryIntegrity();
checkPostSlugRedirectConflict();
checkAiReadiness();
if (!SOURCE_ONLY) {
  checkBuiltHtml();
  checkCategoryWordCount();
  checkListingLinksResolve();
  checkSitemapNoStubs();
  checkNoLeakedTemplateUrls();
  checkIncomingDofollowLinks();
} else {
  record("PASS", "built-HTML checks", "skipped (--source-only); run `pnpm validate:seo` after build");
}

const fails = results.filter((r) => r.level === "FAIL");
const warns = results.filter((r) => r.level === "WARN");
const passes = results.filter((r) => r.level === "PASS");

const icon = { PASS: "\u2713", FAIL: "\u2717", WARN: "!" };
for (const r of results) {
  if (r.level === "PASS") continue; // keep noise down; show only issues inline
  console.log(`  ${icon[r.level]} [${r.level}] ${r.check}${r.detail ? " — " + r.detail : ""}`);
}

console.log("\nGroup results:");
for (const r of results.filter((r) => r.level === "PASS")) {
  console.log(`  ${icon.PASS} ${r.check}${r.detail ? " — " + r.detail : ""}`);
}

console.log("\n" + "=".repeat(38));
console.log(`PASS ${passes.length}   WARN ${warns.length}   FAIL ${fails.length}`);

if (fails.length) {
  console.log("\nValidation FAILED — see [FAIL] items above.\n");
  process.exit(1);
}
console.log("\nAll SEO fixes validated successfully.\n");
