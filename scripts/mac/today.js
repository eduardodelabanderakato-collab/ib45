// scripts/mac/today.js — print today's itinerary (plan + flights from the real current airport). Read-only.
// Usage: node scripts/mac/today.js [YYYY-MM-DD]   (add --json for machine output)
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..');
const P = require(path.join(ROOT, 'src/plan.js')), F = require(path.join(ROOT, 'src/flights.js'));
const state = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/state.json'), 'utf8'));
const args = process.argv.slice(2); const json = args.includes('--json');
const day = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Intl.DateTimeFormat('en-CA', { timeZone: state.tz }).format(new Date());
let at = state.currentAirport || 'HND';
try { at = JSON.parse(execFileSync('node', [path.join(__dirname, 'ff-log.js'), day]).toString()).currentAirport || at; } catch (e) {}
const plan = P.planFor(state, day);
const flyable = plan.blocks.filter(b => ['sprint', 'retrieval'].includes(b.kind));
const it = F.itinerary(at, flyable); const legByStart = Object.fromEntries(it.legs.map(l => [l.start, l.flight]));
const out = { date: day, label: `${plan.prettyLong} · ${plan.dayLabel}`, phase: plan.phase, at, endsAt: it.endsAt, countdowns: plan.countdowns.filter(c => c.daysLeft <= 14).map(c => `${c.title}: ${c.daysLeft}d`), blocks: plan.blocks.map(b => ({ start: b.start, end: b.end, title: b.title, kind: b.kind, steps: b.steps, flight: legByStart[b.start] || null })) };
if (json) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`${out.label} · ${out.phase} · you are in ${at}`);
if (out.countdowns.length) console.log('Countdowns: ' + out.countdowns.join(' · '));
for (const b of out.blocks) {
  const f = b.flight; console.log(`\n${b.start}–${b.end}  ${b.title}${f ? `   ✈ ${f.from} → ${f.to} ${f.city} · ${f.minutes} min` : b.kind === 'fixed' ? '' : '   (ground)'}`);
  if (b.kind !== 'fixed') for (const s of b.steps) console.log(`   ○ ${s}`);
}
console.log(`\nEnd of day: ${out.endsAt}${out.endsAt !== at ? ` (${F.BY[out.endsAt] && F.BY[out.endsAt].c})` : ''}`);
