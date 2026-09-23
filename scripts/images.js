// scripts/images.js — resolve photos for places via the Wikipedia REST summary API; cached in data/images.json.
// Usage: node scripts/images.js "Sapporo" "Hanamaki" ...  → prints JSON {name: {url, credit, title}}
'use strict';
const fs = require('fs'), path = require('path');
const CACHE = path.join(__dirname, '..', 'data/images.json');
let cache = {}; try { cache = JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (e) {}
const ALIAS = { 'Tokyo': 'Tokyo', 'Stanford': 'Main Quad (Stanford University)', 'São Paulo': 'São Paulo', 'Seoul': 'Seoul' };
async function lookup(name) {
  if (cache[name]) return cache[name];
  const title = ALIAS[name] || name;
  for (const q of [title, title + ' (city)', title + ', Japan']) {
    try {
      const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q), { headers: { 'User-Agent': 'ib45-brief/1.0 (personal study planner)' } });
      if (!r.ok) continue; const j = await r.json(); const img = j.originalimage || j.thumbnail; if (!img) continue;
      const url = (j.originalimage && j.originalimage.width > 1400 && j.thumbnail) ? j.thumbnail.source.replace(/\/\d+px-/, '/1200px-') : img.source;
      cache[name] = { url, title: j.title, credit: 'Wikimedia Commons', page: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page }; return cache[name];
    } catch (e) {}
  }
  return null;
}
(async () => {
  const names = process.argv.slice(2); const out = {};
  for (const n of names) { const v = await lookup(n); if (v) out[n] = v; }
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2)); console.log(JSON.stringify(out));
})();
