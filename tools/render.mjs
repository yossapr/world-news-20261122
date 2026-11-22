// render.mjs: screenshots tools/poster.html at exactly 1024x1024 through headless Chrome (CDP 9223)
// and reports the page's section boxes so overflow and dead space are measurable, not guessed.
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';

const PORT = process.env.CDP_PORT ?? '9223';
const out = process.argv[2] ?? 'out/page.png';
const html = process.argv[3] ?? 'poster.html';
const url = pathToFileURL(resolve(html)).href;
mkdirSync(dirname(resolve(out)), { recursive: true });

const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); }
});
await new Promise((r) => ws.addEventListener('open', r));
const send = (method, params = {}) =>
  new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 700));
const probe = await send('Runtime.evaluate', {
  expression: `(() => {
    const names = ['.rail','.mast','.leads','.mid','.cards','.briefs-head','.briefs','.foot'];
    const boxes = {};
    for (const n of names) { const e=document.querySelector(n); if(e){const r=e.getBoundingClientRect(); boxes[n]=[+r.top.toFixed(1),+r.bottom.toFixed(1),+r.height.toFixed(1)];} }
    const out = [];
    for (const e of document.querySelectorAll('body *')) {
      const r = e.getBoundingClientRect();
      if (r.width && (r.bottom > 1024.5 || r.right > 1024.5 || r.top < -0.5 || r.left < -0.5)) out.push(String(e.className||e.tagName));
      if (e.scrollHeight > e.clientHeight + 1 && getComputedStyle(e).overflow !== 'visible') out.push('clip:'+String(e.className||e.tagName));
    }
    return { page:[document.body.scrollHeight,document.body.scrollWidth], boxes, overflow:[...new Set(out)] };
  })()`, returnByValue: true,
});
if (probe.exceptionDetails) console.log('probe error:', JSON.stringify(probe.exceptionDetails).slice(0,400));
console.log(JSON.stringify(probe.result?.value, null, 0));
const shot = await send('Page.captureScreenshot', {
  format: 'png', captureBeyondViewport: true, optimizeForSpeed: false,
  clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 },
});
writeFileSync(out, Buffer.from(shot.data, 'base64'));
const b = Buffer.from(shot.data, 'base64');
console.log('wrote', out, b.length, 'bytes');
await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`);
ws.close();
