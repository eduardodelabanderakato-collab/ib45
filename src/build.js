// src/build.js — state -> site/ (index.html, plan.json, wp-*.png)
'use strict';
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const P = require('./plan.js'); const R = require('./render.js');

const ROOT = path.join(__dirname, '..'); const OUT = path.join(ROOT, 'site');
const state = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/state.json'), 'utf8'));

function todayISO() {
  if (process.env.IB45_DATE) return process.env.IB45_DATE;
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: state.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t).value; return `${g('year')}-${g('month')}-${g('day')}`;
}

// Viewport in CSS px; scale = deviceScaleFactor. Pixel output = w*scale x h*scale.
const DEVICES = {
  iphone: { w: 402, h: 874, scale: 3, pad: { top: 300, bottom: 120, side: 20 }, u: 1, center: false, expandAll: false },          // 1206x2622; clock zone left empty
  ipad:   { w: 1376, h: 1376, scale: 2, pad: { top: 300, bottom: 220, side: 100 }, u: 1.3, maxWidth: 720, center: true, expandAll: true },  // 2752x2752 square, centre-safe
  mac:    { w: 1280, h: 832, scale: 2, pad: { top: 60, bottom: 80, side: 100 }, u: 1.05, maxWidth: 600, center: true, expandAll: true }    // 2560x1664 MacBook Air
};

async function main() {
  const iso = todayISO(); const plan = P.planFor(state, iso);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), R.dashboardHTML(plan, state));
  fs.writeFileSync(path.join(OUT, 'plan.json'), JSON.stringify(plan, null, 2));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  const launch = process.env.CI ? {} : { channel: 'chrome' };
  const browser = await chromium.launch(launch);
  for (const [name, d] of Object.entries(DEVICES)) {
    const page = await browser.newPage({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: d.scale });
    await page.setContent(R.wallpaperHTML(plan, d), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, `wp-${name}.png`), fullPage: false });
    await page.close();
  }
  await browser.close();
  console.log(`built ${iso} (${plan.dayLabel}): ${plan.blocks.length} blocks, ${plan.countdowns.length} countdowns -> site/`);
}
main().catch(e => { console.error(e); process.exit(1); });
