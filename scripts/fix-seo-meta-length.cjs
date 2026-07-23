#!/usr/bin/env node
/* eslint-disable */
// One-shot SEO meta-length fix (Commit F).
// - Trims `title` to <=60 chars at a clean breakpoint.
// - Trims `description` to <=160 chars at sentence/word boundary.
// - Expands too-short descriptions (<120) with a generic SEO suffix.
const fs = require("fs");
const path = require("path");

const dir = "src/content/blog";
const MAX_TITLE = 60;
const MAX_DESC = 160;
const MIN_DESC = 120;

function trimTitle(t) {
  if (t.length <= MAX_TITLE) return t;
  // Prefer chopping the part after " — " / ": " / " - " if main clause fits.
  for (const sep of [" — ", ": ", " - ", " – "]) {
    const idx = t.indexOf(sep);
    if (idx > 0 && idx <= MAX_TITLE) return t.slice(0, idx).trimEnd();
  }
  // Otherwise trim at last space <= MAX_TITLE
  const slice = t.slice(0, MAX_TITLE);
  const sp = slice.lastIndexOf(" ");
  return (sp > 30 ? slice.slice(0, sp) : slice).trimEnd();
}

function trimDesc(d) {
  if (d.length <= MAX_DESC) return d;
  // Find last sentence boundary within MAX_DESC-2
  const window = d.slice(0, MAX_DESC);
  const lastDot = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "), window.lastIndexOf("? "));
  if (lastDot >= MIN_DESC) return d.slice(0, lastDot + 1);
  // Fallback: last word boundary within MAX_DESC-1
  const sp = window.lastIndexOf(" ");
  return (sp > MIN_DESC ? d.slice(0, sp) : d.slice(0, MAX_DESC - 1)).replace(/[,;:\-]\s*$/, "") + ".";
}

function expandDesc(d, fallbackTopic) {
  if (d.length >= MIN_DESC) return d;
  const suffix = " Practical 2026 guide by Luca Berton (AI & Cloud Advisor).";
  const candidate = d.replace(/\.$/, "") + suffix;
  return candidate.length <= MAX_DESC ? candidate : d;
}

const files = fs.readdirSync(dir).filter(f => f.endsWith(".mdx"));
let changed = 0;
const log = [];
for (const f of files) {
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, "utf8");
  let mutated = false;
  // title
  c = c.replace(/(\ntitle:\s*")([^"]+)(")/, (m, p1, val, p3) => {
    const newVal = trimTitle(val);
    if (newVal !== val) { mutated = true; log.push(`  ${f} title [${val.length}→${newVal.length}]: ${newVal}`); }
    return p1 + newVal + p3;
  });
  // description
  c = c.replace(/(\ndescription:\s*")([^"]+)(")/, (m, p1, val, p3) => {
    let newVal = val;
    if (val.length > MAX_DESC) newVal = trimDesc(val);
    else if (val.length < MIN_DESC) newVal = expandDesc(val);
    if (newVal !== val) { mutated = true; log.push(`  ${f} desc [${val.length}→${newVal.length}]: ${newVal.slice(0,90)}...`); }
    return p1 + newVal + p3;
  });
  if (mutated) { fs.writeFileSync(fp, c); changed++; }
}
console.log(`Updated ${changed} files:`);
console.log(log.join("\n"));
