// scripts/brief.js — the Morning Briefing, in the language of a daily newsletter. Builds HTML + text for a date.
// Usage: node scripts/brief.js [YYYY-MM-DD] [--out dir]  → brief-<date>.html/.txt; prints JSON {day, subject, html, text}
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const P = require(path.join(ROOT, 'src/plan.js')), F = require(path.join(ROOT, 'src/flights.js'));
const state = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/state.json'), 'utf8'));
const args = process.argv.slice(2); const day = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Intl.DateTimeFormat('en-CA', { timeZone: state.tz }).format(new Date());
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(ROOT, 'app/out');
const APP_URL = 'https://claude.ai/artifact/1yfwsi3bMVerDih52BtTSD'; const SITE = 'https://eduardodelabanderakato-collab.github.io/ib45';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plan = P.planFor(state, day); const t = state.tour || {}; const at = t.at || state.currentAirport || 'HND'; const city = F.BY[at] ? F.BY[at].c : at;
const flyable = plan.blocks.filter(b => ['sprint', 'retrieval'].includes(b.kind)); const it = F.itinerary(at, flyable); const legByStart = Object.fromEntries(it.legs.map(l => [l.start, l.flight]));
const yday = P.addDays(day, -1); const y = (state.log || []).find(r => r.date === yday);
const cds = plan.countdowns.filter(c => c.type !== 'checkpoint'); const near = cds.filter(c => c.daysLeft <= 14); const cps = plan.countdowns.filter(c => c.type === 'checkpoint').slice(0, 1);
const stanfordAll = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/seed/stanford.json'), 'utf8')).milestones; const stanford = stanfordAll.filter(m => m.date >= day && P.addDays(day, 21) >= m.date).slice(0, 3);
let IMG = {}; try { IMG = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/images.json'), 'utf8')); } catch (e) {}
const photo = (name, cap) => { const im = IMG[name]; return im ? `<img src="${im.url}" width="564" alt="${esc(name)}" style="width:100%;height:auto;max-height:320px;object-fit:cover;border-radius:10px;display:block"><div style="text-align:center;font-size:12px;color:#6B6B6B;margin:6px 0 16px">(${esc(cap || name)} · Image: ${esc(im.credit)})</div>` : ''; };
const wk = plan.rates; const minutesToday = it.legs.reduce((a, l) => a + (l.flight ? l.flight.minutes : 0), 0); const nFlights = it.legs.filter(l => l.flight).length;
const DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']; const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const d0 = new Date(day + 'T12:00:00Z'); const dateLine = `${DOW[d0.getUTCDay()]}, ${d0.getUTCDate()} ${MONTHS[d0.getUTCMonth()]} ${d0.getUTCFullYear()}`;
const testTomorrow = cds.find(c => c.daysLeft === 1), testToday = cds.find(c => c.daysLeft === 0);
const edTitle = testToday ? 'test day' : testTomorrow ? 'the day before' : near.length ? 'on the ramp' : nFlights >= 3 ? 'a full itinerary' : 'one more leg';
const intro = [`bom dia.`, plan.dayType ? `it's day ${plan.dayType}.` : `no school today.`,
  nFlights ? `${['no', 'one', 'two', 'three', 'four', 'five'][nFlights] || nFlights} flight${nFlights === 1 ? '' : 's'}, ${minutesToday} minutes in the air, first wheels up at ${flyable[0].start}.` : `no flights scheduled.`,
  testToday ? `${testToday.title.toLowerCase()} is today. you did the work; the plan for today is light.` : testTomorrow ? `${testTomorrow.title.toLowerCase()} is tomorrow: nothing new today, only what's already yours.` : near[0] ? `${near[0].subjectShort.toLowerCase()} is ${near[0].daysLeft} days out and you're on ramp day ${near[0].rampDay}.` : `nothing is due within two weeks. this is when the lead is built.`,
  `that's the whole job.`].join(' ');
const subject = `${edTitle} · ${plan.pretty}${flyable[0] ? ` · ${flyable[0].start} ${flyable[0].title}` : ''}${near[0] ? ` · ${near[0].subjectShort} in ${near[0].daysLeft}d` : ''}`;
const yesterday = y ? (y.started ? `<b>Started ✓</b> · ${y.sprintsDone}/${y.sprintsPlanned} blocks flown · ${y.focusMinutes || 0} min in the air · landed in ${esc(y.currentAirport || at)}` : `<b>Not started ✗</b> · no flights logged`) : `no audit for ${P.pretty(yday)}`;

// ---------- pieces (email-safe inline CSS) ----------
const C = { ink: '#111111', dim: '#6B6B6B', line: '#EBEBEB', bg: '#F6F6F6', card: '#FFFFFF', acc: '#8C1515', hi: '#FFE8A3', box: '#FFF7E0' };
const font = `font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif`;
const mono = `font-family:'SF Mono',Menlo,Consolas,monospace`;
const dots = `<div style="text-align:center;color:#F5A623;letter-spacing:6px;font-size:14px;padding:18px 0">····</div>`;
const label = s => `<div style="font-size:11px;font-weight:700;letter-spacing:.14em;color:${C.acc};text-transform:uppercase;margin:0 0 6px">${esc(s)}</div>`;
const H = s => `<div style="font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.15;margin:0 0 12px">${esc(s)}</div>`;
const p = s => `<p style="margin:0 0 12px;font-size:15.5px;line-height:1.55">${s}</p>`;
const hi = s => `<span style="background:${C.hi};padding:1px 5px;border-radius:3px;font-weight:700">${esc(s)}</span>`;
const box = s => `<div style="background:${C.box};border-left:3px solid #F5A623;padding:10px 14px;margin:8px 0 14px;font-size:14.5px;line-height:1.5">${s}</div>`;
const blockHTML = (b) => { const f = legByStart[b.start]; if (b.kind === 'fixed') return `<p style="margin:0 0 10px;font-size:14px;color:${C.dim}"><span style="${mono};font-size:12.5px">${b.start}</span> &nbsp;${esc(b.title)} · ${b.start}–${b.end}</p>`;
  return `<div style="margin:0 0 16px"><div style="font-size:16.5px;font-weight:700"><span style="${mono};font-size:13px;color:${C.acc};font-weight:600">${b.start}–${b.end}</span> &nbsp;${esc(b.title)}${b.where ? ` <span style="font-weight:500;color:${C.dim}">· ${esc(b.where)}</span>` : ''}</div>
  ${f ? `<div style="font-size:13px;color:${C.dim};margin:2px 0 6px">✈️ <span style="${mono}">${f.from} → ${f.to}</span> · ${esc(f.city)} · ${f.minutes} min in the air</div>` : ''}
  ${b.steps.map(s => `<div style="font-size:15px;line-height:1.5;padding-left:2px">○ &nbsp;${esc(s)}</div>`).join('')}</div>`; };
const sectionsList = [['✈️', `${nFlights ? `${nFlights} flight${nFlights === 1 ? '' : 's'}, ${minutesToday} min in the air` : 'No flights today'} — the itinerary`], ...near.slice(0, 2).map(c => ['🧪', `${c.subjectShort} ramp day ${c.rampDay}: ${(c.task || '').replace(/^\S+ (ramp|report) -\d+: /, '')}`]), ...(cps.length ? [['📚', `${cps[0].title} · ${cps[0].daysLeft === 0 ? 'today' : cps[0].daysLeft + ' days'}`]] : []), ...(stanford[0] ? [['🌲', `Stanford: ${stanford[0].title} · ${P.pretty(stanford[0].date)}`]] : []), ['🌙', `Tonight: hard stop 21:15, report, lights out ${state.sleep.lightsOut}`]];

const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;background:${C.bg};${font};color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:${C.card};border-radius:14px;overflow:hidden">
<tr><td style="background:#061633;background-image:radial-gradient(circle at 50% 30%,#0e3a7a 0%,#061633 60%,#03091c 100%);padding:26px 28px;text-align:center"><img src="${SITE}/hologram-figure.png" height="150" alt="" style="height:150px;width:auto;display:block;margin:0 auto 10px"><div style="font-size:38px;font-weight:800;color:#EAF2FF;letter-spacing:-.03em;line-height:1">✈︎ flight deck</div><div style="margin-top:8px;font-size:11px;letter-spacing:.14em;color:#7fd8ff;text-transform:uppercase;font-weight:600">Eduardo · IB 45 · Class of 2032</div></td></tr>
<tr><td style="padding:26px 28px 0">
  <div style="text-align:center;font-size:11px;letter-spacing:.14em;color:${C.dim};text-transform:uppercase;font-weight:600">${esc(P.prettyLong ? '' : '')}${dateLine} &nbsp;•&nbsp; reading time: 2 minutes</div>
  <div style="text-align:center;font-size:26px;font-weight:800;letter-spacing:-.02em;margin:18px 0 10px">${esc(edTitle)}</div>
  ${p(esc(intro))}
  ${dots}
  ${label('quick takes')}
  <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;line-height:1.7">
  <tr><td>${hi('Yesterday:')} ${yesterday}</td></tr>
  <tr><td>${hi('Position:')} <span style="${mono}">${esc(at)}</span> · ${esc(city)} · ${(t.kmTotal || 0).toLocaleString('en-US')} km flown so far</td></tr>
  <tr><td>${hi('This week:')} started ${wk.daysStarted} of ${wk.schoolDaysSoFar} school days</td></tr>
  ${near[0] ? `<tr><td>${hi('Next test:')} ${esc(near[0].title)} · ${near[0].daysLeft === 0 ? 'today' : near[0].daysLeft === 1 ? 'tomorrow' : `in ${near[0].daysLeft} days`}</td></tr>` : ''}
  ${cps.length ? `<tr><td>${hi('Reading:')} ${esc(cps[0].title)} · ${cps[0].daysLeft === 0 ? 'today' : `${cps[0].daysLeft} days`}</td></tr>` : ''}
  </table>
  ${dots}
  ${label("in today's edition")}
  <div style="font-size:15px;line-height:1.8">${sectionsList.map(([e, s]) => `${e} &nbsp;${esc(s)}<br>`).join('')}</div>
  ${dots}
  <img src="${SITE}/map.png?d=${day}" width="564" alt="Route map" style="width:100%;height:auto;border-radius:10px;border:1px solid ${C.line};display:block">
  <div style="text-align:center;font-size:12px;color:${C.dim};margin:6px 0 20px">(Route so far: ${esc((t.visited || []).join(' → '))} · ${(t.kmTotal || 0).toLocaleString('en-US')} km · ${Math.round((t.minutesTotal || 0) / 60 * 10) / 10} h)</div>
  ${photo(F.BY[it.endsAt] ? F.BY[it.endsAt].c : '', `Tonight you land in ${F.BY[it.endsAt] ? F.BY[it.endsAt].c : it.endsAt}`)}
  ${label('today')}${H(nFlights ? `${['No', 'One', 'Two', 'Three', 'Four', 'Five'][nFlights] || nFlights} flight${nFlights === 1 ? '' : 's'}, ${minutesToday} minutes in the air` : 'A day on the ground')}
  ${plan.blocks.map(blockHTML).join('')}
  ${box(`<b>Under the hood…</b> the audit reads your Focus Flight log at 21:20. Only flights count; a block with no flight is a missed block.`)}
  ${near.length ? dots + label('ramps') + H(near.length === 1 ? `${near[0].subjectShort}: day ${near[0].rampDay} of the ramp` : `${near.length} tests inside the 14-day window`) + near.map(c => p(`<b>${esc(c.title)}</b> · ${c.daysLeft === 0 ? 'today' : c.daysLeft === 1 ? 'tomorrow' : `${c.daysLeft} days`}${c.task ? `<br>${esc(c.task.replace(/^\S+ (ramp|report) -\d+: /, ''))}` : ''}`)).join('') + box(`<b>Remembering:</b> a test announced only two weeks out is a finishing sprint, not a learning sprint. The base keeps running underneath.`) : ''}
  ${cds.length > near.length ? dots + label('countdowns') + `<div style="font-size:15px;line-height:1.8">${cds.slice(0, 6).map(c => `<b style="${mono};font-size:13px;color:${c.daysLeft <= 3 ? C.acc : C.ink}">${String(c.daysLeft).padStart(2, ' ')}d</b> &nbsp;${esc(c.title)}<br>`).join('')}</div>` : ''}
  ${stanford.length ? dots + label('stanford · class of 2032') + photo('Stanford', 'Main Quad, Stanford University') + H(`${P.addDays(day, 0) <= '2027-11-01' ? Math.round((new Date('2027-11-01T12:00:00Z') - new Date(day + 'T12:00:00Z')) / 86400000) : 0} days to Restrictive Early Action`) + `<div style="font-size:15px;line-height:1.8">${stanford.map(m => `<b style="${mono};font-size:13px">${m.date.slice(5)}</b> &nbsp;${esc(m.title)} <span style="color:${C.dim};font-size:13px">· ${esc(m.owner)}</span><br>`).join('')}</div>` : ''}
  ${dots}${label('tonight')}${p(`<b>21:15</b> hard stop. <b>Report</b> in the app or the chat: blocks flown, errors added and closed, retrieval, one line on what the plan got wrong. <b>${esc(state.sleep.lightsOut)}</b> lights out.`)}
  <div style="text-align:center;padding:10px 0 26px"><a href="${APP_URL}" style="display:inline-block;background:${C.acc};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:10px">Open the Flight Deck</a></div>
</td></tr>
<tr><td style="background:${C.bg};padding:16px 28px;text-align:center;font-size:12px;color:${C.dim};line-height:1.6">Sent every morning at 06:45 from your own plan. Changes, tests, holidays: tell Claude in the IB45 chat.<br>${esc(dateLine)} · edition ${Math.max(1, Math.round((new Date(day + 'T12:00:00Z') - new Date('2026-09-23T12:00:00Z')) / 86400000) + 1)}</td></tr>
</table></td></tr></table></body></html>`;
const text = `FLIGHT DECK · ${dateLine}\n${edTitle}\n\n${intro}\n\nQUICK TAKES\nYesterday: ${yesterday.replace(/<[^>]+>/g, '')}\nPosition: ${at} · ${city}\nThis week: started ${wk.daysStarted} of ${wk.schoolDaysSoFar}\n${near[0] ? `Next test: ${near[0].title} in ${near[0].daysLeft}d\n` : ''}\nTODAY\n` + plan.blocks.map(b => { const f = legByStart[b.start]; return `${b.start}–${b.end}  ${b.title}${f ? `  ✈ ${f.from}→${f.to} ${f.minutes}m` : ''}` + (b.kind === 'fixed' ? '' : '\n' + b.steps.map(s => `   ○ ${s}`).join('\n')); }).join('\n') + (near.length ? `\n\nRAMPS\n` + near.map(c => `${c.title} · ${c.daysLeft}d · ${(c.task || '').replace(/^\S+ (ramp|report) -\d+: /, '')}`).join('\n') : '') + (stanford.length ? `\n\nSTANFORD\n` + stanford.map(m => `${m.date}  ${m.title}`).join('\n') : '') + `\n\nTONIGHT: hard stop 21:15 · report · lights out ${state.sleep.lightsOut}\n${APP_URL}\n`;
fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, `brief-${day}.html`), html); fs.writeFileSync(path.join(outDir, `brief-${day}.txt`), text);
console.log(JSON.stringify({ day, subject, html: path.join(outDir, `brief-${day}.html`), text: path.join(outDir, `brief-${day}.txt`) }));
