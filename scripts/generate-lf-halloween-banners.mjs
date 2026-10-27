#!/usr/bin/env node
/**
 * Linux Foundation Halloween flash promo (Oct 28–29, 2026) banners — embedded
 * across Luca's sites
 * --------------------------------------------------------------------------
 * Same approach as scripts/generate-agntcon-banners.mjs: one generator,
 * stable image URLs, every site embeds a small <a><picture> snippet.
 *
 * Source: scripts/assets/lf-halloween-2026-artwork.jpg, the 1595x829 creative
 * from the Linux Foundation's AWIN announcement, as supplied. It needs two
 * fixes before use, both done in memory (the source file stays untouched):
 *   - a Chrome "translate" button was captured on the pumpkin with the
 *     artwork; it is filled in from the pixels around it;
 *   - it shows the generic code TREATS35, so the two offer lines are redrawn
 *     with Luca's personal code TREATS35LUCA in Passion One (OFL, in
 *     scripts/assets/fonts), the closest match to the artwork's lettering.
 *
 * Output, in static/promo/lf-halloween-2026/ (served at lucaberton.com/promo/...):
 *   wide.webp / wide.jpg       1200x300 CSS strip at 2x (2400x600 px), composed
 *                              from the artwork's own headline, button, logo
 *                              and porch scene
 *   card-{800,1200,1595}.webp  the full artwork, for phones and cards
 *   card.jpg                   1595 px JPEG fallback
 *
 * Usage: node scripts/generate-lf-halloween-banners.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const ORIGINAL = path.join(ROOT, 'scripts', 'assets', 'lf-halloween-2026-artwork.jpg');
const FONT = path.join(ROOT, 'scripts', 'assets', 'fonts', 'PassionOne-Regular.ttf');
const OUT = path.join(ROOT, 'static', 'promo', 'lf-halloween-2026');
fs.mkdirSync(OUT, { recursive: true });

const CODE = 'TREATS35LUCA';
const ORANGE = '#eb8c3a'; // the artwork's own orange (code, button, corner)
const fontFace = `@font-face{font-family:Passion;src:url(data:font/ttf;base64,${fs.readFileSync(FONT).toString('base64')})}`;

const { width: W, height: H } = await sharp(ORIGINAL).metadata();
if (W !== 1595 || H !== 829) throw new Error(`unexpected artwork size ${W}x${H}; the regions below are for 1595x829`);

// 1. Fill in the translate button (1320–1363, 645–688, plus its soft shadow).
//    The hole straddles the top edge of the penguin's right foot, which
//    crosses it from (1314,654) to (1369,676). Below that line the hole is
//    filled only from the yellow foot around it, above it only from the
//    flipper and sheet, each by solving Laplace's equation (every pixel the
//    average of its valid neighbours), so the foot keeps a clean edge instead
//    of a grey smear.
const raw = await sharp(ORIGINAL).removeAlpha().raw().toBuffer();
{
  const [x0, y0, x1, y1] = [1315, 640, 1368, 693];
  const edgeY = (x) => 654 + ((676 - 654) * (x - 1314)) / (1369 - 1314);
  const inHole = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const yellow = (i) => raw[i] > 170 && raw[i + 1] > 120 && raw[i + 2] < 110 && raw[i] - raw[i + 2] > 90;
  const foot = (x, y) => (inHole(x, y) ? y >= edgeY(x) : yellow((y * W + x) * 3));

  // Start each side at the mean of its own boundary pixels.
  const mean = { true: [0, 0, 0, 0], false: [0, 0, 0, 0] };
  for (let y = y0 - 1; y <= y1 + 1; y++) {
    for (let x = x0 - 1; x <= x1 + 1; x++) {
      if (inHole(x, y)) continue;
      const i = (y * W + x) * 3;
      const m = mean[yellow(i)];
      for (let c = 0; c < 3; c++) m[c] += raw[i + c];
      m[3]++;
    }
  }
  const f = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) f[i] = raw[i];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const m = mean[foot(x, y)];
      for (let c = 0; c < 3; c++) f[(y * W + x) * 3 + c] = m[c] / m[3];
    }
  }
  for (let it = 0; it < 4000; it++) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const side = foot(x, y);
        const i = (y * W + x) * 3;
        const sum = [0, 0, 0];
        let n = 0;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          if (foot(x + dx, y + dy) !== side) continue;
          const j = ((y + dy) * W + x + dx) * 3;
          for (let c = 0; c < 3; c++) sum[c] += f[j + c];
          n++;
        }
        if (n) for (let c = 0; c < 3; c++) f[i + c] = sum[c] / n;
      }
    }
  }
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) raw[i + c] = Math.round(f[i + c]);
    }
  }
}

const browser = await chromium.launch();

// 2. The offer lines sit on plain black at 60,200 820x205 (text 88–701 x
//    214–390). Paint them out and redraw them with the personal code, cap
//    height 71 px like the artwork, condensed to the artwork's width.
const [OL, OT, OW, OH] = [60, 200, 820, 205];
const offer = await (async () => {
  const page = await browser.newPage({ viewport: { width: OW, height: OH } });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontFace}
    html,body{margin:0;background:transparent}
    .p{position:relative;width:${OW}px;height:${OH}px;background:linear-gradient(90deg,#000 88%,rgba(0,0,0,0));
       font-family:Passion;font-size:113px;line-height:1;color:#fff}
    .l{position:absolute;left:28px;white-space:nowrap;transform:scaleX(.86);transform-origin:0 0}
    .l1{top:-10px}.l2{top:91px}
    b{font-weight:400;color:${ORANGE}}
  </style></head><body><div class="p">
    <div class="l l1">Use <b>${CODE}</b></div>
    <div class="l l2">for <b>35%</b> off sitewide</div>
  </div></body></html>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (!(await page.evaluate(() => document.fonts.check('113px Passion')))) throw new Error('Passion One did not load');
  const png = await page.locator('.p').screenshot({ type: 'png', omitBackground: true });
  await page.close();
  return png;
})();

const SRC = await sharp(raw, { raw: { width: W, height: H, channels: 3 } })
  .composite([{ input: offer, left: OL, top: OT }])
  .png()
  .toBuffer();

// Regions of the cleaned 1595x829 artwork, in source pixels: left, top, width, height.
// The scene starts below the headline so none of the artwork's text shows in
// it; that cuts the "2 days only" corner, which the strip redraws.
const REGIONS = {
  headline: [78, 70, 988, 102],
  cta: [78, 450, 718, 106],
  logo: [80, 608, 440, 90],
  scene: [860, 180, 735, 649],
};
const crop = async ([left, top, width, height]) =>
  'data:image/png;base64,' + (await sharp(SRC).extract({ left, top, width, height }).png().toBuffer()).toString('base64');

/**
 * The headline's right end runs over the lit porch window, so a plain crop
 * shows a box. Key it instead: white text, alpha from how white each pixel is
 * (the window is yellow and the door blue-grey, so their darkest channel stays
 * low and they drop out).
 */
const whiteText = async ([left, top, width, height]) => {
  const { data, info } = await sharp(SRC).extract({ left, top, width, height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = Math.max(0, Math.min(255, Math.round(((min - 90) / 140) * 255)));
  }
  return 'data:image/png;base64,' + (await sharp(data, { raw: info }).png().toBuffer()).toString('base64');
};

const img = {};
for (const [k, r] of Object.entries(REGIONS)) img[k] = k === 'headline' ? await whiteText(r) : await crop(r);

// 3. The strip: headline, one-line offer, button and logo on the left; the
//    porch scene with the penguin and the "2 days only" corner on the right.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontFace}
  html,body{margin:0;padding:0;background:#000}
  .b{position:relative;width:1200px;height:300px;overflow:hidden;background:#000}
  .scene{position:absolute;right:0;top:0;height:300px}
  .fade{position:absolute;right:0;top:0;width:340px;height:300px;background:linear-gradient(90deg,#000 0%,rgba(0,0,0,0) 30%)}
  .corner{position:absolute;right:0;top:0;width:150px;height:150px;
          background:linear-gradient(225deg,${ORANGE} 49.6%,rgba(0,0,0,0) 50.4%)}
  .corner span{position:absolute;left:105px;top:45px;transform:translate(-50%,-50%) rotate(45deg);
               text-align:center;font-family:Passion;font-size:27px;line-height:.95;color:#111;white-space:nowrap}
  .headline{position:absolute;left:38px;top:24px;height:66px}
  .offer{position:absolute;left:44px;top:104px;font-family:Passion;font-size:62px;line-height:1;color:#fff;
         white-space:nowrap;transform:scaleX(.86);transform-origin:0 0}
  .offer b{font-weight:400;color:${ORANGE}}
  .cta{position:absolute;left:38px;top:190px;height:56px}
  .logo{position:absolute;left:470px;top:196px;height:46px}
  .ends{position:absolute;left:44px;top:258px;font:italic 400 17px/1 Arial,Helvetica,sans-serif;color:#d9d9d9}
</style></head><body><div class="b">
  <img class="scene" src="${img.scene}"><div class="fade"></div><div class="corner"><span>2 DAYS<br>ONLY!</span></div>
  <img class="headline" src="${img.headline}">
  <div class="offer">Use <b>${CODE}</b> for <b>35%</b> off sitewide</div>
  <img class="cta" src="${img.cta}"><img class="logo" src="${img.logo}">
  <div class="ends">*Offer ends Oct. 29</div>
</div></body></html>`;

const page = await browser.newPage({ viewport: { width: 1200, height: 300 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const wide = await page.locator('.b').screenshot({ type: 'png' });
await browser.close();

await sharp(wide).flatten({ background: '#000' }).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, 'wide.jpg'));
await sharp(wide).webp({ quality: 88 }).toFile(path.join(OUT, 'wide.webp'));
for (const w of [800, 1200, 1595]) {
  await sharp(SRC).resize({ width: w }).webp({ quality: 86 }).toFile(path.join(OUT, `card-${w}.webp`));
}
await sharp(SRC).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'card.jpg'));

// Self-check: every file exists with the expected size
const expect = { 'wide.jpg': [2400, 600], 'wide.webp': [2400, 600], 'card-800.webp': [800, 416], 'card-1200.webp': [1200, 624], 'card-1595.webp': [1595, 829], 'card.jpg': [1595, 829] };
let ok = true;
for (const [f, [w, h]] of Object.entries(expect)) {
  const m = await sharp(path.join(OUT, f)).metadata();
  const kb = Math.round(fs.statSync(path.join(OUT, f)).size / 1024);
  const good = m.width === w && Math.abs(m.height - h) <= 1;
  ok &&= good;
  console.log(`${good ? 'ok ' : 'BAD'} ${f} ${m.width}x${m.height} ${kb} KB`);
}
process.exit(ok ? 0 : 1);
