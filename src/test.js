const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./plan.js');
const state = JSON.parse(require('fs').readFileSync(__dirname + '/../data/state.json', 'utf8'));

test('rotation: anchor day is Day 1, next school day flips', () => {
  assert.equal(P.dayType(state, '2026-09-22'), 1);
  assert.equal(P.dayType(state, '2026-09-23'), 2);
  assert.equal(P.dayType(state, '2026-09-25'), 2);
  assert.equal(P.dayType(state, '2026-09-28'), 1);
  assert.equal(P.dayType(state, '2026-09-26'), null);
});

test('rotation: holidays shift the count', () => {
  const s = JSON.parse(JSON.stringify(state));
  s.rotation.holidays = ['2026-09-24'];
  assert.equal(P.dayType(s, '2026-09-24'), null);
  assert.equal(P.dayType(s, '2026-09-25'), 1);
});

test('nextSchoolDay skips weekends and holidays', () => {
  assert.equal(P.nextSchoolDay(state, '2026-09-25'), '2026-09-28');
  const s = JSON.parse(JSON.stringify(state));
  s.rotation.holidays = ['2026-09-28'];
  assert.equal(P.nextSchoolDay(s, '2026-09-25'), '2026-09-29');
});

test('template: Thursday has lab, two sprints, physics tutor, evening', () => {
  const b = P.blocksFor(state, '2026-10-01');
  assert.deepEqual(b.map(x => x.slot), ['LAB', 'S1', 'S2', 'TUTOR', 'EVE']);
  assert.equal(b[0].start, '15:20');
});

test('template: Friday has no evening block; Saturday afternoon free', () => {
  const fri = P.blocksFor(state, '2026-10-02').map(x => x.slot);
  assert.ok(!fri.includes('EVE'));
  const sat = P.blocksFor(state, '2026-10-03');
  assert.ok(sat.every(x => x.end <= '12:00'));
});

test('S1 default is pre-learning tomorrow classes', () => {
  const b = P.blocksFor(state, '2026-09-29');
  const s1 = b.find(x => x.slot === 'S1');
  assert.match(s1.task, /Pre-learn Wed \(Day 1\)/);
  assert.match(s1.task, /Math/);
});

test('assignments override the default task for a slot', () => {
  const b = P.blocksFor(state, '2026-09-24');
  assert.match(b.find(x => x.slot === 'LAB').task, /bring the essay/i);
});

test('countdowns: days left and ramp day', () => {
  const c = P.countdowns(state, '2026-09-23');
  const port = c.find(x => x.id === 'port-test-0925');
  assert.equal(port.daysLeft, 2);
  assert.equal(port.rampDay, -2);
  assert.ok(!c.find(x => x.id === 'math-test-0922'));
});

test('rates: rolling 7 days, no streaks', () => {
  const s = JSON.parse(JSON.stringify(state));
  s.log = [
    { date: '2026-09-22', started: true, sprintsDone: 2, sprintsPlanned: 3, errorsAdded: 4, errorsClosed: 1, retrieval: true },
    { date: '2026-09-23', started: false, sprintsDone: 0, sprintsPlanned: 2, errorsAdded: 0, errorsClosed: 0, retrieval: false }
  ];
  const r = P.rates(s, '2026-09-24');
  assert.equal(r.daysStarted, 1);
  assert.equal(r.schoolDaysSoFar, 4);
  assert.equal(r.errorsAdded, 4);
  assert.equal(r.errorsClosed, 1);
  assert.ok(!('streak' in r));
});

test('blocks carry a title and 1-4 steps; overrides win', () => {
  const b = P.blocksFor(state, '2026-09-23');
  const lab = b.find(x => x.slot === 'LAB');
  assert.equal(lab.title, 'Library · Friday prep');
  assert.equal(lab.steps.length, 3);
  const def = P.blocksFor(state, '2026-10-06'); // Tuesday, no overrides
  for (const x of def) { assert.ok(x.title.length > 0); assert.ok(x.steps.length >= 1 && x.steps.length <= 4, x.slot); }
  assert.equal(def.find(x => x.slot === 'S1').title, 'Pre-learn tomorrow');
});

test('report ramp includes an early draft for feedback', () => {
  const c = P.countdowns(state, '2026-09-29').find(x => x.id === 'chem-report-1004');
  assert.equal(c.daysLeft, 5);
  assert.match(c.task, /early draft/);
});

test('build: writes html and three PNGs at exact sizes', async () => {
  const { execSync } = require('node:child_process');
  execSync('node src/build.js', { cwd: __dirname + '/..', env: { ...process.env, IB45_DATE: '2026-09-23' }, stdio: 'pipe' });
  const fs = require('fs'); const site = __dirname + '/../site/';
  assert.match(fs.readFileSync(site + 'index.html', 'utf8'), /Wednesday 23 Sep/);
  const dims = f => { const b = fs.readFileSync(site + f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  assert.deepEqual(dims('wp-iphone.png'), [1206, 2622]);
  assert.deepEqual(dims('wp-ipad.png'), [2752, 2752]);
  assert.deepEqual(dims('wp-mac.png'), [2560, 1664]);
});
