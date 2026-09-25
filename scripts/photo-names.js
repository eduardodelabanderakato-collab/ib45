// scripts/photo-names.js — every Wikipedia photo the email for `day` may need (destinations, faces, authors, Stanford, AI)
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const P = require(path.join(ROOT, 'src/plan.js')), F = require(path.join(ROOT, 'src/flights.js'));
function photoNames(state, day) {
  const p = P.planFor(state, day); const at = (state.tour && state.tour.at) || 'HND';
  const it = F.itinerary(at, p.blocks.filter(b => ['sprint', 'retrieval'].includes(b.kind)), (state.tour && state.tour.visited) || []);
  const faces = ['Isaac Newton', 'Dmitri Mendeleev', 'Leonhard Euler', 'Adam Smith', 'Marjane Satrapi', 'Machado de Assis'];
  const leisure = (state.leisure || []).map(l => l.author).filter(Boolean);
  return [...new Set([...it.legs.filter(l => l.flight).map(l => l.flight.city), F.BY[it.endsAt] ? F.BY[it.endsAt].c : '', 'Stanford', 'Artificial intelligence', ...faces, ...leisure])].filter(Boolean);
}
module.exports = { photoNames };
if (require.main === module) { const st = require(path.join(ROOT, 'data/state.json')); const d = process.argv[2] || new Intl.DateTimeFormat('en-CA', { timeZone: st.tz }).format(new Date()); console.log(photoNames(st, d).join('\n')); }
