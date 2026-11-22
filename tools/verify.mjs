// verify.mjs — every figure and claim printed on the page must appear in the edition's own record
// of the story it belongs to. Run before rendering: node tools/verify.mjs (exits 1 on a mismatch).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const edition = JSON.parse(readFileSync(fileURLToPath(new URL('./edition.json', import.meta.url)), 'utf8'));
const record = (n) => JSON.stringify(edition.stories.find((story) => story.n === n) ?? null);
const plain = (text) => text.replaceAll('\u2212', '-').replaceAll('\u2013', '-').replace(/\s+/g, ' ');

// [what the page prints, the story it belongs to, the words the edition records it with]
const CLAIMS = [
  ['warming will pass 1.5C', 1, '1.5C'], ['objections to 03:00 GMT', 1, '03:00 GMT'],
  ['approval session at 07:00 GMT', 1, '0700 GMT'], ['faster carbon removal', 1, 'carbon removal'],
  ['fossil fuels kept out', 1, 'fossil fuels'], ['400 drones', 2, '400 drones'],
  ['110 missiles', 2, '110 missiles'], ['at least 11 dead', 2, 'at least 11 dead'],
  ['seven dead in Kyiv', 2, 'seven in Kyiv'], ['three bridges', 2, 'Three bridges'],
  ['750-kV substation', 2, '750-kV substation'], ['blacking out several regions', 2, 'blackouts in several regions'],
  ['a day after the Crimea bridge threat', 2, "day after Putin's Crimea bridge threat"],
  ['two US bases in Bahrain', 3, 'Sheikh Isa and Al Juffair'], ['Fars reported', 3, 'Fars'],
  ['drones intercepted', 3, 'intercepted'], ['no injuries reported', 3, 'no injuries'],
  ['tankers hit in Hormuz', 3, 'Hormuz'], ['damage not independently verified', 3, 'not independently verified'],
  ['16 crew evacuated', 4, 'Crew of 16'], ['crew reached lifeboats', 4, 'lifeboats'],
  ['Ukraine was likely behind it', 4, 'Ukraine likely hit'], ['60 wounded', 5, 'wounded 60'],
  ['six of them children', 5, 'six children'], ['25 apartment blocks damaged', 5, '25 apartment'],
  ['24 dead in Bayelsa', 6, '24'], ['up to 300 aboard', 6, '300 people'],
  ['24 rescued', 6, 'rescued'], ['Likud invited', 7, 'Likud'],
  ['broadest possible government', 7, 'broadest possible government'], ['three Palestinians killed', 8, 'three Palestinians'],
  ['World Central Kitchen papers', 8, 'World Central Kitchen'], ['11 dead after the capture', 9, '11 dead'],
  ['$5m reward', 9, '5-million'], ['2-hour cuts every two days', 10, '2 hours'],
  ['power cuts from 22 November', 10, 'from Nov 22'], ['SEC accounting probe', 11, 'SEC'],
  ['14% one-day fall', 11, '14 percent'], ['20% weekly loss', 11, '20 percent'],
  ['intensive care', 12, 'intensive care'], ['bowel obstruction', 12, 'bowel obstruction'],
  ['hospital says stable', 12, 'stable'], ['Marles rejects the report', 13, 'Marles'],
  ['budget office is wrong', 13, 'budget office'], ['FBI crime database hack', 14, 'hack'],
  ['teen gamer rescue', 15, 'gamer'], ['Vance and the midterms', 16, 'Vance'],
  ['23,000 workers', 23, '23,000'], ['23 November strike', 22, '23 Nov'],
  ['20 to 30 homes', 26, '20 to 30'], ['Fred Nile dies at 92', 27, '92'],
  ['1956 Games', 29, '1956'], ['10 years of EU trade talks', 30, '10 years'],
  ['England 37-12', 31, '37-12'], ['Arsenal 2-2, Leeds 4-1', 33, '2-2'],
  ['4 km from the swimmer', 20, '4km'], ['15 km swim', 20, '15km'], ['70 years since 1956', 29, '70 years'],
];

const missing = CLAIMS.filter(([, n, words]) => !plain(record(n)).includes(plain(words)));
for (const [claim, n, words] of missing) console.log(`MISSING: ${claim} | story ${n} | expected: ${words}`);
if (edition.stories.length !== 35) console.log(`edition holds ${edition.stories.length} stories, not 35`);
const bad = missing.length + (edition.stories.length === 35 ? 0 : 1);
console.log(bad ? `FACTS: ${bad} mismatch(es)` : `FACTS: ${CLAIMS.length} claims checked, all present in the edition`);
process.exit(bad ? 1 : 0);
