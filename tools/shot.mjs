// shot.mjs — screenshots tools/poster.html at exactly 1024×1024 via headless Chrome (CDP, port 9223).
// Usage: node tools/shot.mjs [out.png]. It also prints the page's section boxes and any overflow, so
// layout changes are measured rather than eyeballed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const port = process.env.CDP_PORT ?? '9223';
const png = resolve(process.argv[2] ?? 'entry.png');
const page = pathToFileURL(resolve(process.argv[3] ?? 'tools/poster.html')).href;

const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const waiting = new Map();
socket.addEventListener('message', (event) => {
  const reply = JSON.parse(event.data);
  const settle = waiting.get(reply.id);
  if (settle) { waiting.delete(reply.id); settle(reply.result ?? reply.error); }
});
await new Promise((ready) => socket.addEventListener('open', ready));
const call = (method, params = {}) => new Promise((done) => { const id = ++seq; waiting.set(id, done); socket.send(JSON.stringify({ id, method, params })); });

await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride', { width: 1024, height: 1024, deviceScaleFactor: 1, mobile: false });
await call('Page.navigate', { url: page });
await new Promise((settled) => setTimeout(settled, 700));

const measured = await call('Runtime.evaluate', { returnByValue: true, expression: `(() => {
  const boxes = {};
  for (const name of ['.rail', '.mast', '.leads', '.mid', '.cards', '.briefs', '.foot']) {
    const node = document.querySelector(name);
    if (node) { const r = node.getBoundingClientRect(); boxes[name] = [Math.round(r.top), Math.round(r.bottom)]; }
  }
  const spilling = [];
  for (const node of document.body.querySelectorAll('*')) {
    const r = node.getBoundingClientRect();
    if (r.width && (r.bottom > 1024.5 || r.right > 1024.5 || r.top < -0.5 || r.left < -0.5)) spilling.push(node.className || node.tagName);
  }
  return { page: [document.body.scrollHeight, document.body.scrollWidth], boxes, spilling: [...new Set(spilling)] };
})()` });
console.log(JSON.stringify(measured.result?.value));

const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, optimizeForSpeed: false, clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 } });
const bytes = Buffer.from(shot.data, 'base64');
mkdirSync(dirname(png), { recursive: true });
writeFileSync(png, bytes);
console.log(`wrote ${png} (${bytes.length} bytes)`);
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
socket.close();
