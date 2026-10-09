#!/usr/bin/env node
/**
 * AGNTCon + MCPCon North America 2026 banners — embedded across Luca's sites
 * --------------------------------------------------------------------------
 * Same approach as udienza.com's scripts/generate-banners.mjs: one generator,
 * stable image URLs, every site embeds a small <a><picture> snippet.
 *
 * Source: scripts/assets/agntcon-na-2026-artwork.png (the campaign artwork,
 * with the date corrected to the official Oct 22–23, 2026 and the venue to the
 * San Jose McEnery Convention Center, per aaif.io). It still shows the old
 * LUCA25 offer, so the offer panel is redrawn first (Montserrat, matching the
 * artwork) into scripts/assets/agntcon-na-2026-artwork-luca475.png, the
 * $475 registration with code LUCA_475 that the Linux Foundation switched
 * all codes to in October 2026. Every output below is cut from that file.
 *
 * Output, in static/promo/agntcon-na-2026/ (served at lucaberton.com/promo/...):
 *   wide.webp / wide.jpg       1200x300 CSS strip at 2x (2400x600 px), composed
 *                              from the artwork's own logo, date, code box and
 *                              ticket button, so no fonts are needed
 *   card-{800,1200,1672}.webp  the full 16:9 artwork, for phones and cards
 *   card.jpg                   1672 px JPEG fallback
 *
 * Usage: node scripts/generate-agntcon-banners.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const ORIGINAL = path.join(ROOT, 'scripts', 'assets', 'agntcon-na-2026-artwork.png');
const SRC = path.join(ROOT, 'scripts', 'assets', 'agntcon-na-2026-artwork-luca475.png');
const OUT = path.join(ROOT, 'static', 'promo', 'agntcon-na-2026');
fs.mkdirSync(OUT, { recursive: true });

const OFFER = { lead: 'REGISTER FOR', price: '$475', accent: 'ONLY', sub: 'WITH CODE', code: 'LUCA_475' };

const browser = await chromium.launch();

// The offer panel (rounded gradient border) at 50,704 992x196: keep the border,
// repaint the inside with the artwork's own left-to-right navy, redraw the text.
{
  const [L, T, W, H] = [50, 704, 992, 196];
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;background:transparent}
    .p{position:relative;width:${W}px;height:${H}px;font-family:Montserrat,sans-serif;color:#f4f6fa}
    .in{position:absolute;inset:9px;border-radius:18px;
        background:linear-gradient(90deg,rgb(6,12,16) 0%,rgb(7,13,21) 42%,rgb(4,17,30) 70%,rgb(4,19,34) 100%)}
    .lead{position:absolute;left:44px;top:34px;font-weight:700;font-size:25px;letter-spacing:2.5px}
    .price{position:absolute;left:38px;top:58px;font-weight:800;font-size:100px;line-height:1;letter-spacing:-2px;
           background:linear-gradient(180deg,#2bb4ff,#2a9dfd);-webkit-background-clip:text;color:transparent}
    .accent{position:absolute;left:292px;top:80px;font-weight:800;font-size:46px;line-height:1;
            background:linear-gradient(90deg,#3ca9fd,#8441fc);-webkit-background-clip:text;color:transparent}
    .sub{position:absolute;left:296px;top:132px;font-weight:500;font-size:22px;letter-spacing:2.5px}
    .rule{position:absolute;left:478px;top:58px;width:2px;height:82px;background:#767d81}
    .code{position:absolute;left:510px;top:37px;width:446px;height:122px;border-radius:12px;background:#fefefe;
          display:flex;align-items:center;justify-content:center;font-weight:800;font-size:70px;color:#0b0b0f}
  </style></head><body><div class="p"><div class="in"></div>
    <div class="lead">${OFFER.lead}</div><div class="price">${OFFER.price}</div>
    <div class="accent">${OFFER.accent}</div><div class="sub">${OFFER.sub}</div>
    <div class="rule"></div><div class="code">${OFFER.code}</div>
  </div></body></html>`, { waitUntil: 'load' });
  if (!(await page.evaluate(() => document.fonts.check('800 70px Montserrat')))) {
    throw new Error('Montserrat is not installed; the redrawn panel would not match the artwork');
  }
  const panel = await page.locator('.p').screenshot({ type: 'png', omitBackground: true });
  await page.close();
  await sharp(ORIGINAL).composite([{ input: panel, left: L, top: T }]).png().toFile(SRC);
}

// Regions of the 1672x941 artwork, in source pixels: left, top, width, height.
const REGIONS = {
  logo: [70, 45, 845, 215],
  date: [1292, 82, 378, 116],
  code: [50, 704, 992, 196],
  cta: [1134, 670, 498, 94],
  city: [880, 180, 792, 560],
};

const crop = async ([left, top, width, height]) =>
  'data:image/png;base64,' + (await sharp(SRC).extract({ left, top, width, height }).png().toBuffer()).toString('base64');

/**
 * Crop with the artwork's own background keyed out, so the logo and the date
 * sit on the strip instead of in a visible box: alpha follows how far each
 * pixel is brighter or more saturated than the crop's border (its background).
 */
const cutout = async ([left, top, width, height]) => {
  const { data, info } = await sharp(SRC).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const lum = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  const sat = (i) => Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
  const border = [];
  for (let x = 0; x < info.width; x++) for (const y of [0, info.height - 1]) border.push((y * info.width + x) * 4);
  for (let y = 0; y < info.height; y++) for (const x of [0, info.width - 1]) border.push((y * info.width + x) * 4);
  const bgL = border.map(lum).sort((a, b) => a - b)[Math.floor(border.length / 2)];
  const bgS = border.map(sat).sort((a, b) => a - b)[Math.floor(border.length / 2)];
  for (let i = 0; i < data.length; i += 4) {
    const d = Math.max(lum(i) - bgL - 12, (sat(i) - bgS - 25) * 0.9);
    data[i + 3] = Math.max(0, Math.min(255, Math.round(d * 3.2)));
  }
  return 'data:image/png;base64,' + (await sharp(data, { raw: info }).png().toBuffer()).toString('base64');
};

const img = {};
for (const [k, r] of Object.entries(REGIONS)) img[k] = ['logo', 'date'].includes(k) ? await cutout(r) : await crop(r);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#060a22}
  .b{position:relative;width:1200px;height:300px;overflow:hidden;
     background:linear-gradient(90deg,#060a22 0%,#080d2c 48%,#0b1440 100%)}
  .city{position:absolute;right:0;top:0;height:300px;width:620px;object-fit:cover;object-position:center;opacity:.55}
  .shade{position:absolute;inset:0;background:linear-gradient(90deg,#060a22 38%,rgba(6,10,34,.82) 58%,rgba(6,10,34,.35) 100%)}
  .logo{position:absolute;left:34px;top:30px;height:122px}
  .date{position:absolute;left:44px;top:178px;height:92px}
  .code{position:absolute;right:30px;top:42px;width:560px}
  .cta{position:absolute;right:40px;top:178px;height:62px}
</style></head><body><div class="b">
  <img class="city" src="${img.city}"><div class="shade"></div>
  <img class="logo" src="${img.logo}"><img class="date" src="${img.date}">
  <img class="code" src="${img.code}"><img class="cta" src="${img.cta}">
</div></body></html>`;

const page = await browser.newPage({ viewport: { width: 1200, height: 300 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
const wide = await page.locator('.b').screenshot({ type: 'png' });
await browser.close();

await sharp(wide).flatten({ background: '#060a22' }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'wide.jpg'));
await sharp(wide).webp({ quality: 88 }).toFile(path.join(OUT, 'wide.webp'));
for (const w of [800, 1200, 1672]) {
  await sharp(SRC).resize({ width: w }).webp({ quality: 86 }).toFile(path.join(OUT, `card-${w}.webp`));
}
await sharp(SRC).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'card.jpg'));

// Self-check: every file exists with the expected size
const expect = { 'wide.jpg': [2400, 600], 'wide.webp': [2400, 600], 'card-800.webp': [800, 450], 'card-1200.webp': [1200, 675], 'card-1672.webp': [1672, 941], 'card.jpg': [1672, 941] };
let ok = true;
for (const [f, [w, h]] of Object.entries(expect)) {
  const m = await sharp(path.join(OUT, f)).metadata();
  const kb = Math.round(fs.statSync(path.join(OUT, f)).size / 1024);
  const good = m.width === w && Math.abs(m.height - h) <= 1;
  ok &&= good;
  console.log(`${good ? 'ok ' : 'BAD'} ${f} ${m.width}x${m.height} ${kb} KB`);
}
process.exit(ok ? 0 : 1);
