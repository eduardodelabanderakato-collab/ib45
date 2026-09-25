// scripts/images.js — resolve photos for places via the Wikipedia REST summary API; cached in data/images.json.
// Usage: node scripts/images.js "Sapporo" "Hanamaki" ...  → prints JSON {name: {url, credit, title}}
'use strict';
const fs = require('fs'), path = require('path');
const CACHE = path.join(__dirname, '..', 'data/images.json');
let cache = {}; try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (e) {}
const ALIAS = { 'Tokyo': 'Tokyo', 'Stanford': 'Main Quad (Stanford University)', 'São Paulo': 'São Paulo', 'Seoul': 'Seoul', 'Artificial intelligence': 'Supercomputer', 'Stanford Hoover Tower': 'Hoover Tower', 'Stanford Memorial Church': 'Stanford Memorial Church', 'Stanford Dish': 'Stanford Dish', 'AI robot': 'Humanoid robot', 'AI data center': 'Data center', 'AI chip': 'Graphics processing unit' };
async function lookup(name) {
  if (cache[name]) return cache[name];
  const title = ALIAS[name] || name;
  for (const q of [title, title + ' (city)', title + ', Japan']) {
    await new Promise(r => setTimeout(r, 250)); // Wikipedia throttles bursts; a batch of 35 names lost half its answers without this
    try {
      const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q), { headers: { 'User-Agent': 'ib45-brief/1.0 (personal study planner)' } });
      if (!r.ok) continue; const j = await r.json(); const img = j.originalimage || j.thumbnail; if (!img) continue;
      const clean = u => u.split('?')[0]; const url = (j.originalimage && j.originalimage.width <= 2600) ? clean(j.originalimage.source) : (j.thumbnail ? clean(j.thumbnail.source) : clean(img.source));
      cache[name] = { url, title: j.title, credit: 'Wikimedia Commons', page: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page }; return cache[name];
    } catch (e) {}
  }
  return null;
}
const slug = n => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
(async () => {
  const argv = process.argv.slice(2); const di = argv.indexOf('--download'); const dir = di >= 0 ? argv[di + 1] : null; const names = argv.filter((a, i) => a !== '--download' && i !== di + 1);
  const out = {};
  for (const n of names) { let v = await lookup(n); if (!v) { await new Promise(r => setTimeout(r, 1500)); v = await lookup(n); } if (!v) continue; v.slug = slug(n); out[n] = v;
    if (dir) { try { fs.mkdirSync(dir, { recursive: true }); const f = path.join(dir, v.slug + '.jpg'); if (!fs.existsSync(f)) { const r = await fetch(v.url, { headers: { 'User-Agent': 'ib45-brief/1.0 (personal study planner)' } }); if (r.ok) fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); } } catch (e) {} } }
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2)); console.log(JSON.stringify(out));
})();
