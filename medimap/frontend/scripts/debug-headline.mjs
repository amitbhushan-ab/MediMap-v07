// scripts/debug-headline.mjs — throwaway: inspect headline in dark mode
const targets = await fetch('http://127.0.0.1:9222/json').then((res) => res.json());
const page = targets.find((target) => target.type === 'page');
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
await new Promise((resolve) => socket.addEventListener('open', resolve));
function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
await new Promise((resolve) => setTimeout(resolve, 3800));
await send('Runtime.evaluate', { expression: "document.documentElement.classList.add('dark')" });
await new Promise((resolve) => setTimeout(resolve, 700));
const expression = `
JSON.stringify([...document.querySelectorAll('h1 span')].map(el => {
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { text: el.textContent, cls: el.className, color: s.color, opacity: s.opacity, display: s.display, transform: s.transform, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top) };
}))
`;
const result = await send('Runtime.evaluate', { expression, returnByValue: true });
console.log(result.result?.result?.value || JSON.stringify(result));
socket.close();
