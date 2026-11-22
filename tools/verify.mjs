// verify.mjs — every figure and claim printed on the page must appear in the edition's own record
// of the story it belongs to. Run before rendering: node tools/verify.mjs (exits 1 on a mismatch).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const edition = JSON.parse(readFileSync(fileURLToPath(new URL('./edition.json', import.meta.url)), 'utf8'));
const record = (n) => JSON.stringify(edition.stories.find((story) => story.n === n) ?? null);
const plain = (text) => text.replaceAll('\u2212', '-').replaceAll('\u2013', '-').replace(/\s+/g, ' ');

// [what the page prints, the story it belongs to, the words the edition records it with]
const CLAIMS = [
  ['hero: 1.5C limit', 1, '1.5C'], ['objections closed at 03:00 GMT', 1, '03:00 GMT'],
  ['session at 07:00 GMT', 1, '0700 GMT'], ['hero: 400 drones', 2, '400 drones'],
  ['110 missiles', 2, '110 missiles'], ['three Dnipro bridges', 2, 'Three bridges'],
  ['750-kV substation', 2, '750-kV substation'], ['Crimea bridge threat', 2, 'Crimea bridge'],
  ['hero: two US bases', 3, 'Sheikh Isa and Al Juffair'], ['Fars reported', 3, 'Fars'],
  ['drones intercepted', 3, 'intercepted'], ['damage unverified', 3, 'not independently verified'],
  ['16 crew aboard', 4, 'Crew of 16'], ['crew reached lifeboats', 4, 'lifeboats'],
  ['Finland blames Ukraine', 4, 'Ukraine likely hit'], ['60 wounded', 5, 'wounded 60'],
  ['six of them children', 5, 'six children'], ['25 apartment blocks', 5, '25 apartment'],
  ['hero: 24 dead', 6, '24'], ['up to 300 aboard', 6, '300 people'], ['24 rescued', 6, 'rescued'],
  ['Likud invited', 7, 'Likud'], ['broadest government', 7, 'broadest possible government'],
  ['3 killed in Gaza', 8, 'three Palestinians'], ['World Central Kitchen', 8, 'World Central Kitchen'],
  ['11 dead after the capture', 9, '11 dead'], ['$5m reward', 9, '5-million'],
  ['2-hour power cuts', 10, '2 hours'], ['cuts every two days', 10, '2 hours every 2 days'],
  ['cuts from today', 10, 'from Nov 22'], ['SEC accounting probe', 11, 'SEC'],
  ['hero: 14% one-day fall', 11, '14 percent'], ['20% weekly loss', 11, '20 percent'],
  ['intensive care', 12, 'intensive care'], ['bowel obstruction', 12, 'bowel obstruction'],
  ['hospital says stable', 12, 'stable'], ['Marles rejects the report', 13, 'Marles'],
  ['budget office is wrong', 13, 'budget office'], ['FBI crime database hack', 14, 'hack'],
  ['teen gamer rescue', 15, 'gamer'], ['Vance and the midterms', 16, 'Vance'],
  ['15 km swim', 20, '15km'], ['4 km from the swimmer', 20, '4km'],
  ['23 November strike', 22, '23 Nov'], ['hero: 23,000 workers', 23, '23,000'],
  ['20 to 30 homes', 26, '20 to 30'], ['Fred Nile dies at 92', 27, '92'],
  ['70 years since 1956', 29, '70 years'], ['1956 Games', 29, '1956'],
  ['10 years of EU trade talks', 30, '10 years'], ['England 37-12', 31, '37-12'],
  ['Arsenal 2-2, Leeds 4-1', 33, '2-2'],
];

const missing = CLAIMS.filter(([, n, words]) => !plain(record(n)).includes(plain(words)));
for (const [claim, n, words] of missing) console.log(`MISSING: ${claim} | story ${n} | expected: ${words}`);
if (edition.stories.length !== 35) console.log(`edition holds ${edition.stories.length} stories, not 35`);
// Every item on the page is stamped with the edition's own date, so the date must be that day.
if (edition.day !== '2026-11-22') console.log(`edition day is ${edition.day}, not 2026-11-22`);
const bad = missing.length + (edition.stories.length === 35 ? 0 : 1) + (edition.day === '2026-11-22' ? 0 : 1);
console.log(bad ? `FACTS: ${bad} mismatch(es)` : `FACTS: ${CLAIMS.length} claims checked, all present in the edition; day ${edition.day}`);
process.exit(bad ? 1 : 0);
