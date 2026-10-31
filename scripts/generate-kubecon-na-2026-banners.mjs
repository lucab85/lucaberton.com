#!/usr/bin/env node
/**
 * KubeCon + CloudNativeCon North America 2026 banners (code LUCA20)
 * -----------------------------------------------------------------
 * Source: scripts/assets/kubecon-na-2026-artwork.png, the official 1200x630
 * event artwork (Salt Lake City, November 9–12, 2026). The Linux Foundation's
 * offer is 20% off registration with code LUCA20 (not valid on academic passes).
 * Colours are sampled from the artwork: sky #113e82, mountains #d62293, bee
 * #fef35c, ink #031323. Text is Inter (scripts/assets/fonts), close to the
 * artwork's bold geometric caps.
 *
 * Output, in static/promo/kubecon-na-2026/ (served at lucaberton.com/promo/...):
 *   wide.webp / wide.jpg     1200x300 CSS strip at 2x (2400x600 px): an offer
 *                            panel in the artwork's sky, then the artwork itself
 *                            at its native height (600 px)
 *   card-{800,1200}.webp     the artwork with the hashtag line replaced by the
 *                            offer, for phones
 *   card.jpg                 1200 px JPEG fallback
 *
 * Usage: node scripts/generate-kubecon-na-2026-banners.mjs
 * (REPO_ROOT=<repo> lets a copy of this script run from another directory.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = process.env.REPO_ROOT ?? path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const ART = path.join(ROOT, 'scripts', 'assets', 'kubecon-na-2026-artwork.png');
const FONT = path.join(ROOT, 'scripts', 'assets', 'fonts', 'Inter-Variable.ttf');
const OUT = path.join(ROOT, 'static', 'promo', 'kubecon-na-2026');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f)); // drop sizes this version no longer makes

const CODE = 'LUCA20';
const SKY = '#113e82';
const PINK = '#d62293';
const BEE = '#fef35c';
const INK = '#031323';
const art = `data:image/png;base64,${fs.readFileSync(ART).toString('base64')}`;
const fontFace = `@font-face{font-family:Inter;font-weight:100 900;src:url(data:font/ttf;base64,${fs
  .readFileSync(FONT)
  .toString('base64')})}`;

const base = `${fontFace}
  html,body{margin:0}
  .b{position:relative;overflow:hidden;background:${SKY};color:#fff;font-family:Inter,sans-serif}
  .star{position:absolute;border-radius:50%;background:#fff}
  .pct{font-weight:800;line-height:1;letter-spacing:-.01em;color:${BEE};white-space:nowrap}
  .code{display:inline-flex;align-items:center;background:#fff;color:${INK};border-radius:12px}
  .code small{font-weight:700;letter-spacing:.14em;color:${SKY};text-transform:uppercase;line-height:1.15}
  .code b{font-weight:800;line-height:1;letter-spacing:.01em}
  .cta{display:inline-block;background:${PINK};color:#fff;font-weight:700;border-radius:999px;white-space:nowrap}`;

// A few stars like the artwork's, for the panel that extends its sky.
const stars = (list) => list.map(([x, y, r]) => `<div class="star" style="left:${x}px;top:${y}px;width:${r}px;height:${r}px"></div>`).join('');

const ART_W = (1200 * 300) / 630; // the artwork at the strip's height
const PANEL = 1200 - ART_W;
const WIDE = `<div class="b" style="width:1200px;height:300px">
  ${stars([[560, 30, 5], [470, 262, 4], [598, 150, 3], [330, 272, 5], [24, 268, 4], [250, 18, 4]])}
  <img src="${art}" style="position:absolute;right:0;top:0;height:300px;width:${ART_W}px">
  <div style="position:absolute;left:${PANEL - 1}px;top:0;width:26px;height:300px;background:linear-gradient(90deg,${SKY},rgba(17,62,130,0))"></div>
  <div style="position:absolute;left:44px;top:40px;width:${PANEL - 70}px">
    <div style="font-weight:700;font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#e4f6ff">Save on your KubeCon pass</div>
    <div class="pct" style="font-size:86px;margin-top:14px">20% OFF</div>
    <div style="display:flex;align-items:center;gap:16px;margin-top:22px">
      <div class="code" style="gap:14px;padding:10px 18px 10px 16px">
        <small style="font-size:12px">Use<br>code</small><b style="font-size:42px">${CODE}</b></div>
      <div class="cta" style="font-size:18px;padding:13px 22px">Register now →</div>
    </div>
  </div></div>`;

// The card is the artwork itself. Its hashtag line (#KubeCon #CloudNativeCon,
// x 62–505, y 152–182) sits on flat sky: cover it and put the offer there.
const CARD = `<div class="b" style="width:1200px;height:630px">
  <img src="${art}" style="position:absolute;left:0;top:0;width:1200px;height:630px">
  <div style="position:absolute;left:50px;top:142px;width:480px;height:52px;background:${SKY}"></div>
  <div style="position:absolute;left:62px;top:158px">
    <div style="display:flex;align-items:center;gap:22px">
      <div class="pct" style="font-size:64px">20% OFF</div>
      <div class="code" style="gap:12px;padding:8px 18px 8px 14px">
        <small style="font-size:12px">Use<br>code</small><b style="font-size:44px">${CODE}</b></div>
    </div>
    <div class="cta" style="font-size:22px;padding:11px 24px;margin-top:16px">Register now →</div>
  </div></div>`;

const browser = await chromium.launch();
async function render(html, width, height, scale) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head><body>${html}</body></html>`, {
    waitUntil: 'load',
  });
  await page.evaluate(() => document.fonts.ready);
  if (!(await page.evaluate(() => document.fonts.check('800 40px Inter')))) throw new Error('Inter did not load');
  const png = await page.locator('.b').screenshot({ type: 'png' });
  await page.close();
  return png;
}

const wide = await render(WIDE, 1200, 300, 2); // 2400x600
const card = await render(CARD, 1200, 630, 1); // the artwork's native 1200x630
await browser.close();

await sharp(wide).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'wide.jpg'));
await sharp(wide).webp({ quality: 88 }).toFile(path.join(OUT, 'wide.webp'));
for (const w of [800, 1200]) {
  await sharp(card).resize({ width: w }).webp({ quality: 86 }).toFile(path.join(OUT, `card-${w}.webp`));
}
await sharp(card).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'card.jpg'));
console.log(`Wrote ${OUT}`);
