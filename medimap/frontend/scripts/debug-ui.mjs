// scripts/debug-ui.mjs — one-off DOM/style diagnostics
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
await new Promise((resolve) => setTimeout(resolve, 4200));

const expression = `
(() => {
  const buttons = [...document.querySelectorAll('button')].map((el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { text: el.textContent.trim().slice(0, 30), color: s.color, bg: s.backgroundColor, cls: String(el.className).slice(0, 100), w: Math.round(r.width), x: Math.round(r.left) };
  });
  const chat = buttons.find((b) => b.text.includes('Assistant'));
  const nav = [...document.querySelectorAll('header a, header button')].map((el) => {
    const r = el.getBoundingClientRect();
    return { tag: el.tagName, text: el.textContent.trim().slice(0, 20), label: el.getAttribute('aria-label'), x: Math.round(r.left), w: Math.round(r.width), display: getComputedStyle(el).display };
  });
  return JSON.stringify({ chat, nav, accentVar: getComputedStyle(document.documentElement).getPropertyValue('--accent') }, null, 2);
})()
`;
const result = await send('Runtime.evaluate', { expression, returnByValue: true });
console.log(result.result?.result?.value || JSON.stringify(result));
socket.close();
