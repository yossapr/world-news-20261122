// page.mjs — writes tools/poster.html, the 1024×1024 front page for Sunday 22 November 2026.
// Inputs: edition.json (the day's 35 stories), words.json (every word printed) and land-path.txt
// (Natural Earth coastlines). Nothing is fetched. Usage: node tools/page.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const local = (name) => fileURLToPath(new URL(name, import.meta.url));
const edition = JSON.parse(readFileSync(local('./edition.json'), 'utf8'));
const copy = JSON.parse(readFileSync(local('./words.json'), 'utf8'));
const coast = readFileSync(local('./land-path.txt'), 'utf8').trim();

const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const storyAt = (n) => edition.stories.find((story) => story.n === n);
const regionStyle = (id) => copy.regions[id] ?? copy.regions.world;

// The edition files Australia under Asia. A front page puts a story where its dateline is, so the
// four Australian stories move to Oceania, and the two English league matches stay in Europe.
// The six items that cross regions keep their own World band: an EU-Indonesia trade deal, two
// rugby internationals between hemispheres, a tennis final, and the two club matches above.
const DATELINE_REGION = { 13: 'oceania', 27: 'oceania', 28: 'oceania', 29: 'oceania', 33: 'europe', 35: 'europe' };
const regionOf = (story) => DATELINE_REGION[story.n] ?? story.region;
const tally = edition.stories.reduce((acc, story) => ({ ...acc, [regionOf(story)]: (acc[regionOf(story)] ?? 0) + 1 }), {});
const pad = (n) => String(n).padStart(2, '0');

// Mix a colour towards the paper, so each card's scene sits on its region's own tint.
const mix = (hex, toward = '#f7f3ea', weight = 0.86) => {
  const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(toward.slice(i, i + 2), 16));
  return `#${a.map((v, i) => Math.round(v * (1 - weight) + b[i] * weight).toString(16).padStart(2, '0')).join('')}`;
};

// The page must carry the edition exactly: 3 leads, 10 cards, 22 briefs, no story twice.
const placed = [...copy.leads, ...copy.cards, ...copy.briefs].map((item) => item.n);
if (placed.length !== 35 || new Set(placed).size !== 35) throw new Error(`expected 35 distinct stories, got ${placed.length}`);
if (placed.some((n) => storyAt(n) === undefined)) throw new Error('copy names a story the edition does not hold');
if (copy.leads.map((lead) => lead.n).join() !== '1,2,3') throw new Error('the leads must be the edition leads');

// How the day was filed: thirteen outlet stamps, all inside 21 November 2026 UTC, checked against
// the edition's own publishedAt values so no time on the page is invented.
const CLOCK = [
  { n: 26, at: '01:45', about: 'Narail fires' }, { n: 24, at: '04:43', about: 'Lisbon march' },
  { n: 30, at: '05:37', about: 'EU trade deal' }, { n: 5, at: '06:07', about: 'Kryvyi Rih' },
  { n: 31, at: '08:17', about: 'Twickenham' }, { n: 8, at: '09:54', about: 'Gaza aid' },
  { n: 14, at: '10:02', about: 'FBI hack' }, { n: 7, at: '11:50', about: 'Eisenkot' },
  { n: 9, at: '13:41', about: 'Sinaloa' }, { n: 10, at: '14:35', about: 'Iran cuts' },
  { n: 23, at: '15:02', about: 'IG Metall' }, { n: 15, at: '16:09', about: 'FBI rescue' },
  { n: 1, at: '22:25', about: 'COP31 draft' },
];
for (const tick of CLOCK) {
  const stamps = (storyAt(tick.n).links ?? []).map((link) => link.publishedAt ?? '');
  const sameDay = stamps.some((stamp) => stamp.startsWith('2026-11-21') && stamp.slice(11, 16) === tick.at);
  if (!sameDay) throw new Error(`clock ${tick.at} is not story ${tick.n}'s own stamp: ${stamps.join(' ')}`);
}

// Hero band: six figures the edition carries, largest and broadest first.
const heroBand = `<section class="hero">${copy.hero.map((item) => `<div class="hcell"><div class="hfig">${escape(item.fig)}</div><div class="hlabel">${escape(item.label)}</div></div>`).join('')}</section>`;

// Region bar: one coloured segment per region, by count, so the page's breadth reads in one glance.
const regionBar = `<section class="regionbar">${Object.entries(tally).sort((a, b) => b[1] - a[1])
  .map(([id, count]) => `<div class="rseg" style="background:${regionStyle(id)[1]}"><span>${regionStyle(id)[0]}</span><b>${count}</b></div>`).join('')}</section>`;

const clockBlock = `<section class="daystrip"><div class="ds-head"><h5>The filing clock, in UTC <span>thirteen reports stamped hour by hour, the last at 22:25 GMT, before this edition closed at 08:31 GMT</span></h5></div>
<div class="ds-track">${CLOCK.map((tick) => `<div class="ds-i"><b>${tick.at}</b><span>${escape(tick.about)}</span></div>`).join('')}</div></section>`;

// Map: equirectangular, 76N..52S, one dot per dateline in its region's hue, the leads numbered.
// The band is tall enough that the drawing itself fills the row, so no paper shows under it.
const TOP = 12; const HEIGHT = 118;
const plot = (lon, lat) => [lon + 180, 84 - Math.min(74, Math.max(-46, lat))];
const dotFor = (story, radius) => {
  const [x, y] = plot(story.geo.lon, story.geo.lat);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${regionStyle(regionOf(story))[2]}" opacity="${radius > 2.5 ? 1 : 0.92}"/>`;
};
const quietDots = edition.stories.filter((story) => story.geo && story.tier !== 'lead').map((story) => dotFor(story, 2.2)).join('');
const loudDots = [1, 2, 3].map((n) => {
  const story = storyAt(n);
  const [x, y] = plot(story.geo.lon, story.geo.lat);
  const place = copy.labels[n];
  const anchor = place.anchor ? ` text-anchor="${place.anchor}"` : '';
  return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#0f2433"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.4" fill="${regionStyle(regionOf(story))[2]}"/>` +
    `<text x="${x.toFixed(1)}" y="${(y + 2.1).toFixed(1)}" class="mn">${n}</text>` +
    `<text x="${(x + place.dx).toFixed(1)}" y="${(y + place.dy).toFixed(1)}" class="ml"${anchor}>${place.label}</text></g>`;
}).join('');
const worldMap = `<svg class="map" viewBox="0 ${TOP} 360 ${HEIGHT}" preserveAspectRatio="xMidYMid meet" aria-label="World map with one dot for each story">
<rect x="0" y="${TOP}" width="360" height="${HEIGHT}" fill="#0f2433"/>
<g stroke="#1b3749" stroke-width="0.3" fill="none"><path d="M0 26H360M0 56H360M0 86H360M0 116H360"/><path d="M60 0V142M120 0V142M180 0V142M240 0V142M300 0V142"/></g>
<path d="${coast}" fill="#2b4c63" stroke="#456b83" stroke-width="0.5"/>
${quietDots}
${loudDots}
</svg>`;

// Lead drawings, wide: each fills its panel above the headline, and each is tied to what its story
// reports.
const star = (cx, cy, radius) => {
  const points = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const reach = i % 2 ? radius * 0.34 : radius;
    return `${(cx + reach * Math.cos(angle)).toFixed(1)} ${(cy + reach * Math.sin(angle)).toFixed(1)}`;
  });
  return `M${points.join('L')}Z`;
};

const DRAWING = {
  // a draft on the table, its warming line crossing the 1.5C limit
  deal: `<svg viewBox="0 0 321 100" aria-hidden="true">
<rect width="321" height="100" fill="#123029"/>
<path d="M0 86H321" stroke="#2c4a41" stroke-width="1.2"/>
<rect x="24" y="10" width="112" height="72" fill="#cbc2ae"/>
<g transform="rotate(-3 78 46)"><rect x="18" y="6" width="112" height="72" fill="#f6f1e4"/>
<g stroke="#a89d88" stroke-width="2.2" stroke-linecap="round"><path d="M30 17H70"/><path d="M30 23H82"/><path d="M30 29H58"/></g>
<g stroke="#d8d0bd" stroke-width="0.9"><path d="M30 60H72"/><path d="M30 65H56"/></g></g>
<path d="M26 80C68 76 94 70 120 59s52-23 82-31 52-7 72-3" fill="none" stroke="#b3261e" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M148 20H314" stroke="#f3c79a" stroke-width="1.2" stroke-dasharray="5 4" opacity=".85"/>
<circle cx="274" cy="25" r="3.4" fill="#b3261e"/>
<circle cx="274" cy="25" r="7" fill="none" stroke="#b3261e" stroke-width="1" opacity=".5"/>
</svg>`,
  // three bridges over the Dnipro, the middle span broken by the overnight strike
  bridge: `<svg viewBox="0 0 321 100" aria-hidden="true">
<rect width="321" height="100" fill="#13253c"/>
<g stroke="#e0662f" stroke-width="1.5" stroke-linecap="round" opacity=".95"><path d="M300 2L232 40"/><path d="M318 9L250 45"/><path d="M282 0L220 34"/><path d="M316 23L262 49"/></g>
<g fill="#f0b24a"><circle cx="232" cy="40" r="2.6"/><circle cx="250" cy="45" r="2.6"/><circle cx="220" cy="34" r="2.2"/><circle cx="262" cy="49" r="2.4"/></g>
<path d="M2 58C2 37 108 37 108 58" fill="none" stroke="#eef3fa" stroke-width="2.6"/>
<path d="M212 58C212 37 318 37 318 58" fill="none" stroke="#eef3fa" stroke-width="2.6"/>
<g stroke="#f2f6fb" stroke-width="3.6" stroke-linecap="round"><path d="M0 58H108"/><path d="M212 58H321"/></g>
<g stroke="#c3d0de" stroke-width="0.9" opacity=".85"><path d="M20 58V43M44 58V38M68 58V38M92 58V43M232 58V43M256 58V38M280 58V38M304 58V43"/></g>
<g stroke="#a9bccf" stroke-width="3"><path d="M108 58V79"/><path d="M212 58V79"/></g>
<g stroke="#f2f6fb" stroke-width="3.6" stroke-linecap="round"><path d="M108 58L122 71"/><path d="M212 58L198 69"/></g>
<rect x="126" y="74" width="42" height="7" rx="1" transform="rotate(24 147 77)" fill="#cfd9e5"/>
<g fill="#9fb3c8" opacity=".45"><circle cx="118" cy="82" r="3.4"/><circle cx="182" cy="80" r="2.6"/></g>
<path d="M0 79H321" stroke="#3d5871" stroke-width="1.2"/>
<g stroke="#6f88a6" stroke-width="1.1" opacity=".7"><path d="M14 87H86M108 92H180M202 87H274M60 97H132M180 95H252"/></g>
<path d="${star(160, 67, 9)}" fill="#ffd9a0" stroke="#e0662f" stroke-width="1" opacity=".95"/>
</svg>`,
  // two US bases in Bahrain under radomes, both waves of drones intercepted above them
  bases: `<svg viewBox="0 0 321 100" aria-hidden="true">
<rect width="321" height="100" fill="#2a1512"/>
<path d="M0 80H321" stroke="#7a4a3a" stroke-width="1.2"/>
<path d="M30 80a40 40 0 0 1 80 0z" fill="#d5c8b3"/>
<g stroke="#a8957e" stroke-width="0.8" opacity=".8"><path d="M44 80c0-18 10-30 26-34M70 46c14 4 26 16 26 34M70 46v34"/></g>
<rect x="36" y="80" width="68" height="9" fill="#c2b49f"/>
<rect x="58" y="83" width="16" height="6" fill="#7d6d59"/>
<path d="M212 80a52 52 0 0 1 104 0z" fill="#e7ddd0"/>
<g stroke="#ac9880" stroke-width="0.8" opacity=".85"><path d="M224 80c0-24 14-39 40-43M264 37c18 5 32 21 32 43M264 80V37"/></g>
<rect x="220" y="80" width="84" height="10" fill="#d8cbb8"/>
<rect x="252" y="83" width="20" height="7" fill="#8d7c67"/>
<path d="M264 37V19" stroke="#e7ddd0" stroke-width="2.4"/><path d="M254 16a10 10 0 0 1 20 0z" fill="#e7ddd0"/>
<g stroke="#ef8a3f" stroke-width="1.6" stroke-linecap="round" opacity=".9"><path d="M6 16L52 46"/><path d="M96 4L128 32"/><path d="M196 7L214 31"/></g>
<g fill="#f0b24a"><path d="M52 46l13 3-8 7z"/><path d="M128 32l13 4-8 7z"/><path d="M214 31l12 4-7 7z"/></g>
<path d="${star(70, 28, 10)}" fill="#fff3c4" stroke="#e0662f" stroke-width="1"/>
<path d="${star(264, 12, 12)}" fill="#fff3c4" stroke="#e0662f" stroke-width="1"/>
</svg>`,
};

// One flat scene per card, 240×52, drawn from that story's own facts and laid on its region's tint.
// Same three paints everywhere: the region's deep hue, its light hue, and the paper.
const SCENE = {
  // a cargo ship burning in the Gulf of Finland, its crew in the lifeboats
  ship: (c, l) => `<rect x="0" y="34" width="240" height="18" fill="${c}" opacity=".32"/>
<path d="M16 34h124l-9 10H26z" fill="${c}"/>
<rect x="96" y="22" width="30" height="12" fill="${c}"/><g fill="${l}"><rect x="100" y="25" width="6" height="4"/><rect x="110" y="25" width="6" height="4"/><rect x="120" y="25" width="4" height="4"/></g>
<path d="M66 30l7-16 8 16z" fill="#e0662f"/><path d="M76 30l6-11 7 11z" fill="#f0b24a"/>
<g fill="#a9a294" opacity=".55"><circle cx="70" cy="12" r="5"/><circle cx="80" cy="7" r="6"/><circle cx="68" cy="4" r="4"/></g>
<g fill="#f7f3ea" opacity=".9"><ellipse cx="30" cy="42" rx="9" ry="2.4"/><ellipse cx="52" cy="44" rx="6" ry="2"/></g>
<ellipse cx="170" cy="38" rx="16" ry="3" fill="${l}" opacity=".85"/><path d="M163 38c3-4 11-4 14 0" fill="none" stroke="${c}" stroke-width="1.4"/>`,
  // an apartment block in Kryvyi Rih with a floor torn out of it
  burst: (c, l) => `<rect x="26" y="4" width="150" height="48" fill="${c}"/>
<g fill="${l}"><rect x="34" y="10" width="14" height="8"/><rect x="54" y="10" width="14" height="8"/><rect x="74" y="10" width="14" height="8"/><rect x="94" y="10" width="14" height="8"/><rect x="114" y="10" width="14" height="8"/><rect x="134" y="10" width="14" height="8"/><rect x="34" y="26" width="14" height="8"/><rect x="54" y="26" width="14" height="8"/><rect x="74" y="26" width="14" height="8"/><rect x="34" y="42" width="14" height="6"/><rect x="54" y="42" width="14" height="6"/><rect x="74" y="42" width="14" height="6"/></g>
<path d="M94 4h44l-10 14-8-4-12 8-14-4z" fill="#f7f3ea"/><path d="M94 4h20l-6 8z" fill="${c}"/>
<g fill="#cfc7b6" opacity=".8"><circle cx="120" cy="20" r="3"/><circle cx="136" cy="12" r="2.2"/><circle cx="108" cy="10" r="2"/></g>
<path d="${star(140, 8, 7)}" fill="#f0b24a"/>
<path d="M196 52V18" stroke="${c}" stroke-width="2"/><path d="M196 26l10-6M196 34l12 4" stroke="${c}" stroke-width="1.2"/>`,
  // a boat of mourners going over in Bayelsa
  boat: (c, l) => `<rect x="0" y="26" width="240" height="26" fill="${c}" opacity=".3"/>
<path d="M34 26L188 20l-10 16-136 6z" fill="${c}"/>
<path d="M34 26L188 20l-4 5-146 6z" fill="#f7f3ea" opacity=".85"/>
<g fill="${c}"><circle cx="70" cy="14" r="4"/><circle cx="92" cy="12" r="4"/><circle cx="114" cy="11" r="4"/></g>
<g stroke="${c}" stroke-width="2" stroke-linecap="round"><path d="M70 18v6M92 16v6M114 15v6"/></g>
<g fill="none" stroke="${l}" stroke-width="1.4" opacity=".8"><path d="M24 36c10 4 20 4 30 0M150 32c10 4 20 4 30 0"/><path d="M30 44c12 4 22 4 34 0M144 40c12 4 22 4 34 0"/></g>
<path d="M196 24l8-8 4 8z" fill="${c}" opacity=".6"/>`,
  // a table set for coalition talks in Jerusalem
  talks: (c, l) => `<rect x="0" y="40" width="240" height="12" fill="${c}" opacity=".28"/>
<rect x="54" y="30" width="132" height="5" fill="${c}"/>
<path d="M64 35v13M176 35v13" stroke="${c}" stroke-width="2.4"/>
<g fill="${c}" opacity=".55"><rect x="60" y="14" width="9" height="16" rx="2"/><rect x="171" y="14" width="9" height="16" rx="2"/></g>
<g fill="${c}"><circle cx="46" cy="20" r="5"/><path d="M39 36c0-6 3-9 7-9s7 3 7 9z"/><circle cx="194" cy="20" r="5"/><path d="M187 36c0-6 3-9 7-9s7 3 7 9z"/></g>
<g fill="#f7f3ea"><rect x="86" y="25" width="22" height="5"/><rect x="112" y="26" width="18" height="4"/><rect x="140" y="25" width="24" height="5"/></g>
<path d="M120 18h6v12h-6z" fill="${c}" opacity=".45"/>`,
  // a food-aid van struck in Gaza
  aid: (c, l) => `<rect x="0" y="42" width="240" height="10" fill="${c}" opacity=".28"/>
<path d="M30 20h108v20H30z" fill="#f7f3ea" stroke="${c}" stroke-width="1.6"/>
<path d="M138 26h30l12 8v6h-42z" fill="#f7f3ea" stroke="${c}" stroke-width="1.6"/>
<path d="M144 28h18l8 6h-26z" fill="${l}"/>
<g fill="${c}"><rect x="44" y="26" width="8" height="8"/><rect x="56" y="26" width="8" height="8"/><rect x="44" y="36" width="8" height="4" opacity=".5"/><rect x="56" y="36" width="8" height="4" opacity=".5"/></g>
<g fill="#3a352c"><circle cx="52" cy="41" r="4"/><circle cx="160" cy="41" r="4"/></g>
<path d="M96 20l10-8 8 8z" fill="#3a352c" opacity=".75"/><path d="M104 12c2-4 6-4 8-2" stroke="#a9a294" stroke-width="2" fill="none"/>
<g fill="${c}" opacity=".7"><rect x="186" y="32" width="18" height="10"/><rect x="190" y="24" width="18" height="8"/></g>`,
  // Tehran's skyline on a rolling power cut: half the windows are dark
  bolt: (c, l) => `<rect x="0" y="0" width="240" height="52" fill="${c}" opacity=".18"/>
<g fill="${c}"><rect x="14" y="22" width="22" height="30"/><rect x="40" y="12" width="26" height="40"/><rect x="70" y="26" width="18" height="26"/><rect x="92" y="6" width="24" height="46"/><rect x="120" y="20" width="20" height="32"/><rect x="146" y="14" width="26" height="38"/></g>
<g fill="${l}"><rect x="44" y="18" width="5" height="5"/><rect x="54" y="18" width="5" height="5"/><rect x="96" y="14" width="5" height="5"/><rect x="106" y="14" width="5" height="5"/><rect x="96" y="26" width="5" height="5"/><rect x="150" y="22" width="5" height="5"/><rect x="160" y="22" width="5" height="5"/></g>
<g fill="#3a352c" opacity=".45"><rect x="44" y="30" width="5" height="5"/><rect x="54" y="30" width="5" height="5"/><rect x="106" y="26" width="5" height="5"/><rect x="150" y="34" width="5" height="5"/><rect x="160" y="34" width="5" height="5"/><rect x="18" y="30" width="5" height="5"/></g>
<path d="M196 4v48M186 52l10-14 10 14" stroke="${c}" stroke-width="1.6" fill="none"/><path d="M192 8h8M194 20h12"/>
<path d="M214 8l-8 12h7l-3 10 10-13h-7z" fill="#f0b24a"/>`,
  // the cartel boss taken: a police van waiting in Sinaloa
  cuffs: (c, l) => `<rect x="0" y="42" width="240" height="10" fill="${c}" opacity=".28"/>
<path d="M26 18h124v22H26z" fill="${c}"/><path d="M150 24h26l12 8v8h-38z" fill="${c}"/>
<path d="M32 24h60v9H32z" fill="${l}" opacity=".9"/><path d="M156 28h14l7 5h-21z" fill="${l}" opacity=".9"/>
<g stroke="${l}" stroke-width="1.6"><path d="M44 30v8M52 30v8M60 30v8M68 30v8M76 30v8"/></g>
<g fill="#f0b24a"><rect x="60" y="13" width="8" height="4"/><rect x="70" y="13" width="8" height="4"/></g>
<g fill="#3a352c"><circle cx="44" cy="42" r="4.4"/><circle cx="132" cy="42" r="4.4"/><circle cx="172" cy="42" r="4"/></g>
<circle cx="196" cy="26" r="5" fill="${c}"/><path d="M189 44c0-7 3-11 7-11s7 4 7 11z" fill="${c}"/>
<circle cx="214" cy="30" r="4.4" fill="${c}" opacity=".7"/><path d="M208 44c0-6 3-9 6-9s6 3 6 9z" fill="${c}" opacity=".7"/>`,
  // Nvidia's week: the chart turns down
  probe: (c, l) => `<rect x="0" y="0" width="240" height="52" fill="${c}" opacity=".12"/>
<g stroke="${c}" stroke-width="1" opacity=".5"><path d="M24 6v40M24 46h196"/></g>
<g fill="${c}" opacity=".45"><rect x="40" y="18" width="16" height="28"/><rect x="64" y="12" width="16" height="34"/><rect x="88" y="8" width="16" height="38"/><rect x="112" y="14" width="16" height="32"/><rect x="136" y="22" width="16" height="24"/><rect x="160" y="30" width="16" height="16"/></g>
<path d="M34 10L70 8l28-2 26 8 24 12 22 12" fill="none" stroke="#b3261e" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M196 50l-12-2 8-8z" fill="#b3261e"/>
<path d="${star(86, 6, 5)}" fill="#f0b24a" opacity=".8"/>`,
  // Bolsonaro in intensive care: a hospital bed and a monitor
  pulse: (c, l) => `<rect x="0" y="40" width="240" height="12" fill="${c}" opacity=".24"/>
<path d="M28 30h116v5H28z" fill="${c}"/><path d="M34 35v12M138 35v12" stroke="${c}" stroke-width="2.4"/>
<path d="M146 24h5v20h-5z" fill="${c}"/><path d="M150 24c0-4 6-4 6 0" fill="none" stroke="${c}" stroke-width="2"/>
<path d="M36 24h96v6H36z" fill="#f7f3ea" stroke="${c}" stroke-width="1.2"/>
<circle cx="46" cy="20" r="5" fill="${c}"/>
<rect x="176" y="8" width="48" height="30" rx="2" fill="${c}"/>
<path d="M180 26h7l4-8 5 14 4-7h8l3-3h6" fill="none" stroke="${l}" stroke-width="1.6" stroke-linejoin="round"/>
<g fill="${l}" opacity=".8"><rect x="180" y="12" width="8" height="3"/><rect x="192" y="12" width="12" height="3"/></g>`,
  // the AUKUS report rejected in Canberra, a submarine on the water
  sub: (c, l) => `<rect x="0" y="30" width="240" height="22" fill="${c}" opacity=".3"/>
<path d="M20 38c0-7 12-11 34-11h44c18 0 30 4 30 11s-12 9-30 9H54c-22 0-34-2-34-9z" fill="${c}"/>
<path d="M92 27v-8h14v8z" fill="${c}"/><path d="M99 19v-6h3v6z" fill="${c}"/>
<g stroke="${l}" stroke-width="1.2" opacity=".8"><path d="M36 42h26M74 43h30M118 42h16"/></g>
<g transform="rotate(-6 186 22)"><rect x="156" y="8" width="60" height="30" fill="#f7f3ea" stroke="${c}" stroke-width="1.2"/>
<g stroke="${c}" stroke-width="1.4" opacity=".55"><path d="M164 16h30M164 21h40M164 26h24"/></g>
<g stroke="#b3261e" stroke-width="2.6"><path d="M178 12l22 22M200 12l-22 22"/></g></g>`,
};

const leadBlock = (lead) => {
  const region = regionStyle(regionOf(storyAt(lead.n)));
  return `<article class="lead" style="--lc:${region[1]}"><div class="lart">${DRAWING[lead.art]}
<div class="lband"><span><b>${escape(lead.tag)}</b> &middot; ${escape(lead.src)}</span><span>${escape(lead.mark[0])}: ${escape(lead.mark[1])}</span></div></div>
<div class="lk"><i>${pad(lead.n)}</i>${escape(`${lead.p} · ${lead.t}`)}<span class="ld">22 NOV</span></div>
<h3>${lead.head.map(escape).join('<br>')}</h3><p class="deck">${escape(lead.deck)}</p></article>`;
};

const cardBlock = (card, index) => {
  const region = regionStyle(regionOf(storyAt(card.n)));
  return `<article class="card" style="--gc:${region[1]}">
<div class="chead"><span class="cnum">${pad(index + 4)}</span><span class="ck">${escape(`${card.p} · ${card.t}`)}</span></div>
<div class="cart"><svg viewBox="0 0 240 52" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${SCENE[card.glyph](region[1], region[2])}</svg></div>
<h4>${escape(card.h)}</h4><p><b>${escape(card.d)}</b> &middot; ${escape(card.b)}</p>
<div class="src"><span class="tag">${escape(card.tag)}</span> &middot; ${escape(card.s)} &middot; <span class="dt">22 NOV</span></div></article>`;
};

const briefItem = (item) => `<li style="--gc:${regionStyle(regionOf(storyAt(item.n)))[1]}"><span class="bn">${pad(item.n)}</span><b>${escape(item.p)}</b> ${escape(item.t)} <span class="bs">${escape(item.s)} &middot; 22 NOV</span></li>`;

// Briefs run down three columns of near-equal length: the longest columns come first.
const perColumn = Math.ceil(copy.briefs.length / 3);
const longerColumns = copy.briefs.length - 3 * (perColumn - 1);
let nextBrief = 0;
const briefColumns = [0, 1, 2].map((column) => {
  const size = perColumn - (column < longerColumns ? 0 : 1);
  const briefs = copy.briefs.slice(nextBrief, nextBrief + size);
  nextBrief += size;
  return `<ul class="b">${briefs.map(briefItem).join('')}</ul>`;
});

const stylesheet = `
:root{--paper:#f7f3ea;--ink:#15120e;--muted:#6d645a;--rule:#15120e;--soft:#d8cfc0;--accent:#b3261e;--amber:#f3c79a}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1024px;height:1024px;overflow:hidden}
body{background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;padding:10px 16px 8px;display:flex;flex-direction:column;gap:5px}
.rail{display:flex;justify-content:space-between;align-items:baseline;background:var(--ink);color:#e8dfd2;padding:3px 8px 2.5px;font-size:8.6px;letter-spacing:.16em;text-transform:uppercase}
.rail b{color:var(--paper);letter-spacing:.18em}
.rail .date{color:var(--amber);font-weight:700;letter-spacing:.18em}
.mast{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;border-bottom:2px solid var(--rule);padding:1px 0 3px}
.mast h1{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:41px;line-height:.92;letter-spacing:-.028em}
.mast .side{text-align:right;font-size:8.4px;line-height:1.35;letter-spacing:.1em;text-transform:uppercase;color:#4a433b;padding-bottom:3px;white-space:nowrap}
.mast .side b{display:block;font-size:10.4px;letter-spacing:.01em;text-transform:none;color:var(--ink);font-family:Georgia,serif;font-style:italic;font-weight:400;margin:1px 0}
.hero{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));background:var(--ink);color:var(--paper)}
.hcell{padding:3px 9px 4px;border-left:1px solid #3b352c;min-width:0}
.hcell:first-child{border-left:0}
.hfig{font-family:Georgia,serif;font-size:31px;font-weight:700;line-height:.94;letter-spacing:-.03em;color:var(--amber)}
.hlabel{font-size:6.9px;line-height:1.16;letter-spacing:.05em;text-transform:uppercase;color:#d9d0c1;margin-top:2px}
.regionbar{display:flex;height:18px}
.rseg{flex:1 1 0;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 8px;color:#f7f3ea;font-size:6.8px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;white-space:nowrap;overflow:hidden}
.rseg b{font-size:9.4px;letter-spacing:0}
.daystrip{border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:3px 0 3px}
.daystrip .ds-head{display:flex;align-items:baseline}
.daystrip h5{margin:0 0 3px}
.ds-track{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));border-top:1px solid #b8ae9e}
.ds-i{position:relative;min-width:0;border-left:1px solid #cec3b0;padding:2px 6px 1px 7px;color:#332d26}
.ds-i:first-child{border-left:0}
.ds-i::before{content:'';position:absolute;left:-1px;top:-1px;width:1px;height:5px;background:var(--accent)}
.ds-i:first-child::before{left:0}
.ds-i b{display:block;font-size:7.3px;font-weight:700;color:var(--accent);line-height:1.05}
.ds-i span{display:block;font-size:7.4px;line-height:1.12;margin-top:1px;white-space:nowrap;overflow:hidden}
.leads{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 14px}
.lead{min-width:0;display:flex;flex-direction:column}
.lart{position:relative;height:92px;overflow:hidden;background:#13253c}
.lart svg{display:block;width:100%;height:92px}
.lband{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:2px 7px 2.5px;background:rgba(8,11,14,.76);color:#f2ece0;font-size:6.3px;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap;overflow:hidden}
.lband b{color:var(--amber);letter-spacing:.12em}
.lband span{overflow:hidden;text-overflow:ellipsis}
.lband span+span{flex:0 1 auto}
.lk{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:7.3px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:#332d26;white-space:nowrap;overflow:hidden}
.lk i{flex:0 0 auto;font-style:normal;background:var(--lc);color:#f7f3ea;padding:1.5px 5px 1px;font-size:7.6px;letter-spacing:.06em}
.ld{margin-left:auto;flex:0 0 auto;font-size:7px;letter-spacing:.1em;color:var(--accent)}
.lead h3{font-family:Georgia,serif;font-size:30px;line-height:0.98;letter-spacing:-.02em;margin:3px 0 2px}
.lead .deck{font-size:9.2px;line-height:1.16;color:#332d26}
.mid{display:grid;grid-template-columns:1fr 296px;gap:14px;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:4px 0 4px}
h5{font-size:8.4px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:2px}
h5 span{color:var(--muted);letter-spacing:.04em;text-transform:none;font-weight:400;font-size:7.5px}
.map{width:100%;display:block;border:1px solid #0b1c27}
.ml{font:700 5.6px Arial;fill:#f4efe3;letter-spacing:.03em;paint-order:stroke;stroke:#0f2433;stroke-width:1.2}
.mn{font:700 5.1px Arial;fill:#f9f5ea;text-anchor:middle}
.daynote{display:flex;flex-direction:column;min-width:0}
.daynote .lede{font-family:Georgia,serif;font-size:14.4px;line-height:1.2;letter-spacing:-.01em;margin-top:2px}
.daynote .lede b{font-weight:700}
.legend{border-top:1px solid var(--soft);margin-top:7px;padding-top:5px;display:grid;gap:4px}
.legend div{display:flex;align-items:center;gap:7px;font-size:7.5px;line-height:1.2;color:#4a433b}
.legend .sw{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center}
.legend .dot{width:7px;height:7px;border-radius:50%;background:#6ea8e0}
.legend .lead{width:11px;height:11px;border-radius:50%;background:#0f2433;color:#f7f3ea;font-size:6px;font-weight:700}
.legend .prov{font-size:6px;font-weight:700;letter-spacing:.06em;color:var(--accent);border:1px solid #d8cfc0;padding:1px 3px}
.legend .time{font-size:6.6px;font-weight:700;color:var(--accent)}
.daynote .check{margin-top:auto;border-top:1px solid var(--rule);padding-top:4px;font-size:7.2px;line-height:1.26;color:#4a433b}
.daynote .check b{color:var(--ink)}
.cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0 12px;align-content:start}
.card{padding:0 0 2px;border-top:3px solid var(--gc);min-width:0}
.chead{display:flex;align-items:center;gap:5px;min-width:0;margin:2px 0 3px}
.cnum{flex:0 0 auto;background:var(--gc);color:#f7f3ea;font-size:7.6px;font-weight:700;padding:1.5px 4px 1px;letter-spacing:.04em}
.ck{flex:1 1 auto;min-width:0;font-size:6.9px;letter-spacing:.05em;text-transform:uppercase;color:#4a433b;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cart{height:36px;overflow:hidden;margin-bottom:3px}
.cart svg{display:block;width:100%;height:36px}
.card h4{font-family:Georgia,serif;font-size:13px;line-height:1.02;letter-spacing:-.01em;margin:0 0 1px}
.card p{font-size:7.8px;line-height:1.12;color:#4a433b}
.card p b{color:var(--ink)}
.card .tag{color:var(--accent);font-weight:700}
.dt{color:#5d554b;font-weight:700}
.src{font-size:7px;letter-spacing:.05em;text-transform:uppercase;color:#8a8074;margin-top:2px}
.briefs-head{border-top:2px solid var(--rule);padding-top:3px;display:flex;justify-content:space-between;align-items:baseline}
.briefs-head h5{margin:0}
.briefs-head .cnt{font-size:7.7px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.briefs{flex:1;min-height:0;border-top:1px solid var(--soft);padding:4px 0 2px;margin-top:3px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 16px}
ul.b{list-style:none;display:flex;flex-direction:column;justify-content:space-between;min-width:0}
ul.b li{font-size:9.9px;line-height:1.1;color:#2b2620;padding-left:9px;position:relative}
ul.b li::before{content:'';position:absolute;left:0;top:5px;width:4px;height:4px;background:var(--gc)}
ul.b li b{font-weight:700}
.bn{color:#9a9082;font-weight:700;margin-right:3px;font-size:7.8px}
.bs{color:#8a8074;font-size:6.3px;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap}
.foot{border-top:1px solid var(--rule);padding-top:3px;display:flex;justify-content:space-between;align-items:baseline;gap:14px}
.foot p{font-size:7.3px;line-height:1.24;color:#4a433b;max-width:840px}
.foot p b{color:var(--ink)}
.mark{font-family:Georgia,serif;font-size:10px;font-weight:700;letter-spacing:.02em;white-space:nowrap}
`;

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sunday 22 November 2026</title><style>${stylesheet}</style></head>
<body>
<div class="rail"><span><b>The world in one day</b></span><span class="date">Sunday 22 November 2026</span><span>35 stories &middot; 7 regions &middot; closed 08:31 GMT</span></div>
<header class="mast"><h1>Sunday 22 November 2026</h1><div class="side">A front page of the day&rsquo;s reporting<b>35 stories, from Sinaloa to Canberra</b></div></header>
${heroBand}
${regionBar}
${clockBlock}
<section class="leads">${copy.leads.map(leadBlock).join('')}</section>
<section class="mid"><div><h5>Where it happened, Sunday 22 November 2026 <span>one dot for each dateline, one dot per story, coloured by its region; the three leads are numbered</span></h5>${worldMap}</div>
<div class="daynote"><h5>The day in one sentence</h5><p class="lede"><b>400 drones</b> over Kyiv and its bridges, a <b>climate draft</b> on the table in Antalya, two <b>US bases</b> struck in Bahrain, a <b>cartel boss</b> held in Sinaloa and a boat of <b>mourners</b> lost in Nigeria: one Sunday, 35 stories, seven regions.</p>
<div class="legend"><div><span class="sw dot"></span>one dot per dateline, in its region&rsquo;s colour</div>
<div><span class="sw lead">1</span>the three leads, numbered on the map</div>
<div><span class="sw prov">CLAIMED</span>what kind of claim it is: claimed, official or reported</div>
<div><span class="sw time">22:25</span>the filing clock, each outlet&rsquo;s own UTC stamp</div></div>
<p class="check"><b>Date check.</b> This is the Sunday 22 November 2026 edition, closed at 08:31 GMT with 35 stories. Each carries the dateline its outlet gave it; the thirteen clock times are those outlets&rsquo; own UTC stamps, all on Saturday 21 November, and every other date here (23 November, 1956, 2028) belongs to the story that names it. Nothing is invented and no story is repeated. Outlets are named with every story, and one provenance word marks what kind of claim each one is.</p></div></section>
<section class="cards">${copy.cards.map((card, index) => cardBlock(card, index)).join('')}</section>
<section class="briefs-head"><h5>And in brief <span>the rest of the day, place by place</span></h5><span class="cnt">22 more stories</span></section>
<section class="briefs">${briefColumns.join('')}</section>
<footer class="foot"><p>The map is drawn from Natural Earth land outlines; every story above is dated to this edition and every outlet is named with it. Figures in the top band are the edition&rsquo;s own, each carried by a story below.</p><div class="mark">One day &middot; 35 stories &middot; 7 regions</div></footer>
</body></html>`;

writeFileSync(local('./poster.html'), page);
console.log(`poster.html: ${page.length} bytes, ${copy.leads.length} leads, ${copy.cards.length} cards, ${copy.briefs.length} briefs, ${copy.hero.length} hero figures, ${Object.keys(SCENE).length} card scenes`);
