// scripts/mac/ff-log.js — read Eduardo's real Focus Flight log (CloudKit-mirrored SQLite on this Mac). Read-only: works on a temp copy.
// Usage: node scripts/mac/ff-log.js [YYYY-MM-DD]   → JSON { date, currentAirport, flights: [{start, end, minutes, from, to, category, status}] }
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');
const SRC = path.join(os.homedir(), 'Library/Group Containers/group.net.cementpla.FocusFlights');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-'));
for (const f of ['FocusFlights.sqlite', 'FocusFlights.sqlite-wal', 'FocusFlights.sqlite-shm']) { const p = path.join(SRC, f); if (fs.existsSync(p)) fs.copyFileSync(p, path.join(TMP, f)); }
const DB = path.join(TMP, 'FocusFlights.sqlite');
const q = sql => JSON.parse(execFileSync('sqlite3', ['-json', DB, sql]).toString() || '[]');
const day = process.argv[2] || new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
const EPOCH = Date.UTC(2001, 0, 1) / 1000;
const iso = s => new Date((s + EPOCH) * 1000);
const local = d => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(d);
const ymd = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
const ap = Object.fromEntries(q('select Z_PK k, ZIATA_CODE i, ZMUNICIPALITY c from ZAIRPORTENTITY').map(r => [r.k, r]));
const cat = Object.fromEntries(q('select Z_PK k, ZNAME n from ZCATEGORY').map(r => [r.k, r.n]));
const user = q('select ZAIRPORT a from ZUSER')[0];
const rows = q('select ZFROM f, ZTO t, ZDEPARTUREDATE d, ZARRIVALDATE a, ZSTATUS s, ZCATEGORY c from ZORDER where ZDEPARTUREDATE is not null order by ZDEPARTUREDATE');
const flights = rows.map(r => { const s = iso(r.d), e = r.a ? iso(r.a) : null; return { start: local(s), end: e ? local(e) : null, date: ymd(s), minutes: e ? Math.round((e - s) / 60000) : null, from: ap[r.f] && ap[r.f].i, to: ap[r.t] && ap[r.t].i, toCity: ap[r.t] && ap[r.t].c, category: cat[r.c], status: r.s === 3 ? 'completed' : r.s === 4 ? 'cancelled' : String(r.s) }; }).filter(f => f.date === day);
console.log(JSON.stringify({ date: day, currentAirport: ap[user.a] && ap[user.a].i, flights }, null, 2));
fs.rmSync(TMP, { recursive: true, force: true });
