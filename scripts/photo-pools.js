// scripts/photo-pools.js — rotating photo pools so no two consecutive editions show the same picture
'use strict';
const POOLS = {
  stanford: ['Stanford', 'Stanford Hoover Tower', 'Stanford Memorial Church', 'Stanford Dish'],
  ai: ['Artificial intelligence', 'AI robot', 'AI data center', 'AI chip'],
  phys: [['Isaac Newton', 'Newton, who wrote the rules you are being tested on'], ['Albert Einstein', 'Einstein, who rewrote them'], ['Richard Feynman', 'Feynman, who explained them best'], ['Emmy Noether', 'Noether, who found why energy is conserved']],
  chem: [['Dmitri Mendeleev', 'Mendeleev, who put the table in order'], ['Marie Curie', 'Curie, two Nobel prizes, two elements'], ['Antoine Lavoisier', 'Lavoisier, who made chemistry quantitative'], ['Linus Pauling', 'Pauling, who explained the chemical bond']],
  math: [['Leonhard Euler', 'Euler, who did more math than anyone'], ['Carl Friedrich Gauss', 'Gauss, the prince of mathematicians'], ['Srinivasa Ramanujan', 'Ramanujan, who saw formulas'], ['Emmy Noether', 'Noether, algebra as a way of seeing']],
  econ: [['Adam Smith', 'Adam Smith, before the diagrams'], ['John Maynard Keynes', 'Keynes, who invented macro'], ['Elinor Ostrom', 'Ostrom, common pool resources, Nobel 2009'], ['Alfred Marshall', 'Marshall, who drew supply and demand']],
  eng: [['Marjane Satrapi', 'Marjane Satrapi, author of Persepolis'], ['George Orwell', 'Orwell, 1984 is next'], ['Wilfred Owen', 'Owen, whose poems opened the year'], ['Sophocles', 'Sophocles, Antigone in April']],
  port: [['Machado de Assis', 'Machado de Assis, who knew a lot about irony'], ['Clarice Lispector', 'Clarice Lispector'], ['Carlos Drummond de Andrade', 'Drummond'], ['Guimarães Rosa', 'Guimarães Rosa']]
};
const dayIndex = iso => Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse('2026-09-22T12:00:00Z')) / 86400000);
const pick = (key, iso) => { const p = POOLS[key]; return p[((dayIndex(iso) % p.length) + p.length) % p.length]; };
const allNames = () => [...new Set(Object.values(POOLS).flat().map(x => Array.isArray(x) ? x[0] : x))];
module.exports = { POOLS, pick, dayIndex, allNames };
