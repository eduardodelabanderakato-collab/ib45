// scripts/brief.js — the Morning Briefing. Builds HTML + text for a date from data/state.json (+ audit of yesterday).
// Usage: node scripts/brief.js [YYYY-MM-DD] [--out dir]  → writes brief-<date>.html and .txt; prints subject line.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const P = require(path.join(ROOT, 'src/plan.js')), F = require(path.join(ROOT, 'src/flights.js'));
const state = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/state.json'), 'utf8'));
const args = process.argv.slice(2); const day = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Intl.DateTimeFormat('en-CA', { timeZone: state.tz }).format(new Date());
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(ROOT, 'app/out');
const APP_URL = 'https://claude.ai/artifact/1yfwsi3bMVerDih52BtTSD';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plan = P.planFor(state, day); const at = state.currentAirport || 'HND';
const flyable = plan.blocks.filter(b => ['sprint', 'retrieval'].includes(b.kind)); const it = F.itinerary(at, flyable); const legByStart = Object.fromEntries(it.legs.map(l => [l.start, l.flight]));
const yday = P.addDays(day, -1); const y = (state.log || []).find(r => r.date === yday);
const cds = plan.countdowns.filter(c => c.type !== 'checkpoint').slice(0, 5);
const checkpoints = plan.countdowns.filter(c => c.type === 'checkpoint').slice(0, 1);
const stanford = JSON.parse(fs.readFileSync(path.join(ROOT, 'app/seed/stanford.json'), 'utf8')).milestones.filter(m => m.date >= day && P.addDays(day, 21) >= m.date).slice(0, 3);
const wk = plan.rates;
const greeting = plan.dayType ? `${plan.prettyLong} · Day ${plan.dayType}` : plan.prettyLong;
const firstFlight = flyable[0];
const subject = `${plan.pretty}: ${firstFlight ? `${firstFlight.start} ${firstFlight.title}` : 'free day'}${cds[0] ? ` · ${cds[0].title} in ${cds[0].daysLeft}d` : ''}`;

// ---------- HTML (inline styles; email-safe) ----------
const C = { ink: '#111418', dim: '#6B7280', line: '#E6E8EC', bg: '#F5F6F8', card: '#FFFFFF', acc: '#8C1515', ok: '#1F7A4D', warn: '#B4540A' };
const row = (label, html) => `<tr><td style="padding:0 0 6px;color:${C.dim};font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:600">${label}</td></tr><tr><td style="padding:0 0 22px">${html}</td></tr>`;
const block = (b, i) => { const f = legByStart[b.start]; const fixed = b.kind === 'fixed';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line}"><tr>
  <td style="padding:14px 0 14px;width:64px;vertical-align:top;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px;color:${fixed ? C.dim : C.ink}">${b.start}</td>
  <td style="padding:14px 0;vertical-align:top">
    <div style="font-size:${fixed ? 15 : 18}px;font-weight:${fixed ? 500 : 700};color:${fixed ? C.dim : C.ink};letter-spacing:-.01em">${esc(b.title)}${b.where ? ` <span style="font-weight:500;color:${C.dim}">· ${esc(b.where)}</span>` : ''}</div>
    ${f ? `<div style="margin-top:3px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:12px;color:${C.acc}">✈ ${f.from} → ${f.to} · ${esc(f.city)} · ${f.minutes} min</div>` : ''}
    ${fixed ? '' : `<div style="margin-top:8px">${b.steps.map(s => `<div style="font-size:14.5px;color:${C.ink};padding:3px 0"><span style="display:inline-block;width:14px;height:14px;border:1.5px solid #9AA1AB;border-radius:50%;vertical-align:-2px;margin-right:9px"></span>${esc(s)}</div>`).join('')}</div>`}
  </td><td style="padding:14px 0;vertical-align:top;text-align:right;color:${C.dim};font-size:12px;white-space:nowrap">${b.end}</td></tr></table>`; };
const chip = (n, t, urgent) => `<td style="padding:0 8px 8px 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${urgent ? C.acc : C.bg};color:${urgent ? '#fff' : C.ink};border-radius:10px;padding:8px 12px;font-size:13px;white-space:nowrap"><b style="font-size:16px">${n}</b> ${esc(t)}</td></tr></table></td>`;
const yesterday = y ? (y.started ? `<span style="color:${C.ok};font-weight:700">Started ✓</span> · ${y.sprintsDone}/${y.sprintsPlanned} blocks flown · ${y.focusMinutes || 0} min in the air · landed in ${esc(y.currentAirport || at)}` : `<span style="color:${C.acc};font-weight:700">Not started ✗</span> · no flights logged`) : `No audit for ${P.pretty(yday)}.`;
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head>
<body style="margin:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;color:${C.ink}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="padding:0 6px 14px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${C.dim};font-weight:600">Morning briefing · IB 45 · Class of 2032</td></tr>
<tr><td style="background:${C.card};border-radius:18px;padding:28px 28px 8px;border:1px solid ${C.line}">
  <div style="font-size:30px;font-weight:800;letter-spacing:-.03em;line-height:1.05">${esc(greeting)}</div>
  <div style="margin-top:6px;color:${C.dim};font-size:14px">${esc(plan.phase)} · you are in <span style="font-family:'SF Mono',Menlo,monospace">${esc(at)}</span>${F.BY[at] ? ' · ' + esc(F.BY[at].c) : ''} · started ${wk.daysStarted} of ${wk.schoolDaysSoFar} this week</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px">
  ${row('Yesterday', `<div style="font-size:14.5px">${yesterday}</div>`)}
  ${row('Today', plan.blocks.map(block).join('') + `<div style="border-top:1px solid ${C.line}"></div>`)}
  ${cds.length ? row('Countdowns', `<table role="presentation" cellpadding="0" cellspacing="0"><tr>${cds.map(c => chip(c.daysLeft === 0 ? 'Today' : c.daysLeft + 'd', c.title, c.daysLeft <= 3)).join('')}</tr></table>${cds.filter(c => c.task).slice(0, 2).map(c => `<div style="font-size:13px;color:${C.dim};margin-top:2px">${esc(c.subjectShort)} ramp: ${esc(c.task.replace(/^\S+ (ramp|report) -\d+: /, ''))}</div>`).join('')}`) : ''}
  ${checkpoints.length ? row('Reading', `<div style="font-size:14px">${esc(checkpoints[0].title)} · ${checkpoints[0].daysLeft === 0 ? 'today' : checkpoints[0].daysLeft + ' days'}</div>`) : ''}
  ${stanford.length ? row('Stanford · next 3 weeks', stanford.map(m => `<div style="font-size:14px;padding:3px 0"><span style="font-family:'SF Mono',Menlo,monospace;font-size:12px;color:${C.dim}">${m.date.slice(5)}</span> &nbsp;${esc(m.title)} <span style="color:${C.dim};font-size:12px">· ${esc(m.owner)}</span></div>`).join('')) : ''}
  ${row('Tonight', `<div style="font-size:14px">Hard stop 21:15 · report in the app or the chat · lights out ${esc(state.sleep.lightsOut)}. The audit reads your Focus Flight log at 21:20.</div>`)}
  </table>
</td></tr>
<tr><td style="padding:14px 6px 0;text-align:center"><a href="${APP_URL}" style="display:inline-block;background:${C.acc};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:12px">Open the Flight Deck</a></td></tr>
<tr><td style="padding:16px 6px 0;text-align:center;color:${C.dim};font-size:12px">Sent automatically every morning. Changes: tell Claude in the IB45 chat.</td></tr>
</table></td></tr></table></body></html>`;
const text = `${greeting}\n${plan.phase} · in ${at}\n\nYESTERDAY: ${yesterday.replace(/<[^>]+>/g, '')}\n\nTODAY\n` + plan.blocks.map(b => { const f = legByStart[b.start]; return `${b.start}–${b.end}  ${b.title}${f ? `  ✈ ${f.from}→${f.to} ${f.minutes}m` : ''}` + (b.kind === 'fixed' ? '' : '\n' + b.steps.map(s => `   ○ ${s}`).join('\n')); }).join('\n') + (cds.length ? `\n\nCOUNTDOWNS\n` + cds.map(c => `${c.daysLeft}d  ${c.title}`).join('\n') : '') + (stanford.length ? `\n\nSTANFORD\n` + stanford.map(m => `${m.date}  ${m.title}`).join('\n') : '') + `\n\nTonight: hard stop 21:15, report, lights out ${state.sleep.lightsOut}.\n${APP_URL}\n`;
fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, `brief-${day}.html`), html); fs.writeFileSync(path.join(outDir, `brief-${day}.txt`), text);
console.log(JSON.stringify({ day, subject, html: path.join(outDir, `brief-${day}.html`), text: path.join(outDir, `brief-${day}.txt`) }));
