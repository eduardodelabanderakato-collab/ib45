// scripts/news.js — one good AI story (Hacker News, last 36h) + two Economist finance headlines → data/news.json
'use strict';
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'data/news.json');
const BAD = /\b(strike|war|dead|death|kill|killed|lawsuit|sued|ban|banned|scam|fraud|layoff|layoffs|crash|attack|leak|breach|outage)\b/i;
(async () => {
  const out = { fetchedAt: new Date().toISOString(), ai: null, economist: [] };
  try { const r = await fetch('https://hn.algolia.com/api/v1/search?query=AI&tags=story&hitsPerPage=40&numericFilters=created_at_i>' + Math.floor(Date.now() / 1000 - 36 * 3600)); const j = await r.json();
    const hits = j.hits.filter(h => h.url && /\b(AI|LLM|GPT|Claude|Gemini|OpenAI|Anthropic|DeepMind|model|agent|robot|neural)\b/i.test(h.title) && !BAD.test(h.title)).sort((a, b) => b.points - a.points);
    if (hits[0]) out.ai = { title: hits[0].title, url: hits[0].url, source: new URL(hits[0].url).hostname.replace(/^www\./, ''), points: hits[0].points, hn: 'https://news.ycombinator.com/item?id=' + hits[0].objectID }; } catch (e) {}
  try { const e = await fetch('https://www.economist.com/finance-and-economics/rss.xml', { headers: { 'User-Agent': 'ib45/1.0' } }); const t = await e.text();
    out.economist = [...t.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<description>([\s\S]*?)<\/description>/g)].slice(0, 2).map(m => ({ title: m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim(), url: m[2].trim(), blurb: m[3].replace(/<!\[CDATA\[|\]\]>|<[^>]+>/g, '').trim().slice(0, 160) })); } catch (e) {}
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2)); console.log(JSON.stringify({ ai: out.ai && out.ai.title, economist: out.economist.length }));
})();
