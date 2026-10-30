#!/usr/bin/env node
/**
 * KubeCon + CloudNativeCon North America 2026 banners (code LUCA20)
 * -----------------------------------------------------------------
 * The Linux Foundation sent a code (20% off, not valid on academic passes) but
 * no artwork, so this set is drawn from scratch in the site's own fonts
 * (Bricolage Grotesque and Inter, scripts/assets/fonts) with text only: no CNCF
 * or KubeCon logos. Event facts from the official register page: Salt Palace
 * Convention Center, Salt Lake City, November 9–12, 2026.
 *
 * Output, in static/promo/kubecon-na-2026/ (served at lucaberton.com/promo/...):
 *   wide.webp / wide.jpg            1200x300 CSS strip at 2x (2400x600 px)
 *   card-{800,1200,1600}.webp       the 16:9 card, for phones
 *   card.jpg                        1600 px JPEG fallback
 *
 * Usage: node scripts/generate-kubecon-na-2026-banners.mjs
 * (REPO_ROOT=<repo> lets a copy of this script run from another directory.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = process.env.REPO_ROOT ?? path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const FONTS = path.join(ROOT, 'scripts', 'assets', 'fonts');
const OUT = path.join(ROOT, 'static', 'promo', 'kubecon-na-2026');
fs.mkdirSync(OUT, { recursive: true });

const CODE = 'LUCA20';
const font = (family, file) =>
  `@font-face{font-family:${family};font-weight:100 900;src:url(data:font/ttf;base64,${fs
    .readFileSync(path.join(FONTS, file))
    .toString('base64')})}`;
const fontFace = font('Bricolage', 'BricolageGrotesque-Variable.ttf') + font('Inter', 'Inter-Variable.ttf');

// The Wasatch range behind Salt Lake City, as a flat silhouette along the bottom.
const mountains = (w, h, y) => `<svg class="mt" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
  <path d="M0 ${h} L0 ${y + 40} L${w * 0.08} ${y + 10} L${w * 0.15} ${y + 34} L${w * 0.24} ${y - 18} L${w * 0.31} ${y + 22}
    L${w * 0.4} ${y - 4} L${w * 0.47} ${y + 30} L${w * 0.58} ${y - 30} L${w * 0.66} ${y + 18} L${w * 0.74} ${y - 2}
    L${w * 0.83} ${y + 28} L${w * 0.91} ${y - 14} L${w} ${y + 20} L${w} ${h} Z" fill="rgba(120,160,255,.10)"/>
  <path d="M0 ${h} L0 ${y + 70} L${w * 0.12} ${y + 44} L${w * 0.2} ${y + 66} L${w * 0.33} ${y + 30} L${w * 0.45} ${y + 62}
    L${w * 0.55} ${y + 40} L${w * 0.68} ${y + 70} L${w * 0.79} ${y + 36} L${w * 0.9} ${y + 60} L${w} ${y + 46} L${w} ${h} Z"
    fill="rgba(120,160,255,.08)"/></svg>`;

const base = `${fontFace}
  html,body{margin:0}
  .b{position:relative;overflow:hidden;color:#fff;font-family:Inter,sans-serif;
     background:radial-gradient(120% 140% at 0% 0%,#1d3f8f 0%,#0f2456 45%,#0a1633 100%)}
  .mt{position:absolute;left:0;bottom:0;width:100%;height:100%}
  .eyebrow{font-weight:700;letter-spacing:.18em;color:#9dbcff;text-transform:uppercase}
  .title{font-family:Bricolage,sans-serif;font-weight:800;line-height:1;letter-spacing:-.01em}
  .where{font-weight:500;color:#d3defa}
  .pct{font-family:Bricolage,sans-serif;font-weight:800;line-height:.9;letter-spacing:-.02em;
       background:linear-gradient(90deg,#5ea8ff,#b18cff);-webkit-background-clip:text;color:transparent;
       padding:.15em .05em;margin:-.15em -.05em} /* room for the glyphs that rise above a .9 line box */
  .codebox{background:#fff;color:#0a1633;border-radius:14px;text-align:center}
  .codebox small{display:block;font-weight:700;letter-spacing:.2em;color:#4a5b85;text-transform:uppercase}
  .codebox b{display:block;font-family:Bricolage,sans-serif;font-weight:800;line-height:1}
  .cta{display:inline-block;background:#326ce5;color:#fff;font-weight:700;border-radius:999px}`;

const WIDE = `<div class="b" style="width:1200px;height:300px">${mountains(1200, 300, 205)}
  <div style="position:absolute;left:52px;top:58px;width:520px">
    <div class="eyebrow" style="font-size:15px">KubeCon + CloudNativeCon</div>
    <div class="title" style="font-size:54px;margin-top:12px">North America 2026</div>
    <div class="where" style="font-size:22px;margin-top:16px">Salt Lake City · November 9–12</div>
  </div>
  <div style="position:absolute;left:600px;top:66px;width:270px;text-align:center">
    <div class="pct" style="font-size:104px">20%</div>
    <div class="where" style="font-size:20px;margin-top:8px;font-weight:600">off your registration</div>
  </div>
  <div style="position:absolute;right:52px;top:48px;width:250px;text-align:center">
    <div class="codebox" style="padding:16px 0 18px"><small style="font-size:13px">Use code</small>
      <b style="font-size:56px;margin-top:6px">${CODE}</b></div>
    <div class="cta" style="font-size:19px;padding:12px 26px;margin-top:18px">Register now →</div>
  </div></div>`;

const CARD = `<div class="b" style="width:1600px;height:900px">${mountains(1600, 900, 700)}
  <div style="position:absolute;left:110px;top:100px;right:110px">
    <div class="eyebrow" style="font-size:34px">KubeCon + CloudNativeCon</div>
    <div class="title" style="font-size:118px;margin-top:22px">North America 2026</div>
    <div class="where" style="font-size:46px;margin-top:30px">Salt Lake City · November 9–12</div>
  </div>
  <div style="position:absolute;left:110px;top:470px">
    <div class="pct" style="font-size:196px">20% OFF</div>
    <div class="where" style="font-size:40px;margin-top:18px;font-weight:600">your registration</div>
  </div>
  <div style="position:absolute;right:110px;top:470px;width:470px;text-align:center">
    <div class="codebox" style="padding:30px 0 34px;border-radius:24px"><small style="font-size:26px">Use code</small>
      <b style="font-size:108px;margin-top:10px">${CODE}</b></div>
    <div class="cta" style="font-size:38px;padding:22px 52px;margin-top:34px">Register now →</div>
  </div></div>`;

const browser = await chromium.launch();
async function render(html, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head><body>${html}</body></html>`, {
    waitUntil: 'load',
  });
  await page.evaluate(() => document.fonts.ready);
  for (const f of ['800 40px Bricolage', '700 20px Inter']) {
    if (!(await page.evaluate((spec) => document.fonts.check(spec), f))) throw new Error(`${f} did not load`);
  }
  const png = await page.locator('.b').screenshot({ type: 'png' });
  await page.close();
  return png;
}

const wide = await render(WIDE, 1200, 300); // 2400x600
const card = await sharp(await render(CARD, 1600, 900)).resize({ width: 1600 }).toBuffer(); // 1600x900
await browser.close();

await sharp(wide).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'wide.jpg'));
await sharp(wide).webp({ quality: 88 }).toFile(path.join(OUT, 'wide.webp'));
for (const w of [800, 1200, 1600]) {
  await sharp(card).resize({ width: w }).webp({ quality: 86 }).toFile(path.join(OUT, `card-${w}.webp`));
}
await sharp(card).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'card.jpg'));
console.log(`Wrote ${OUT}`);
