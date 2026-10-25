// scripts/eval-page.mjs — run an expression in the CDP page.
// Usage: node scripts/eval-page.mjs <url> <expression> [dark]
const [url, expression, mode] = process.argv.slice(2);
if (!url || !expression) {
  console.error('Usage: node scripts/eval-page.mjs <url> <expression> [dark]');
  process.exit(1);
}

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
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve);
  socket.addEventListener('error', reject);
});
function send(method, params = {}) {
  const id = ++nextId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await new Promise((resolve) => setTimeout(resolve, 3800));
if (mode === 'dark') {
  await send('Runtime.evaluate', { expression: "document.documentElement.classList.add('dark')" });
  await new Promise((resolve) => setTimeout(resolve, 500));
}
const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
console.log(JSON.stringify(result.result?.result?.value ?? result, null, 2));
socket.close();
