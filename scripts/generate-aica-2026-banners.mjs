#!/usr/bin/env node
/**
 * AI & Chips Summit 2026 (AICA) banners (code AICA20@)
 * ----------------------------------------------------
 * The event: Thursday 26 November 2026, 09:00–18:00, KIT (Royal Tropical
 * Institute), Amsterdam. Tickets are sold at sales.ticketing.cm.com/aicasummit2026
 * (General Admission, €200 excluding fees, with a discount-code field). The code
 * AICA20@ comes from the organisers (Etiënne vantKruys).
 *
 * Same layout as the Linux Foundation banners (generate-kubecon-na-2026-banners.mjs):
 * an offer panel on the left (eyebrow, headline, code pill, button) and the
 * event's own identity on the right. AICA's identity is black on #f7f7f7 with
 * an orange accent (#e54f17, from aica-summit.com) and Space Grotesk, the
 * site's typeface (scripts/assets/fonts, SIL OFL).
 *
 * Sources, in scripts/assets/:
 *   aica-2026-logo.png   the AICA wordmark, cropped from the official Luma cover
 *                        (2912x1440) and made black-on-transparent
 *   aica-2026-share.png  the official share image, aica-summit.com/assets/media/aica-share.png
 *
 * DISCOUNT: the headline shows it only when set. The code's value isn't
 * published on the event pages; Luca confirmed 20% on Nov 13, 2026.
 *
 * Output, in static/promo/aica-2026/ (served at lucaberton.com/promo/...):
 *   wide.webp / wide.jpg     1200x300 CSS strip at 2x (2400x600 px)
 *   card-{800,1200}.webp     the share image with its tagline replaced by the offer
 *   card.jpg                 1200 px JPEG fallback
 *
 * Usage: node scripts/generate-aica-2026-banners.mjs
 * (REPO_ROOT=<repo> lets a copy of this script run from another directory.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = process.env.REPO_ROOT ?? path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const ASSETS = path.join(ROOT, 'scripts', 'assets');
const OUT = path.join(ROOT, 'static', 'promo', 'aica-2026');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f)); // drop sizes this version no longer makes

const CODE = 'AICA20@';
const DISCOUNT = '20% OFF'; // null shows "Save on your ticket" instead
const PAPER = '#f7f7f7';
const INK = '#0b0b0b';
const ORANGE = '#e54f17';
const PEACH = '#ff956d';
const dataUrl = (file, type) => `data:${type};base64,${fs.readFileSync(path.join(ASSETS, file)).toString('base64')}`;
const logo = dataUrl('aica-2026-logo.png', 'image/png');
const share = dataUrl('aica-2026-share.png', 'image/png');
const fontFace = `@font-face{font-family:'Space Grotesk';font-weight:300 700;src:url(${dataUrl('fonts/SpaceGrotesk-Variable.ttf', 'font/ttf')})}`;

const base = `${fontFace}
  html,body{margin:0}
  .b{position:relative;overflow:hidden;background:${PAPER};color:${INK};font-family:'Space Grotesk',sans-serif}
  .eyebrow{font-weight:600;letter-spacing:.18em;text-transform:uppercase;white-space:nowrap}
  .head{font-weight:700;line-height:1;letter-spacing:-.01em;white-space:nowrap}
  .code{display:inline-flex;align-items:center;background:${INK};color:#fff;border-radius:12px}
  .code small{font-weight:700;letter-spacing:.14em;color:${PEACH};text-transform:uppercase;line-height:1.15}
  .code b{font-weight:700;line-height:1;letter-spacing:.02em}
  .cta{display:inline-block;background:${ORANGE};color:#fff;font-weight:700;border-radius:999px;white-space:nowrap}
  .tri{position:absolute;width:0;height:0;border-style:solid;border-color:transparent}`;

// The offer: the discount when known, otherwise the plain promise.
const eyebrow = DISCOUNT ? 'Save on your AICA ticket' : 'AI & Chips Summit 2026';
const headline = DISCOUNT ?? 'Save on your ticket';
const headColor = DISCOUNT ? ORANGE : INK;

// An outlined triangle, the A of the wordmark, as the strip's one ornament.
const triangle = (x, y, size, stroke, color) => {
  const h = size * 0.87;
  return `<svg style="position:absolute;left:${x}px;top:${y}px" width="${size}" height="${h}" viewBox="0 0 ${size} ${h}">
    <polygon points="${size / 2},${stroke} ${size - stroke},${h - stroke / 2} ${stroke},${h - stroke / 2}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linejoin="miter"/></svg>`;
};

const WIDE = `<div class="b" style="width:1200px;height:300px">
  ${triangle(1012, 70, 280, 24, 'rgba(229,79,23,.16)')}
  <div style="position:absolute;left:44px;top:42px">
    <div class="eyebrow" style="font-size:14px">${eyebrow}</div>
    <div class="head" style="font-size:${DISCOUNT ? 86 : 58}px;margin-top:${DISCOUNT ? 14 : 18}px;color:${headColor}">${headline}</div>
    <div style="display:flex;align-items:center;gap:16px;margin-top:${DISCOUNT ? 22 : 30}px">
      <div class="code" style="gap:14px;padding:10px 18px 10px 16px">
        <small style="font-size:12px">Use<br>code</small><b style="font-size:42px">${CODE}</b></div>
      <div class="cta" style="font-size:18px;padding:13px 22px">Get your ticket →</div>
    </div>
  </div>
  <div style="position:absolute;left:640px;top:0;width:1px;height:300px;background:rgba(11,11,11,.12)"></div>
  <div style="position:absolute;left:680px;top:42px">
    <div class="eyebrow" style="font-size:18px;line-height:1.5">26 November 2026<br>KIT Amsterdam</div>
    <div style="font-size:17px;margin-top:6px;color:#3a3a3a">The Age of Collective Intelligence</div>
  </div>
  <img src="${logo}" style="position:absolute;left:680px;top:158px;height:96px">
</div>`;

// The card is the official share image. Its tagline ("The Age of Collective
// Intelligence", y 420–465) sits on flat #f7f7f7: cover it and put the offer there.
const CARD = `<div class="b" style="width:1200px;height:630px">
  <img src="${share}" style="position:absolute;left:0;top:0;width:1200px;height:630px">
  <div style="position:absolute;left:150px;top:400px;width:900px;height:92px;background:${PAPER}"></div>
  <div style="position:absolute;left:0;top:${DISCOUNT ? 398 : 404}px;width:1200px;display:flex;justify-content:center;align-items:center;gap:20px">
    ${DISCOUNT ? `<div class="head" style="font-size:60px;color:${ORANGE}">${DISCOUNT}</div>` : ''}
    <div class="code" style="gap:12px;padding:9px 18px 9px 14px">
      <small style="font-size:12px">Use<br>code</small><b style="font-size:44px">${CODE}</b></div>
    <div class="cta" style="font-size:22px;padding:14px 26px">Get your ticket →</div>
  </div></div>`;

const browser = await chromium.launch();
async function render(html, width, height, scale) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head><body>${html}</body></html>`, {
    waitUntil: 'load',
  });
  await page.evaluate(() => document.fonts.ready);
  if (!(await page.evaluate(() => document.fonts.check("700 40px 'Space Grotesk'")))) throw new Error('Space Grotesk did not load');
  const png = await page.locator('.b').screenshot({ type: 'png' });
  await page.close();
  return png;
}

const wide = await render(WIDE, 1200, 300, 2); // 2400x600
const card = await render(CARD, 1200, 630, 1); // the share image's native 1200x630
await browser.close();

await sharp(wide).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'wide.jpg'));
await sharp(wide).webp({ quality: 88 }).toFile(path.join(OUT, 'wide.webp'));
for (const w of [800, 1200]) {
  await sharp(card).resize({ width: w }).webp({ quality: 86 }).toFile(path.join(OUT, `card-${w}.webp`));
}
await sharp(card).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'card.jpg'));
console.log(`Wrote ${OUT}`);
