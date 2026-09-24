// scripts/brief.js — the Morning Briefing, in the language of a daily newsletter. Builds HTML + text for a date.
// Usage: node scripts/brief.js [YYYY-MM-DD] [--out dir]  → brief-<date>.html/.txt; prints JSON {day, subject, html, text}
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const P = require(path.join(ROOT, 'src/plan.js')), F = require(path.join(ROOT, 'src/flights.js'));
const state = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/state.json'), 'utf8'));
const args = process.argv.slice(2); const day = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Intl.DateTimeFormat('en-CA', { timeZone: state.tz }).format(new Date());
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(ROOT, 'app/out');
const APP_URL = 'https://eduardodelabanderakato-collab.github.io/ib45/'; const SITE = 'https://eduardodelabanderakato-collab.github.io/ib45';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plan = P.planFor(state, day); const t = state.tour || {}; const at = t.at || state.currentAirport || 'HND'; const city = F.BY[at] ? F.BY[at].c : at;
const flyable = plan.blocks.filter(b => ['sprint', 'retrieval'].includes(b.kind)); const it = F.itinerary(at, flyable); const legByStart = Object.fromEntries(it.legs.map(l => [l.start, l.flight]));
const yday = P.addDays(day, -1); const y = (state.log || []).find(r => r.date === yday);
const cds = plan.countdowns.filter(c => c.type !== 'checkpoint'); const near = cds.filter(c => c.daysLeft <= 14); const cps = plan.countdowns.filter(c => c.type === 'checkpoint').slice(0, 1);
const stanfordAll = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/seed/stanford.json'), 'utf8')).milestones; const stanford = stanfordAll.filter(m => m.date >= day && P.addDays(day, 7) >= m.date).slice(0, 3);
let IMG = {}; try { IMG = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/images.json'), 'utf8')); } catch (e) {}
let NEWS = { ai: null, economist: [] }; try { NEWS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/news.json'), 'utf8')); } catch (e) {}
let BR = { reading: {}, tests: {} }; try { BR = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/briefs.json'), 'utf8')); } catch (e) {}
const nextBrief = (BR.reading.eng || []).find(b => b.by >= day && b.by <= P.addDays(day, 1)); const portBrief = (BR.reading.port || []).find(b => b.by >= day);
const focus = state.focus && state.focus.until >= day ? state.focus.text : null;
const FACE = { phys: ['Isaac Newton', 'Newton, who wrote the rules you are being tested on'], chem: ['Dmitri Mendeleev', 'Mendeleev, who put the table in order'], math: ['Leonhard Euler', 'Euler, who did more math than anyone'], econ: ['Adam Smith', 'Adam Smith, before the diagrams'], eng: ['Marjane Satrapi', 'Marjane Satrapi, author of Persepolis'], port: ['Machado de Assis', 'Machado de Assis, who knew a lot about irony'] };
const LINKS = { phys: ['Kognity · A.2', 'https://app.kognity.com/'], chem: ['Kognity · Structure 1', 'https://app.kognity.com/'], math: ['Nikolaidis · Trigonometry notes', 'https://www.christosnikolaidis.com/en/'], econ: ['EconplusDal · PED', 'https://www.youtube.com/@EconplusDal/search?query=price%20elasticity%20of%20demand'], eng: ['Persepolis · quote bank rules', APP_URL + '#subjects'], port: ['Critérios A–D · Prova 1', APP_URL + '#subjects'], sat: ['Bluebook', 'https://bluebook.app.collegeboard.org/'] };
const link = (id) => LINKS[id] ? `<a href="${LINKS[id][1]}" style="color:#0b7fb0;text-decoration:underline;font-weight:700">${esc(LINKS[id][0])}</a>` : '';
const tomorrowISO = P.addDays(day, 1); const tPlan = P.planFor(state, tomorrowISO); const tFirst = tPlan.blocks.find(b => ['sprint', 'retrieval'].includes(b.kind));
const NOTES = [
  () => `${wk.daysStarted ? `You started ${wk.daysStarted} of ${wk.schoolDaysSoFar} days this week.` : `Nothing flown yet this week.`} ${nFlights ? `Today has ${nFlights} leg${nFlights === 1 ? '' : 's'}; the first one is the whole battle.` : `No legs today; rest is part of the plan.`}`,
  () => near[0] ? `${near[0].subjectShort} is ${near[0].daysLeft === 0 ? 'today' : `${near[0].daysLeft} day${near[0].daysLeft === 1 ? '' : 's'} out`}. Ramp day ${near[0].rampDay}: ${near[0].daysLeft <= 1 ? 'nothing new, only what is already yours.' : 'close the weak topics, nothing else.'}` : `Nothing due inside two weeks. This is where the lead is built.`,
  () => `${(t.kmTotal || 0).toLocaleString('en-US')} km flown so far, ${reaDays} days to Stanford. Every block is a leg; the map only moves when you fly.`
]; 
const reaDays = Math.round((new Date('2027-11-01T12:00:00Z') - new Date(day + 'T12:00:00Z')) / 86400000);

const photo = (name, cap) => { const im = IMG[name]; if (!im) return ''; const src = im.slug ? `${SITE}/photos/${im.slug}.jpg` : im.url; return im ? `<img src="${src}" data-fallback="${im.url}" width="564" alt="${esc(name)}" style="width:100%;height:auto;max-height:320px;object-fit:cover;border-radius:10px;display:block"><div style="text-align:center;font-size:12px;color:#6B6B6B;margin:6px 0 16px">(${esc(cap || name)} · Image: ${esc(im.credit)})</div>` : ''; };
const wk = plan.rates; const minutesToday = it.legs.reduce((a, l) => a + (l.flight ? l.flight.minutes : 0), 0); const nFlights = it.legs.filter(l => l.flight).length;
const DOW = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']; const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const d0 = new Date(day + 'T12:00:00Z'); const dateLine = `${DOW[d0.getUTCDay()]}, ${d0.getUTCDate()} ${MONTHS[d0.getUTCMonth()]} ${d0.getUTCFullYear()}`;
const testTomorrow = cds.find(c => c.daysLeft === 1), testToday = cds.find(c => c.daysLeft === 0);
const edTitle = testToday ? 'test day' : testTomorrow ? 'the day before' : near.length ? 'on the ramp' : nFlights >= 3 ? 'a full itinerary' : 'one more leg';
const intro = [`good morning.`, plan.dayType ? `it's day ${plan.dayType}.` : `no school today.`,
  nFlights ? `${['no', 'one', 'two', 'three', 'four', 'five'][nFlights] || nFlights} flight${nFlights === 1 ? '' : 's'}, ${minutesToday} minutes in the air, first wheels up at ${flyable[0].start}.` : `no flights scheduled.`,
  testToday ? `${testToday.title.toLowerCase()} is today. you did the work; the plan for today is light.` : testTomorrow ? `${testTomorrow.title.toLowerCase()} is tomorrow: nothing new today, only what's already yours.` : near[0] ? `${near[0].subjectShort.toLowerCase()} is ${near[0].daysLeft} days out and you're on ramp day ${near[0].rampDay}.` : `nothing is due within two weeks. this is when the lead is built.`,
  `that's the whole job.`].join(' ');
const priorities = (() => { const P_ = [];
  for (const c of near.filter(c => c.daysLeft <= 3)) P_.push(`<b>${esc(c.subjectShort)}</b> · ${c.daysLeft === 0 ? 'test today' : c.daysLeft === 1 ? 'test tomorrow' : `test in ${c.daysLeft} days`}: ${esc((c.task || '').replace(/^\S+ (ramp|report) -\d+: /, '')) || 'ramp'}`);
  if (flyable[0]) P_.push(`<b>${flyable[0].start}</b> · ${esc(flyable[0].title)}: ${esc(flyable[0].steps[0] || '')}`);
  for (const c of near.filter(c => c.daysLeft > 3 && c.daysLeft <= 14 && c.task)) P_.push(`<b>${esc(c.subjectShort)}</b> · ${c.daysLeft} days out: ${esc((c.task || '').replace(/^\S+ (ramp|report) -\d+: /, ''))}`);
  if (cps[0]) P_.push(`<b>Reading</b> · ${esc(cps[0].title)} ${cps[0].daysLeft === 0 ? 'today' : 'in ' + cps[0].daysLeft + ' days'}`);
  for (const m of stanford.filter(m => P.addDays(day, 7) >= m.date)) P_.push(`<b>Stanford</b> · ${esc(m.title)} · ${P.pretty(m.date)}`);
  return P_.slice(0, 3); })();
const subject = `${edTitle} · ${plan.pretty}${flyable[0] ? ` · ${flyable[0].start} ${flyable[0].title}` : ''}${near[0] ? ` · ${near[0].subjectShort} in ${near[0].daysLeft}d` : ''}`;
const yesterday = y ? (y.started ? `<b>Started ✓</b> · ${y.sprintsDone}/${y.sprintsPlanned} blocks flown · ${y.focusMinutes || 0} min in the air · landed in ${esc(y.currentAirport || at)}` : `<b>Not started ✗</b> · no flights logged`) : `no audit for ${P.pretty(yday)}`;

// ---------- newsletter HTML (Gmail-safe: tables, solid colors, system fonts) ----------
const C = { ink: '#0e1a33', body: '#2b3446', dim: '#6f7a90', line: '#dfe7f2', bg: '#eef2f8', card: '#ffffff', acc: '#0a7fb5', hi: '#d9f1ff', warm: '#0a7fb5', box: '#eef7fd', navy: '#061633', navy2: '#0d2350', cyan: '#5fd4ff', mist: '#9fb3d1' };
const font = `font-family:Helvetica Neue,Helvetica,Arial,sans-serif`;
const legs = it.legs.filter(l => l.flight);
const flightPlan = legs.length ? `<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:8px"><tr style="background:${C.box}"><td style="padding:8px 12px;${font};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.dim}">Depart</td><td style="padding:8px 12px;${font};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.dim}">Route</td><td style="padding:8px 12px;${font};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.dim}">Set in Focus Flight</td></tr>${legs.map(l => `<tr><td style="padding:10px 12px;${font};font-size:15px;font-weight:700;color:${C.ink};border-top:1px solid ${C.line}">${l.start}</td><td style="padding:10px 12px;${font};font-size:15px;color:${C.body};border-top:1px solid ${C.line}"><b>${l.flight.from} → ${l.flight.to}</b> · ${esc(l.flight.city)}</td><td style="padding:10px 12px;${font};font-size:15px;color:${C.body};border-top:1px solid ${C.line}">${l.flight.minutes} min · ${esc(l.title)}</td></tr>`).join('')}</table></td></tr>` : '';
const destCities = [...new Set(legs.map(l => l.flight.city))].filter(cn => IMG[cn]).slice(0, 3);
const photoStrip = destCities.length ? `<tr><td style="padding:0 0 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${destCities.map(cn => { const im = IMG[cn]; const src = im.slug ? `${SITE}/photos/${im.slug}.jpg` : im.url; return `<td width="${Math.floor(100 / destCities.length)}%" style="padding:0 4px"><img src="${src}" data-fallback="${im.url}" alt="${esc(cn)}" width="180" style="display:block;width:100%;height:120px;object-fit:cover;border-radius:8px;border:0"></td>`; }).join('')}</tr><tr>${destCities.map(cn => `<td align="center" style="padding:4px 4px 0;${font};font-size:12px;color:${C.dim}">${esc(cn)}</td>`).join('')}</tr></table></td></tr><tr><td align="center" style="padding:0 0 16px;${font};font-size:12px;color:${C.dim}">(Where you land today · Images: Wikimedia Commons)</td></tr>` : '';
const leisure = (state.leisure || []).find(b => !b.done);
const dots = `<tr><td align="center" style="padding:26px 0 22px;color:${C.warm};font-size:18px;letter-spacing:8px;${font}">····</td></tr>`;
const label = t => `<tr><td style="padding:0 0 10px;${font};font-size:14px;font-weight:800;letter-spacing:1.5px;color:${C.warm};text-transform:uppercase">${esc(t)}</td></tr>`;
const H = t => `<tr><td style="padding:0 0 14px;${font};font-size:32px;font-weight:800;line-height:1.12;letter-spacing:-.5px;color:${C.ink}">${esc(t)}</td></tr>`;
const P_ = html => `<tr><td style="padding:0 0 16px;${font};font-size:18px;line-height:1.6;color:${C.body}">${html}</td></tr>`;
const hi = t => `<span style="background:${C.hi};padding:2px 7px;font-weight:800;color:${C.ink};border-radius:3px">${esc(t)}</span>`;
const box = html => `<tr><td style="padding:0 0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${C.box};border-left:4px solid ${C.warm};padding:14px 16px;${font};font-size:17px;line-height:1.55;color:${C.body};border-radius:0 10px 10px 0">${html}</td></tr></table></td></tr>`;
const thumb = (name, html, size) => { const im = IMG[name]; const src = im ? (im.slug ? `${SITE}/photos/${im.slug}.jpg` : im.url) : null; return `<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${src ? `<td width="${size || 84}" valign="top" style="padding:0 14px 0 0"><img src="${src}"${im ? ` data-fallback="${im.url}"` : ''} width="${size || 84}" height="${size || 84}" alt="${esc(name)}" style="display:block;width:${size || 84}px;height:${size || 84}px;object-fit:cover;border-radius:12px;border:0"></td>` : ''}<td valign="top" style="${font};font-size:17px;line-height:1.5;color:${C.body}">${html}</td></tr></table></td></tr>`; };
const navyCard = (html, withHolo) => `<tr><td style="padding:0 0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.navy}" style="background:${C.navy};border-radius:14px"><tr><td style="padding:18px 18px 18px 20px;${font};font-size:17px;line-height:1.55;color:#ffffff">${html}</td>${withHolo ? `<td width="64" valign="bottom" style="padding:6px 10px 0 0"><img src="${SITE}/hologram-figure.png" width="54" alt="" style="display:block;width:54px;height:auto;border:0"></td>` : ''}</tr></table></td></tr>`;
const img = (src, alt, cap, fb) => `<tr><td style="padding:4px 0 6px"><img src="${src}"${fb ? ` data-fallback="${fb}"` : ''} width="100%" alt="${esc(alt)}" style="display:block;width:100%;height:auto;border:0;border-radius:12px"></td></tr>${cap ? `<tr><td align="center" style="padding:0 0 18px;${font};font-size:12px;color:${C.dim}">(${esc(cap)})</td></tr>` : ''}`;
const photoRow = (name, cap) => { const im = IMG[name]; if (!im) return ''; const src = im.slug ? `${SITE}/photos/${im.slug}.jpg` : im.url; return img(src, name, `${cap || name} · Image: ${im.credit}`, im.url); };
const emojiFor = b => b.kind === 'lab' ? '🧪' : b.kind === 'tutor' ? '🎓' : b.kind === 'retrieval' ? '🌙' : b.slot === 'S1' ? '📖' : b.subject === 'port' ? '🇧🇷' : b.subject === 'eng' ? '📚' : b.subject === 'math' ? '📐' : b.subject === 'phys' ? '⚛️' : b.subject === 'chem' ? '⚗️' : b.subject === 'econ' ? '📈' : '✈️';
const blockRows = b => { const f = legByStart[b.start]; if (b.kind === 'fixed') return P_(`<span style="color:${C.dim}">${b.start}–${b.end} · ${esc(b.title)}</span>`);
  return P_(`<b style="color:${C.ink}">${emojiFor(b)} ${b.start} · ${esc(b.title)}</b>${f ? ` <span style="color:${C.dim}">— ${esc(f.city)} in ${f.minutes} minutes</span>` : ''}<br>${b.steps.map(st => `&nbsp;&nbsp;○ ${esc(st)}`).join('<br>')}`); };
const wd = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d0.getUTCDay()];
const editionNo = Math.max(1, Math.round((new Date(day + 'T12:00:00Z') - new Date('2026-09-23T12:00:00Z')) / 86400000) + 1);
const nextDest = F.BY[it.endsAt] ? F.BY[it.endsAt].c : null;
const sectionsList = [['✈️', `${nFlights ? `${nFlights} flight${nFlights === 1 ? '' : 's'}, ${minutesToday} min in the air` : 'No flights today'} — the itinerary`], ...near.slice(0, 2).map(c => ['🧪', `${c.subjectShort} ramp day ${c.rampDay}: ${(c.task || '').replace(/^\S+ (ramp|report) -\d+: /, '')}`]), ...(cps.length ? [['📚', `${cps[0].title} · ${cps[0].daysLeft === 0 ? 'today' : cps[0].daysLeft + ' days'}`]] : []), ...(stanford[0] ? [['🌲', `Stanford: ${stanford[0].title} · ${P.pretty(stanford[0].date)}`]] : []), ['🌙', `Tonight: hard stop 21:15, report, lights out ${state.sleep.lightsOut}`]];
const captainNote = NOTES[editionNo % NOTES.length]();
let readMin = 2;
let html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.card}">
<tr><td style="padding:0"><img src="${SITE}/banner.gif?d=${day}" width="100%" alt="Life" style="display:block;width:100%;height:auto;border:0"></td></tr>
<tr><td bgcolor="${C.navy}" style="background:${C.navy};padding:6px 18px 22px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:0 0 14px;${font};font-size:12px;letter-spacing:2px;color:${C.mist};text-transform:uppercase;line-height:1.5">${esc(wd)}, ${d0.getUTCDate()} ${MONTHS[d0.getUTCMonth()].charAt(0) + MONTHS[d0.getUTCMonth()].slice(1).toLowerCase()} ${d0.getUTCFullYear()} &nbsp;•&nbsp; reading time: ${readMin} minute${readMin === 1 ? '' : 's'}</td></tr>
<tr><td align="center" style="padding:0 0 16px;${font};font-size:36px;font-weight:800;color:#ffffff;letter-spacing:-.8px;line-height:1.1">${esc(edTitle)}</td></tr>
<tr><td style="padding:0 0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #1d3562;border-bottom:1px solid #1d3562"><tr>
${[[`${wk.daysStarted}/${wk.schoolDaysSoFar}`, 'started this week'], [`${(t.kmTotal || 0).toLocaleString('en-US')}`, 'km flown'], [near[0] ? `${near[0].daysLeft}d` : '—', near[0] ? esc(near[0].subjectShort) + ' test' : 'no test'], [`${reaDays}d`, 'to Stanford REA']].map(([v, l]) => `<td align="center" style="padding:12px 2px;${font}"><div style="font-size:20px;font-weight:800;color:${C.cyan}">${v}</div><div style="font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:${C.mist}">${l}</div></td>`).join('')}
</tr></table></td></tr>
<tr><td style="padding:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.navy2}" style="background:${C.navy2};border-radius:14px"><tr><td width="56" valign="top" style="padding:16px 0 16px 16px"><img src="${SITE}/avatar.png" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:28px;border:2px solid ${C.cyan}"></td><td valign="top" style="padding:16px 18px 16px 14px;${font};font-size:17px;line-height:1.55;color:#ffffff"><span style="color:${C.cyan};font-weight:800">Captain's note.</span> ${esc(captainNote)}</td></tr></table></td></tr>
</table></td></tr>
<tr><td style="padding:22px 18px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${focus ? P_(`<b>Focus of the week:</b> ${esc(focus.replace(/^This week's focus: /, ''))}`) : ''}
${dots}
${label('priorities')}
${priorities.map((x, i) => P_(`${hi(String(i + 1) + '.')} &nbsp;${x}`)).join('')}
${dots}
${label('today')}
${H(nFlights ? `${['No', 'One', 'Two', 'Three', 'Four', 'Five'][nFlights] || nFlights} flight${nFlights === 1 ? '' : 's'}, ${minutesToday} minutes in the air${nextDest ? `, landing in ${nextDest}` : ''}` : 'A day on the ground')}
${nextDest ? photoRow(nextDest, `Tonight you land in ${nextDest}`) : ''}
${P_(`<b>Why it matters.</b> ${near[0] && near[0].daysLeft <= 3 ? `${esc(near[0].subjectShort)} is ${near[0].daysLeft === 0 ? 'today' : near[0].daysLeft === 1 ? 'tomorrow' : 'in ' + near[0].daysLeft + ' days'}. Today is the last edit.` : `Today's pre-learning turns tomorrow's classes into a review.`}${state.studyGuides ? ' First five minutes: the study guide in Drive.' : ''}`)}
${flightPlan}
${legs.length ? `<tr><td style="padding:0 0 16px"><img src="${SITE}/map.png?d=${day}" width="100%" alt="Today's route" style="display:block;width:100%;height:auto;border:0;border-radius:12px"></td></tr>` : ''}
${P_(`${y ? (y.started ? `Yesterday: <b>${y.sprintsDone} of ${y.sprintsPlanned}</b> blocks, ${y.focusMinutes || 0} min in the air.` : `Yesterday: no flights logged.`) : `No audit yet for ${P.pretty(yday)}.`} You're in <b>${esc(city)}</b>.`)}
${plan.blocks.map(blockRows).join('')}
${near.length ? dots + label('ramps') + H(near.length === 1 ? `${near[0].subjectShort}: day ${near[0].rampDay} of the ramp` : `${near.length} tests inside the 14-day window`) + near.map(c => { const tb = BR.tests[c.id]; const face = FACE[c.subject]; return (face && c.daysLeft <= 3 ? photoRow(face[0], face[1]) : '') + P_(`<b>${esc(c.title)}</b> · ${c.daysLeft === 0 ? 'today' : c.daysLeft === 1 ? 'tomorrow' : `in ${c.daysLeft} days`}${c.task ? `<br>${esc(c.task.replace(/^\S+ (ramp|report) -\d+: /, ''))}` : ''}`) + (tb && c.daysLeft <= 3 ? box(`<b>What to expect:</b> ${esc(tb.expect)}<br><b>Traps:</b> ${esc(tb.traps)}<br><b>Do:</b> ${esc(tb.do)}`) : ''); }).join('') : ''}
${cds.length > near.length ? dots + label('coming up') + `<tr><td style="padding:0 0 14px;${font};font-size:14px;line-height:2.1">` + cds.slice(0, 6).map(c => `<span style="display:inline-block;border:1px solid ${C.line};border-radius:14px;padding:2px 10px;margin:0 6px 4px 0;color:${C.body};white-space:nowrap"><b style="color:${c.daysLeft <= 3 ? '#c0392b' : C.ink}">${c.daysLeft}d</b> ${esc(c.subjectShort || c.title.split(' ')[0])}</span>`).join('') + `</td></tr>` : ''}
${stanford.length ? dots + label('stanford · this week') + thumb('Stanford', stanford.map(m => `<b>${P.pretty(m.date)}</b> &nbsp;${esc(m.title)}`).join('<br>')) : ''}
${nextBrief ? dots + label('reading · persepolis') + H(`Chapters ${nextBrief.chapters} by ${P.pretty(nextBrief.by)}`) + photoRow('Marjane Satrapi', 'Marjane Satrapi, author of Persepolis') + P_(`<b>${esc(nextBrief.titles)}</b>`) + P_(`<b>What to expect.</b> ${esc(nextBrief.expect)}`) + P_(`<b>Watch for.</b> ${esc(nextBrief.watch)}`) + P_(`<b>Two questions to read with.</b> ${esc(nextBrief.questions)}`) + box(`<b>Global issues to tag:</b> ${esc(nextBrief.globalIssues)}<br><b>Quotes to look for:</b> ${esc(nextBrief.quotes)}`) : ''}
${portBrief && near.find(c => c.subject === 'port') ? dots + label('português · prova 1') + H(portBrief.titles) + P_(`<b>O que esperar.</b> ${esc(portBrief.expect)}`) + P_(`<b>Observar.</b> ${esc(portBrief.watch)}`) + box(`${esc(portBrief.quotes)}`) : ''}
${NEWS.ai || (NEWS.economist && NEWS.economist.length) ? dots + label('two headlines') + thumb('Artificial intelligence', [NEWS.ai ? `🤖 <a href="${NEWS.ai.url}" style="color:${C.ink};text-decoration:none;font-weight:700">${esc(NEWS.ai.title)}</a> <span style="color:${C.dim};font-size:14px">· ${esc(NEWS.ai.source)}</span>` : '', NEWS.economist && NEWS.economist[0] ? `📈 <a href="${NEWS.economist[0].url}" style="color:${C.ink};text-decoration:none;font-weight:700">${esc(NEWS.economist[0].title)}</a> <span style="color:${C.dim};font-size:14px">· The Economist, one example card for Paper 1</span>` : ''].filter(Boolean).join('<br>')) : ''}
${dots}
${label('read tonight')}
${P_(`📚 <b>School:</b> ${P.readingTonight(state, day) ? esc(P.readingTonight(state, day).replace('Read tonight: ', '')) : 'nothing due'}${leisure ? `<br>🌙 <b>Before bed, if the night allows:</b> ${esc(leisure.title)}${leisure.author ? ' · ' + esc(leisure.author) : ''} · ~${leisure.pages || 20} pages` : ''}`)}
${leisure && leisure.author && IMG[leisure.author] ? photoRow(leisure.author, `${leisure.author}, ${leisure.title}`) : ''}
${dots}
${label('tonight')}
${navyCard(`<b style="color:${C.cyan}">21:15</b> hard stop. Report in Life or the chat: blocks flown, errors added and closed, one line on what the plan got wrong. <b style="color:${C.cyan}">${esc(state.sleep.lightsOut)}</b> lights out.`, true)}
${tFirst ? box(`<b>Tomorrow's first flight.</b> ${tFirst.start} · ${esc(tFirst.title)} — ${esc(tFirst.steps[0] || '')}`) : ''}
<tr><td align="center" style="padding:8px 0 28px"><a href="${APP_URL}" style="display:inline-block;background:${C.navy};color:${C.cyan};border-radius:10px;text-decoration:none;${font};font-weight:700;font-size:15px;padding:13px 24px">Open Life</a></td></tr>
</table></td></tr>
<tr><td bgcolor="${C.navy}" style="background:${C.navy};padding:22px 18px 34px;${font};font-size:13px;line-height:1.6;color:${C.mist};text-align:center">Life · edition ${editionNo} · sent every morning at 06:45 from your own plan.<br>Tests, holidays, changes: tell Claude in the IB45 chat.</td></tr>
</table></td></tr></table></body></html>`;
{ const words = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length; readMin = Math.max(1, Math.round(words / 230)); html = html.replace(/reading time: \d+ minutes?/, `reading time: ${readMin} minute${readMin === 1 ? '' : 's'}`); }
const text = `LIFE · ${dateLine}\n${edTitle}\n\n${intro}\n\nQUICK TAKES\nYesterday: ${yesterday.replace(/<[^>]+>/g, '')}\nPosition: ${at} · ${city}\nThis week: started ${wk.daysStarted} of ${wk.schoolDaysSoFar}\n${near[0] ? `Next test: ${near[0].title} in ${near[0].daysLeft}d\n` : ''}\nTODAY\n` + plan.blocks.map(b => { const f = legByStart[b.start]; return `${b.start}–${b.end}  ${b.title}${f ? `  ✈ ${f.from}→${f.to} ${f.minutes}m` : ''}` + (b.kind === 'fixed' ? '' : '\n' + b.steps.map(s => `   ○ ${s}`).join('\n')); }).join('\n') + (near.length ? `\n\nRAMPS\n` + near.map(c => `${c.title} · ${c.daysLeft}d · ${(c.task || '').replace(/^\S+ (ramp|report) -\d+: /, '')}`).join('\n') : '') + (stanford.length ? `\n\nSTANFORD\n` + stanford.map(m => `${m.date}  ${m.title}`).join('\n') : '') + `\n\nTONIGHT: hard stop 21:15 · report · lights out ${state.sleep.lightsOut}\n${APP_URL}\n`;
fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, `brief-${day}.html`), html); fs.writeFileSync(path.join(outDir, `brief-${day}.txt`), text);
console.log(JSON.stringify({ day, subject, html: path.join(outDir, `brief-${day}.html`), text: path.join(outDir, `brief-${day}.txt`) }));
