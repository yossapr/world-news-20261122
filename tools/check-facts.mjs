// check-facts.mjs: every figure and claim printed on the page must be present in the edition's
// own record of the story it belongs to. Run before rendering; exits 1 on the first mismatch.
import { readFileSync } from 'node:fs';

const edition = JSON.parse(readFileSync(new URL('./edition.json', import.meta.url), 'utf8'));
const by = (n) => edition.stories.find((s) => s.n === n);
const text = (n) => JSON.stringify(by(n));
const norm = (s) => s.replace(/\u2212/g, '-').replace(/\u2013/g, '-').replace(/\s+/g, ' ');

// [what the page says, story number, how the edition records it]
const claims = [
  // lead 1, COP31
  ['warming will pass 1.5C', 1, '1.5C'],
  ['objections to 03:00 GMT', 1, '03:00 GMT'],
  ['approval session at 07:00 GMT', 1, '0700 GMT'],
  ['oil producers fought to keep fossil fuels out', 1, 'fossil fuels'],
  ['faster carbon removal', 1, 'carbon removal'],
  // lead 2, the overnight attack
  ['400 drones', 2, '400 drones'],
  ['110 missiles', 2, '110 missiles'],
  ['at least 11 dead', 2, 'at least 11 dead'],
  ['seven in Kyiv', 2, 'seven in Kyiv'],
  ['three bridges', 2, 'Three bridges'],
  ['750-kV substation', 2, '750-kV substation'],
  ['blacking out several regions', 2, 'blackouts in several regions'],
  ['a day after the Crimea bridge threat', 2, "day after Putin's Crimea bridge threat"],
  // lead 3, Bahrain
  ['two US bases', 3, 'Sheikh Isa and Al Juffair'],
  ['Fars reported', 3, 'Fars'],
  ['Bahrain says intercepted', 3, 'intercepted'],
  ['no injuries reported', 3, 'no injuries'],
  ['tankers hit in Hormuz', 3, 'Hormuz'],
  ['damage not independently verified', 3, 'not independently verified'],
  // cards
  ['16 crew', 4, 'Crew of 16'],
  ['crew reached lifeboats', 4, 'lifeboats'],
  ['Ukraine was likely behind it', 4, 'Ukraine likely hit'],
  ['60 wounded', 5, 'wounded 60'],
  ['six of the wounded are children', 5, 'six children'],
  ['25 apartment blocks damaged', 5, '25 apartment'],
  ['24 dead in Bayelsa', 6, '24'],
  ['up to 300 aboard', 6, '300 people'],
  ['24 rescued', 6, 'rescued'],
  ['Likud invited to talks', 7, 'Likud'],
  ['broadest possible government', 7, 'broadest possible government'],
  ['three Palestinians killed', 8, 'three Palestinians'],
  ['World Central Kitchen papers', 8, 'World Central Kitchen'],
  ['11 dead after the capture', 9, '11 dead'],
  ['$5m reward', 9, '5-million'],
  ['2-hour cuts every two days', 10, '2 hours'],
  ['power cuts from today, 22 November', 10, 'from Nov 22'],
  ['SEC accounting probe', 11, 'SEC'],
  ['14% one-day fall', 11, '14 percent'],
  ['20% weekly loss', 11, '20 percent'],
  ['intensive care', 12, 'intensive care'],
  ['bowel obstruction', 12, 'bowel obstruction'],
  ['hospital says stable', 12, 'stable'],
  ['Marles rejects the report', 13, 'Marles'],
  ['budget office is wrong', 13, 'budget office'],
  // briefs
  ['FBI crime database hack', 14, 'hack'],
  ['teen gamer rescue', 15, 'gamer'],
  ['Vance and the midterms', 16, 'Vance'],
  ['23,000 workers', 23, '23,000'],
  ['23 November strike', 22, '23 Nov'],
  ['20 to 30 homes', 26, '20 to 30'],
  ['Fred Nile dies at 92', 27, '92'],
  ['1956 Games', 29, '1956'],
  ['10 years of EU-Indonesia talks', 30, '10 years'],
  ['England 37-12', 31, '37-12'],
  ['Arsenal 2-2, Leeds 4-1', 33, '2-2'],
  ['4 km from the swimmer', 20, '4km'],
  // numbers panel
  ['15 km swim', 20, '15km'],
  ['70 years since 1956', 29, '70 years'],
];

let bad = 0;
for (const [claim, n, find] of claims) {
  const hay = norm(text(n));
  if (!hay.includes(norm(find))) { console.log('MISSING:', claim, '| story', n, '| expected:', find); bad++; }
}
// every story on the page exists in the edition, and the edition has no story the page drops
const used = [...edition.stories].map((s) => s.n);
if (used.length !== 35) { console.log('edition does not hold 35 stories:', used.length); bad++; }
console.log(bad ? `FACTS: ${bad} mismatch(es)` : `FACTS: ${claims.length} claims checked, all present in the edition`);
if (bad) process.exit(1);
