// probe.mjs: opens poster.html and reports measurements for a list of style tweaks (no image written).
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const PORT = process.env.CDP_PORT ?? '9223';
const url = pathToFileURL(resolve(process.argv[2] ?? 'tools/poster.html')).href;
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? m.error); pending.delete(m.id); } });
await new Promise((r) => ws.addEventListener('open', r));
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 700));
const expr = process.argv[3] ?? `(() => {
  const b=document.querySelector('.briefs'), ul=document.querySelector('.briefs ul');
  const cards=[...document.querySelectorAll('.card')].map(c=>[+c.getBoundingClientRect().top.toFixed(1),+c.getBoundingClientRect().height.toFixed(1)]);
  return { briefer:[b.clientHeight, ul.scrollHeight], cards };
})()`;
const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
if (r.exceptionDetails) console.log('ERR', JSON.stringify(r.exceptionDetails).slice(0,500));
console.log(JSON.stringify(r.result?.value));
await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); ws.close();
