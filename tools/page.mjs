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
const tally = edition.stories.reduce((acc, story) => ({ ...acc, [story.region]: (acc[story.region] ?? 0) + 1 }), {});
const pad = (n) => String(n).padStart(2, '0');

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

// Map: equirectangular, 64N..50S, one dot per dateline in its region's hue, the leads numbered.
const FRAME = { top: 20, height: 114 };
const plot = (lon, lat) => [lon + 180, 84 - Math.min(64, Math.max(-50, lat))];
const dotFor = (story, radius) => {
  const [x, y] = plot(story.geo.lon, story.geo.lat);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${regionStyle(story.region)[2]}" opacity="${radius > 2.5 ? 1 : 0.92}"/>`;
};
const quietDots = edition.stories.filter((story) => story.geo && story.tier !== 'lead').map((story) => dotFor(story, 2.2)).join('');
const loudDots = [1, 2, 3].map((n) => {
  const story = storyAt(n);
  const [x, y] = plot(story.geo.lon, story.geo.lat);
  const place = copy.labels[n];
  const anchor = place.anchor ? ` text-anchor="${place.anchor}"` : '';
  return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="#0f2433"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.4" fill="${regionStyle(story.region)[2]}"/>` +
    `<text x="${x.toFixed(1)}" y="${(y + 2.1).toFixed(1)}" class="mn">${n}</text>` +
    `<text x="${(x + place.dx).toFixed(1)}" y="${(y + place.dy).toFixed(1)}" class="ml"${anchor}>${place.label}</text></g>`;
}).join('');
const worldMap = `<svg class="map" viewBox="0 ${FRAME.top} 360 ${FRAME.height}" preserveAspectRatio="xMidYMid meet" aria-label="World map with one dot for each story">
<rect x="0" y="${FRAME.top}" width="360" height="${FRAME.height}" fill="#0f2433"/>
<g stroke="#1b3749" stroke-width="0.35" fill="none"><path d="M0 24H360M0 54H360M0 84H360M0 114H360"/><path d="M60 0V142M120 0V142M180 0V142M240 0V142M300 0V142"/></g>
<path d="${coast}" fill="#2b4c63" stroke="#456b83" stroke-width="0.55"/>
${quietDots}
${loudDots}
</svg>`;

// Lead drawings, wide: each fills its 321x112 panel above the headline, and each is tied to what
// its story reports.
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
  deal: `<svg viewBox="0 0 321 112" aria-hidden="true">
<rect width="321" height="112" fill="#123029"/>
<path d="M0 96H321" stroke="#2c4a41" stroke-width="1.2"/>
<rect x="24" y="12" width="118" height="80" fill="#cbc2ae"/>
<g transform="rotate(-3 82 52)"><rect x="18" y="8" width="118" height="80" fill="#f6f1e4"/>
<g stroke="#a89d88" stroke-width="2.2" stroke-linecap="round"><path d="M30 20H72"/><path d="M30 26H84"/><path d="M30 32H60"/></g>
<g stroke="#d8d0bd" stroke-width="0.9"><path d="M30 66H74"/><path d="M30 71H58"/></g></g>
<path d="M28 88C70 84 96 78 122 66s52-26 82-34 52-8 72-4" fill="none" stroke="#b3261e" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M150 22H314" stroke="#f3c79a" stroke-width="1.2" stroke-dasharray="5 4" opacity=".85"/>
<circle cx="276" cy="28" r="3.4" fill="#b3261e"/>
<circle cx="276" cy="28" r="7" fill="none" stroke="#b3261e" stroke-width="1" opacity=".5"/>
</svg>`,
  // three bridges over the Dnipro, the middle span broken by the overnight strike
  bridge: `<svg viewBox="0 0 321 112" aria-hidden="true">
<rect width="321" height="112" fill="#13253c"/>
<g stroke="#e0662f" stroke-width="1.5" stroke-linecap="round" opacity=".95"><path d="M300 2L232 44"/><path d="M318 10L250 50"/><path d="M282 0L220 38"/><path d="M316 26L262 54"/></g>
<g fill="#f0b24a"><circle cx="232" cy="44" r="2.6"/><circle cx="250" cy="50" r="2.6"/><circle cx="220" cy="38" r="2.2"/><circle cx="262" cy="54" r="2.4"/></g>
<path d="M2 64C2 40 108 40 108 64" fill="none" stroke="#eef3fa" stroke-width="2.6"/>
<path d="M212 64C212 40 318 40 318 64" fill="none" stroke="#eef3fa" stroke-width="2.6"/>
<g stroke="#f2f6fb" stroke-width="3.6" stroke-linecap="round"><path d="M0 64H108"/><path d="M212 64H321"/></g>
<g stroke="#c3d0de" stroke-width="0.9" opacity=".85"><path d="M20 64V48M44 64V42M68 64V42M92 64V48M232 64V48M256 64V42M280 64V42M304 64V48"/></g>
<g stroke="#a9bccf" stroke-width="3"><path d="M108 64V88"/><path d="M212 64V88"/></g>
<g stroke="#f2f6fb" stroke-width="3.6" stroke-linecap="round"><path d="M108 64L122 78"/><path d="M212 64L198 76"/></g>
<rect x="126" y="82" width="42" height="7" rx="1" transform="rotate(24 147 85)" fill="#cfd9e5"/>
<g fill="#9fb3c8" opacity=".45"><circle cx="118" cy="92" r="3.4"/><circle cx="182" cy="90" r="2.6"/></g>
<path d="M0 88H321" stroke="#3d5871" stroke-width="1.2"/>
<g stroke="#6f88a6" stroke-width="1.1" opacity=".7"><path d="M14 96H86M108 102H180M202 96H274M60 108H132M180 106H252"/></g>
<path d="${star(160, 74, 9)}" fill="#ffd9a0" stroke="#e0662f" stroke-width="1" opacity=".95"/>
</svg>`,
  // two US bases in Bahrain under radomes, both waves of drones intercepted above them
  bases: `<svg viewBox="0 0 321 112" aria-hidden="true">
<rect width="321" height="112" fill="#2a1512"/>
<path d="M0 90H321" stroke="#7a4a3a" stroke-width="1.2"/>
<path d="M30 90a40 40 0 0 1 80 0z" fill="#d5c8b3"/>
<g stroke="#a8957e" stroke-width="0.8" opacity=".8"><path d="M44 90c0-20 10-34 26-38M70 52c14 5 26 18 26 38M70 52v38"/></g>
<rect x="36" y="90" width="68" height="10" fill="#c2b49f"/>
<rect x="58" y="93" width="16" height="7" fill="#7d6d59"/>
<path d="M212 90a52 52 0 0 1 104 0z" fill="#e7ddd0"/>
<g stroke="#ac9880" stroke-width="0.8" opacity=".85"><path d="M224 90c0-27 14-44 40-48M264 42c18 6 32 24 32 48M264 90V42"/></g>
<rect x="220" y="90" width="84" height="11" fill="#d8cbb8"/>
<rect x="252" y="93" width="20" height="8" fill="#8d7c67"/>
<path d="M264 42V22" stroke="#e7ddd0" stroke-width="2.4"/><path d="M254 19a10 10 0 0 1 20 0z" fill="#e7ddd0"/>
<g stroke="#ef8a3f" stroke-width="1.6" stroke-linecap="round" opacity=".9"><path d="M6 18L52 52"/><path d="M96 4L128 36"/><path d="M196 8L214 34"/></g>
<g fill="#f0b24a"><path d="M52 52l13 3-8 8z"/><path d="M128 36l13 4-8 7z"/><path d="M214 34l12 4-7 7z"/></g>
<path d="${star(70, 32, 10)}" fill="#fff3c4" stroke="#e0662f" stroke-width="1"/>
<path d="${star(264, 14, 12)}" fill="#fff3c4" stroke="#e0662f" stroke-width="1"/>
</svg>`,
};

// One 24×24 glyph per card, drawn in the card's region colour.
const ICON = {
  ship: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 15.6h19.6l-2.9 4.6H5.1z" fill="currentColor"/><rect x="6.4" y="10.6" width="3.4" height="3.2" fill="currentColor"/><rect x="10.6" y="10.6" width="3.4" height="3.2" fill="currentColor" opacity=".65"/><rect x="10.6" y="6.6" width="3.4" height="3.2" fill="currentColor"/><circle cx="16.6" cy="7.4" r="2.2" fill="currentColor" opacity=".45"/><circle cx="19" cy="4.6" r="1.7" fill="currentColor" opacity=".3"/><path d="M17.4 10.4V15" stroke="currentColor" stroke-width="1.4"/></svg>`,
  burst: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.6l2.1 5.3 4.6-3.2-1.9 5.2 5.6.1-4.6 3.1 3.4 4.2-5.4-1.2.6 5.5-3.6-4.2-3.6 4.2.6-5.5-5.4 1.2 3.4-4.2L3.6 9l5.6-.1L7.3 3.7l4.6 3.2z" fill="currentColor"/><circle cx="12" cy="12.4" r="2.6" fill="#f7f3ea"/></svg>`,
  boat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.4 12.4l17-3.6 1.6 5.2-15.4 3.2z" fill="currentColor"/><path d="M8.6 9.4l1.2-3.6 4 1.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><g stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"><path d="M2 19.6c1.6-1.4 3-1.4 4.6 0s3 1.4 4.6 0 3-1.4 4.6 0 3 1.4 4.6 0"/><path d="M2 22.4c1.6-1.4 3-1.4 4.6 0s3 1.4 4.6 0 3-1.4 4.6 0 3 1.4 4.6 0" opacity=".55"/></g><circle cx="15.4" cy="7.2" r="1.6" fill="currentColor"/></svg>`,
  talks: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4.2h12.6v8.4H9.4l-3.6 3v-3H2z" fill="currentColor" opacity=".55"/><path d="M9.4 9.6h12.6V18h-3.8v3l-3.6-3H9.4z" fill="currentColor" stroke="#f7f3ea" stroke-width="1.1"/><g stroke="#f7f3ea" stroke-width="1.3" stroke-linecap="round"><path d="M12.4 12.6h6.6M12.4 15.2h4.6"/></g></svg>`,
  aid: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.6" y="7.6" width="18.8" height="13.4" rx="1" fill="currentColor"/><rect x="1.8" y="4.2" width="20.4" height="4" rx="0.8" fill="currentColor" opacity=".65"/><path d="M12 11.2c1.8-2.4 5.4-.8 4.3 2-.7 1.7-4.3 4-4.3 4s-3.6-2.3-4.3-4c-1.1-2.8 2.5-4.4 4.3-2z" fill="#f7f3ea"/></svg>`,
  cuffs: `<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="7.4" cy="12" r="4.6"/><circle cx="16.6" cy="12" r="4.6"/></g><path d="M11.4 12h1.2" stroke="currentColor" stroke-width="2.2"/><path d="M3.4 8.4 1.6 6.6M20.6 8.4l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.4 1.6L4.2 13.4h6.2l-1.6 9 9.4-12h-6.4z" fill="currentColor"/><path d="M3 21.4h5.6M15.4 21.4H21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity=".55"/></svg>`,
  probe: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.4" cy="10.4" r="7.2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.8 15.8L21.6 21.6" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M6.4 7.6l3.2 4 2-2.6 2.4 3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pulse: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.6 12.4h3.6l2-4.2 3 8.4 2.2-4.2h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sub: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 15.4c0-2.6 2.6-4 6.6-4h10.4l2.6 2-2.6 2H8.8c-4 0-6.6-1.4-6.6-4z" fill="currentColor"/><rect x="8.4" y="7.6" width="5.2" height="4" rx="1" fill="currentColor"/><path d="M11 7.6V4.4h3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><g stroke="currentColor" stroke-width="1.4" opacity=".6" stroke-linecap="round"><path d="M3 19.4h7M13 19.4h8"/></g></svg>`,
};

const leadBlock = (lead) => `<article class="lead"><div class="lart">${DRAWING[lead.art]}
<div class="lband"><span><b>${escape(lead.tag)}</b> &middot; ${escape(lead.src)}</span><span>${escape(lead.mark[0])}: ${escape(lead.mark[1])}</span></div></div>
<div class="lk"><i>${pad(lead.n)}</i>${escape(`${lead.p} · ${lead.t}`)}</div>
<h3>${lead.head.map(escape).join('<br>')}</h3><p class="deck">${escape(lead.deck)}</p></article>`;

const cardBlock = (card, index) => `<article class="card" style="--gc:${regionStyle(storyAt(card.n).region)[1]}">
<div class="chead"><span class="ck"><i>${pad(index + 4)}</i>${escape(`${card.p} · ${card.t}`)}</span><span class="cg">${ICON[card.glyph] ?? ''}</span></div>
<h4>${escape(card.h)}</h4><p><b>${escape(card.d)}</b> &middot; ${escape(card.b)}</p>
<div class="src"><span class="tag">${escape(card.tag)}</span> &middot; ${escape(card.s)}</div></article>`;

const briefItem = (item) => `<li style="--gc:${regionStyle(storyAt(item.n).region)[1]}"><span class="bn">${pad(item.n)}</span><b>${escape(item.p)}</b> ${escape(item.t)} <span class="bs">${escape(item.s)}</span></li>`;

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
body{background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;padding:11px 16px 9px;display:flex;flex-direction:column;gap:5px}
.rail{display:flex;justify-content:space-between;align-items:baseline;background:var(--ink);color:#e8dfd2;padding:3px 8px 2.5px;font-size:8.6px;letter-spacing:.16em;text-transform:uppercase}
.rail b{color:var(--paper);letter-spacing:.18em}
.rail .date{color:var(--amber);font-weight:700;letter-spacing:.18em}
.mast{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;border-bottom:2px solid var(--rule);padding:2px 0 3px}
.mast h1{font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:44px;line-height:.94;letter-spacing:-.028em}
.mast .side{text-align:right;font-size:8.4px;line-height:1.35;letter-spacing:.1em;text-transform:uppercase;color:#4a433b;padding-bottom:3px;white-space:nowrap}
.mast .side b{display:block;font-size:10.4px;letter-spacing:.01em;text-transform:none;color:var(--ink);font-family:Georgia,serif;font-style:italic;font-weight:400;margin:1px 0}
.hero{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));background:var(--ink);color:var(--paper)}
.hcell{padding:5px 9px 6px;border-left:1px solid #3b352c;min-width:0}
.hcell:first-child{border-left:0}
.hfig{font-family:Georgia,serif;font-size:34px;font-weight:700;line-height:.95;letter-spacing:-.03em;color:var(--amber)}
.hlabel{font-size:6.9px;line-height:1.18;letter-spacing:.05em;text-transform:uppercase;color:#d9d0c1;margin-top:2px}
.regionbar{display:flex;height:21px}
.rseg{flex:1 1 0;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 8px;color:#f7f3ea;font-size:6.8px;letter-spacing:.11em;text-transform:uppercase;font-weight:700;white-space:nowrap;overflow:hidden}
.rseg b{font-size:9.4px;letter-spacing:0}
.daystrip{border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:3px 0 4px}
.daystrip .ds-head{display:flex;align-items:baseline}
.daystrip h5{margin:0 0 3px}
.ds-track{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));border-top:1px solid #b8ae9e}
.ds-i{position:relative;min-width:0;border-left:1px solid #cec3b0;padding:3px 6px 2px 7px;color:#332d26}
.ds-i:first-child{border-left:0}
.ds-i::before{content:'';position:absolute;left:-1px;top:-1px;width:1px;height:5px;background:var(--accent)}
.ds-i:first-child::before{left:0}
.ds-i b{display:block;font-size:7.3px;font-weight:700;color:var(--accent);line-height:1.05}
.ds-i span{display:block;font-size:7.4px;line-height:1.15;margin-top:1.5px;white-space:nowrap;overflow:hidden}
.leads{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 14px}
.lead{min-width:0;display:flex;flex-direction:column}
.lart{position:relative;height:112px;overflow:hidden;background:#13253c}
.lart svg{display:block;width:100%;height:112px}
.lband{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:2px 7px 2.5px;background:rgba(8,11,14,.76);color:#f2ece0;font-size:6.3px;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap;overflow:hidden}
.lband b{color:var(--amber);letter-spacing:.12em}
.lband span{overflow:hidden;text-overflow:ellipsis}
.lband span+span{flex:0 1 auto}
.lk{font-size:7.2px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-top:4px;white-space:nowrap;overflow:hidden}
.lk i{font-style:normal;color:#9a9082;margin-right:5px}
.lead h3{font-family:Georgia,serif;font-size:22.5px;line-height:1.02;letter-spacing:-.018em;margin:2px 0 2px}
.lead .deck{font-size:9.1px;line-height:1.18;color:#332d26}
.mid{display:grid;grid-template-columns:1fr 300px;gap:14px;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);padding:4px 0 5px}
h5{font-size:8.4px;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:2px}
h5 span{color:var(--muted);letter-spacing:.04em;text-transform:none;font-weight:400;font-size:7.5px}
.map{width:100%;display:block;border:1px solid #0b1c27}
.ml{font:700 5.6px Arial;fill:#f4efe3;letter-spacing:.03em;paint-order:stroke;stroke:#0f2433;stroke-width:1.2}
.mn{font:700 5.1px Arial;fill:#f9f5ea;text-anchor:middle}
.daynote{display:flex;flex-direction:column;min-width:0}
.daynote .lede{font-family:Georgia,serif;font-size:14.2px;line-height:1.2;letter-spacing:-.01em;margin-top:2px}
.daynote .lede b{font-weight:700}
.daynote .check{margin-top:auto;border-top:1px solid var(--rule);padding-top:4px;font-size:7.2px;line-height:1.26;color:#4a433b}
.daynote .check b{color:var(--ink)}
.cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0 12px;align-content:start}
.card{padding:1px 0 1px;border-top:3px solid var(--gc);min-width:0}
.chead{display:flex;justify-content:space-between;align-items:center;gap:4px;min-height:24px}
.ck{flex:1 1 auto;min-width:0;font-size:6.7px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);font-weight:700;white-space:nowrap;overflow:hidden}
.ck i{font-style:normal;color:#9a9082;margin-right:4px}
.cg{flex:0 0 23px;width:23px;height:23px;color:var(--gc)}
.cg svg{display:block;width:23px;height:23px}
.card h4{font-family:Georgia,serif;font-size:11.7px;line-height:1.04;letter-spacing:-.01em;margin:1px 0}
.card p{font-size:8px;line-height:1.13;color:#4a433b}
.card p b{color:var(--ink)}
.card .src{margin-top:1px}
.tag{color:var(--accent);font-weight:700}
.src{font-size:7.1px;letter-spacing:.05em;text-transform:uppercase;color:#8a8074;margin-top:2px}
.briefs-head{border-top:2px solid var(--rule);padding-top:3px;display:flex;justify-content:space-between;align-items:baseline}
.briefs-head h5{margin:0}
.briefs-head .cnt{font-size:7.7px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.briefs{flex:1;min-height:0;border-top:1px solid var(--soft);padding:5px 0 3px;margin-top:3px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 16px}
ul.b{list-style:none;display:flex;flex-direction:column;justify-content:space-between;min-width:0}
ul.b li{font-size:10.2px;line-height:1.13;color:#2b2620;padding-left:9px;position:relative}
ul.b li::before{content:'';position:absolute;left:0;top:5px;width:4px;height:4px;background:var(--gc)}
ul.b li b{font-weight:700}
.bn{color:#9a9082;font-weight:700;margin-right:3px;font-size:8px}
.bs{color:#8a8074;font-size:7px;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap}
.foot{border-top:1px solid var(--rule);padding-top:3px;display:flex;justify-content:space-between;align-items:baseline;gap:14px}
.foot p{font-size:7.3px;line-height:1.24;color:#4a433b;max-width:840px}
.foot p b{color:var(--ink)}
.mark{font-family:Georgia,serif;font-size:10px;font-weight:700;letter-spacing:.02em;white-space:nowrap}
`;

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sunday 22 November 2026</title><style>${stylesheet}</style></head>
<body>
<div class="rail"><span><b>The world in one day</b></span><span class="date">Sunday 22 November 2026</span><span>35 stories &middot; 6 regions &middot; closed 08:31 GMT</span></div>
<header class="mast"><h1>Sunday 22 November 2026</h1><div class="side">A front page of the day&rsquo;s reporting<b>35 stories, from Sinaloa to Canberra</b></div></header>
${heroBand}
${regionBar}
${clockBlock}
<section class="leads">${copy.leads.map(leadBlock).join('')}</section>
<section class="mid"><div><h5>Where it happened, Sunday 22 November 2026 <span>one dot for each dateline, coloured by region; the numbered three are the leads</span></h5>${worldMap}</div>
<div class="daynote"><h5>The day in one sentence</h5><p class="lede"><b>400 drones</b> over Kyiv and its bridges, a <b>climate draft</b> on the table in Antalya, two <b>US bases</b> struck in Bahrain, a <b>cartel boss</b> held in Sinaloa and a boat of <b>mourners</b> lost in Nigeria: one Sunday, 35 stories, six regions.</p>
<p class="check"><b>Date check.</b> This is the Sunday 22 November 2026 edition, closed at 08:31 GMT with 35 stories. Each carries the dateline its outlet gave it; the thirteen clock times are those outlets&rsquo; own UTC stamps, all on Saturday 21 November, and every other date here (23 November, 1956, 2028) belongs to the story that names it. Nothing is invented and no story is repeated. Outlets are named with every story, and one provenance word marks what kind of claim each one is.</p></div></section>
<section class="cards">${copy.cards.map((card, index) => cardBlock(card, index)).join('')}</section>
<section class="briefs-head"><h5>And in brief <span>the rest of the day, place by place</span></h5><span class="cnt">22 more stories</span></section>
<section class="briefs">${briefColumns.join('')}</section>
<footer class="foot"><p>The map is drawn from Natural Earth land outlines; every story above is dated to this edition and every outlet is named with it. Figures in the top band are the edition&rsquo;s own, each carried by a story below.</p><div class="mark">One day &middot; 35 stories &middot; 6 regions</div></footer>
</body></html>`;

writeFileSync(local('./poster.html'), page);
console.log(`poster.html: ${page.length} bytes, ${copy.leads.length} leads, ${copy.cards.length} cards, ${copy.briefs.length} briefs, ${copy.hero.length} hero figures`);
