// scripts/inspect-page.mjs — measure a rendered page over the Chrome DevTools Protocol.
// Usage: node scripts/inspect-page.mjs <url> [width] [height]
const url = process.argv[2];
const width = Number(process.argv[3] || 390);
const height = Number(process.argv[4] || 844);

if (!url) {
  console.error('Usage: node scripts/inspect-page.mjs <url> [width] [height]');
  process.exit(1);
}

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
await send('Page.navigate', { url });
await new Promise((resolve) => setTimeout(resolve, 3500));

const expression = `(() => {
  const vw = document.documentElement.clientWidth;
  const all = [...document.querySelectorAll('*')];
  const boxes = all.map((el) => {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      cls: String(el.className || '').slice(0, 140),
      w: Math.round(r.width),
      left: Math.round(r.left),
      right: Math.round(r.right),
    };
  });
  const offenders = boxes
    .filter((b) => b.right > vw + 1 || b.w > vw + 1)
    .sort((a, b) => b.right - a.right)
    .slice(0, 18);
  const navButtons = [...document.querySelectorAll('header button')].map((el) => {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return { label: el.getAttribute('aria-label'), display: style.display, w: Math.round(r.width), right: Math.round(r.right) };
  });
  return JSON.stringify({
    vw,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    bodyWidth: Math.round(document.body.getBoundingClientRect().width),
    offenders,
    navButtons,
  }, null, 2);
})()`;

const result = await send('Runtime.evaluate', { expression, returnByValue: true });
console.log(result.result?.result?.value || JSON.stringify(result, null, 2));
socket.close();
