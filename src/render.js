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
.g{position:relative;background:var(--tint);backdrop-filter:blur(${22 * u}px) saturate(160%);-webkit-backdrop-filter:blur(${22 * u}px) saturate(160%);border-radius:var(--r);box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 0 -1px 0 rgba(255,255,255,.15),inset 1px 0 0 rgba(255,255,255,.35),0 ${10 * u}px ${30 * u}px rgba(20,30,60,.07);overflow:hidden}
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
  return `<div class="g" style="padding:${(open ? 20 : 16) * u}px ${(open ? 22 : 20) * u}px ${(open ? 18 : 16) * u}px"><div style="display:flex;justify-content:space-between;align-items:center;gap:${8 * u}px"><div><div class="${open ? 't' : 't2'}">${esc(b.title)}</div><div class="m">${b.start} – ${b.end}${b.where ? ' · ' + esc(b.where) : ''}${open ? '' : ' · ' + esc(b.subjectShort)}</div></div>${right}</div>${steps}</div>`;
}

// device: { w, h, scale, pad: {top,bottom,side}, u, maxWidth, center, expandAll }
function wallpaperHTML(plan, d) {
  const u = d.u; const r = plan.rates;
  const blocks = plan.blocks.filter(b => b.kind !== 'fixed' || b.slot === 'REVIEW');
  const cds = plan.countdowns.slice(0, 2);
  const cards = blocks.map((b, i) => blockCard(b, u, d.expandAll || i === 0)).join('');
  return `<!doctype html><html><head><meta charset="utf-8">${FONT}<style>${glassCSS(u)}
html,body{width:${d.w}px;height:${d.h}px;overflow:hidden}
.wrap{position:absolute;top:${d.pad.top}px;bottom:${d.pad.bottom}px;left:${d.pad.side}px;right:${d.pad.side}px;display:flex;flex-direction:column;gap:${10 * u}px;${d.center ? 'justify-content:center;' : ''}${d.maxWidth ? `max-width:${d.maxWidth}px;margin:0 auto;` : ''}z-index:1}
.top{display:flex;justify-content:space-between;font-size:${12 * u}px;font-weight:500;color:var(--dim);padding:0 ${6 * u}px ${2 * u}px}
.cds{display:flex;gap:${10 * u}px;margin-top:${d.center ? 0 : 'auto'}}
.pill{flex:1}
</style></head><body><div class="orbs"><i></i><i></i><i></i></div>
<div class="wrap">
<div class="top"><span>${esc(plan.pretty)} · ${esc(plan.dayLabel)}</span><span>Started ${r.daysStarted} of ${r.schoolDaysSoFar}</span></div>
${cards || `<div class="g" style="padding:${20 * u}px ${22 * u}px"><div class="t">Nothing scheduled</div><div class="m">Tell Claude when something is announced.</div></div>`}
${cds.length ? `<div class="cds">${cds.map(c => `<div class="g pill"><div class="big">${c.daysLeft}</div><div class="lbl"><b>day${c.daysLeft === 1 ? '' : 's'}</b><span>${esc(c.title)}</span></div></div>`).join('')}</div>` : ''}
</div></body></html>`;
}

function dashboardHTML(plan, state) {
  const u = 1; const r = plan.rates;
  const blocks = plan.blocks;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IB45 · ${esc(plan.pretty)}</title>${FONT}<style>${glassCSS(u)}
main{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:28px 16px 60px}
h1{font-size:34px;font-weight:600;letter-spacing:-.035em;margin:0}
.sub{font-size:14px;font-weight:500;color:var(--dim);margin:6px 0 22px}
h2{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:28px 0 10px 6px}
.stack{display:flex;flex-direction:column;gap:10px}
.step{cursor:pointer;user-select:none}.step.done{opacity:.45}.step.done .ck{background:var(--ink)}.step.done span:last-child{text-decoration:line-through}
.cds{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.stat{padding:14px 18px}.stat .big{font-size:34px;font-weight:300}.stat .lbl{margin-top:2px}
.rd{display:grid;grid-template-columns:84px 1fr;gap:6px 12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(14,18,32,.08)}.rd:last-child{border:0}.rd small{grid-column:1/-1;font-size:12px;color:var(--dim)}
.bar{flex:1;height:6px;background:rgba(14,18,32,.08);border-radius:3px;overflow:hidden}.bar i{display:block;height:100%;border-radius:3px}
ol{margin:0;padding:18px 22px 18px 40px}ol li{margin:8px 0;font-size:14.5px;font-weight:500}
footer{color:var(--dim);font-size:12px;text-align:center;margin-top:30px}
a{color:inherit}
</style></head><body><div class="orbs"><i></i><i></i><i></i></div>
<main>
<h1>${esc(plan.prettyLong)}</h1><div class="sub">${esc(plan.dayLabel)} · ${esc(plan.phase)} · Started ${r.daysStarted} of ${r.schoolDaysSoFar} this week</div>
<h2>Today</h2><div class="stack">${blocks.map((b, i) => b.kind === 'fixed' ? `<div class="g" style="padding:14px 22px"><div class="t2">${esc(b.title)}</div><div class="m">${b.start} – ${b.end}</div></div>` : `<div class="g" data-slot="${b.slot}" style="padding:18px 22px 16px"><div class="t">${esc(b.title)}</div><div class="m">${b.start} – ${b.end}${b.where ? ' · ' + esc(b.where) : ''} · ${esc(b.subjectShort)}</div><div class="steps">${b.steps.map((s, j) => `<div class="step" data-k="${plan.date}|${b.slot}|${j}"><span class="ck"></span><span>${esc(s)}</span></div>`).join('')}</div></div>`).join('') || '<div class="g" style="padding:18px 22px">Nothing scheduled.</div>'}</div>
<h2>Countdowns</h2><div class="cds">${plan.countdowns.slice(0, 8).map(c => `<div class="g pill"><div class="big">${c.daysLeft}</div><div class="lbl"><b>${esc(c.title)}</b><span>${esc(c.date)}${c.task ? ' · ' + esc(c.task.replace(/^\S+ (ramp|report) -\d+: /, '')) : ''}</span></div></div>`).join('') || '<div class="g" style="padding:16px 20px;color:var(--dim)">No upcoming assessments. Tell Claude when one is announced.</div>'}</div>
<h2>This week</h2><div class="stats">
<div class="g stat"><div class="big">${r.daysStarted}<span style="font-size:16px;color:var(--dim)">/${r.schoolDaysSoFar}</span></div><div class="lbl"><span>days started</span></div></div>
<div class="g stat"><div class="big">${r.sprintsDone}<span style="font-size:16px;color:var(--dim)">/${r.sprintsPlanned}</span></div><div class="lbl"><span>sprints</span></div></div>
<div class="g stat"><div class="big">${r.errorsClosed}<span style="font-size:16px;color:var(--dim)">/${r.errorsAdded}</span></div><div class="lbl"><span>errors closed / added</span></div></div>
<div class="g stat"><div class="big">${r.retrievalDays}<span style="font-size:16px;color:var(--dim)">/7</span></div><div class="lbl"><span>retrieval days</span></div></div>
</div>
<h2>Readiness</h2><div class="g" style="padding:8px 22px">${plan.readiness.map(s => `<div class="rd"><span style="font-weight:600;font-size:14px">${esc(s.short)}</span><div class="bar"><i style="width:${s.total ? Math.round(100 * s.taught / s.total) : 0}%;background:${s.color}"></i></div><small>${s.taught}/${s.total} taught · next: ${esc(s.next)}</small></div>`).join('')}</div>
<h2>Rules</h2><div class="g"><ol>${RULES.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
<footer>Hard stop ${esc(plan.sleep.hardStop)} · lights out ${esc(plan.sleep.lightsOut)} · wake ${esc(plan.sleep.wake)} · built ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC</footer>
</main>
<script>
(function(){try{var K='ib45-done';var done=JSON.parse(localStorage.getItem(K)||'{}');document.querySelectorAll('.step[data-k]').forEach(function(el){var k=el.dataset.k;if(done[k])el.classList.add('done');el.addEventListener('click',function(){el.classList.toggle('done');done[k]=el.classList.contains('done');try{localStorage.setItem(K,JSON.stringify(done))}catch(e){}})})}catch(e){}})();
</script></body></html>`;
}

module.exports = { dashboardHTML, wallpaperHTML };
