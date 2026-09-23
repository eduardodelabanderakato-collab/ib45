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
  fs.writeFileSync(path.join(OUT, 'deck.html'), R.dashboardHTML(plan, state));
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
  try { require('child_process').execFileSync('node', [path.join(ROOT, 'scripts/news.js')], { stdio: 'ignore' }); } catch (e) {}
  // Email banner (image, so Gmail keeps the look)
  try { const holo = fs.existsSync(path.join(ROOT, 'app/assets/hologram-figure.png')) ? 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'app/assets/hologram-figure.png')).toString('base64') : '';
    const bp = await browser.newPage({ viewport: { width: 1200, height: 260 }, deviceScaleFactor: 1 });
    await bp.setContent(`<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800&display=block" rel="stylesheet"><style>html,body{margin:0;width:1200px;height:260px;overflow:hidden}body{background:radial-gradient(800px 320px at 50% 0%,#0f3f85 0%,#061633 60%,#03091c 100%);font-family:'Inter Tight',Inter,-apple-system,sans-serif;color:#EAF2FF;position:relative}.bits{position:absolute;inset:0;font:600 14px Menlo,monospace;color:rgba(120,200,255,.3)}.bits span{position:absolute}.w{position:absolute;left:0;right:0;top:58px;text-align:center}.w h1{margin:0;font-size:96px;font-weight:800;letter-spacing:-.05em;line-height:.9}.w p{margin:10px 0 0;font-size:15px;letter-spacing:.24em;text-transform:uppercase;color:#7fd8ff;font-weight:700}.h{position:absolute;right:140px;top:14px;height:232px;filter:drop-shadow(0 0 22px rgba(95,212,255,.6))}.h2{position:absolute;left:140px;top:14px;height:232px;filter:drop-shadow(0 0 22px rgba(95,212,255,.6));transform:scaleX(-1)}</style></head><body><div class="bits">${Array.from({length:50},()=>`<span style="left:${Math.random()*1200}px;top:${Math.random()*260}px;opacity:${(0.2+Math.random()*0.6).toFixed(2)}">${Math.random()<.5?'0':'1'}</span>`).join('')}</div>${holo?`<img class="h" src="${holo}">`:''}<div class="w"><h1>Life</h1><p>Eduardo · IB 45 · Class of 2032</p></div></body></html>`, { waitUntil: 'networkidle' });
    await bp.evaluate(() => document.fonts.ready); await bp.waitForTimeout(300); await bp.screenshot({ path: path.join(OUT, 'banner.png') });
    // animated version: bits drift + hologram flicker → banner.gif (ffmpeg present locally and on ubuntu runners)
    try { const fdir = path.join(OUT, '_frames'); fs.mkdirSync(fdir, { recursive: true });
      for (let i = 0; i < 16; i++) { await bp.evaluate((i) => { const bits = document.querySelectorAll('.bits span'); bits.forEach((b, k) => { const y = (parseFloat(b.style.top) - 3 + (k % 3)) ; b.style.top = (y < -20 ? 280 : y) + 'px'; b.style.opacity = (0.15 + 0.6 * Math.abs(Math.sin((i + k) / 3))).toFixed(2); }); const h = document.querySelector('.h'); if (h) { h.style.opacity = (0.82 + 0.18 * Math.abs(Math.sin(i / 2.2))).toFixed(2); h.style.filter = `drop-shadow(0 0 ${18 + 10 * Math.abs(Math.sin(i / 2))}px rgba(95,212,255,.65))`; } }, i); await bp.screenshot({ path: path.join(fdir, `f${String(i).padStart(2, '0')}.png`) }); }
      const { execFileSync } = require('child_process'); execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '6', '-i', path.join(fdir, 'f%02d.png'), '-vf', 'scale=900:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3', '-loop', '0', path.join(OUT, 'banner.gif')]); fs.rmSync(fdir, { recursive: true, force: true });
    } catch (e) { console.warn('banner.gif skipped:', e.message); try { fs.copyFileSync(path.join(OUT, 'banner.png'), path.join(OUT, 'banner.gif')); } catch (e2) {} }
    await bp.close();
  } catch (e) { console.warn('banner skipped:', e.message); }
  // Route map for the briefing email (visited airports + current position)
  try {
    const F = require('./flights.js'); const t = state.tour || { visited: ['HND'], at: 'HND' };
    const vis = (t.visited || []).filter(c => F.BY[c]); const markers = vis.map(c => ({ name: c, coords: [F.BY[c].la, F.BY[c].lo] })); const lines = []; for (let i = 1; i < vis.length; i++) lines.push({ from: vis[i - 1], to: vis[i] });
    const mp = await browser.newPage({ viewport: { width: 1200, height: 560 }, deviceScaleFactor: 2 });
    await mp.setContent(`<!doctype html><html><head><meta charset="utf-8"><script src="https://cdnjs.cloudflare.com/ajax/libs/jsvectormap/1.5.3/js/jsvectormap.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/jsvectormap/1.5.3/maps/world.js"></script><style>html,body{margin:0;background:#fff}#m{width:1200px;height:560px}</style></head><body><div id="m"></div><script>new jsVectorMap({selector:'#m',map:'world',zoomButtons:false,zoomOnScroll:false,backgroundColor:'transparent',regionStyle:{initial:{fill:'#E6E8EC',stroke:'#fff',strokeWidth:.6}},markers:${JSON.stringify(markers)},lines:${JSON.stringify(lines)},markerStyle:{initial:{fill:'#8C1515',stroke:'#fff',strokeWidth:2,r:5}},lineStyle:{stroke:'#8C1515',strokeWidth:2,strokeDasharray:'5 4'},labels:{markers:{render:m=>m.name}},markerLabelStyle:{initial:{fontFamily:'Menlo, monospace',fontSize:12,fill:'#111'}}});</script></body></html>`, { waitUntil: 'networkidle' });
    await mp.waitForTimeout(400); await mp.screenshot({ path: path.join(OUT, 'map.png') }); await mp.close();
  } catch (e) { console.warn('map skipped:', e.message); }
  try { const { execFileSync } = require('child_process'); const F = require('./flights.js'); const t = state.tour || { at: 'HND' }; const it = F.itinerary(t.at || 'HND', plan.blocks.filter(b => ['sprint', 'retrieval'].includes(b.kind)));
    const names = [...new Set([...it.legs.filter(l => l.flight).map(l => l.flight.city), F.BY[it.endsAt] ? F.BY[it.endsAt].c : '', 'Stanford', 'Artificial intelligence'])].filter(Boolean);
    execFileSync('node', [path.join(ROOT, 'scripts/images.js'), ...names, '--download', path.join(OUT, 'photos')], { stdio: 'ignore' }); } catch (e) { console.warn('photos skipped:', e.message); }
  try { const { execFileSync } = require('child_process'); const r = JSON.parse(execFileSync('node', [path.join(ROOT, 'scripts/brief.js'), iso, '--out', OUT]).toString()); fs.copyFileSync(r.html, path.join(OUT, 'brief.html')); } catch (e) { console.warn('brief skipped:', e.message); }
  // Life app (static): regenerate 14 days of plan seeds from the current position, then build app/index.html into the site root
  try { const { execFileSync } = require('child_process'); const F = require('./flights.js'); let at = (state.tour && state.tour.at) || 'HND'; const seedDir = path.join(ROOT, 'app/seed/plan'); fs.mkdirSync(seedDir, { recursive: true }); for (const f of fs.readdirSync(seedDir)) fs.unlinkSync(path.join(seedDir, f));
    for (let d = iso, i = 0; i < 14; d = P.addDays(d, 1), i++) { const p = P.planFor(state, d); const fly = p.blocks.filter(b => ['sprint', 'retrieval'].includes(b.kind)); const it = F.itinerary(at, fly); const by = Object.fromEntries(it.legs.map(l => [l.start, l.flight]));
      fs.writeFileSync(path.join(seedDir, d + '.json'), JSON.stringify({ date: d, label: p.prettyLong, dayLabel: p.dayLabel, phase: p.phase, at, endsAt: it.endsAt, blocks: p.blocks.map(b => ({ slot: b.slot, start: b.start, end: b.end, title: b.title, kind: b.kind, subject: b.subject, subjectShort: b.subjectShort, color: b.color, where: b.where, steps: b.steps, flight: by[b.start] || null })), countdowns: p.countdowns.filter(c => c.daysLeft <= 21).map(c => ({ id: c.id, title: c.title, date: c.date, daysLeft: c.daysLeft, subject: c.subjectShort, task: c.task, type: c.type })) })); at = it.endsAt; }
    const subjects = Object.entries(state.subjects).filter(([id]) => id !== 'sat').map(([id, s]) => ({ id, name: s.name, short: s.short, color: s.color, kind: s.kind, grade: s.grade, target: 7, next: s.next.slice(0, 4), teacherNote: s.teacherNote || '', resources: s.resources, topicsTotal: s.topics.length, topicsTaught: s.topics.filter(t => t.status !== 'new').length, work: s.work || null }));
    fs.writeFileSync(path.join(ROOT, 'app/seed/subjects.json'), JSON.stringify({ subjects })); fs.writeFileSync(path.join(ROOT, 'app/seed/assessments.json'), JSON.stringify({ items: state.assessments.filter(a => a.date >= iso) })); fs.writeFileSync(path.join(ROOT, 'app/seed/focus.json'), JSON.stringify(state.focus || null));
    const t = state.tour || {}; const codes = [...new Set([...F.TOUR, ...(t.visited || [])])]; fs.writeFileSync(path.join(ROOT, 'app/seed/tour.json'), JSON.stringify({ at: t.at || 'HND', home: 'GRU', visited: t.visited || ['HND'], kmTotal: t.kmTotal || 0, minutesTotal: t.minutesTotal || 0, cities: new Set(t.visited || []).size, waypoints: F.TOUR, coords: Object.fromEntries(codes.filter(c => F.BY[c]).map(c => [c, { la: F.BY[c].la, lo: F.BY[c].lo, c: F.BY[c].c }])) }));
    execFileSync('node', [path.join(ROOT, 'app/build-app.js'), 'Life'], { stdio: 'ignore' }); fs.copyFileSync(path.join(ROOT, 'app/index.html'), path.join(OUT, 'index.html')); const builtMatch = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8').match(/const BUILT = "([^"]+)"/); fs.writeFileSync(path.join(OUT, 'version.json'), JSON.stringify({ built: builtMatch ? builtMatch[1] : new Date().toISOString(), date: iso })); } catch (e) { console.warn('app skipped:', e.message); }
  await browser.close();
  console.log(`built ${iso} (${plan.dayLabel}): ${plan.blocks.length} blocks, ${plan.countdowns.length} countdowns -> site/`);
}
main().catch(e => { console.error(e); process.exit(1); });
