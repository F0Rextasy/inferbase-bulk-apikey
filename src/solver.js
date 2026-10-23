'use strict';
/**
 * solver.js — the browser/captcha engine of inferbase-bulk-apikey, moved out of
 * cli.js verbatim: the exit transport (TLS + SOCKS5/HTTP-CONNECT), the temp.tf
 * mailbox rail, the raw CDP client, the page helpers and the Turnstile widget
 * that has to mint inside a real headed Chrome.
 *
 * Locked contract used by every repo in this family:
 *
 *   const { solveCaptcha } = require('./solver.js');
 *   const { token, ms } = await solveCaptcha({ type, sitekey, url, proxy, cdata, action });
 *   // type   : 'turnstile' (this panel has no other gate)
 *   // sitekey: the widget key to render (default: the panel's own)
 *   // url    : the page to load first (default: the register page)
 *   // proxy  : 'http://user:pass@host:port' | 'socks5://host:port' | null (DIRECT)
 *   // cdata / action: accepted for signature parity; this panel renders no widget
 *   //          that takes them, so they are not forwarded.
 *   // → { token: string, ms: number }   token is returned UNTRIMMED
 *   // no Chrome / no token → a real Error, never a silent null
 *
 * The widget lives behind one in-page namespace, held in `NS` below so the whole
 * module stays self-contained and portable. The engine reads its own browser
 * flags from argv so it also works standalone: `--browser <exe>` (or
 * CHROME_PATH), `--debug-port N`, `--headless`.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const tls = require('tls');
const http = require('http');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { spawn, spawnSync } = require('child_process');

const IS_SRC = path.basename(__dirname) === 'src';
const ROOT = IS_SRC ? path.resolve(__dirname, '..') : __dirname;
const OUT_DIR = path.join(ROOT, 'out');
const SHOTS_DIR = path.join(OUT_DIR, 'shots');

const SITE = 'https://inferbase.ai';
const BASE = 'https://api.inferbase.ai';
const API = `${BASE}/v1`;
const TEMPTF = 'https://temp.tf';
const TURNSTILE_SITEKEY = '0x4AAAAAAEE8v-wpU5kytU0i';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
/** The single in-page namespace every helper of this engine writes to. */
const NS = '__sk';

// ------------------------------------------------------------------- options
const argv = process.argv.slice(2);
function arg(name, dflt) {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return dflt;
}

const TIMEOUT_MS = Math.max(5000, parseInt(arg('timeout', '60000'), 10) || 60000);
const CODE_TIMEOUT_MS = Math.max(30000, (parseInt(arg('code-timeout', '240'), 10) || 240) * 1000);
const CHROME_BIN = arg('browser', process.env.CHROME_PATH || '');
const DEBUG_PORT = parseInt(arg('debug-port', '0'), 10) || 0; // 0 = auto-pick a free, nonzero port
const HEADLESS = argv.includes('--headless');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

// ------------------------------------------------------------------- proxy
function parseProxy(line) {
  const s = String(line || '').trim();
  if (!s || s.startsWith('#') || s.startsWith('//')) return null;
  let m = s.match(/^(https?|socks5h?|socks4a?):\/\/(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)/i);
  if (!m) m = s.match(/^(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)$/);
  if (!m) return null;
  if (m.length === 6) {
    const raw = m[1].toLowerCase();
    if (raw === 'socks4' || raw === 'socks4a') return null; // not supported by this client
    const protocol = raw.startsWith('socks') ? 'socks5' : 'http';
    return { protocol, host: m[4], port: Number(m[5]), username: m[2] || undefined, password: m[3] || undefined, line: s };
  }
  return { protocol: 'http', host: m[3], port: Number(m[4]), username: m[1] || undefined, password: m[2] || undefined, line: s };
}
const labelOf = (p) => (p ? `${p.protocol}://${p.host}:${p.port}` : '(direct)');

/** A raw socket straight to host:port — direct-mode twin of connectThrough. */
function directConnect(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host, port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`connect timeout (${host}:${port})`)); }, timeoutMs);
    sock.once('error', (e) => { clearTimeout(t); try { sock.destroy(); } catch {} reject(new Error(`connect failed: ${e.message}`)); });
    sock.once('connect', () => { clearTimeout(t); resolve(sock); });
  });
}

function connectThrough(proxy, host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: proxy.host, port: proxy.port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`proxy timeout (${proxy.host}:${proxy.port})`)); }, timeoutMs);
    const done = (err, s) => { clearTimeout(t); if (err) { try { sock.destroy(); } catch {} reject(err); } else resolve(s); };
    sock.once('error', (e) => done(new Error(`proxy connect failed: ${e.message}`)));
    sock.once('connect', () => {
      if (proxy.protocol === 'socks5') {
        sock.write(proxy.username ? Buffer.from([5, 2, 0, 2]) : Buffer.from([5, 1, 0]));
        let stage = 0;
        let buf = Buffer.alloc(0);
        const sendConnect = () => {
          const hb = Buffer.from(host);
          sock.write(Buffer.concat([Buffer.from([5, 1, 0, 3, hb.length]), hb, Buffer.from([port >> 8, port & 0xff])]));
        };
        const onData = (d) => {
          try {
            buf = Buffer.concat([buf, d]);
            for (;;) {
              if (stage === 0) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[0] !== 5) return done(new Error('SOCKS5 bad version'));
                if (v[1] === 2) {
                  if (!proxy.username) return done(new Error('SOCKS5 auth required'));
                  const u = Buffer.from(proxy.username || '');
                  const p = Buffer.from(proxy.password || '');
                  sock.write(Buffer.concat([Buffer.from([1, u.length]), u, Buffer.from([p.length]), p]));
                  stage = 1;
                  continue;
                }
                if (v[1] !== 0) return done(new Error('SOCKS5 no acceptable method'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 1) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[1] !== 0) return done(new Error('SOCKS5 auth failed'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 2) {
                if (buf.length < 5) return;
                const atyp = buf[3];
                const need = 4 + (atyp === 1 ? 4 : atyp === 3 ? 1 + buf[4] : 16) + 2;
                if (buf.length < need) return;
                const rep = buf[1]; buf = buf.slice(need);
                if (rep !== 0) return done(new Error(`SOCKS5 connect failed (code ${rep})`));
                sock.off('data', onData);
                return done(null, sock);
              }
            }
          } catch (e) { done(e); }
        };
        sock.on('data', onData);
        return;
      }
      const auth = proxy.username ? `Proxy-Authorization: Basic ${Buffer.from(`${proxy.username}:${proxy.password || ''}`).toString('base64')}\r\n` : '';
      sock.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`);
      let buf = '';
      const onData = (d) => {
        buf += d;
        if (!buf.includes('\r\n\r\n')) return;
        sock.off('data', onData);
        if (!/^HTTP\/\d(\.\d)? 200/.test(buf)) return done(new Error(`proxy CONNECT refused: ${buf.split('\r\n')[0]}`));
        done(null, sock);
      };
      sock.on('data', onData);
    });
  });
}

/** One HTTPS request through one exit (or direct). Redirects are followed on demand. */
async function exitFetch(proxy, url, { method = 'GET', headers = {}, body = null, timeoutMs = TIMEOUT_MS, redirects = 0 } = {}) {
  let current = url;
  for (let hop = 0; ; hop++) {
    const u = new URL(current);
    const raw = proxy ? await connectThrough(proxy, u.hostname, u.port || 443, Math.min(timeoutMs, 20000)) : await directConnect(u.hostname, u.port || 443, Math.min(timeoutMs, 20000));
    const sock = tls.connect({ socket: raw, servername: u.hostname });
    try {
      await withTimeout(
        new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); }),
        timeoutMs,
        `TLS handshake timeout (${u.hostname})`
      );
      const payload = body == null ? null : Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
      const r = await withTimeout(
        new Promise((resolve, reject) => {
          const req = http.request(
            {
              method,
              path: u.pathname + u.search,
              createConnection: () => sock,
              headers: {
                host: u.host,
                'user-agent': UA,
                accept: '*/*',
                connection: 'close',
                ...(payload ? { 'content-type': 'application/json', 'content-length': payload.length } : {}),
                ...headers,
              },
            },
            (res) => {
              const chunks = [];
              res.on('data', (c) => chunks.push(c));
              res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
            }
          );
          req.on('error', reject);
          if (payload) req.write(payload);
          req.end();
        }),
        timeoutMs,
        'request timeout'
      );
      try { sock.destroy(); } catch {}
      const loc = r.headers.location;
      if ([301, 302, 303, 307, 308].includes(r.status) && loc && hop < redirects) {
        const next = new URL(loc, current).toString();
        if (!next.startsWith('https://')) return { ...r, url: current };
        current = next;
        continue;
      }
      return { ...r, url: current };
    } catch (e) {
      try { sock.destroy(); } catch {}
      throw e;
    }
  }
}

async function exitJson(proxy, url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (opts.body != null && !Buffer.isBuffer(opts.body)) headers['content-type'] = headers['content-type'] || 'application/json';
  const r = await exitFetch(proxy, url, { ...opts, headers });
  let json = null;
  try { json = JSON.parse(r.body); } catch { /* not json */ }
  return { status: r.status, json, text: r.body, headers: r.headers };
}

// ------------------------------------------------------------------- mail
/**
 * Mail rail: the public temp.tf API (no key). It hands out a REAL Microsoft or
 * Gmail mailbox alias, and inferbase answers `hello@inferbase.ai` with the
 * verification link within seconds (measured 2026-10-23, 28 s box→mail).
 */

/** The verification LINK (not a code) — the panel mails `?token=…`. */
const extractLink = (blobRaw) => {
  const blob = String(blobRaw).replace(/&amp;/g, '&');
  const m = /https?:\/\/[^\s"'<>)]*[?&]token=[A-Za-z0-9._-]{6,}/i.exec(blob);
  return m ? m[0] : null;
};

async function newMailbox(exit) {
  const r = await exitJson(exit, `${TEMPTF}/api/account?providers=gmail&dot=0&plus=1`, {
    headers: { accept: 'application/json' },
  });
  const address = r.json && r.json.email;
  if (!address || !/@/.test(address)) throw new Error(`temp.tf account ${r.status}: ${String(r.text).slice(0, 120)}`);
  return { provider: 'temptf', address };
}

/** Raw messages, newest first, each with the html/text body temp.tf returns. */
const inboxList = async (exit, box) => {
  const r = await exitJson(exit, `${TEMPTF}/api/check`, { method: 'POST', body: { email: box.address, wait: false } });
  const list = Array.isArray(r.json) ? r.json : (r.json && (r.json.data || r.json.messages)) || [];
  return list.map((m, i) => ({
    id: String(m.id || m.messageId || i),
    subject: String(m.subject || m.title || ''),
    from: String(m.from || m.sender || (m.fromAddress && (m.fromAddress.address || m.fromAddress)) || ''),
    text: String(m.text || m.textBody || m.plain || m.body || m.html || m.htmlBody || m.snippet || ''),
  }));
};

/** A temp.tf box; the rail throttles, so a couple of tries with plain retry. */
async function pickMailbox(exit, tries = 4) {
  let last = null;
  for (let i = 0; i < tries; i++) {
    try { return await newMailbox(exit); } catch (e) { last = e; await sleep(4000 + i * 4000); }
  }
  throw last || new Error('temp.tf offered no mailbox');
}

/** Message ids already in the box before this run — never accepted. */
async function baseline(exit, box) {
  try { return new Set((await inboxList(exit, box)).map((m) => String(m.id))); } catch (e) { return new Set(); }
}

/** Only the panel's own sender counts — the box is a shared public one. */
const isBrandMail = (from, subject) => /inferbase/i.test(`${from} ${subject}`);

/** Waits for the panel's verification mail and returns its URL. */
async function waitForLink(exit, box, skip, { timeoutMs = Math.min(CODE_TIMEOUT_MS, 180000), pollMs = 5000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    let messages = [];
    try { messages = await inboxList(exit, box); } catch (e) { /* keep waiting */ }
    for (const m of messages) {
      if (skip.has(String(m.id))) continue;
      if (!isBrandMail(m.from, m.subject)) continue;
      const link = extractLink(m.text);
      if (link) return { link, subject: m.subject.slice(0, 80), from: m.from.slice(0, 80) };
    }
    if (Date.now() > deadline) throw new Error('no verification mail arrived in the window');
    await sleep(pollMs);
  }
}

// ------------------------------------------------------------ websocket CDP
/**
 * Minimal RFC6455 client for Chrome's ws:// DevTools endpoint. Node 18 has no
 * global WebSocket, so the handshake and framing are done here on `net`.
 */
class WsClient extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    this.sock = null;
    this.buf = Buffer.alloc(0);
    this.frag = [];
    this.id = 0;
    this.pending = new Map();
  }
  connect(timeoutMs = 15000) {
    const u = new URL(this.url);
    return new Promise((resolve, reject) => {
      const sock = net.connect({ host: u.hostname, port: Number(u.port || 80) });
      this.sock = sock;
      const t = setTimeout(() => { sock.destroy(); reject(new Error('websocket handshake timeout')); }, timeoutMs);
      sock.once('error', (e) => { clearTimeout(t); reject(new Error(`websocket error: ${e.message}`)); });
      sock.once('close', () => {
        for (const [, p] of this.pending) p.reject(new Error('websocket closed'));
        this.pending.clear();
        this.emit('closed');
      });
      sock.once('connect', () => {
        sock.write(
          `GET ${u.pathname} HTTP/1.1\r\n` +
            `Host: ${u.hostname}:${u.port}\r\n` +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            `Sec-WebSocket-Key: ${crypto.randomBytes(16).toString('base64')}\r\n` +
            'Sec-WebSocket-Version: 13\r\n\r\n'
        );
      });
      let handshake = '';
      const onData = (d) => {
        handshake += d.toString('latin1');
        const idx = handshake.indexOf('\r\n\r\n');
        if (idx === -1) return;
        sock.off('data', onData);
        const head = handshake.slice(0, idx);
        if (!/^HTTP\/1\.1 101/.test(head)) {
          clearTimeout(t);
          sock.destroy();
          reject(new Error(`websocket refused: ${head.split('\r\n')[0]}`));
          return;
        }
        clearTimeout(t);
        const rest = Buffer.from(handshake.slice(idx + 4), 'latin1');
        sock.on('data', (chunk) => this._feed(chunk));
        if (rest.length) this._feed(rest);
        resolve(this);
      };
      sock.on('data', onData);
    });
  }
  _feed(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    for (;;) {
      const b = this.buf;
      if (b.length < 2) return;
      const fin = (b[0] & 0x80) !== 0;
      const op = b[0] & 0x0f;
      const masked = (b[1] & 0x80) !== 0;
      let len = b[1] & 0x7f;
      let off = 2;
      if (len === 126) {
        if (b.length < 4) return;
        len = b.readUInt16BE(2);
        off = 4;
      } else if (len === 127) {
        if (b.length < 10) return;
        len = Number(b.readBigUInt64BE(2));
        off = 10;
      }
      let mask = null;
      if (masked) {
        if (b.length < off + 4) return;
        mask = b.slice(off, off + 4);
        off += 4;
      }
      if (b.length < off + len) return;
      const payload = Buffer.from(b.slice(off, off + len));
      if (mask) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      this.buf = b.slice(off + len);
      if (op === 0x0) {
        this.frag.push(payload);
        if (fin) { const full = Buffer.concat(this.frag).toString('utf8'); this.frag = []; this._message(full); }
        continue;
      }
      if (op === 0x1) {
        if (fin) this._message(payload.toString('utf8'));
        else this.frag = [payload];
        continue;
      }
      if (op === 0x9) { this._frame(payload, 0xa); continue; }
      if (op === 0x8) { try { this.sock.destroy(); } catch {} return; }
      // 0xa pong — ignore
    }
  }
  _frame(payload, opcode) {
    const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
    const len = data.length;
    let header;
    if (len < 126) header = Buffer.from([0x80 | opcode, 0x80 | len]);
    else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }
    const mask = crypto.randomBytes(4);
    const out = Buffer.allocUnsafe(len);
    for (let i = 0; i < len; i++) out[i] = data[i] ^ mask[i & 3];
    try { this.sock.write(Buffer.concat([header, mask, out])); } catch (e) { /* closed */ }
  }
  _message(text) {
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    if (msg.id !== undefined && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message || 'cdp error'));
      else resolve(msg.result || {});
      return;
    }
    if (msg.method) this.emit('event', msg);
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this._frame(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }), 0x1);
    });
  }
  close() { try { this.sock.destroy(); } catch {} }
}

/** Thin CDP layer: session-aware send + method-scoped events. */
class CDP {
  constructor(ws) {
    this.ws = ws;
  }
  send(method, params, sessionId) { return this.ws.send(method, params, sessionId); }
  /** No `sessionId` = every session (attach events carry the new session id). */
  on(method, fn, sessionId) {
    const h = (msg) => {
      if (msg.method !== method) return;
      if (sessionId !== undefined && (msg.sessionId || undefined) !== sessionId) return;
      fn(msg.params);
    };
    this.ws.on('event', h);
    return () => this.ws.off('event', h);
  }
}

// ------------------------------------------------------------------- chrome
function findChrome() {
  if (CHROME_BIN) return CHROME_BIN;
  const cands =
    process.platform === 'win32'
      ? [
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
          process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe') : null,
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
  for (const c of cands) {
    if (!c) continue;
    if (c.includes('/') || c.includes('\\')) { if (fs.existsSync(c)) return c; continue; }
    const probe = spawnSync(process.platform === 'win32' ? 'where' : 'which', [c], { encoding: 'utf8', windowsHide: true });
    if (probe.status === 0 && String(probe.stdout).trim()) return String(probe.stdout).trim().split(/\r?\n/)[0];
  }
  throw new Error('Chrome not found — pass --browser <chrome.exe> or set CHROME_PATH');
}

function killChromeTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else child.kill('SIGTERM');
  } catch (e) { /* best effort */ }
}

/** A free loopback port — each run gets its own browser and profile. */
function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

/**
 * Launch Chrome with lean flags over the pinned exit (whole-browser
 * --proxy-server; authenticated HTTP proxies are answered through the Fetch
 * domain). A fresh profile per call keeps every account's panel session clean.
 */
async function launchChrome(exit) {
  const bin = findChrome();
  const debugPort = DEBUG_PORT || (await freePort());
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'inferbase-cli-'));
  const args = [
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
    '--renderer-process-limit=2',
    '--js-flags=--max-old-space-size=256',
    '--no-first-run',
    '--no-default-browser-check',
    '--mute-audio',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`,
    '--window-size=1280,900',
    '--remote-allow-origins=*',
  ];
  if (HEADLESS) args.push('--headless=new');
  if (exit) args.push(`--proxy-server=${exit.protocol}://${exit.host}:${exit.port}`);
  args.push('about:blank');

  const child = spawn(bin, args, { detached: false, stdio: 'ignore' });
  const cleanup = () => {
    killChromeTree(child);
    setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {} }, 2000).unref();
  };
  child.once('error', cleanup);

  const devFile = path.join(profile, 'DevToolsActivePort');
  let port = 0;
  let wsPath = '';
  for (let i = 0; i < 160 && !port; i++) {
    const v = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((r) => r.json()).catch(() => null);
    if (v && v.webSocketDebuggerUrl) {
      const u = new URL(v.webSocketDebuggerUrl);
      port = Number(u.port);
      wsPath = u.pathname;
      break;
    }
    if (fs.existsSync(devFile)) {
      const lines = fs.readFileSync(devFile, 'utf8').split('\n');
      port = Number(lines[0]);
      wsPath = (lines[1] || '').trim();
      break;
    }
    await sleep(300);
  }
  if (!port) {
    cleanup();
    throw new Error(`chrome never came up (debug port ${debugPort} busy? pass --debug-port N)`);
  }

  const ws = new WsClient(`ws://127.0.0.1:${port}${wsPath || '/devtools/browser'}`);
  try {
    await ws.connect();
  } catch (e) {
    cleanup();
    throw e;
  }
  const cdp = new CDP(ws);

  // Auth'd HTTP proxy: answer 407 challenges via the Fetch domain, on the page
  // session and on every auto-attached child (out-of-process iframes).
  const needAuth = !!(exit && exit.username && exit.protocol !== 'socks5');
  const wired = new Set();
  const wireAuth = async (sid) => {
    if (!needAuth || !sid || wired.has(sid)) return;
    wired.add(sid);
    cdp.on('Fetch.authRequired', (p) => {
      cdp.send('Fetch.continueWithAuth', {
        requestId: p.requestId,
        authChallengeResponse: {
          response: 'ProvideCredentials',
          username: exit.username,
          password: exit.password || '',
          proxyUsername: exit.username,
          proxyPassword: exit.password || '',
        },
      }, sid).catch(() => {});
    }, sid);
    cdp.on('Fetch.requestPaused', (p) => cdp.send('Fetch.continueRequest', { requestId: p.requestId }, sid).catch(() => {}), sid);
    await cdp.send('Fetch.enable', { handleAuthRequests: true, patterns: [{ urlPattern: '*' }] }, sid).catch(() => {});
  };

  cdp.on('Target.attachedToTarget', (p) => wireAuth(p && p.sessionId));
  await cdp.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  for (const d of ['Page', 'Runtime', 'Network']) await cdp.send(`${d}.enable`, {}, sessionId);
  await wireAuth(sessionId);

  return {
    cdp,
    targetId,
    sessionId,
    close: async () => {
      try { await cdp.send('Target.closeTarget', { targetId }); } catch (e) {}
      try { ws.close(); } catch (e) {}
      cleanup();
    },
  };
}

/** Left-click at a viewport point — the widget nudge inside widgetToken. */
async function clickAt(cdp, sid, x, y) {
  const p = { x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 };
  await cdp.send('Input.dispatchMouseEvent', { ...p, type: 'mousePressed' }, sid);
  await sleep(70);
  await cdp.send('Input.dispatchMouseEvent', { ...p, type: 'mouseReleased' }, sid);
}

class Page {
  constructor(cdp, sessionId) {
    this.cdp = cdp;
    this.sessionId = sessionId;
  }
  async eval(expr, { awaitPromise = false, timeoutMs = 70000 } = {}) {
    const r = await withTimeout(this.cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise }, this.sessionId), timeoutMs, 'eval timeout');
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
    return r.result && r.result.value;
  }
  async goto(url) {
    await this.cdp.send('Page.navigate', { url }, this.sessionId);
  }
  async url() {
    return this.eval('location.href', { timeoutMs: 20000 }).catch(() => '');
  }
  async shoot(name) {
    try {
      const r = await this.cdp.send('Page.captureScreenshot', { format: 'png' }, this.sessionId);
      fs.mkdirSync(SHOTS_DIR, { recursive: true });
      fs.writeFileSync(path.join(SHOTS_DIR, `${name}.png`), Buffer.from(r.data, 'base64'));
    } catch (e) { /* diagnostics only */ }
  }
  async mouseClick(x, y) {
    return clickAt(this.cdp, this.sessionId, x, y);
  }
}

// ---------------------------------------------------------- in-page helpers
/**
 * The panel is a plain React SPA. `set` still goes through the native value
 * descriptor and fires input/change, because React ignores a bare
 * `el.value = …`; `deep` walks shadow roots so a widget inside one resolves.
 * Everything hangs off the one namespace in `NS`.
 */
const pageHelper = () => `
window.${NS} = window.${NS} || {};
window.${NS}Tok = window.${NS}Tok || {};
window.${NS}Wid = window.${NS}Wid || {};
window.${NS}.deep = (sel) => {
  const walk = (r) => {
    const el = r.querySelector(sel);
    if (el) return el;
    for (const e of r.querySelectorAll('*')) if (e.shadowRoot) { const f = walk(e.shadowRoot); if (f) return f; }
    return null;
  };
  return walk(document);
};
window.${NS}.set = (sel, text) => {
  const el = window.${NS}.deep(sel);
  if (!el) return false;
  el.focus();
  const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  d.set.call(el, text);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};
window.${NS}.clickText = (re) => {
  const out = [];
  const walk = (r) => { out.push(...r.querySelectorAll('button,[role=button],a')); for (const e of r.querySelectorAll('*')) if (e.shadowRoot) walk(e.shadowRoot); };
  walk(document);
  const b = out.find((x) => new RegExp(re, 'i').test((x.innerText || '').trim()));
  if (!b) return false;
  b.click();
  return true;
};
window.${NS}.checkTerms = () => {
  const cs = [...document.querySelectorAll('input[type=checkbox]')];
  const el = cs[cs.length - 1];
  if (!el) return null;
  el.scrollIntoView({ block: 'center' });
  if (!el.checked) el.click();
  return el.checked;
};
window.${NS}.text = () => {
  const out = [];
  const walk = (r) => { out.push(r.textContent || ''); for (const e of r.querySelectorAll('*')) if (e.shadowRoot) walk(e.shadowRoot); };
  walk(document);
  return out.join(' ').replace(/\\s+/g, ' ').slice(0, 400);
};
window.${NS}.fetchJson = async (p, opts) => {
  opts = opts || {};
  const r = await fetch(p, {
    method: opts.method || 'GET',
    headers: Object.assign({ Accept: 'application/json', 'Content-Type': 'application/json' }, opts.headers || {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: r.status, json, text };
};
/** The panel loads the Turnstile script lazily; inject it when it is absent. */
window.${NS}.script = () => new Promise((resolve) => {
  if (window.turnstile) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  s.async = true; s.defer = true;
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.head.appendChild(s);
  setTimeout(() => resolve(!!window.turnstile), 20000);
});
/** Our own widget container: the panel's own container only exists after a form
 *  interaction, and every gated route in this flow needs its own token. */
window.${NS}.mount = (id) => {
  let host = document.getElementById('${NS}_host_' + id);
  if (!host) {
    host = document.createElement('div');
    host.id = '${NS}_host_' + id;
    host.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:2147483646;background:#fff';
    document.body.appendChild(host);
  }
  window.${NS}Tok[id] = '';
  try {
    if (window.${NS}Wid[id] != null) {
      window.turnstile.reset(window.${NS}Wid[id]);
    } else {
      window.${NS}Wid[id] = window.turnstile.render(host, {
        sitekey: window.${NS}Sitekey,
        theme: 'light',
        callback: (t) => { window.${NS}Tok[id] = t; },
        'error-callback': () => { window.${NS}Tok[id] = ''; },
      });
    }
    return 'mounted';
  } catch (e) {
    return 'err:' + e.message;
  }
};
window.${NS}.box = (id) => {
  const host = document.getElementById('${NS}_host_' + id);
  if (!host) return null;
  const r = host.getBoundingClientRect();
  return r.width > 8 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
};
window.${NS}.token = (id) => window.${NS}Tok[id] || '';
true;
`;

/**
 * A token from our own widget on the current document. Tokens are single-use and
 * document-bound: every gated route needs its own, and one produced in another
 * context answers `Turnstile 校验失败`.
 */
async function widgetToken(page, id, { timeoutMs = 60000, note = () => {}, sitekey = TURNSTILE_SITEKEY } = {}) {
  await page.eval(`window.${NS}Sitekey = ${JSON.stringify(sitekey)}`).catch(() => false);
  const ready = await page.eval(`window.${NS}.script()`, { awaitPromise: true, timeoutMs: 30000 }).catch(() => false);
  if (!ready) return '';
  const mounted = await page.eval(`window.${NS}.mount(${JSON.stringify(id)})`).catch((e) => 'err:' + e.message);
  if (String(mounted).startsWith('err')) return '';
  const deadline = Date.now() + timeoutMs;
  let clicks = 0;
  while (Date.now() < deadline) {
    const st = await page.eval(`(() => ({ t: window.${NS}.token(${JSON.stringify(id)}) || '', box: window.${NS}.box(${JSON.stringify(id)}) }))()`).catch(() => null);
    if (st && st.t && st.t.length > 20) return st.t;
    if (st && st.box && clicks < 4 && !HEADLESS) {
      await page.mouseClick(st.box.x + 26, st.box.y + st.box.h / 2);
      clicks++;
      note(`  widget click ${clicks}`);
    }
    await sleep(1800);
  }
  return '';
}

/** Installs (and re-installs) the in-page helper — every navigation drops it. */
async function ensureHelper(page, tries = 20) {
  for (let i = 0; i < tries; i++) {
    const ok = await page.eval(`!!(window.${NS} && window.${NS}.deep)`).catch(() => false);
    if (ok) return true;
    await page.eval(pageHelper()).catch(() => {});
    await sleep(700);
  }
  return false;
}

// ------------------------------------------------------------ solveCaptcha
/**
 * The locked one-call entry point: mint a Turnstile token in a real Chrome on
 * this panel. Fresh profile, the pinned exit as Chrome's `--proxy-server`
 * (headed unless --headless), browser always closed again; the token comes back
 * untrimmed.
 */
async function solveCaptcha({ type = 'turnstile', sitekey = TURNSTILE_SITEKEY, url = '', proxy = null } = {}) {
  if (type !== 'turnstile') throw new Error(`solveCaptcha: ${SITE} only speaks turnstile (asked for ${type})`);
  const exit = typeof proxy === 'string' ? parseProxy(proxy) : proxy || null;
  if (typeof proxy === 'string' && !exit) throw new Error(`solveCaptcha: unusable proxy ${proxy}`);
  const t0 = Date.now();
  const chrome = await launchChrome(exit);
  try {
    const page = new Page(chrome.cdp, chrome.sessionId);
    await page.goto(url || `${SITE}/register`);
    await sleep(6000);
    if (!(await ensureHelper(page))) throw new Error('solveCaptcha: the in-page helper could not be installed');
    const token = await widgetToken(page, 'solve', { sitekey });
    if (!token) throw new Error('solveCaptcha: the Turnstile widget produced no token');
    return { token, ms: Date.now() - t0 };
  } finally {
    await chrome.close().catch(() => {});
  }
}

module.exports = {
  // engine
  NS, SITE, BASE, API, TEMPTF, TURNSTILE_SITEKEY, TIMEOUT_MS, CODE_TIMEOUT_MS, HEADLESS, ROOT, OUT_DIR, SHOTS_DIR,
  sleep, log, withTimeout,
  parseProxy, labelOf, directConnect, connectThrough, exitFetch, exitJson,
  extractLink, newMailbox, inboxList, pickMailbox, baseline, isBrandMail, waitForLink,
  WsClient, CDP, findChrome, killChromeTree, freePort, launchChrome, clickAt, Page,
  pageHelper, widgetToken, ensureHelper,
  solveCaptcha,
};
