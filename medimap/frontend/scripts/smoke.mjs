// scripts/smoke.mjs — loads every route in a real Chrome and fails on
// uncaught errors, console errors, empty pages, or horizontal overflow.
//
// Zero dependencies: it starts its own Vite server, drives Chrome over the
// DevTools protocol, and cleans both up. Run with `npm run smoke`.
//
// Chrome is auto-detected; set CHROME_PATH to use a specific binary.
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
  '/map-view',
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
  '/this-route-does-not-exist',
];

// Signed-out routes the app deliberately forwards elsewhere.
const EXPECTED_REDIRECTS = {
  '/profile': '/login',
};

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];

// The pilot API lives on a remote host; when it is unreachable the app reports
// it through console.error. That is expected in this environment and is not a
// UI regression, so those messages are reported but not treated as failures.
const EXPECTED_CONSOLE_ERRORS = [
  /Search fetch error/i,
  /Map search error/i,
  /Pharmacies fetch error/i,
  /Failed to fetch/i,
  /Load failed/i,
  /net::ERR_/i,
  /ERR_NAME_NOT_RESOLVED/i,
  /ERR_CONNECTION_/i,
  /the server responded with a status of 5\d\d/i,
];

const IGNORE = (text) => EXPECTED_CONSOLE_ERRORS.some((pattern) => pattern.test(text));

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

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
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
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
      const handlers = this.listeners.get(message.method) || [];
      for (const handler of handlers) handler(message.params);
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

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
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

  const profileDir = mkdtempSync(join(tmpdir(), 'medimap-smoke-'));
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

    let runtimeErrors = [];

    cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
      const text = exceptionDetails.exception?.description || exceptionDetails.text || 'exception';
      runtimeErrors.push(text.split('\n')[0]);
    });
    cdp.on('Runtime.consoleAPICalled', (event) => {
      if (event.type !== 'error') return;
      const text = event.args
        .map((arg) => arg.value ?? arg.description ?? arg.unserializableValue ?? '')
        .join(' ')
        .trim();
      if (text) runtimeErrors.push(text);
    });

    // Warm the dev server first: the homepage pulls the heaviest chunk, and on
    // a cold Vite start that first transform can outlast the render deadline.
    // Loading it once here keeps the checked routes on equal footing.
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

      for (const route of ROUTES) {
        checks += 1;
        runtimeErrors = [];
        await cdp.send('Page.navigate', { url: baseUrl + route });

        // Wait for the router to mount the page (lazy chunks included).
        const ready = await (async () => {
          const deadline = Date.now() + 20000;
          while (Date.now() < deadline) {
            const state = await evaluate(
              cdp,
              `JSON.stringify({
                ready: document.readyState,
                root: document.querySelector('#root')?.children.length || 0,
                path: location.pathname + location.search,
                // The route-level Suspense fallback carries this label; its
                // absence means the lazy page chunk has mounted.
                loading: !!document.querySelector('[aria-label="Loading page"]'),
              })`,
            ).catch(() => null);
            if (state) {
              const parsed = JSON.parse(state);
              if (parsed.ready === 'complete' && parsed.root > 0 && !parsed.loading) return parsed;
            }
            await sleep(200);
          }
          return null;
        })();

        await sleep(600);

        const label = `${viewport.name.padEnd(7)} ${route}`;

        if (!ready) {
          failures.push(`${label} — page did not render (#root stayed empty)`);
          console.log(`FAIL  ${label} — page did not render`);
          continue;
        }

        const layout = JSON.parse(
          await evaluate(
            cdp,
            `JSON.stringify({
              overflow: document.documentElement.scrollWidth - window.innerWidth,
              path: location.pathname,
              heading: (function () {
                const headings = [...document.querySelectorAll('h1, h2, h3')];
                const first = headings.find((node) => !node.closest('footer'));
                return first ? first.innerText.split('\\n')[0] : '';
              })(),
            })`,
          ),
        );

        const expectedPath = route.split('?')[0];
        const allowedPath = EXPECTED_REDIRECTS[expectedPath] || expectedPath;
        if (layout.path !== allowedPath) {
          failures.push(`${label} — landed on ${layout.path}, expected ${allowedPath}`);
        }

        const unexpected = runtimeErrors.filter((text) => !IGNORE(text));
        const expected = runtimeErrors.filter((text) => IGNORE(text));

        if (layout.overflow > 1) {
          failures.push(`${label} — horizontal overflow of ${layout.overflow}px`);
        }
        for (const text of unexpected) {
          failures.push(`${label} — console error: ${text.slice(0, 200)}`);
        }
        for (const text of expected) {
          notices.push(`${label} — network: ${text.slice(0, 120)}`);
        }

        const problem = layout.overflow > 1 || unexpected.length > 0 || failures.some((f) => f.startsWith(label));
        console.log(
          `${problem ? 'FAIL' : 'ok  '}  ${label} — overflow ${layout.overflow}px, heading “${layout.heading.slice(0, 42)}”`,
        );
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
      /* Chrome may still hold a file on Windows; the OS temp folder is disposable. */
    }
  }

  console.log(`\n${checks} page loads across ${VIEWPORTS.length} viewports.`);
  if (notices.length) {
    console.log(`\n${notices.length} expected network notice(s):`);
    for (const notice of notices.slice(0, 6)) console.log('  ~ ' + notice);
  }
  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`);
    for (const failure of failures) console.error('  x ' + failure);
    process.exit(1);
  }
  console.log('All routes rendered without console errors or horizontal overflow.');
}

run().catch((error) => {
  console.error('\nSmoke run failed to complete:', error.message);
  process.exit(1);
});
