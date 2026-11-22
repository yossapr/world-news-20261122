// crop.mjs <out.png> <x> <y> <w> <h> [scale]: a zoomed crop of tools/poster.html for close inspection.
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
const [out, x, y, w, h, scale = '2', html = 'tools/poster.html'] = process.argv.slice(2);
const PORT = process.env.CDP_PORT ?? '9223';
const url = pathToFileURL(resolve(html)).href;
mkdirSync(dirname(resolve(out)), { recursive: true });
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener('open', r));
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 700));
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
  clip: { x: +x, y: +y, width: +w, height: +h, scale: +scale } });
writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('wrote', out, Buffer.from(shot.data, 'base64').length);
await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); ws.close();
