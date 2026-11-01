#!/usr/bin/env node
/**
 * HTML minifier (post-build)
 * --------------------------
 * Minifies every built .html file in public/:
 *   1. inline JavaScript <script> bodies with esbuild, then
 *   2. the markup and inline CSS with minify-html (Rust).
 *
 * Replaces astro-compress, whose html-minifier-terser pass ran over ~2,350
 * pages one at a time and took ~11 minutes of a ~12 minute CI build. This
 * takes well under a minute and saves about as much (~19% of raw HTML;
 * inline scripts are over a third of a typical page). CSS and JS bundles are
 * already minified by Vite, so only HTML is processed here.
 *
 * Settings are deliberately conservative:
 *   - closing tags and the <html>/<head> opening tags are kept, so crawlers and
 *     the regex-based validators (validate-seo-fixes, build-vercel-config) see
 *     well-formed markup; the spec-noncompliant "allow_*" shortcuts stay off;
 *   - only classic and module JavaScript is minified. JSON-LD, import maps and
 *     other non-JS script types, and external scripts, are left untouched;
 *   - classic scripts are transformed without a module format, so esbuild keeps
 *     their top-level names (other inline scripts and onclick handlers rely on
 *     those globals);
 *   - a script esbuild cannot parse is kept as is and reported, never dropped;
 *   - <pre>/<textarea> whitespace is always preserved by minify-html.
 *
 * Usage:
 *   node scripts/minify-html.cjs              # minify public/ in place
 *   node scripts/minify-html.cjs --dir dist   # another output directory
 */
const fs = require("node:fs");
const path = require("node:path");
const { minify } = require("@minify-html/node");
const { transformSync } = require("esbuild");

const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const dirIndex = args.indexOf("--dir");
const DIST = path.resolve(ROOT, dirIndex >= 0 ? args[dirIndex + 1] : "public");

const HTML_OPTIONS = {
  keep_closing_tags: true,
  keep_html_and_head_opening_tags: true,
  minify_css: true,
  minify_js: false, // done by esbuild below
};

const SCRIPT_RE = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
const JS_TYPES = /^(module|text\/javascript|application\/javascript)$/i;

const scriptErrors = [];

function minifyInlineScripts(html, file) {
  return html.replace(SCRIPT_RE, (whole, attrs = "", body) => {
    if (/\bsrc\s*=/i.test(attrs) || !body.trim()) return whole;
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if (type && !JS_TYPES.test(type)) return whole;
    try {
      const { code } = transformSync(body, {
        loader: "js",
        minify: true,
        target: "es2020",
        format: type && type.toLowerCase() === "module" ? "esm" : undefined,
      });
      return `<script${attrs}>${code.trim().replace(/<\/script/gi, "<\\/script")}</script>`;
    } catch (err) {
      scriptErrors.push(`${path.relative(DIST, file)}: ${err.message.split("\n")[0]}`);
      return whole;
    }
  });
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

if (!fs.existsSync(DIST)) {
  console.error(`minify-html: ${path.relative(ROOT, DIST)}/ not found; run the build first.`);
  process.exit(1);
}

const started = Date.now();
const files = walk(DIST);
let before = 0;
let after = 0;
for (const file of files) {
  const input = fs.readFileSync(file, "utf8");
  const output = minify(Buffer.from(minifyInlineScripts(input, file)), HTML_OPTIONS);
  before += Buffer.byteLength(input);
  after += output.length;
  fs.writeFileSync(file, output);
}

const mb = (n) => (n / 1024 / 1024).toFixed(2);
console.log(
  `minify-html: ${files.length} HTML files, ${mb(before)} MB -> ${mb(after)} MB ` +
    `(-${mb(before - after)} MB) in ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
if (scriptErrors.length) {
  console.warn(`minify-html: ${scriptErrors.length} inline script(s) left unminified (esbuild could not parse them):`);
  for (const e of scriptErrors.slice(0, 20)) console.warn(`  ${e}`);
}
