// src/flights.js — Focus Flight route engine. Duration model fitted on Eduardo's 26 completed flights:
// minutes ≈ 15.4 + km / 13.38  (≈ 15 min taxi/climb/descent + 803 km/h cruise). R² on his log ≈ 0.99.
'use strict';
const AIRPORTS = require('../data/airports.json');
const BY = Object.fromEntries(AIRPORTS.map(a => [a.i, a]));
const OVERHEAD = 15.4, KM_PER_MIN = 13.38;
const rad = d => d * Math.PI / 180;
function km(a, b) { const R = 6371; const dLa = rad(b.la - a.la), dLo = rad(b.lo - a.lo); const h = Math.sin(dLa / 2) ** 2 + Math.cos(rad(a.la)) * Math.cos(rad(b.la)) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
function bearing(a, b) { const y = Math.sin(rad(b.lo - a.lo)) * Math.cos(rad(b.la)); const x = Math.cos(rad(a.la)) * Math.sin(rad(b.la)) - Math.sin(rad(a.la)) * Math.cos(rad(b.la)) * Math.cos(rad(b.lo - a.lo)); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; }
const minutesFor = d => Math.round(OVERHEAD + d / KM_PER_MIN);
const kmFor = m => Math.max(0, (m - OVERHEAD) * KM_PER_MIN);

// The IB45 World Tour: Tokyo → home to São Paulo by the December break, eastward, every continent.
const TOUR = ['HND', 'CTS', 'ANC', 'YVR', 'SEA', 'SFO', 'LAX', 'LAS', 'DEN', 'ORD', 'YYZ', 'JFK', 'BOS', 'KEF', 'DUB', 'LHR', 'AMS', 'CPH', 'OSL', 'ARN', 'HEL', 'WAW', 'BER', 'PRG', 'VIE', 'ZRH', 'MXP', 'FCO', 'ATH', 'IST', 'TLV', 'CAI', 'DXB', 'DEL', 'BOM', 'CMB', 'BKK', 'SIN', 'CGK', 'PER', 'MEL', 'SYD', 'AKL', 'NAN', 'PPT', 'SCL', 'EZE', 'GIG', 'GRU'];

// Pick the destination for a flight of `minutes` from `fromIATA`, heading along the tour toward `toward` (next waypoint).
// Prefers large airports (type 3) whose flight time is within ±12% of the target and whose bearing is within 60° of the goal.
function pickDestination(fromIATA, minutes, toward) {
  const from = BY[fromIATA]; if (!from) return null;
  const goal = BY[toward] || BY['GRU'];
  const target = kmFor(minutes); const goalDist = km(from, goal); const goalBear = bearing(from, goal);
  if (goalDist <= target * 1.12 && goalDist >= target * 0.6) return { ...goal, km: Math.round(goalDist), minutes: minutesFor(goalDist), waypoint: true };
  let best = null;
  for (const a of AIRPORTS) {
    if (a.i === fromIATA) continue;
    const d = km(from, a); if (d < target * 0.85 || d > target * 1.15) continue;
    let db = Math.abs(bearing(from, a) - goalBear); if (db > 180) db = 360 - db;
    if (db > 60) continue;
    const score = Math.abs(d - target) / target + db / 90 + (a.t === 3 ? 0 : 0.35);
    if (!best || score < best.score) best = { ...a, km: Math.round(d), minutes: minutesFor(d), score };
  }
  if (best) return best;
  // Fallbacks, widening progressively: any bearing, then medium airports, then ±40% distance.
  for (const [tol, minType] of [[0.2, 3], [0.2, 2], [0.4, 3], [0.4, 2], [0.7, 2]]) {
    for (const a of AIRPORTS) { if (a.t < minType || a.i === fromIATA) continue; const d = km(from, a); const s = Math.abs(d - target) / target; if (s <= tol && (!best || s < best.score)) best = { ...a, km: Math.round(d), minutes: minutesFor(d), score: s }; }
    if (best) return best;
  }
  return null;
}

function nextWaypoint(currentIATA) {
  const i = TOUR.indexOf(currentIATA); if (i >= 0) return TOUR[Math.min(i + 1, TOUR.length - 1)];
  // Off-route: head to the nearest tour waypoint ahead by tour order.
  const cur = BY[currentIATA]; if (!cur) return TOUR[1];
  let best = TOUR[1], bd = Infinity; for (const w of TOUR) { const d = km(cur, BY[w]); if (d < bd) { bd = d; best = w; } }
  return best;
}

// Plan a day's flights: blocks (with start/end HH:MM) → destinations chained from `fromIATA`.
function itinerary(fromIATA, blocks) {
  let at = fromIATA; const legs = [];
  for (const b of blocks) {
    const mins = (h => (+h[1].slice(0, 2)) * 60 + (+h[1].slice(3)) - ((+h[0].slice(0, 2)) * 60 + (+h[0].slice(3))))([b.start, b.end]);
    if (mins < 20) { legs.push({ ...b, flight: null }); continue; }
    const dest = pickDestination(at, mins, nextWaypoint(at));
    legs.push({ ...b, flight: dest ? { from: at, to: dest.i, city: dest.c, km: dest.km, minutes: dest.minutes, waypoint: !!dest.waypoint } : null });
    if (dest) at = dest.i;
  }
  return { legs, endsAt: at };
}

module.exports = { AIRPORTS, BY, km, bearing, minutesFor, kmFor, pickDestination, nextWaypoint, itinerary, TOUR };
