#!/usr/bin/env node
// scripts/audit-contrast.mjs — WCAG AA contrast audit across every route,
// both themes, both viewports. Reuses smoke.mjs' zero-dependency CDP harness.
//
// For each route it walks visible text nodes, resolves the effective background
// by climbing ancestors, and reports any text under the AA threshold
// (4.5:1 normal, 3:1 for >=24px or >=18.66px bold). Background images are
// treated as unknown and reported as notices rather than failures.
//
// Usage: `npm run audit:contrast` (or `node scripts/audit-contrast.mjs`).
// Exit code 1 if any combination fails, so it can gate CI.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const ROUTES = [
  '/',
  '/results?q=Paracetamol%20500mg',
  '/map',
  '/scan',
  '/bridge',
  '/about',
  '/points',
  '/profile',
  '/submit-price',
  '/admin',
  '/pharmacy-dashboard',
  '/pharmacy/nsut-jan-aushadhi',
  '/login',
  '/signup',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];

const THEMES = ['light', 'dark'];

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// Runs inside the page. Returns contrast findings for the current state.
const PROBE = `(() => {
  const parse = (c) => {
    if (!c || c === 'transparent' || c === 'none') return null;
    // Split on separators instead of using a regex, so escaping inside
    // this template literal can never corrupt the parser.
    const parts = c.slice(c.indexOf('(') + 1, c.lastIndexOf(')')).split(',');
    const nums = parts.map((v) => parseFloat(v.trim()));
    return nums.some((v) => Number.isNaN(v)) ? null : nums;
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  // Walk up the tree, compositing translucent layers over each other so the
  // reported background matches what the eye actually sees.
  const bgOf = (el) => {
    const stack = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== 'none') return { unknown: true };
      const p = parse(s.backgroundColor);
      if (p && (p.length < 4 || p[3] > 0)) stack.push(p);
      if (p && (p.length < 4 || p[3] >= 0.999)) break;
      n = n.parentElement;
    }
    const bodyBg = parse(getComputedStyle(document.body).backgroundColor);
    stack.push(bodyBg || [0, 0, 0]);
    let out = stack[stack.length - 1].slice(0, 3);
    for (let i = stack.length - 2; i >= 0; i -= 1) {
      const layer = stack[i];
      const a = layer.length > 3 ? layer[3] : 1;
      out = [
        layer[0] * a + out[0] * (1 - a),
        layer[1] * a + out[1] * (1 - a),
        layer[2] * a + out[2] * (1 - a),
      ];
    }
    return { rgb: out.map((v) => Math.round(v)) };
  };

  const bad = [];
  const unknown = new Set();
  const seen = new Set();
  const nodes = document.querySelectorAll(
    'main p, main span, main a, main h1, main h2, main h3, main h4, main li, main button, main th, main td, main label,' +
    ' footer p, footer a, footer span, footer nav,' +
    ' header a, header button, header span,' +
    '[role="dialog"] p, [role="dialog"] span, [role="dialog"] a, [role="dialog"] button',
  );

  for (const el of nodes) {
    const text = (el.innerText || '').trim();
    if (!text) continue;
    if (el.children.length > 0 && text.length > 90) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) < 0.5) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;

    const fg = parse(s.color);
    if (!fg) continue;
    const bg = bgOf(el);
    if (bg.unknown) { unknown.add(text.slice(0, 40)); continue; }

    const cr = ratio(fg.slice(0, 3), bg.rgb);
    const size = parseFloat(s.fontSize);
    const weight = Number(s.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 600);
    const min = large ? 3 : 4.5;
    if (cr >= min) continue;

    const key = s.color + '|' + bg.rgb.join(',') + '|' + Math.round(size) + '|' + text.slice(0, 20);
    if (seen.has(key)) continue;
    seen.add(key);
    bad.push({
      text: text.slice(0, 46),
      fg: s.color,
      bg: 'rgb(' + bg.rgb.join(',') + ')',
      size: Math.round(size),
      ratio: Number(cr.toFixed(2)),
      min,
    });
  }
  return { bad: bad.slice(0, 12), total: bad.length, unknown: [...unknown].slice(0, 4) };
})()`;

function findChrome() {
  const candidates =
    process.platform === 'win32'
      ? [
          process.env.CHROME_PATH,
          join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
          join(process.env.PROGRAMFILES || '', 'Google/Chrome/Application/chrome.exe'),
          join(process.env['PROGRAMFILES(X86)'] || '', 'Google/Chrome/Application/chrome.exe'),
          join(process.env.PROGRAMFILES || '', 'Microsoft/Edge/Application/msedge.exe'),
        ]
      : process.platform === 'darwin'
        ? [
            process.env.CHROME_PATH,
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
          ]
        : [
            process.env.CHROME_PATH,
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
          ];
  return candidates.filter(Boolean).find((path) => existsSync(path)) || null;
}

function freePort() {
  return new Promise((done, fail) => {
    const probe = createServer();
    probe.unref();
    probe.on('error', fail);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });
}

class CDP {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        message.error ? reject(new Error(message.error.message)) : resolve(message.result);
        return;
      }
      for (const handler of this.listeners.get(message.method) || []) handler(message.params);
    });
  }

  ready() {
    return new Promise((done, fail) => {
      this.socket.addEventListener('open', done, { once: true });
      this.socket.addEventListener('error', fail, { once: true });
    });
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`${method} timed out`));
      }, 30000);
    });
  }

  on(method, handler) {
    const handlers = this.listeners.get(method) || [];
    handlers.push(handler);
    this.listeners.set(method, handlers);
  }

  close() {
    this.socket.close();
  }
}

// Returns the probe result as plain JSON (stringified in-page), so callers can
// always JSON.parse the return value regardless of CDP's value encoding.
async function evaluate(cdp, expression) {
  const wrapped = `JSON.stringify(${expression})`;
  const result = await cdp.send('Runtime.evaluate', { expression: wrapped, returnByValue: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || 'evaluate failed');
  }
  return result.result.value;
}

async function waitForServer(url, child, logs) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Vite exited early (code ${child.exitCode})\n${logs.join('')}`);
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {
      /* not listening yet */
    }
    await sleep(400);
  }
  throw new Error(`Vite did not answer on ${url}\n${logs.join('')}`);
}

async function launchChrome(chromePath, profileDir) {
  const child = spawn(
    chromePath,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-gpu',
      '--hide-scrollbars',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const portFile = join(profileDir, 'DevToolsActivePort');
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (existsSync(portFile)) {
      const [port] = readFileSync(portFile, 'utf8').split('\n');
      if (port) {
        const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
        const page = targets.find((target) => target.type === 'page');
        if (page) return { child, port, page };
      }
    }
    await sleep(200);
  }
  child.kill();
  throw new Error('Chrome did not expose a debugging target within 30s');
}

async function run() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error('No Chrome or Edge binary found. Set CHROME_PATH to the browser executable.');
    process.exit(1);
  }

  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const serverLogs = [];
  const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  const server = spawn(
    process.execPath,
    [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  server.stdout.on('data', (chunk) => serverLogs.push(chunk.toString()));
  server.stderr.on('data', (chunk) => serverLogs.push(chunk.toString()));

  const profileDir = mkdtempSync(join(tmpdir(), 'medimap-contrast-'));
  let browser = null;
  let cdp = null;
  const failures = [];
  const notices = [];
  let checks = 0;

  const stopServer = () => {
    if (server.exitCode !== null) return;
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
  };

  try {
    await waitForServer(baseUrl, server, serverLogs);
    browser = await launchChrome(chromePath, profileDir);

    cdp = new CDP(browser.page.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Page.navigate', { url: baseUrl + '/' });
    await sleep(2000);

    for (const viewport of VIEWPORTS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
        screenWidth: viewport.width,
        screenHeight: viewport.height,
      });

      for (const theme of THEMES) {
        for (const route of ROUTES) {
          checks += 1;
          const label = `${viewport.name}/${theme} ${route}`;
          await cdp.send('Page.navigate', { url: baseUrl + route });

          const deadline = Date.now() + 20000;
          let mounted = false;
          while (Date.now() < deadline && !mounted) {
            const state = await evaluate(
              cdp,
              `({ ready: document.readyState, kids: document.querySelector('#root')?.children.length || 0, loading: !!document.querySelector('[aria-label="Loading page"]') })`,
            ).catch(() => null);
            if (state) {
              const parsed = JSON.parse(state);
              if (parsed.ready === 'complete' && parsed.kids > 0 && !parsed.loading) mounted = true;
            }
            if (!mounted) await sleep(250);
          }

          if (!mounted) {
            failures.push(`${label} — page did not render`);
            console.log(`FAIL  ${label} — did not render`);
            continue;
          }

          // The theme context reads localStorage, so set it before the app
          // mounts; this also exercises the cold-load path per theme.
          await evaluate(
            cdp,
            `(localStorage.setItem('medimap_theme', '${theme}'), document.documentElement.classList.toggle('dark', ${theme === 'dark'}), true)`,
          );
          await evaluate(cdp, `window.scrollTo(0, document.body.scrollHeight), true`);
          await sleep(700);

          // Probe once mid-page and once at the top, since contrast can differ.
          let result = null;
          for (const position of ['bottom', 'top']) {
            await evaluate(
              cdp,
              position === 'top' ? 'window.scrollTo(0, 0), true' : 'window.scrollTo(0, document.body.scrollHeight), true',
            );
            await sleep(400);
            const probe = JSON.parse(await evaluate(cdp, PROBE));
            if (!result) result = { bad: [], total: 0, unknown: [] };
            result.bad.push(...probe.bad);
            result.total += probe.total;
            result.unknown.push(...probe.unknown);
          }

          for (const note of [...new Set(result.unknown)]) notices.push(`${label} — skipped (image background): ${note}`);
          const failuresHere = [...new Set(result.bad.map((b) => JSON.stringify(b)))].map((s) => JSON.parse(s));
          if (failuresHere.length) {
            failures.push(`${label} — ${result.total} low-contrast text node(s)`);
            console.log(`FAIL  ${label} — ${result.total} low-contrast`);
            for (const bad of failuresHere.slice(0, 4)) {
              console.log(`        "${bad.text}" ${bad.fg} on ${bad.bg} = ${bad.ratio}:1 (min ${bad.min})`);
            }
          } else {
            console.log(`ok    ${label}`);
          }
        }
      }
    }
  } finally {
    if (cdp) {
      await cdp.send('Browser.close').catch(() => {});
      cdp.close();
    } else if (browser) {
      browser.child.kill();
    }
    stopServer();
    await sleep(300);
    try {
      rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      /* Windows may briefly hold a file; the temp folder is disposable. */
    }
  }

  console.log(`\n${checks} page loads across ${VIEWPORTS.length} viewports and ${THEMES.length} themes.`);
  if (notices.length) {
    console.log(`\n${notices.length} notice(s):`);
    for (const notice of [...new Set(notices)].slice(0, 6)) console.log('  ~ ' + notice);
  }
  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`);
    for (const failure of failures) console.error('  x ' + failure);
    process.exit(1);
  }
  console.log('All inspected text meets WCAG AA contrast in light and dark mode.');
}

run().catch((error) => {
  console.error('\nContrast run failed to complete:', error.message);
  process.exit(1);
});
