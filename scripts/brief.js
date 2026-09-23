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
let BR = { reading: {}, tests: {} }; try { BR = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/briefs.json'), 'utf8')); } catch (e) {}
const nextBrief = (BR.reading.eng || []).find(b => b.by >= day); const portBrief = (BR.reading.port || []).find(b => b.by >= day);
const focus = state.focus && state.focus.until >= day ? state.focus.text : null;
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
  return P_.slice(0, 5); })();
const subject = `${edTitle} · ${plan.pretty}${flyable[0] ? ` · ${flyable[0].start} ${flyable[0].title}` : ''}${near[0] ? ` · ${near[0].subjectShort} in ${near[0].daysLeft}d` : ''}`;
const yesterday = y ? (y.started ? `<b>Started ✓</b> · ${y.sprintsDone}/${y.sprintsPlanned} blocks flown · ${y.focusMinutes || 0} min in the air · landed in ${esc(y.currentAirport || at)}` : `<b>Not started ✗</b> · no flights logged`) : `no audit for ${P.pretty(yday)}`;

// ---------- newsletter HTML (Gmail-safe: tables, solid colors, system fonts) ----------
const C = { ink: '#1a1a1a', body: '#333333', dim: '#777777', line: '#e6e6e6', bg: '#f4f4f4', card: '#ffffff', acc: '#0b5fff', hi: '#ffe58f', warm: '#f59e0b', box: '#fff8e1', navy: '#061633' };
const font = `font-family:Helvetica Neue,Helvetica,Arial,sans-serif`;
const dots = `<tr><td align="center" style="padding:22px 0 18px;color:${C.warm};font-size:16px;letter-spacing:8px;${font}">····</td></tr>`;
const label = t => `<tr><td style="padding:0 0 8px;${font};font-size:12px;font-weight:700;letter-spacing:2px;color:${C.acc};text-transform:uppercase">${esc(t)}</td></tr>`;
const H = t => `<tr><td style="padding:0 0 12px;${font};font-size:24px;font-weight:800;line-height:1.2;color:${C.ink}">${esc(t)}</td></tr>`;
const P_ = html => `<tr><td style="padding:0 0 14px;${font};font-size:16px;line-height:1.6;color:${C.body}">${html}</td></tr>`;
const hi = t => `<span style="background:${C.hi};padding:2px 6px;font-weight:700;color:${C.ink}">${esc(t)}</span>`;
const box = html => `<tr><td style="padding:0 0 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${C.box};border-left:4px solid ${C.warm};padding:12px 16px;${font};font-size:15px;line-height:1.55;color:${C.body}">${html}</td></tr></table></td></tr>`;
const img = (src, alt, cap, fb) => `<tr><td style="padding:4px 0 6px"><img src="${src}"${fb ? ` data-fallback="${fb}"` : ''} width="560" alt="${esc(alt)}" style="display:block;width:100%;max-width:560px;height:auto;border:0"></td></tr>${cap ? `<tr><td align="center" style="padding:0 0 18px;${font};font-size:12px;color:${C.dim}">(${esc(cap)})</td></tr>` : ''}`;
const photoRow = (name, cap) => { const im = IMG[name]; if (!im) return ''; const src = im.slug ? `${SITE}/photos/${im.slug}.jpg` : im.url; return img(src, name, `${cap || name} · Image: ${im.credit}`, im.url); };
const emojiFor = b => b.kind === 'lab' ? '🧪' : b.kind === 'tutor' ? '🎓' : b.kind === 'retrieval' ? '🌙' : b.slot === 'S1' ? '📖' : b.subject === 'port' ? '🇧🇷' : b.subject === 'eng' ? '📚' : b.subject === 'math' ? '📐' : b.subject === 'phys' ? '⚛️' : b.subject === 'chem' ? '⚗️' : b.subject === 'econ' ? '📈' : '✈️';
const blockRows = b => { const f = legByStart[b.start]; if (b.kind === 'fixed') return P_(`<span style="color:${C.dim}">${b.start}–${b.end} · ${esc(b.title)}</span>`);
  return P_(`<b style="color:${C.ink}">${emojiFor(b)} ${b.start} · ${esc(b.title)}</b>${f ? ` <span style="color:${C.dim}">— ${esc(f.city)} in ${f.minutes} minutes</span>` : ''}<br>${b.steps.map(st => `&nbsp;&nbsp;○ ${esc(st)}`).join('<br>')}`); };
const wd = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d0.getUTCDay()];
const editionNo = Math.max(1, Math.round((new Date(day + 'T12:00:00Z') - new Date('2026-09-23T12:00:00Z')) / 86400000) + 1);
const nextDest = F.BY[it.endsAt] ? F.BY[it.endsAt].c : null;
const sectionsList = [['✈️', `${nFlights ? `${nFlights} flight${nFlights === 1 ? '' : 's'}, ${minutesToday} min in the air` : 'No flights today'} — the itinerary`], ...near.slice(0, 2).map(c => ['🧪', `${c.subjectShort} ramp day ${c.rampDay}: ${(c.task || '').replace(/^\S+ (ramp|report) -\d+: /, '')}`]), ...(cps.length ? [['📚', `${cps[0].title} · ${cps[0].daysLeft === 0 ? 'today' : cps[0].daysLeft + ' days'}`]] : []), ...(stanford[0] ? [['🌲', `Stanford: ${stanford[0].title} · ${P.pretty(stanford[0].date)}`]] : []), ['🌙', `Tonight: hard stop 21:15, report, lights out ${state.sleep.lightsOut}`]];
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:${C.card}">
<tr><td style="padding:0"><img src="${SITE}/banner.png?d=${day}" width="600" alt="Life" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>
<tr><td style="padding:22px 20px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:0 0 16px;${font};font-size:12px;letter-spacing:2px;color:${C.dim};text-transform:uppercase">${esc(wd)}, ${d0.getUTCDate()} ${MONTHS[d0.getUTCMonth()].charAt(0) + MONTHS[d0.getUTCMonth()].slice(1).toLowerCase()} ${d0.getUTCFullYear()} &nbsp;•&nbsp; reading time: 2 minutes</td></tr>
<tr><td align="center" style="padding:0 0 12px;${font};font-size:28px;font-weight:800;color:${C.ink};letter-spacing:-.5px">${esc(edTitle)}</td></tr>
${P_(esc(intro))}
${focus ? box(`<b>Focus of the week.</b> ${esc(focus)}`) : ''}
${dots}
${label('priorities')}
${priorities.map((x, i) => P_(`${hi(String(i + 1) + '.')} &nbsp;${x}`)).join('')}
${dots}
${label("in today's edition")}
${P_(sectionsList.map(([e, tt]) => `${e} &nbsp;${esc(tt)}`).join('<br>'))}
${dots}
${label('today')}
${H(nFlights ? `${['No', 'One', 'Two', 'Three', 'Four', 'Five'][nFlights] || nFlights} flight${nFlights === 1 ? '' : 's'}, ${minutesToday} minutes in the air${nextDest ? `, landing in ${nextDest}` : ''}` : 'A day on the ground')}
${nextDest ? photoRow(nextDest, `Tonight you land in ${nextDest}`) : ''}
${P_(`${y ? (y.started ? `Yesterday you flew <b>${y.sprintsDone} of ${y.sprintsPlanned}</b> blocks, ${y.focusMinutes || 0} minutes in the air, and landed in ${esc(y.currentAirport || at)}.` : `Yesterday no flights were logged.`) : `No audit yet for ${P.pretty(yday)}.`} You're in <b>${esc(city)}</b>${t.kmTotal ? `, ${(t.kmTotal).toLocaleString('en-US')} km into the tour` : ''}. Started <b>${wk.daysStarted} of ${wk.schoolDaysSoFar}</b> school days this week.`)}
${plan.blocks.map(blockRows).join('')}
${box(`<b>Under the hood…</b> the audit reads your Focus Flight log at 21:20. Only flights count. A block with no flight is a missed block.`)}
${near.length ? dots + label('ramps') + H(near.length === 1 ? `${near[0].subjectShort}: day ${near[0].rampDay} of the ramp` : `${near.length} tests inside the 14-day window`) + near.map(c => { const tb = BR.tests[c.id]; return P_(`<b>${esc(c.title)}</b> · ${c.daysLeft === 0 ? 'today' : c.daysLeft === 1 ? 'tomorrow' : `in ${c.daysLeft} days`}${c.task ? `<br>${esc(c.task.replace(/^\S+ (ramp|report) -\d+: /, ''))}` : ''}`) + (tb ? box(`<b>What to expect:</b> ${esc(tb.expect)}<br><b>Traps:</b> ${esc(tb.traps)}<br><b>Do:</b> ${esc(tb.do)}`) : ''); }).join('') + box(`<b>Remembering:</b> a test announced two weeks out is a finishing sprint, not a learning sprint. The base keeps running underneath.`) : ''}
${cds.length > near.length ? dots + label('countdowns') + P_(cds.slice(0, 6).map(c => `<b style="color:${c.daysLeft <= 3 ? '#c0392b' : C.ink}">${c.daysLeft}d</b> &nbsp;${esc(c.title)}`).join('<br>')) : ''}
${stanford.length ? dots + label('stanford · class of 2032') + H(`${Math.round((new Date('2027-11-01T12:00:00Z') - new Date(day + 'T12:00:00Z')) / 86400000)} days to Restrictive Early Action`) + photoRow('Stanford', 'Main Quad, Stanford University') + P_(stanford.map(m => `<b>${m.date.slice(5)}</b> &nbsp;${esc(m.title)} <span style="color:${C.dim}">· ${esc(m.owner)}</span>`).join('<br>')) : ''}
${nextBrief ? dots + label('reading · persepolis') + H(`Chapters ${nextBrief.chapters} by ${P.pretty(nextBrief.by)}`) + photoRow('Marjane Satrapi', 'Marjane Satrapi, author of Persepolis') + P_(`<b>${esc(nextBrief.titles)}</b>`) + P_(`<b>What to expect.</b> ${esc(nextBrief.expect)}`) + P_(`<b>Watch for.</b> ${esc(nextBrief.watch)}`) + P_(`<b>Two questions to read with.</b> ${esc(nextBrief.questions)}`) + box(`<b>Global issues to tag:</b> ${esc(nextBrief.globalIssues)}<br><b>Quotes to look for:</b> ${esc(nextBrief.quotes)}`) : ''}
${portBrief && near.find(c => c.subject === 'port') ? dots + label('português · prova 1') + H(portBrief.titles) + P_(`<b>O que esperar.</b> ${esc(portBrief.expect)}`) + P_(`<b>Observar.</b> ${esc(portBrief.watch)}`) + box(`${esc(portBrief.quotes)}`) : ''}
${dots}
${label('tonight')}
${P_(`<b>21:15</b> hard stop. <b>Report</b> in Life or the chat: blocks flown, errors added and closed, retrieval, one line on what the plan got wrong. <b>${esc(state.sleep.lightsOut)}</b> lights out.`)}
<tr><td align="center" style="padding:8px 0 28px"><a href="${APP_URL}" style="display:inline-block;background:${C.navy};color:#ffffff;text-decoration:none;${font};font-weight:700;font-size:15px;padding:13px 24px">Open Life</a></td></tr>
</table></td></tr>
<tr><td style="background:${C.bg};padding:18px 20px;${font};font-size:12px;line-height:1.6;color:${C.dim};text-align:center">Life · edition ${editionNo} · sent every morning at 06:45 from your own plan.<br>Tests, holidays, changes: tell Claude in the IB45 chat.</td></tr>
</table></td></tr></table></body></html>`;
const text = `LIFE · ${dateLine}\n${edTitle}\n\n${intro}\n\nQUICK TAKES\nYesterday: ${yesterday.replace(/<[^>]+>/g, '')}\nPosition: ${at} · ${city}\nThis week: started ${wk.daysStarted} of ${wk.schoolDaysSoFar}\n${near[0] ? `Next test: ${near[0].title} in ${near[0].daysLeft}d\n` : ''}\nTODAY\n` + plan.blocks.map(b => { const f = legByStart[b.start]; return `${b.start}–${b.end}  ${b.title}${f ? `  ✈ ${f.from}→${f.to} ${f.minutes}m` : ''}` + (b.kind === 'fixed' ? '' : '\n' + b.steps.map(s => `   ○ ${s}`).join('\n')); }).join('\n') + (near.length ? `\n\nRAMPS\n` + near.map(c => `${c.title} · ${c.daysLeft}d · ${(c.task || '').replace(/^\S+ (ramp|report) -\d+: /, '')}`).join('\n') : '') + (stanford.length ? `\n\nSTANFORD\n` + stanford.map(m => `${m.date}  ${m.title}`).join('\n') : '') + `\n\nTONIGHT: hard stop 21:15 · report · lights out ${state.sleep.lightsOut}\n${APP_URL}\n`;
fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, `brief-${day}.html`), html); fs.writeFileSync(path.join(outDir, `brief-${day}.txt`), text);
console.log(JSON.stringify({ day, subject, html: path.join(outDir, `brief-${day}.html`), text: path.join(outDir, `brief-${day}.txt`) }));
