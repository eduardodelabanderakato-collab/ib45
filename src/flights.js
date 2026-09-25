// src/flights.js — Focus Flight route engine. Duration model fitted on Eduardo's 26 completed flights:
// minutes ≈ 15.4 + km / 13.38  (≈ 15 min taxi/climb/descent + 803 km/h cruise). R² on his log ≈ 0.99.
'use strict';
const AIRPORTS = require('../data/airports.json');
const BY = Object.fromEntries(AIRPORTS.map(a => [a.i, a]));
const OVERHEAD = 15.4, KM_PER_MIN = 13.38;
const MIN_FLIGHT = 30; // Focus Flight refuses flights shorter than 30 minutes (learned 2026-09-23: Hanamaki -> Sendai rejected)
const rad = d => d * Math.PI / 180;
function km(a, b) { const R = 6371; const dLa = rad(b.la - a.la), dLo = rad(b.lo - a.lo); const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.la)) * Math.cos(rad(b.la)) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
function bearing(a, b) { const y = Math.sin(rad(b.lo - a.lo)) * Math.cos(rad(b.la)); const x = Math.cos(rad(a.la)) * Math.sin(rad(b.la)) - Math.sin(rad(a.la)) * Math.cos(rad(b.la)) * Math.cos(rad(b.lo - a.lo)); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; }
const minutesFor = d => Math.round(OVERHEAD + d / KM_PER_MIN);
const kmFor = m => Math.max(0, (m - OVERHEAD) * KM_PER_MIN);

// The IB45 World Tour, v2 (2026-09-25): WESTWARD, home to São Paulo by the December break.
// v1 went east and asked for a 5,500 km Pacific crossing that 45-minute blocks can never fly, so the picker circled Hokkaido.
// Waypoints are the story; the picker fills the gaps with real airports so that EVERY leg makes progress toward the next waypoint.
// The Atlantic (Cape Verde -> Fernando de Noronha, ~2,100 km, ~175 min) is the one leg that needs the two Saturday blocks joined.
const TOUR = ['VVO', 'HRB', 'SHE', 'PEK', 'XIY', 'CTU', 'KMG', 'HAN', 'DAD', 'SGN', 'BKK', 'KUL', 'SIN', 'RGN', 'CCU', 'HYD', 'BOM', 'KHI', 'MCT', 'DXB', 'IKA', 'IST', 'ATH', 'FCO', 'ZRH', 'MUC', 'BER', 'CPH', 'AMS', 'LHR', 'CDG', 'MAD', 'LIS', 'CMN', 'LPA', 'DSS', 'RAI', 'VXE', 'FEN', 'REC', 'SSA', 'GIG', 'GRU'];
const HOME = 'GRU';
const SLACK = 1.1; // a leg may run 10% past the block; Focus Flight keeps counting

// Next waypoint = first tour stop not yet visited (home is always allowed last).
// Skipped waypoints are forfeited (never fly backwards), and a waypoint closer than a legal flight counts as reached.
function nextWaypoint(currentIATA, visited) {
  const v = new Set(visited || []); const cur = BY[currentIATA];
  let progress = -1; TOUR.forEach((w, i) => { if (w !== HOME && v.has(w)) progress = Math.max(progress, i); });
  for (let i = progress + 1; i < TOUR.length; i++) { const w = TOUR[i]; if (w === HOME) return w; if (v.has(w) || w === currentIATA) continue; if (cur && BY[w] && minutesFor(km(cur, BY[w])) < MIN_FLIGHT) continue; return w; }
  return HOME;
}

// Pick the destination for a block of `minutes` from `fromIATA`. Rules, in order:
// 1. the furthest tour waypoint reachable inside the block (waypoints are the story);
// 2. otherwise the airport that makes the most progress toward the next waypoint, mostly forward (>= 60% of km flown), big airports preferred;
// 3. otherwise the same with a looser forward rule; 4. otherwise null (the itinerary will try to join blocks, then hold).
function pickDestination(fromIATA, minutes, toward, visited) {
  const from = BY[fromIATA]; if (!from) return null;
  const v = new Set(visited || []); const capKm = kmFor(Math.max(minutes, MIN_FLIGHT) * SLACK);
  const goal = BY[toward] || BY[HOME]; const gi = TOUR.indexOf(toward);
  const land = (a, d, extra) => ({ ...a, km: Math.round(d), minutes: minutesFor(d), ...extra });
  // 1. furthest reachable waypoint from `toward` onward (never skipping more than the natural order allows)
  // the first tour waypoint (in order) reachable inside the block wins: more cities, never overshooting the story
  for (let i = Math.max(gi, 0); i < TOUR.length; i++) { const w = BY[TOUR[i]]; if (!w || (v.has(TOUR[i]) && TOUR[i] !== HOME) || TOUR[i] === fromIATA) continue; const d = km(from, w); if (d <= capKm && minutesFor(d) >= MIN_FLIGHT) return land(w, d, { waypoint: true }); }
  // 2./3. best progress toward the goal
  const dg = km(from, goal);
  for (const forwardRatio of [0.6, 0.3]) {
    let best = null;
    for (const a of AIRPORTS) {
      if (a.i === fromIATA || v.has(a.i)) continue;
      const d = km(from, a); if (d > capKm || minutesFor(d) < MIN_FLIGHT) continue;
      const progress = dg - km(a, goal); if (progress < forwardRatio * d) continue;
      const score = progress + (a.t === 3 ? 80 : 0);
      if (!best || score > best.score) best = land(a, d, { score });
    }
    if (best) return best;
  }
  return null;
}

// Holding pattern: the nearest unvisited airport inside the block, any direction, used only when no forward leg exists (ocean ahead).
function holdingLeg(fromIATA, minutes, visited) {
  const from = BY[fromIATA]; if (!from) return null; const v = new Set(visited || []); const capKm = kmFor(Math.max(minutes, MIN_FLIGHT) * SLACK);
  let best = null; for (const revisit of [false, true]) { for (const a of AIRPORTS) { if (a.i === fromIATA || (!revisit && v.has(a.i))) continue; const d = km(from, a); if (d > capKm || minutesFor(d) < MIN_FLIGHT) continue; if (!best || d < best.km) best = { ...a, km: Math.round(d), minutes: minutesFor(d), hold: true }; } if (best) break; }
  return best;
}

const mins = b => (+b.end.slice(0, 2)) * 60 + (+b.end.slice(3)) - ((+b.start.slice(0, 2)) * 60 + (+b.start.slice(3)));
const gap = (a, b) => (+b.start.slice(0, 2)) * 60 + (+b.start.slice(3)) - ((+a.end.slice(0, 2)) * 60 + (+a.end.slice(3)));
// Plan the day's legs from `fromIATA`. `visited` (state.tour.visited) keeps legs from looping back.
function itinerary(fromIATA, blocks, visited) {
  let at = fromIATA; const legs = []; const seen = [...(visited || [])];
  for (let k = 0; k < blocks.length; k++) {
    const b = blocks[k]; const m = mins(b);
    if (m < 20 || at === HOME) { legs.push({ ...b, flight: null, home: at === HOME }); continue; }
    let dest = pickDestination(at, m, nextWaypoint(at, seen), seen); let joined = false;
    // Ocean ahead: try joining this block with the next one (Saturday SAT1 + SAT2 become one long leg).
    if (!dest && blocks[k + 1] && gap(b, blocks[k + 1]) <= 20) { const both = m + gap(b, blocks[k + 1]) + mins(blocks[k + 1]); dest = pickDestination(at, both, nextWaypoint(at, seen), seen); joined = !!dest; }
    if (!dest) dest = holdingLeg(at, m, seen);
    const flight = dest ? { from: at, to: dest.i, city: dest.c, km: dest.km, minutes: dest.minutes, waypoint: !!dest.waypoint, hold: !!dest.hold, joined } : null;
    legs.push({ ...b, flight });
    if (dest) { at = dest.i; seen.push(dest.i); }
    if (joined) { // the second block continues the long leg; if enough of it is left after landing, fly one more short leg
      const left = m + gap(b, blocks[k + 1]) + mins(blocks[k + 1]) - dest.minutes; let extra = null;
      if (left >= MIN_FLIGHT && at !== HOME) { extra = pickDestination(at, left, nextWaypoint(at, seen), seen) || holdingLeg(at, left, seen); }
      legs.push({ ...blocks[k + 1], flight: extra ? { from: at, to: extra.i, city: extra.c, km: extra.km, minutes: extra.minutes, waypoint: !!extra.waypoint, hold: !!extra.hold, afterLongLeg: true } : { ...flight, continued: true } });
      if (extra) { at = extra.i; seen.push(extra.i); } k++;
    }
  }
  return { legs, endsAt: at };
}
module.exports = { AIRPORTS, BY, km, bearing, minutesFor, kmFor, pickDestination, nextWaypoint, holdingLeg, itinerary, TOUR, HOME, MIN_FLIGHT };
