// scripts/mac/audit.js — nightly audit: compare the real Focus Flight log with today's plan, append to data/state.json log, print the verdict.
// Deterministic; no AI. Usage: node scripts/mac/audit.js [YYYY-MM-DD] [--dry]
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..'); const SP = path.join(ROOT, 'data/state.json');
const P = require(path.join(ROOT, 'src/plan.js'));
const state = JSON.parse(fs.readFileSync(SP, 'utf8'));
const args = process.argv.slice(2); const dry = args.includes('--dry');
const day = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Intl.DateTimeFormat('en-CA', { timeZone: state.tz }).format(new Date());
const log = JSON.parse(execFileSync('node', [path.join(__dirname, 'ff-log.js'), day]).toString());
const plan = P.planFor(state, day);
const toMin = t => (+t.slice(0, 2)) * 60 + (+t.slice(3));
const flights = log.flights.filter(f => f.status === 'completed' && f.minutes >= 10);
const planned = plan.blocks.filter(b => ['sprint', 'retrieval'].includes(b.kind));
const flown = planned.map(b => { const s = toMin(b.start), e = toMin(b.end); const hit = flights.find(f => { const fs_ = toMin(f.start), fe = f.end ? toMin(f.end) : fs_ + f.minutes; return Math.min(e, fe) - Math.max(s, fs_) >= 10; }); return { slot: b.slot, title: b.title, start: b.start, flight: hit ? `${hit.from}→${hit.to} ${hit.minutes}m` : null }; });
const minutes = flights.reduce((a, f) => a + (f.minutes || 0), 0);
const sprint1 = planned[0] && (flown[0].flight != null || flights.length > 0);
const entry = { date: day, started: !!sprint1, sprintsDone: flown.filter(x => x.flight).length, sprintsPlanned: planned.length, focusMinutes: minutes, flights: flights.map(f => `${f.start} ${f.from}→${f.to} ${f.minutes}m`), currentAirport: log.currentAirport, source: 'focusflight' };
if (!dry) { state.log = (state.log || []).filter(r => r.date !== day); state.log.push(entry); state.currentAirport = log.currentAirport || state.currentAirport; fs.writeFileSync(SP, JSON.stringify(state, null, 2)); }
const tomorrow = P.addDays(day, 1); const tp = P.planFor(state, tomorrow); const first = tp.blocks.find(b => ['sprint', 'retrieval'].includes(b.kind));
const verdict = entry.started ? `Started ✓ · ${entry.sprintsDone}/${entry.sprintsPlanned} blocks flown · ${minutes} min in the air · now in ${log.currentAirport}` : `Not started ✗ · 0 flights logged today`;
const missed = flown.filter(x => !x.flight).map(x => `${x.start} ${x.title}`);
console.log(`${plan.pretty}: ${verdict}`);
if (missed.length) console.log(`Missed: ${missed.join(' · ')}`);
if (first) console.log(`Tomorrow's first flight: ${first.start} ${first.title} — ${first.steps[0]}`);
console.log(JSON.stringify({ entry, missed, tomorrowFirst: first ? { start: first.start, title: first.title, step: first.steps[0] } : null }));
