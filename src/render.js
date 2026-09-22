// src/render.js — plan -> HTML. iOS 26 "Liquid Glass · Ice": near-white gradient, faint orbs, frosted capsules, Inter.
'use strict';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FONT = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=block" rel="stylesheet">`;

const RULES = [
  'Sprint 1 is what counts as a day started. Ten minutes is a day started.',
  'Phone leaves the room at every sprint. One flight per sprint.',
  'Pre-learn tomorrow. Class is your first retrieval, not first exposure.',
  'Every wrong answer gets a line: what I did, what the scheme wanted, the fix rule.',
  'Drafts reach the teacher early. Early delivery is how you get feedback.',
  'Hard stop 21:15. Read. Lights out 22:45. Sleep is the frame.'
];

// Shared glass CSS. `u` is the unit scale (1 = iPhone points).
function glassCSS(u) {
  return `
:root{--ink:#0e1220;--dim:rgba(14,18,32,.52);--tint:rgba(255,255,255,.55);--r:${26 * u}px}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:var(--ink);background:linear-gradient(180deg,#f6f8fc 0%,#eef3fb 60%,#e8eef9 100%);-webkit-font-smoothing:antialiased}
.orbs{position:fixed;inset:0;pointer-events:none;z-index:0}.orbs i{position:absolute;border-radius:50%;filter:blur(${70 * u}px)}
.orbs i:nth-child(1){left:-30%;top:5%;width:80%;height:40%;background:#cfe0ff}
.orbs i:nth-child(2){right:-30%;top:40%;width:80%;height:45%;background:#e3d6ff}
.orbs i:nth-child(3){left:20%;bottom:-20%;width:80%;height:40%;background:#d7f3f5}
.g{flex:0 0 auto;position:relative;background:var(--tint);backdrop-filter:blur(${22 * u}px) saturate(160%);-webkit-backdrop-filter:blur(${22 * u}px) saturate(160%);border-radius:var(--r);box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 0 -1px 0 rgba(255,255,255,.15),inset 1px 0 0 rgba(255,255,255,.35),0 ${10 * u}px ${30 * u}px rgba(20,30,60,.07);overflow:hidden}
.g:before{content:'';position:absolute;inset:0;border-radius:var(--r);padding:1px;background:linear-gradient(135deg,rgba(255,255,255,.8),rgba(255,255,255,.1) 40%,rgba(255,255,255,.4));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.g:after{content:'';position:absolute;left:-30%;top:-60%;width:90%;height:90%;background:radial-gradient(closest-side,rgba(255,255,255,.4),transparent);pointer-events:none}
.t{font-size:${30 * u}px;font-weight:600;letter-spacing:-.03em;line-height:1.05}
.t2{font-size:${19 * u}px;font-weight:600;letter-spacing:-.02em}
.m{font-size:${13 * u}px;font-weight:500;margin-top:${4 * u}px;color:var(--dim)}
.steps{margin-top:${12 * u}px;display:flex;flex-direction:column;gap:${8 * u}px}
.step{display:flex;align-items:center;gap:${10 * u}px;font-size:${14.5 * u}px;font-weight:500;line-height:1.25}
.ck{width:${17 * u}px;height:${17 * u}px;border-radius:50%;border:1.5px solid currentColor;opacity:.85;flex:0 0 auto}
.big{font-size:${44 * u}px;font-weight:300;letter-spacing:-.04em;line-height:1}
.lbl{display:flex;flex-direction:column;font-size:${12 * u}px;line-height:1.25}.lbl b{font-weight:600}.lbl span{color:var(--dim)}
.pill{display:flex;align-items:center;gap:${12 * u}px;padding:${12 * u}px ${18 * u}px;border-radius:${30 * u}px}
`;
}

function blockCard(b, u, open) {
  const steps = open ? `<div class="steps">${b.steps.map(s => `<div class="step"><span class="ck"></span><span>${esc(s)}</span></div>`).join('')}</div>` : '';
  const right = open ? '' : `<div style="font-size:${12 * u}px;font-weight:500;color:var(--dim);white-space:nowrap">${b.steps.length} step${b.steps.length === 1 ? '' : 's'}</div>`;
  return `<div class="g" style="padding:${(open ? 20 : 13) * u}px ${(open ? 22 : 20) * u}px ${(open ? 18 : 13) * u}px"><div style="display:flex;justify-content:space-between;align-items:center;gap:${8 * u}px"><div><div class="${open ? 't' : 't2'}">${esc(b.title)}</div><div class="m">${b.start} – ${b.end}${b.where ? ' · ' + esc(b.where) : ''}${open ? '' : ' · ' + esc(b.subjectShort)}</div></div>${right}</div>${steps}</div>`;
}

// device: { w, h, scale, pad: {top,bottom,side}, u, maxWidth, center, expandAll }
function wallpaperHTML(plan, d, mul = 1) {
  const r = plan.rates;
  const blocks = plan.blocks.filter(b => b.kind !== 'fixed' || b.slot === 'REVIEW');
  const u = d.u * mul;
  const cds = plan.countdowns.slice(0, 2);
  const cards = blocks.map((b, i) => blockCard(b, u, d.expandAll || i === 0)).join('');
  return `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>${glassCSS(u)}
html,body{width:${d.w}px;height:${d.h}px;overflow:hidden}
.wrap{position:absolute;top:${d.pad.top}px;bottom:${d.pad.bottom}px;left:${d.pad.side}px;right:${d.pad.side}px;display:flex;flex-direction:column;gap:${9 * u}px;overflow:hidden;${d.center ? 'justify-content:center;' : ''}${d.maxWidth ? `max-width:${d.maxWidth}px;margin:0 auto;` : ''}z-index:1}
.top{display:flex;justify-content:space-between;font-size:${12 * u}px;font-weight:500;color:var(--dim);padding:0 ${6 * u}px ${2 * u}px}
.cds{display:flex;gap:${10 * u}px;margin-top:${d.center ? 0 : 'auto'}}
.pill{flex:1}
</style></head><body><div class="orbs"><i></i><i></i><i></i></div>
<div class="wrap">
<div class="top"><span>${esc(plan.pretty)} · ${esc(plan.dayLabel)}</span><span>Started ${r.daysStarted} of ${r.schoolDaysSoFar}</span></div>
${cards || `<div class="g" style="padding:${20 * u}px ${22 * u}px"><div class="t">Nothing scheduled</div><div class="m">Tell Claude when something is announced.</div></div>`}
${cds.length ? `<div class="cds">${cds.map(c => `<div class="g pill"><div class="big">${c.daysLeft}</div><div class="lbl"><b>${c.daysLeft === 0 ? 'today' : c.daysLeft === 1 ? 'day' : 'days'}</b><span>${esc(c.title)}</span></div></div>`).join('')}</div>` : ''}
</div></body></html>`;
}

function dashboardHTML(plan, state) {
  const r = plan.rates;
  const blocks = plan.blocks;
  const cds = plan.countdowns.slice(0, 6);
  const tomorrowISO = require('./plan.js').addDays(plan.date, 1);
  const tomorrow = require('./plan.js').blocksFor(state, tomorrowISO).filter(b => b.kind !== 'fixed').slice(0, 4);
  const step = (b, j, s) => `<div class="step" data-k="${plan.date}|${b.slot}|${j}"><span class="ck"></span><span>${esc(s)}</span></div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IB45 · ${esc(plan.pretty)}</title>${FONT}<style>
:root{--ink:#111418;--dim:rgba(17,20,24,.5);--line:rgba(17,20,24,.08);--tint:rgba(255,255,255,.62)}
*{box-sizing:border-box}html,body{height:100%}
body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:var(--ink);background:linear-gradient(180deg,#f7f8fa 0%,#eef1f5 100%);-webkit-font-smoothing:antialiased;overflow:hidden}
.orbs{position:fixed;inset:0;pointer-events:none;z-index:0}.orbs i{position:absolute;border-radius:50%;filter:blur(80px)}
.orbs i:nth-child(1){left:-25%;top:-10%;width:60%;height:50%;background:#dfe6ef}.orbs i:nth-child(2){right:-20%;bottom:-20%;width:60%;height:55%;background:#e6ecf3}
.g{position:relative;background:var(--tint);backdrop-filter:blur(20px) saturate(120%);-webkit-backdrop-filter:blur(20px) saturate(120%);border-radius:22px;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 8px 24px rgba(20,30,50,.06);border:1px solid rgba(255,255,255,.7);overflow:hidden;display:flex;flex-direction:column;min-height:0}
.g h2{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:0;padding:14px 18px 8px}
.body{padding:0 18px 14px;overflow:auto;min-height:0;flex:1}
main{position:relative;z-index:1;height:100%;display:grid;gap:12px;padding:14px;grid-template-columns:1.35fr 1fr 1fr;grid-template-rows:auto 1fr 1fr;grid-template-areas:"head head head" "today cds week" "today tomorrow rules"}
header{grid-area:head;display:flex;align-items:baseline;justify-content:space-between;padding:4px 6px 0}
h1{font-size:26px;font-weight:600;letter-spacing:-.03em;margin:0}.sub{font-size:13px;font-weight:500;color:var(--dim)}
#today{grid-area:today}#cds{grid-area:cds}#week{grid-area:week}#tomorrow{grid-area:tomorrow}#rules{grid-area:rules}
.blk{padding:10px 0;border-top:1px solid var(--line)}.blk:first-child{border-top:0;padding-top:4px}
.blk .t{font-size:17px;font-weight:600;letter-spacing:-.02em;display:flex;justify-content:space-between;align-items:baseline}.blk .t small{font-size:12px;font-weight:500;color:var(--dim)}
.steps{margin-top:6px;display:flex;flex-direction:column;gap:4px}
.step{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;cursor:pointer;user-select:none;line-height:1.3}
.ck{width:14px;height:14px;border-radius:50%;border:1.5px solid currentColor;opacity:.8;flex:0 0 auto}
.step.done{opacity:.4}.step.done .ck{background:var(--ink)}.step.done span:last-child{text-decoration:line-through}
.fixed{font-size:13px;color:var(--dim);font-weight:500;padding:6px 0;border-top:1px solid var(--line)}
.cd{display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--line)}.cd:first-child{border-top:0;padding-top:2px}
.big{font-size:30px;font-weight:300;letter-spacing:-.04em;line-height:1;min-width:44px}
.lbl{display:flex;flex-direction:column;font-size:12.5px;line-height:1.3}.lbl b{font-weight:600}.lbl span{color:var(--dim)}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px}.stat .big{font-size:28px}.stat .lbl{margin-top:2px}
.rd{display:grid;grid-template-columns:78px 1fr 46px;gap:8px;align-items:center;padding:5px 0;font-size:12.5px}
.bar{height:5px;background:var(--line);border-radius:3px;overflow:hidden}.bar i{display:block;height:100%;border-radius:3px;background:#111418}
.rd small{color:var(--dim);text-align:right}
ol{margin:0;padding:2px 0 0 18px}ol li{margin:5px 0;font-size:12.5px;font-weight:500;line-height:1.35}
.tm{padding:6px 0;border-top:1px solid var(--line);font-size:13px;font-weight:500;display:flex;justify-content:space-between}.tm:first-child{border-top:0}.tm span:last-child{color:var(--dim)}
@media(max-width:900px){body{overflow:auto}main{height:auto;grid-template-columns:1fr;grid-template-areas:"head" "today" "cds" "week" "tomorrow" "rules"}.body{overflow:visible}}
</style></head><body><div class="orbs"><i></i><i></i></div>
<main>
<header><h1>${esc(plan.prettyLong)} <span style="color:var(--dim);font-weight:500">· ${esc(plan.dayLabel)}</span></h1><div class="sub">${esc(plan.phase)} · started ${r.daysStarted} of ${r.schoolDaysSoFar} · hard stop ${esc(plan.sleep.hardStop)} · lights out ${esc(plan.sleep.lightsOut)}</div></header>
<section class="g" id="today"><h2>Today</h2><div class="body">${blocks.map(b => b.kind === 'fixed' ? `<div class="fixed">${b.start} – ${b.end} · ${esc(b.title)}</div>` : `<div class="blk"><div class="t"><span>${esc(b.title)}</span><small>${b.start} – ${b.end}${b.where ? ' · ' + esc(b.where) : ''}</small></div><div class="steps">${b.steps.map((s, j) => step(b, j, s)).join('')}</div></div>`).join('') || '<div class="fixed">Nothing scheduled.</div>'}</div></section>
<section class="g" id="cds"><h2>Countdowns</h2><div class="body">${cds.map(c => `<div class="cd"><div class="big">${c.daysLeft}</div><div class="lbl"><b>${esc(c.title)}</b><span>${c.daysLeft === 0 ? 'today' : c.daysLeft === 1 ? 'tomorrow' : esc(c.date)}${c.task ? ' · ' + esc(c.task.replace(/^\S+ (ramp|report) -\d+: /, '')) : ''}</span></div></div>`).join('') || '<div class="fixed">No upcoming assessments. Tell Claude when one is announced.</div>'}</div></section>
<section class="g" id="week"><h2>This week</h2><div class="body"><div class="stats">
<div class="stat"><div class="big">${r.daysStarted}<span style="font-size:14px;color:var(--dim)">/${r.schoolDaysSoFar}</span></div><div class="lbl"><span>days started</span></div></div>
<div class="stat"><div class="big">${r.sprintsDone}<span style="font-size:14px;color:var(--dim)">/${r.sprintsPlanned}</span></div><div class="lbl"><span>sprints done</span></div></div>
<div class="stat"><div class="big">${r.errorsClosed}<span style="font-size:14px;color:var(--dim)">/${r.errorsAdded}</span></div><div class="lbl"><span>errors closed / added</span></div></div>
<div class="stat"><div class="big">${r.retrievalDays}<span style="font-size:14px;color:var(--dim)">/7</span></div><div class="lbl"><span>retrieval days</span></div></div>
</div><div style="margin-top:12px;border-top:1px solid var(--line);padding-top:8px">${plan.readiness.map(s => `<div class="rd"><span style="font-weight:600">${esc(s.short)}</span><div class="bar"><i style="width:${s.total ? Math.round(100 * s.taught / s.total) : 0}%"></i></div><small>${s.taught}/${s.total}</small></div>`).join('')}</div></div></section>
<section class="g" id="tomorrow"><h2>Tomorrow · ${esc(require('./plan.js').pretty(tomorrowISO))}</h2><div class="body">${tomorrow.map(b => `<div class="tm"><span>${esc(b.title)}</span><span>${b.start}</span></div>`).join('') || '<div class="fixed">Free.</div>'}<div class="fixed" style="margin-top:8px">Next up: ${plan.readiness.filter(s => ['math', 'phys', 'econ'].includes(s.id)).map(s => `${esc(s.short)} → ${esc(s.next)}`).join(' · ')}</div></div></section>
<section class="g" id="rules"><h2>Reminders</h2><div class="body"><ol>${RULES.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div></section>
</main>
<script>
(function(){try{var K='ib45-done';var done=JSON.parse(localStorage.getItem(K)||'{}');document.querySelectorAll('.step[data-k]').forEach(function(el){var k=el.dataset.k;if(done[k])el.classList.add('done');el.addEventListener('click',function(){el.classList.toggle('done');done[k]=el.classList.contains('done');try{localStorage.setItem(K,JSON.stringify(done))}catch(e){}})})}catch(e){}})();
</script></body></html>`;
}

module.exports = { dashboardHTML, wallpaperHTML };
