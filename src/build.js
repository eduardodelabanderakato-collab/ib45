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
  mac:    { w: 1280, h: 832, scale: 2, pad: { top: 90, bottom: 90, side: 100 }, u: 1.05, maxWidth: 600, center: true, expandAll: true }    // 2560x1664 MacBook Air
};

async function main() {
  const iso = todayISO(); const plan = P.planFor(state, iso);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), R.dashboardHTML(plan, state));
  fs.writeFileSync(path.join(OUT, 'plan.json'), JSON.stringify(plan, null, 2));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  try { const A = path.join(ROOT, 'app/assets'); for (const f of fs.readdirSync(A)) if (!/source/.test(f)) fs.copyFileSync(path.join(A, f), path.join(OUT, f)); } catch (e) {}
  const launch = process.env.CI ? {} : { channel: 'chrome' };
  const browser = await chromium.launch(launch);
  for (const [name, d] of Object.entries(DEVICES)) {
    const page = await browser.newPage({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: d.scale });
    // Auto-fit: shrink the layout until the band holds everything (no clipping on busy days).
    let mul = 1;
    for (const m of [1, 0.93, 0.86, 0.8, 0.74, 0.68, 0.62, 0.56]) {
      mul = m;
      await page.setContent(R.wallpaperHTML(plan, d, m), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const fits = await page.evaluate(() => { const w = document.querySelector('.wrap'); return w.scrollHeight <= w.clientHeight + 1; });
      if (fits) break;
    }
    if (mul < 1) console.log(`  ${name}: fitted at ${mul}`);
    await page.screenshot({ path: path.join(OUT, `wp-${name}.png`), fullPage: false });
    await page.close();
  }
  // Route map for the briefing email (visited airports + current position)
  try {
    const F = require('./flights.js'); const t = state.tour || { visited: ['HND'], at: 'HND' };
    const vis = (t.visited || []).filter(c => F.BY[c]); const markers = vis.map(c => ({ name: c, coords: [F.BY[c].la, F.BY[c].lo] })); const lines = []; for (let i = 1; i < vis.length; i++) lines.push({ from: vis[i - 1], to: vis[i] });
    const mp = await browser.newPage({ viewport: { width: 1200, height: 560 }, deviceScaleFactor: 2 });
    await mp.setContent(`<!doctype html><html><head><meta charset="utf-8"><script src="https://cdnjs.cloudflare.com/ajax/libs/jsvectormap/1.5.3/js/jsvectormap.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/jsvectormap/1.5.3/maps/world.js"></script><style>html,body{margin:0;background:#fff}#m{width:1200px;height:560px}</style></head><body><div id="m"></div><script>new jsVectorMap({selector:'#m',map:'world',zoomButtons:false,zoomOnScroll:false,backgroundColor:'transparent',regionStyle:{initial:{fill:'#E6E8EC',stroke:'#fff',strokeWidth:.6}},markers:${JSON.stringify(markers)},lines:${JSON.stringify(lines)},markerStyle:{initial:{fill:'#8C1515',stroke:'#fff',strokeWidth:2,r:5}},lineStyle:{stroke:'#8C1515',strokeWidth:2,strokeDasharray:'5 4'},labels:{markers:{render:m=>m.name}},markerLabelStyle:{initial:{fontFamily:'Menlo, monospace',fontSize:12,fill:'#111'}}});</script></body></html>`, { waitUntil: 'networkidle' });
    await mp.waitForTimeout(400); await mp.screenshot({ path: path.join(OUT, 'map.png') }); await mp.close();
  } catch (e) { console.warn('map skipped:', e.message); }
  try { const { execFileSync } = require('child_process'); const r = JSON.parse(execFileSync('node', [path.join(ROOT, 'scripts/brief.js'), iso, '--out', OUT]).toString()); fs.copyFileSync(r.html, path.join(OUT, 'brief.html')); } catch (e) { console.warn('brief skipped:', e.message); }
  await browser.close();
  console.log(`built ${iso} (${plan.dayLabel}): ${plan.blocks.length} blocks, ${plan.countdowns.length} countdowns -> site/`);
}
main().catch(e => { console.error(e); process.exit(1); });
