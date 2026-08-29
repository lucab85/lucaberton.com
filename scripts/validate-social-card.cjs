#!/usr/bin/env node
/**
 * Social Card Validator
 * ---------------------
 * Catches the exact class of regression that makes a URL paste into
 * WhatsApp / iMessage / Slack / LinkedIn render as a bare link instead of a
 * rich preview card:
 *
 *   - og:image missing or points at a file that does NOT exist in the build
 *     output (the classic "404 image => no card" bug)
 *   - og:image is not an absolute https:// URL (some crawlers refuse relative)
 *   - og:image is a zero-byte / too-small file (< 200x200 hard-fail,
 *     < 600x315 warn — below that WhatsApp/X/Twitter may drop the large card)
 *   - twitter:card is missing or not summary_large_image
 *   - twitter:image missing
 *   - og:title / og:description / og:type missing
 *
 * Runs against the built site in ./public (Astro copies static/ -> public/,
 * so a real source asset that is missing from the build output is caught too).
 * Exits 1 on any FAIL-level check so it can gate the CI deploy.
 *
 * Usage:  node scripts/validate-social-card.cjs            (homepage contract — CI default)
 *         node scripts/validate-social-card.cjs --all      (audit every indexable page)
 *
 * Default scope is the homepage only. That is deliberate: the homepage is the
 * URL that gets pasted into WhatsApp/iMessage/LinkedIn, and it is the page
 * whose OG contract regressed. Blog posts currently have no OG tags (only the
 * homepage Layout renders <SEO>); adding OG to BlogLayout is a separate task.
 * Run --all to audit the whole site once that lands — until then --all will
 * report every blog post as missing OG (expected, not a CI gate).
 *
 * The script also prints the shareable link WhatsApp/iMessage need to
 * re-fetch a preview after a deploy: append ?v=<unix-seconds> to bust the
 * crawler cache (WhatsApp will not refresh a bare URL it has already fetched).
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");

// Homepage contract by default; --all audits every indexable page.
const HOME_ONLY = !process.argv.includes("--all");

const results = [];
const record = (level, check, detail = "") =>
  results.push({ level, check, detail });

// --- tiny HTML attribute / tag helpers (mirror validate-seo-fixes.cjs) ------
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
function getAttr(tag, name) {
  const m = tag.match(
    new RegExp("\\b" + name + "=(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i")
  );
  return m ? m[1] ?? m[2] ?? m[3] ?? null : null;
}
function findMeta(html, key, keyAttr) {
  // keyAttr is "property" (og:*) or "name" (twitter:*, description)
  const re = new RegExp(
    `<meta\\b[^>]*\\b${keyAttr}=["']?${key}["']?[^>]*>`,
    "i"
  );
  const m = html.match(re);
  return m ? m[0] : null;
}
function metaContent(html, key, keyAttr) {
  const tag = findMeta(html, key, keyAttr);
  return tag ? decodeEntities(getAttr(tag, "content") || "") : null;
}

// --- JPEG/PNG dimension reader (no deps) ------------------------------------
function imageSize(buf) {
  if (buf.length < 24) return null;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // JPEG: walk markers for SOF0/SOF1/SOF2 (baseline/progressive)
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      // SOF markers: 0xC0-0xC3, 0xC5-0xC7, 0xC9-0xCB, 0xCD-0xCF
      if ((marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc)) {
        const h = buf.readUInt16BE(i + 5);
        const w = buf.readUInt16BE(i + 7);
        return { w, h };
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }
  // WebP (VP8 / VP8L / VP8X)
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const fmt = buf.toString("ascii", 12, 16);
    if (fmt === "VP8X") {
      return { w: (buf[24] << 8 | buf[23]) + 1, h: (buf[26] << 8 | buf[25]) + 1 };
    }
    if (fmt === "VP8 ") {
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    }
    if (fmt === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

// --- walk built pages -------------------------------------------------------
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === "index.html") out.push(p);
  }
  return out;
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log("?  ./public not found — run `pnpm build` first.\n");
    process.exit(0); // not fatal in a source-only context
  }

  let pages = walk(PUBLIC_DIR);
  if (HOME_ONLY) {
    const home = path.join(PUBLIC_DIR, "index.html");
    pages = fs.existsSync(home) ? [home] : [];
  }

  let checked = 0;
  for (const fp of pages) {
    const rel = path.relative(PUBLIC_DIR, fp).replace(/index\.html$/, "") || "/";
    // Skip non-indexable pages for the social-card contract (noindex => no card).
    const html = fs.readFileSync(fp, "utf8");
    const robotsTag = findMeta(html, "robots", "name");
    const robots = robotsTag ? getAttr(robotsTag, "content") || "" : "";
    if (/noindex/i.test(robots)) continue;
    checked++;

    const ogImage = metaContent(html, "og:image", "property");
    const ogImageUrl = metaContent(html, "og:image:url", "property") || ogImage;
    const ogTitle = metaContent(html, "og:title", "property");
    const ogDesc = metaContent(html, "og:description", "property");
    const ogType = metaContent(html, "og:type", "property");
    const twCard = metaContent(html, "twitter:card", "name");
    const twImage = metaContent(html, "twitter:image", "name");

    // og:title / og:description / og:type — required for ANY rich card.
    if (!ogTitle) record("FAIL", `og:title missing (${rel})`, "page will not produce a titled card");
    if (!ogDesc) record("FAIL", `og:description missing (${rel})`, "no preview body text");
    if (!ogType) record("WARN", `og:type missing (${rel})`, "defaulting behaviour varies by platform");

    // twitter:card must be summary_large_image for the big image card.
    if (twCard !== "summary_large_image") {
      record(
        "FAIL",
        `twitter:card (${rel})`,
        twCard ? `is "${twCard}", expected "summary_large_image"` : "missing"
      );
    }
    if (!twImage) record("FAIL", `twitter:image missing (${rel})`, "X/Twitter card will have no image");

    // og:image — the heart of the card.
    if (!ogImageUrl) {
      record("FAIL", `og:image missing (${rel})`, "NO image card will render (bare link)");
      continue;
    }
    if (!/^https:\/\//i.test(ogImageUrl)) {
      record("FAIL", `og:image not https (${rel})`, ogImageUrl);
    }

    // Resolve the image path against the build output and confirm it exists
    // with real pixels. This is the regression that produces "no card".
    let imgRel;
    try {
      const u = new URL(ogImageUrl);
      imgRel = decodeURIComponent(u.pathname);
    } catch {
      imgRel = ogImageUrl.startsWith("/") ? ogImageUrl : "/" + ogImageUrl;
    }
    const imgAbs = path.join(PUBLIC_DIR, imgRel);
    if (!fs.existsSync(imgAbs)) {
      record(
        "FAIL",
        `og:image missing from build (${rel})`,
        `${ogImageUrl} -> not found in ./public (static/ asset missing or misnamed)`
      );
      continue;
    }
    const stat = fs.statSync(imgAbs);
    if (stat.size === 0) {
      record("FAIL", `og:image is 0 bytes (${rel})`, ogImageUrl);
      continue;
    }
    const dim = imageSize(fs.readFileSync(imgAbs));
    // SVG has no raster dimensions — presence is enough; skip the size gate.
    if (!dim) {
      if (/\.svg$/i.test(imgRel)) {
        record("PASS", `og:image ok (${rel})`, `${ogImageUrl} (SVG, dimensions N/A)`);
      } else {
        record("WARN", `og:image dimensions unreadable (${rel})`, `${ogImageUrl} (${stat.size} bytes)`);
      }
    } else {
      if (dim.w < 200 || dim.h < 200) {
        record("FAIL", `og:image too small (${rel})`, `${ogImageUrl} is ${dim.w}x${dim.h} (< 200x200)`);
      } else if (dim.w < 600 || dim.h < 315) {
        record("WARN", `og:image below 600x315 (${rel})`, `${ogImageUrl} is ${dim.w}x${dim.h} — large card may be dropped`);
      } else {
        record("PASS", `og:image ok (${rel})`, `${ogImageUrl} ${dim.w}x${dim.h} ${stat.size}B`);
      }
    }
  }

  if (!checked) record("WARN", "no indexable pages", "nothing to validate");

  const fails = results.filter((r) => r.level === "FAIL");
  const warns = results.filter((r) => r.level === "WARN");
  const passes = results.filter((r) => r.level === "PASS");

  const icon = { PASS: "✓", FAIL: "✗", WARN: "!" };
  for (const r of results) {
    if (r.level === "PASS") continue;
    console.log(`  ${icon[r.level]} [${r.level}] ${r.check}${r.detail ? " — " + r.detail : ""}`);
  }
  for (const r of passes) {
    console.log(`  ${icon.PASS} ${r.check}${r.detail ? " — " + r.detail : ""}`);
  }

  console.log("\n" + "=".repeat(40));
  console.log(`PASS ${passes.length}   WARN ${warns.length}   FAIL ${fails.length}`);
  const v = Math.floor(Date.now() / 1000);
  console.log(`\nShareable (cache-busting) link for ${checked} page(s):`);
  console.log(`  https://lucaberton.com/?v=${v}`);

  if (fails.length) {
    console.log("\nSocial card validation FAILED — deploy would break link previews.\n");
    process.exit(1);
  }
  console.log("\nSocial card validated successfully.\n");
}

main();
