// scripts/screenshot.mjs — accurate viewport screenshots over CDP.
// Usage: node scripts/screenshot.mjs <url> <out.png> [width] [height] [dark] [full]
import { writeFileSync } from 'node:fs';

const [url, out, widthArg, heightArg, mode, fullArg, waitArg, seedArg] = process.argv.slice(2);
if (!url || !out) {
  console.error('Usage: node scripts/screenshot.mjs <url> <out.png> [width] [height] [dark] [full]');
  process.exit(1);
}
const width = Number(widthArg || 1440);
const height = Number(heightArg || 1000);
const dark = mode === 'dark';
const full = fullArg === 'full';
const wait = Number(waitArg || 3800);
const seed = seedArg || '';

const targets = await fetch('http://127.0.0.1:9222/json').then((res) => res.json());
const page = targets.find((target) => target.type === 'page');
if (!page) throw new Error('No page target found');

const socket = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve);
  socket.addEventListener('error', reject);
});
function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}

await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 600,
});
await send('Page.enable');
if (seed) {
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const payload = JSON.stringify({
    name: 'Amit Bhushan',
    email: 'amit@example.com',
    role: 'customer',
    type: 'customer',
  });
  await send('Runtime.evaluate', {
    expression: `localStorage.setItem('medimap_user', ${JSON.stringify(payload)})`,
  });
}
await send('Page.navigate', { url });
await new Promise((resolve) => setTimeout(resolve, wait));

if (dark) {
  await send('Runtime.evaluate', {
    expression: "document.documentElement.classList.add('dark')",
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
}

let clip;
if (full) {
  const metrics = await send('Page.getLayoutMetrics');
  const content = metrics.result.cssContentSize || metrics.result.contentSize;
  clip = { x: 0, y: 0, width: content.width, height: Math.min(content.height, 5000), scale: 1 };
}

const shot = await send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: full,
  ...(clip ? { clip } : {}),
});

writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
const size = shot.result.data.length;
console.log(`${out}: ${width}x${height}${dark ? ' dark' : ''}${full ? ' full' : ''} (${size} b64 chars)`);
socket.close();
