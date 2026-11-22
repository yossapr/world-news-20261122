// build.mjs: writes poster.html, the 1024x1024 front page for Sunday 22 November 2026.
// Stories and figures come from edition.json; the wording comes from copy.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { leads, cards, briefs, numbers, REGION, MAP_POINTS } from './copy.mjs';

const edition = JSON.parse(readFileSync(new URL('./edition.json', import.meta.url), 'utf8'));
const landPath = readFileSync(new URL('./land-path.txt', import.meta.url), 'utf8');
const stories = edition.stories;
const by = (n) => stories.find((s) => s.n === n);
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- integrity: every story appears exactly once, and no copy names a story the edition lacks ----
const used = [...leads, ...cards, ...briefs].map((s) => s.n);
if (used.length !== 35 || new Set(used).size !== 35) throw new Error('page must carry all 35 stories once: ' + used.length);
for (const n of used) if (!by(n)) throw new Error('story ' + n + ' is not in the edition');
if (leads[0].n !== 1 || leads[1].n !== 2 || leads[2].n !== 3) throw new Error('leads must be the edition leads');
for (const c of cards) if (!c.glyph) throw new Error('card ' + c.n + ' has no glyph');

const regionOf = (r) => REGION[r] ?? REGION.world;
const counts = stories.reduce((m, s) => ((m[s.region] = (m[s.region] ?? 0) + 1), m), {});
const regionLine = Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .map(([r, c]) => `<span class="rg"><i style="background:${regionOf(r)[1]}"></i>${regionOf(r)[0]}<b>${c}</b></span>`)
  .join('');

// ---- the filing clock: only stories whose outlet stamp is on the edition's own wire day ----
// Every stamp in this edition falls on 21 November 2026 (UTC); the page says exactly that.
const DAY_STRIP = [
  { n: 26, t: '01:45', label: 'Narail fires' },
  { n: 24, t: '04:43', label: 'Lisbon march' },
  { n: 30, t: '05:37', label: 'EU trade deal' },
  { n: 5, t: '06:07', label: 'Kryvyi Rih' },
  { n: 31, t: '08:17', label: 'Twickenham' },
  { n: 8, t: '09:54', label: 'Gaza aid' },
  { n: 14, t: '10:02', label: 'FBI hack' },
  { n: 7, t: '11:50', label: 'Eisenkot' },
  { n: 9, t: '13:41', label: 'Sinaloa' },
  { n: 10, t: '14:35', label: 'Iran cuts' },
  { n: 23, t: '15:02', label: 'IG Metall' },
  { n: 15, t: '16:09', label: 'FBI rescue' },
  { n: 1, t: '22:25', label: 'COP31 draft' },
];
for (const d of DAY_STRIP) {
  const stamps = (by(d.n).links ?? []).map((l) => l.publishedAt ?? '');
  const utc = stamps.map((x) => x.slice(11, 16));
  const day = stamps.map((x) => x.slice(0, 10));
  if (!day.includes('2026-11-21') || !utc.includes(d.t)) throw new Error('clock time ' + d.t + ' is not story ' + d.n + "'s stamp: " + stamps.join(','));
}

// ---- map: equirectangular, cropped to 64N..46S so the panel holds no dead polar bands ----
const MAPC = { sea: '#0f2433', land: '#2b4c63', stroke: '#456b83', grid: '#1b3749', label: '#f4efe3', halo: '#0f2433' };
const TOP = 20, HEIGHT = 114;
const project = ([lon, lat]) => [lon + 180, 84 - Math.max(-50, Math.min(64, lat))];
const dotColor = (r) => regionOf(r)[2];
const dot = (s) => {
  const [x, y] = project([s.geo.lon, s.geo.lat]);
  const lead = s.tier === 'lead';
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${lead ? 2.7 : 2.2}" fill="${dotColor(s.region)}" opacity="${lead ? 1 : 0.92}"/>`;
};
const dotPaths = stories.filter((s) => s.geo && s.tier !== 'lead').map(dot).join('');
const leadDots = [1, 2, 3].map((n) => {
  const s = by(n);
  const [x, y] = project([s.geo.lon, s.geo.lat]);
  const p = MAP_POINTS[n];
  return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${MAPC.halo}"/>` +
    `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.4" fill="${dotColor(s.region)}"/>` +
    `<text x="${x.toFixed(1)}" y="${(y + 2.1).toFixed(1)}" class="mn">${n}</text>` +
    `<text x="${(x + p.dx).toFixed(1)}" y="${(y + p.dy).toFixed(1)}" class="ml"${p.anchor ? ` text-anchor="${p.anchor}"` : ''}>${p.label}</text></g>`;
}).join('');
const mapSvg = `<svg class="map" viewBox="0 ${TOP} 360 ${HEIGHT}" preserveAspectRatio="xMidYMid meet" aria-label="World map with one dot for each story">
  <rect x="0" y="${TOP}" width="360" height="${HEIGHT}" fill="${MAPC.sea}"/>
  <g stroke="${MAPC.grid}" stroke-width="0.35" fill="none">
    <path d="M0 24H360M0 54H360M0 84H360M0 114H360"/>
    <path d="M60 0V142M120 0V142M180 0V142M240 0V142M300 0V142"/>
  </g>
  <path d="${landPath}" fill="${MAPC.land}" stroke="${MAPC.stroke}" stroke-width="0.55"/>
  ${dotPaths}
  ${leadDots}
</svg>`;

// ---- lead drawings: flat vector shapes, each anchored to what the story says happened ----
const star = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.34 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return 'M' + pts.join('L') + 'Z';
};

const ART = {
  // 1.5C draft: a document on the table with the warming line crossing the limit
  deal: `<svg viewBox="0 0 164 132" aria-hidden="true">
    <rect width="164" height="132" fill="#123029"/>
    <rect x="54" y="26" width="96" height="94" fill="#cbc2ae"/>
    <g transform="rotate(-4 102 74)">
      <rect x="46" y="20" width="100" height="96" fill="#f6f1e4"/>
      <g stroke="#a89d88" stroke-width="2.4" stroke-linecap="round">
        <path d="M56 30H94"/><path d="M56 37H104"/><path d="M56 44H84"/>
      </g>
      <path d="M56 106V62C62 82 70 90 78 88s10-14 18-18 12-2 18-6" fill="none" stroke="#b3261e" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M52 78H142" stroke="#b3261e" stroke-width="1.3" stroke-dasharray="4 3" opacity=".9"/>
      <circle cx="134" cy="64" r="3.2" fill="#b3261e"/>
      <g stroke="#d8d0bd" stroke-width="1"><path d="M56 100H96"/><path d="M56 105H84"/></g>
    </g>
    <path d="M14 120H152" stroke="#2c4a41" stroke-width="1.2"/>
  </svg>`,
  // 400 drones and 110 missiles: three bridges over the Dnipro, the middle one broken
  bridge: `<svg viewBox="0 0 164 132" aria-hidden="true">
    <rect width="164" height="132" fill="#13253c"/>
    <g stroke="#e0662f" stroke-width="1.6" stroke-linecap="round" opacity=".95">
      <path d="M148 4L126 34"/><path d="M162 10L140 38"/><path d="M132 2L116 26"/><path d="M164 26L150 48"/>
    </g>
    <g fill="#f0b24a"><circle cx="126" cy="34" r="2.6"/><circle cx="140" cy="38" r="2.6"/><circle cx="116" cy="26" r="2.2"/><circle cx="150" cy="48" r="2.6"/></g>
    <path d="M2 86C2 62 56 62 56 86" fill="none" stroke="#eef3fa" stroke-width="2.8"/>
    <path d="M112 86C112 62 162 62 162 86" fill="none" stroke="#eef3fa" stroke-width="2.8"/>
    <g stroke="#f2f6fb" stroke-width="3.8" stroke-linecap="round"><path d="M0 86H56"/><path d="M112 86H164"/></g>
    <g stroke="#c3d0de" stroke-width="0.9" opacity=".85">
      <path d="M12 86V71M26 86V67M40 86V71M126 86V71M140 86V67M154 86V71"/>
    </g>
    <g stroke="#a9bccf" stroke-width="3"><path d="M56 86V110"/><path d="M112 86V110"/></g>
    <g stroke="#f2f6fb" stroke-width="3.8" stroke-linecap="round"><path d="M56 86L66 99"/><path d="M112 86L102 97"/></g>
    <rect x="66" y="103" width="32" height="6.4" rx="1" transform="rotate(26 82 106)" fill="#cfd9e5"/>
    <rect x="60" y="115" width="10" height="3.6" transform="rotate(-16 65 116)" fill="#b9c6d6"/>
    <g fill="#9fb3c8" opacity=".45"><circle cx="72" cy="112" r="3"/><circle cx="98" cy="110" r="2.4"/></g>
    <path d="${star(84, 96, 8)}" fill="#ffd9a0" stroke="#e0662f" stroke-width="0.9" opacity=".95"/>
    <path d="M2 110H150" stroke="#3d5871" stroke-width="1.2"/>
    <g stroke="#6f88a6" stroke-width="1.1" opacity=".75">
      <path d="M8 116H44M58 122H94M108 116H146M26 126H62M88 128H120"/>
    </g>
  </svg>`,
  // Iranian drones over Bahrain: two US bases under radomes, both waves intercepted
  bases: `<svg viewBox="0 0 164 132" aria-hidden="true">
    <rect width="164" height="132" fill="#2a1512"/>
    <path d="M0 104H164" stroke="#7a4a3a" stroke-width="1.1"/>
    <path d="M18 104a26 26 0 0 1 52 0z" fill="#d5c8b3"/>
    <g stroke="#a8957e" stroke-width="0.8" opacity=".8">
      <path d="M28 104c0-14 6-23 16-26M44 78c9 3 16 12 16 26M44 78v26"/>
    </g>
    <rect x="22" y="104" width="44" height="9" fill="#c2b49f"/>
    <rect x="38" y="106" width="12" height="6" fill="#7d6d59"/>
    <path d="M96 104a33 33 0 0 1 64 0z" fill="#e7ddd0"/>
    <g stroke="#ac9880" stroke-width="0.8" opacity=".85">
      <path d="M104 104c0-18 9-30 28-33M124 71c12 4 22 16 22 33M128 104V71"/>
    </g>
    <rect x="102" y="104" width="52" height="10" fill="#d8cbb8"/>
    <rect x="122" y="107" width="14" height="7" fill="#8d7c67"/>
    <path d="M128 71V56" stroke="#e7ddd0" stroke-width="2.4"/><path d="M120 53a8 8 0 0 1 16 0z" fill="#e7ddd0"/>
    <g stroke="#ef8a3f" stroke-width="1.6" stroke-linecap="round" opacity=".9">
      <path d="M4 20L32 44"/><path d="M104 4L120 30"/><path d="M146 8L136 32"/>
    </g>
    <g fill="#f0b24a">
      <path d="M32 44l12 2-7 8z"/><path d="M120 30l12 3-7 7z"/><path d="M136 32l11 3-6 7z"/>
    </g>
    <path d="${star(44, 58, 9)}" fill="#fff3c4" stroke="#e0662f" stroke-width="1"/>
    <path d="${star(128, 40, 11)}" fill="#fff3c4" stroke="#e0662f" stroke-width="1"/>
  </svg>`,
};

// ---- ten flat glyphs, one per card, in the story's region colour ----
const GLYPH = {
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

const dayStrip = `
  <section class="daystrip">
    <div class="ds-head"><h5>The filing clock, in UTC <span>thirteen reports stamped hour by hour, the last at 22:25 GMT, before this edition closed at 08:31 GMT</span></h5></div>
    <div class="ds-track">${DAY_STRIP.map((d) => `<div class="ds-i"><b>${d.t}</b><span>${esc(d.label)}</span></div>`).join('')}</div>
  </section>`;

const leadBlock = (l) => `
  <article class="lead">
    <div class="panel">
      <div class="panel-txt">
        <div class="pk">${esc(l.kicker)}</div>
        <div class="pfig">${esc(l.fig)}</div>
        <div class="punit">${esc(l.figUnit)}</div>
        <div class="psub">${esc(l.figSub)}</div>
        <div class="pmark"><em>${esc(l.marker[0])}</em> ${esc(l.marker[1])}</div>
      </div>
      <div class="part">${ART[l.art]}</div>
    </div>
    <h3>${l.head.map((h) => esc(h)).join('<br>')}</h3>
    <p class="deck">${esc(l.deck)}</p>
    <div class="src">${esc(l.src)}</div>
  </article>`;

const cardBlock = (c) => {
  const region = by(c.n).region;
  const g = GLYPH[c.glyph] ?? '';
  return `
  <article class="card" style="--gc:${regionOf(region)[1]}">
    <div class="chead"><span class="ck">${esc(c.kicker)}</span><span class="cg">${g}</span></div>
    <h4>${esc(c.head)}</h4>
    <p><b>${esc(c.datum)}</b> &middot; ${esc(c.hook)}</p>
    <div class="src">${esc(c.src)}</div>
  </article>`;
};

const briefLi = (b) => `<li style="--gc:${regionOf(by(b.n).region)[1]}"><b>${esc(b.place)}</b> ${esc(b.text)} <span class="bs">${esc(b.src)}</span></li>`;
// column-major so each of the three columns is full and the last row is never ragged
const per = Math.ceil(briefs.length / 3);
const long = briefs.length - per * 3 + 3; // first `long` columns take one extra
const cols = [];
let at = 0;
for (let i = 0; i < 3; i++) { const size = per - (i < long ? 0 : 1); cols.push(briefs.slice(at, at + size)); at += size; }

const numBlock = (n) => `<div class="num"><div class="nf">${esc(n.fig)}</div><div class="nc">${esc(n.cap)} <span class="ns">&middot; ${esc(n.src)}</span></div></div>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sunday 22 November 2026</title>
<style>
  :root { --paper:#f7f3ea; --ink:#15120e; --muted:#6d645a; --rule:#15120e; --soft:#d8cfc0; --accent:#b3261e; --amber:#f3c79a; }
  * { box-sizing:border-box; margin:0; padding:0 }
  html,body { width:1024px; height:1024px; overflow:hidden }
  body { background:var(--paper); color:var(--ink); font-family:Arial,Helvetica,sans-serif;
    -webkit-font-smoothing:antialiased; padding:11px 16px 9px; display:flex; flex-direction:column; gap:5px }

  .rail { display:flex; justify-content:space-between; align-items:baseline; background:var(--ink);
    color:#e8dfd2; padding:3px 8px 2.5px; font-size:8.8px; letter-spacing:.16em; text-transform:uppercase }
  .rail b { color:var(--paper); letter-spacing:.18em } .rail .date { color:var(--amber); font-weight:700; letter-spacing:.18em }

  .mast { display:flex; justify-content:space-between; align-items:flex-end; gap:18px;
    border-top:3px solid var(--rule); border-bottom:1px solid var(--rule); padding:3px 0 4px }
  .mast h1 { font-family:Georgia,'Times New Roman',serif; font-weight:700; font-size:48px; line-height:.94;
    letter-spacing:-.028em }
  .mast .side { text-align:right; font-size:8.6px; line-height:1.35; letter-spacing:.1em; text-transform:uppercase;
    color:#4a433b; padding-bottom:3px; white-space:nowrap }
  .mast .side b { display:block; font-size:10.6px; letter-spacing:.01em; text-transform:none; color:var(--ink);
    font-family:Georgia,serif; font-style:italic; font-weight:400; margin:1px 0 }

  .daystrip { border-top:1px solid var(--rule); border-bottom:1px solid var(--rule); padding:3px 0 4px }
  .daystrip .ds-head { display:flex; align-items:baseline; gap:0 }
  .daystrip h5 { margin:0 0 3px }
  .ds-track { display:grid; grid-template-columns:repeat(13,minmax(0,1fr)); gap:0;
    border-top:1px solid #b8ae9e }
  .ds-i { position:relative; min-width:0; border-left:1px solid #cec3b0;
    padding:3px 6px 2px 7px; color:#332d26 }
  .ds-i:first-child { border-left:0 }
  .ds-i::before { content:''; position:absolute; left:-1px; top:-1px; width:1px; height:5px; background:var(--accent) }
  .ds-i:first-child::before { left:0 }
  .ds-i b { display:block; font-size:7.4px; font-weight:700; letter-spacing:.01em; color:var(--accent); line-height:1.05 }
  .ds-i span { display:block; font-size:7.5px; line-height:1.15; margin-top:1.5px; white-space:nowrap; overflow:hidden }

  .leads { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0 14px }
  .lead { min-width:0; display:flex; flex-direction:column }
  .panel { position:relative; display:flex; height:132px; overflow:hidden; background:#123029 }
  .lead:nth-child(2) .panel { background:#13253c }
  .lead:nth-child(3) .panel { background:#2a1512 }
  .panel .part { position:absolute; right:0; top:0; width:164px; height:132px }
  .panel .part svg { display:block; width:164px; height:132px }
  .panel::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg, rgba(18,48,41,.98) 40%, rgba(18,48,41,0) 74%); z-index:1 }
  .lead:nth-child(2) .panel::after { background:linear-gradient(90deg, rgba(19,37,60,.98) 40%, rgba(19,37,60,0) 74%) }
  .lead:nth-child(3) .panel::after { background:linear-gradient(90deg, rgba(42,21,18,.98) 40%, rgba(42,21,18,0) 74%) }
  .panel-txt { position:relative; z-index:2; padding:5px 0 5px 9px; width:52%; color:#f7f3ea;
    display:flex; flex-direction:column }
  .pk { font-size:7.4px; letter-spacing:.12em; text-transform:uppercase; color:var(--amber); font-weight:700; white-space:nowrap }
  .pfig { font-family:Georgia,serif; font-size:46px; font-weight:700; line-height:.92; letter-spacing:-.03em; margin-top:auto }
  .punit { font-size:8.3px; line-height:1.1; letter-spacing:.03em; text-transform:uppercase; color:#ece3d5; margin-top:2px }
  .psub { font-size:7.6px; line-height:1.18; color:#c7d2da; margin-top:2px }
  .pmark { font-size:6.6px; line-height:1.2; color:#e8dcc6; letter-spacing:.03em; margin-top:4px;
    border-top:1px solid rgba(255,255,255,.22); padding-top:2.5px }
  .pmark em { font-style:normal; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--amber) }

  .lead h3 { font-family:Georgia,serif; font-size:24px; line-height:1.01; letter-spacing:-.018em; margin:5px 0 2px }
  .lead .deck { font-size:9.6px; line-height:1.2; color:#332d26 }
  .src { font-size:7.4px; letter-spacing:.055em; text-transform:uppercase; color:#8a8074; margin-top:2px }

  .mid { display:grid; grid-template-columns:1fr 312px; gap:14px; border-top:1px solid var(--rule);
    border-bottom:1px solid var(--rule); padding:4px 0 5px }
  h5 { font-size:8.4px; letter-spacing:.13em; text-transform:uppercase; color:var(--accent); font-weight:700; margin-bottom:2px }
  h5 span { color:var(--muted); letter-spacing:.04em; text-transform:none; font-weight:400; font-size:7.6px }
  .map { width:100%; display:block; border:1px solid #0b1c27 }
  .ml { font:700 5.6px Arial; fill:${MAPC.label}; letter-spacing:.03em; paint-order:stroke; stroke:${MAPC.halo}; stroke-width:1.2 }
  .mn { font:700 5.1px Arial; fill:#f9f5ea; text-anchor:middle }
  .regions { display:flex; flex-wrap:wrap; gap:1px 11px; margin-top:3px; align-items:center }
  .rg { font-size:8px; color:#3d372f; display:inline-flex; align-items:center; gap:3px }
  .rg i { width:6px; height:6px; display:inline-block }
  .rg b { margin-left:1px }

  .nums-panel { background:#0f2433; color:var(--paper); padding:4px 9px 8px; display:flex; flex-direction:column }
  .nums-panel h5 { color:var(--amber); border-bottom:1px solid #4a433b; padding-bottom:2px; margin-bottom:3px }
  .nums-panel h5 span { color:#a89c8d }
  .nums { display:grid; grid-template-columns:1fr 1fr; gap:2px 9px; flex:1; align-content:space-between }
  .nf { font-family:Georgia,serif; font-size:23px; font-weight:700; line-height:.98; letter-spacing:-.03em; color:var(--amber) }
  .nc { font-size:7.1px; line-height:1.12; color:#e8dfd2; margin-top:1px; padding-right:2px }
  .ns { color:#a89c8d; font-size:6.4px; letter-spacing:.06em; text-transform:uppercase; white-space:nowrap }

  .cards { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:0 12px; align-content:start }
  .card { padding:1px 0 1px; border-top:3px solid var(--gc); min-width:0 }
  .chead { display:flex; justify-content:space-between; align-items:center; gap:4px; min-height:25px }
  .ck { flex:1 1 auto; min-width:0; font-size:6.9px; letter-spacing:.07em; text-transform:uppercase; color:var(--accent); font-weight:700; white-space:nowrap; overflow:hidden }
  .cg { flex:0 0 24px; width:24px; height:24px; color:var(--gc) }
  .cg svg { display:block; width:24px; height:24px }
  .card h4 { font-family:Georgia,serif; font-size:11.9px; line-height:1.04; letter-spacing:-.01em; margin:1px 0 }
  .card p { font-size:8.1px; line-height:1.13; color:#4a433b }
  .card p b { color:var(--ink) }
  .card .src { margin-top:1px }

  .sentence { border-top:2px solid var(--rule); border-bottom:1px solid var(--rule); padding:2px 0 2px;
    display:flex; gap:12px; align-items:baseline }
  .sentence .lab { font-size:8px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent);
    font-weight:700; white-space:nowrap }
  .sentence p { font-family:Georgia,serif; font-size:14.6px; line-height:1.18; letter-spacing:-.01em }
  .sentence p b { font-weight:700 }

  .briefs-head { border-top:1px solid var(--soft); padding-top:3px; display:flex; justify-content:space-between; align-items:baseline }
  .briefs-head h5 { margin:0 }
  .briefs-head .cnt { font-size:7.8px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted) }
  .briefs { flex:1; min-height:0; border-top:1px solid var(--soft); padding:5px 0 3px; margin-top:3px;
    display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0 16px }
  ul.b { list-style:none; display:flex; flex-direction:column; justify-content:space-between; min-width:0 }
  ul.b li { font-size:10.4px; line-height:1.13; color:#2b2620; padding-left:9px; position:relative }
  ul.b li::before { content:''; position:absolute; left:0; top:5px; width:4px; height:4px; background:var(--gc) }
  ul.b li b { font-weight:700 }
  .bs { color:#8a8074; font-size:7px; letter-spacing:.03em; text-transform:uppercase; white-space:nowrap }

  .foot { border-top:1px solid var(--rule); padding-top:3px; display:flex; justify-content:space-between;
    align-items:baseline; gap:14px }
  .foot p { font-size:7.4px; line-height:1.24; color:#4a433b; max-width:830px }
  .foot p b { color:var(--ink) }
  .mark { font-family:Georgia,serif; font-size:10px; font-weight:700; letter-spacing:.02em; white-space:nowrap }
</style></head>
<body>
  <div class="rail">
    <span><b>The world in one day</b></span>
    <span class="date">Sunday 22 November 2026</span>
    <span>35 stories &middot; 6 regions &middot; every one sourced</span>
  </div>

  <header class="mast">
    <h1>Sunday 22 November 2026</h1>
    <div class="side">A front page of the day&rsquo;s reporting<b>35 stories, from Sinaloa to Canberra</b></div>
  </header>

  ${dayStrip}

  <section class="leads">${leads.map(leadBlock).join('')}</section>

  <section class="mid">
    <div>
      <h5>Where it happened, Sunday 22 November 2026 <span>one dot for each dateline, coloured by region; the numbered three are the leads</span></h5>
      ${mapSvg}
      <div class="regions">${regionLine}</div>
    </div>
    <div class="nums-panel">
      <h5>The day in numbers <span>as its outlets reported them</span></h5>
      <div class="nums">${numbers.map(numBlock).join('')}</div>
    </div>
  </section>

  <section class="cards">${cards.map(cardBlock).join('')}</section>

  <section class="sentence">
    <span class="lab">The day in one sentence</span>
    <p><b>400 drones</b> over Kyiv and its bridges, a <b>climate draft</b> on the table in Antalya,
      two <b>US bases</b> struck in Bahrain, a <b>cartel boss</b> held in Sinaloa and a boat of
      <b>mourners</b> lost in Nigeria: one Sunday, 35 stories, six regions.</p>
  </section>

  <section class="briefs-head"><h5>And in brief <span>the rest of the day, place by place</span></h5><span class="cnt">22 more stories</span></section>
  <section class="briefs">${cols.map((c) => `<ul class="b">${c.map(briefLi).join('')}</ul>`).join('')}</section>

  <footer class="foot">
    <p><b>Date check.</b> This is the Sunday 22 November 2026 edition, closed at 08:31 GMT with 35 stories.
      Each carries the dateline its outlet gave it; the thirteen clock times are those outlets&rsquo; own UTC stamps,
      all on Saturday 21 November, and every other date here (23 November, 1956, 2028) belongs to the story
      that names it. Nothing is invented and no story is repeated. Outlets are named with every story; the map is
      drawn from Natural Earth land outlines.</p>
    <div class="mark">One day &middot; 35 stories &middot; 6 regions</div>
  </footer>
</body></html>`;

writeFileSync(new URL('./poster.html', import.meta.url), html);
console.log('poster.html', html.length, 'bytes |', leads.length, 'leads', cards.length, 'cards', briefs.length, 'briefs', numbers.length, 'numbers');
