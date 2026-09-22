// src/plan.js — pure planning logic. No I/O.
'use strict';

const DAY = 86400000;
const toDate = iso => new Date(iso + 'T12:00:00Z');
const toISO = d => d.toISOString().slice(0, 10);
const addDays = (iso, n) => toISO(new Date(toDate(iso).getTime() + n * DAY));
const weekday = iso => toDate(iso).getUTCDay(); // 0 Sun .. 6 Sat
const isWeekend = iso => [0, 6].includes(weekday(iso));
const isoWeek = iso => { const d = toDate(iso); const t = new Date(d); t.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7)); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / DAY + 1) / 7); };
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pretty = iso => `${WD[weekday(iso)]} ${+iso.slice(8)} ${MON[+iso.slice(5, 7) - 1]}`;
const prettyLong = iso => `${WDL[weekday(iso)]} ${+iso.slice(8)} ${MON[+iso.slice(5, 7) - 1]}`;

function isSchoolDay(state, iso) {
  return !isWeekend(iso) && !(state.rotation.holidays || []).includes(iso);
}

function dayType(state, iso) {
  if (!isSchoolDay(state, iso)) return null;
  const { anchorDate, anchorType } = state.rotation;
  let count = 0;
  const step = iso >= anchorDate ? 1 : -1;
  for (let d = anchorDate; d !== iso; d = addDays(d, step)) if (isSchoolDay(state, d)) count++;
  if (step < 0 && isSchoolDay(state, iso)) count++;
  return ((anchorType - 1 + (step > 0 ? count : -count)) % 2 + 2) % 2 + 1;
}

function nextSchoolDay(state, iso) {
  let d = addDays(iso, 1);
  while (!isSchoolDay(state, d)) d = addDays(d, 1);
  return d;
}

// Weekly template. slot ids are what assignments override.
const TEMPLATE = {
  1: [ // Mon
    { slot: 'S1', start: '15:20', end: '16:10', kind: 'sprint', where: 'Library' },
    { slot: 'SOCCER', start: '16:30', end: '18:00', kind: 'fixed', task: 'Soccer (CAS)' },
    { slot: 'S2', start: '18:30', end: '19:20', kind: 'sprint' },
    { slot: 'EVE', start: '20:45', end: '21:15', kind: 'retrieval' }
  ],
  2: [ // Tue
    { slot: 'LAB', start: '15:20', end: '16:20', kind: 'lab', subject: 'phys' },
    { slot: 'S1', start: '17:00', end: '17:50', kind: 'sprint' },
    { slot: 'S2', start: '18:00', end: '18:50', kind: 'sprint' },
    { slot: 'S3', start: '19:00', end: '19:40', kind: 'sprint' },
    { slot: 'EVE', start: '20:45', end: '21:15', kind: 'retrieval' }
  ],
  3: [ // Wed
    { slot: 'LAB', start: '15:20', end: '16:20', kind: 'lab', subject: 'chem' },
    { slot: 'SOCCER', start: '16:30', end: '18:00', kind: 'fixed', task: 'Soccer (CAS)' },
    { slot: 'S1', start: '18:30', end: '19:20', kind: 'sprint' },
    { slot: 'EVE', start: '20:45', end: '21:15', kind: 'retrieval' }
  ],
  4: [ // Thu
    { slot: 'LAB', start: '15:20', end: '16:20', kind: 'lab', subject: 'lang' },
    { slot: 'S1', start: '17:00', end: '17:50', kind: 'sprint' },
    { slot: 'S2', start: '18:00', end: '18:50', kind: 'sprint' },
    { slot: 'TUTOR', start: '19:00', end: '20:00', kind: 'tutor', subject: 'phys' },
    { slot: 'EVE', start: '20:45', end: '21:15', kind: 'retrieval' }
  ],
  5: [ // Fri
    { slot: 'S1', start: '16:20', end: '17:10', kind: 'sprint' },
    { slot: 'S2', start: '17:20', end: '18:10', kind: 'sprint' },
    { slot: 'S3', start: '18:20', end: '19:00', kind: 'sprint' },
    { slot: 'TUTOR', start: '19:30', end: '20:30', kind: 'tutor', subject: 'math' }
  ],
  6: [ // Sat
    { slot: 'SAT1', start: '09:00', end: '10:30', kind: 'sprint' },
    { slot: 'SAT2', start: '10:45', end: '12:00', kind: 'sprint' }
  ],
  0: [ // Sun
    { slot: 'SATBLK', start: '09:00', end: '10:30', kind: 'sprint', subject: 'sat' },
    { slot: 'DIAG', start: '10:45', end: '12:00', kind: 'sprint' },
    { slot: 'FLEX', start: '14:00', end: '15:30', kind: 'sprint' },
    { slot: 'REVIEW', start: '18:00', end: '18:30', kind: 'fixed', task: 'Sunday review with Claude' }
  ]
};

const HL_ROTATION = { 1: 'math', 2: 'phys', 4: 'econ', 5: 'math' }; // S2 default by weekday

function preLearnTask(state, iso) {
  const tomorrow = nextSchoolDay(state, iso);
  const t = dayType(state, tomorrow);
  const parts = state.rotation.classes[String(t)].map(id => {
    const s = state.subjects[id];
    return `${s.short}: ${s.next[0]} (15)`;
  });
  return `Pre-learn ${WD[weekday(tomorrow)]} (Day ${t}): ${parts.join(' · ')}`;
}

function rampTask(a, rampDay, state) {
  const s = state.subjects[a.subject].short;
  if (a.ramp === 'language') {
    const L = { '-14': 'confirm format & criteria with teacher; copy top-band descriptors onto a card', '-13': 'study one top-band exemplar against the criteria', '-12': 'timed essay 1; send tonight with the 4-line note', '-8': 'feedback in: log it, redraft the named paragraphs', '-7': 'resend redraft: "did this fix it?"', '-6': 'mark an exemplar with the criteria', '-5': 'timed essay 2 applying the fix rules; send tonight', '-4': 'quote-bank / device-to-effect drill', '-3': 'feedback 2: log, redraft one paragraph', '-2': '25-min plan-only on a fresh question', '-1': 'read your best redraft + descriptor card. Nothing new. Early night.' };
    return L[String(rampDay)] ? `${s} ramp ${rampDay}: ${L[String(rampDay)]}` : null;
  }
  if (a.ramp === 'report') {
    const R = { '-7': 'skeleton: sections, data tables, what is missing', '-5': 'early draft to teacher for feedback', '-4': 'early draft to teacher for feedback (if not sent)', '-2': 'apply the feedback, final formatting', '-1': 'proofread, submit' };
    return R[String(rampDay)] ? `${s} report ${rampDay}: ${R[String(rampDay)]}` : null;
  }
  const S = { '-14': 'diagnose cold: 10-12 mixed questions timed, score by topic, rank red/amber/green', '-13': 'red topics: re-explain from memory, 30 min problems, log errors', '-12': 'red topics: problems + error log', '-11': 'red topics: problems + error log', '-10': 'red + one amber topic interleaved', '-9': 'red + one amber topic interleaved', '-8': 'mixed set across all topics, strict mark scheme', '-7': 'mixed set across all topics', '-6': 'mixed set, weighted to red', '-5': 'mixed set, timed', '-4': 'full timed past paper under exam conditions', '-3': 'mark it; every lost mark into the error log', '-2': 'error-only pass: redo every logged error cold; still wrong -> 3-line rule card', '-1': 'rule cards + one brain dump per topic. Stop by 21:00.' };
  return S[String(rampDay)] ? `${s} ramp ${rampDay}: ${S[String(rampDay)]}` : null;
}

function countdowns(state, iso) {
  return (state.assessments || [])
    .filter(a => a.date >= iso)
    .map(a => { const daysLeft = daysBetween(iso, a.date); return { ...a, daysLeft, rampDay: -daysLeft, subjectShort: state.subjects[a.subject].short, color: state.subjects[a.subject].color, task: rampTask(a, -daysLeft, state) }; })
    .sort((x, y) => x.daysLeft - y.daysLeft);
}

function defaultTask(state, iso, block, cds) {
  const wd = weekday(iso);
  const live = cds.filter(c => c.daysLeft <= 14 && c.daysLeft > 0 && c.task);
  if (block.kind === 'lab') {
    let id = block.subject;
    if (id === 'lang') id = isoWeek(iso) % 2 === 0 ? 'port' : 'eng';
    const near = live.find(c => c.subject === 'chem' && wd === 2) || live.find(c => c.subject === 'math' && wd === 3);
    if (near) id = near.subject;
    const s = state.subjects[id];
    return { subject: id, task: s.kind === 'language' ? `${s.short} lab: bring this fortnight's essay draft; ask for a mark per criterion` : `${s.short} lab: bring your open error log; work the starred errors with the teacher` };
  }
  if (block.kind === 'tutor') { const s = state.subjects[block.subject]; return { subject: block.subject, task: `${s.short} tutor: bring the error log, not open questions` }; }
  if (block.kind === 'retrieval') return { subject: 'all', task: 'Retrieval 30 min: this week\'s topics cold (2-3 problems or a brain dump each). Then the 2-minute nightly report.' };
  if (block.kind === 'fixed') return { subject: 'all', task: block.task };
  if (block.slot === 'S1' && wd >= 1 && wd <= 5) return { subject: 'pre', task: preLearnTask(state, iso) };
  if (block.slot === 'S2') {
    if (live[0]) return { subject: live[0].subject, task: live[0].task };
    const id = HL_ROTATION[wd] || 'math'; const s = state.subjects[id];
    return { subject: id, task: `${s.short} problem set: 8 questions on the current topic (${s.resources[1] || s.resources[0]}), errors logged` };
  }
  if (block.slot === 'S3') { const id = wd === 2 ? 'eng' : 'port'; const s = state.subjects[id]; return { subject: id, task: s.next[0] }; }
  if (block.slot === 'SAT1') { const id = ['math', 'phys', 'econ'][isoWeek(iso) % 3]; const s = state.subjects[id]; return { subject: id, task: `${s.short} mixed set: 12 questions, half current unit, half older units, shuffled. 90 min. Errors logged.` }; }
  if (block.slot === 'SAT2') { const id = isoWeek(iso) % 2 === 0 ? 'port' : 'eng'; const s = state.subjects[id]; return { subject: id, task: `${s.short}: timed Paper 1 (75 min). Send to teacher tonight with the 4-line note.` }; }
  if (block.slot === 'SATBLK') return { subject: 'sat', task: state.subjects.sat.next[0] };
  if (block.slot === 'DIAG') return { subject: 'all', task: 'Mini-diagnostics: two subjects, 25 min each, timed, mark-scheme marked, score per topic.' };
  if (block.slot === 'FLEX') { return live[0] ? { subject: live[0].subject, task: live[0].task } : { subject: 'all', task: 'Flex: close open errors from this week (two spaced reattempts each).' }; }
  return { subject: 'all', task: 'Free' };
}

function defaultTitle(state, block, subject, task) {
  const s = state.subjects[subject];
  const T = { LAB: s ? `${s.short} lab` : 'Support lab', TUTOR: s ? `${s.short} tutor` : 'Tutor', S1: 'Pre-learn tomorrow', EVE: 'Retrieval + report', SATBLK: 'SAT', DIAG: 'Mini-diagnostics', REVIEW: 'Sunday review', SOCCER: 'Soccer', FLEX: 'Flex block' };
  if (T[block.slot] && !(block.slot === 'FLEX' && /ramp|report/.test(task))) return T[block.slot];
  const m = task.match(/^(\S+ (?:ramp|report) -\d+)/); if (m) return m[1].replace(' -', ' −');
  if (s && s.kind === 'language') return `${s.short} reading`;
  if (/mixed set/.test(task)) return `${s.short} mixed set`;
  if (/Paper 1/.test(task)) return `${s.short} timed essay`;
  return s ? `${s.short} practice` : 'Study';
}

function defaultSteps(task) {
  let parts = task.includes(' · ') ? task.split(' · ') : task.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/);
  parts = parts.map(x => x.replace(/^[A-Za-zÀ-ú]+ (?:ramp|report) -\d+: /, '').replace(/[.]$/, '').trim()).filter(Boolean);
  return parts.slice(0, 4);
}

function blocksFor(state, iso) {
  const wd = weekday(iso);
  const tpl = TEMPLATE[wd] || [];
  const cds = countdowns(state, iso);
  const overrides = (state.assignments || {})[iso] || [];
  return tpl.map(b => {
    const d = defaultTask(state, iso, b, cds);
    const o = overrides.find(x => x.slot === b.slot) || {};
    const subject = o.subject || d.subject;
    const s = state.subjects[subject];
    const task = o.task || (o.steps ? o.steps.join(' · ') : d.task);
    const steps = o.steps || defaultSteps(task);
    const title = o.title || defaultTitle(state, b, subject, task);
    return { slot: b.slot, start: b.start, end: b.end, kind: b.kind, where: b.where || null, subject, subjectShort: s ? s.short : (subject === 'pre' ? 'Pre-learn' : ''), color: s ? s.color : '#334155', title, task, steps };
  });
}

function rates(state, iso) {
  const from = addDays(iso, -6);
  const rows = (state.log || []).filter(r => r.date >= from && r.date <= iso);
  const sum = k => rows.reduce((a, r) => a + (r[k] || 0), 0);
  const wdNum = weekday(iso); const monday = addDays(iso, -((wdNum + 6) % 7));
  let schoolDaysSoFar = 0; for (let d = monday; d <= iso; d = addDays(d, 1)) if (isSchoolDay(state, d)) schoolDaysSoFar++;
  const weekRows = rows.filter(r => r.date >= monday);
  return { daysStarted: weekRows.filter(r => r.started).length, schoolDaysSoFar, sprintsDone: sum('sprintsDone'), sprintsPlanned: sum('sprintsPlanned'), errorsAdded: sum('errorsAdded'), errorsClosed: sum('errorsClosed'), retrievalDays: rows.filter(r => r.retrieval).length };
}

function readiness(state) {
  return Object.entries(state.subjects).filter(([id]) => id !== 'sat').map(([id, s]) => {
    const n = s.topics.length; const c = k => s.topics.filter(t => t.status === k).length;
    return { id, short: s.short, color: s.color, grade: s.grade, total: n, taught: c('taught') + c('learning') + c('shaky') + c('solid'), solid: c('solid'), next: s.next[0] };
  });
}

function phaseInfo(state, iso) {
  const p = state.student.phase; const wk = Math.floor(daysBetween(p.start, iso) / 7) + 1;
  return wk <= p.weeks ? `${p.name} week ${wk}/${p.weeks}` : `Full load week ${wk - p.weeks}`;
}

function planFor(state, iso) {
  const t = dayType(state, iso);
  return { date: iso, pretty: pretty(iso), prettyLong: prettyLong(iso), dayType: t, dayLabel: t ? `Day ${t}` : (isWeekend(iso) ? 'Weekend' : 'No school'), phase: phaseInfo(state, iso), blocks: blocksFor(state, iso), countdowns: countdowns(state, iso), rates: rates(state, iso), readiness: readiness(state), sleep: state.sleep };
}

module.exports = { dayType, nextSchoolDay, blocksFor, countdowns, rates, readiness, planFor, addDays, pretty, TEMPLATE };
