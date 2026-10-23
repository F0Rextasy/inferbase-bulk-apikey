#!/usr/bin/env node
'use strict';

/**
 * inferbase-bulk-apikey CLI — mint Inferbase (inferbase.ai) accounts, one API
 * key each, and keep only the keys that answered a real chat call. Zero
 * dependencies, Node >= 18, proxy OPTIONAL (direct by default).
 *
 * Why a real browser: registration carries a Cloudflare Turnstile token, and
 * the widget only mints in a real headed Chrome (the panel's own sign-up does
 * the same). The tool therefore drives Chrome over CDP with a tiny built-in
 * WebSocket client, and it screens the exit first (step 1).
 *
 * Flow, per account:
 *   1. screen exit the register page must render AND the widget must mint a
 *                  token; a line that loads the page but never answers cannot
 *                  register, so it is skipped before a mailbox is spent
 *   2. mailbox     a fresh alias from the public temp.tf API (gmail)
 *   3. register    `POST /api/v1/auth/register` {email,password,full_name,
 *                  company,turnstile_token} → "check your email"
 *   4. verify      the link in `hello@inferbase.ai`'s mail carries `?token=` →
 *                  `POST /api/v1/auth/verify-email`
 *   5. login+key   `POST /api/v1/auth/login` (session cookie + `csrf_token`),
 *                  then `POST /api/v1/inference/keys` with `X-CSRF-Token`
 *                  → the plaintext `inf_…` key is in the response
 *   6. gate        `GET /v1/models` + a real completion through the same exit.
 *
 * Options:
 *   --count N        accounts (= keys) to mint, serial                     [1]
 *   --model <id>     model used for the live gate                         [auto]
 *   --pool <file>    proxy list, one exit per line (env INFERBASE_PROXIES)  [optional]
 *   --tries N        exit candidates screened per account                  [3]
 *   --mint-tries N   full sign-up attempts (fresh mailbox + Chrome) per exit  [2]
 *   --gap MS         pause between accounts                              [20000]
 *   --timeout MS     per-request timeout (node side)                     [60000]
 *   --code-timeout S seconds to wait for the verification mail             [240]
 *   --keys <file>    key file for --verify-only / --connect-9router  [keys.txt]
 *   --screen         only screen the exit list (page + widget + token)
 *   --verify-only    re-run every key in the key file through the chat gate
 *   --connect-9router  register this provider (and its keys) on a local 9Router
 *   --headless       run Chrome headless — DIAGNOSTIC ONLY: the widget will not
 *                    mint on this panel, so every account fails at the token
 *   --browser <exe>  Chrome binary (env CHROME_PATH)                     [auto]
 *   --debug-port N   Chrome DevTools port — a free nonzero one by default
 *   --auto           solve the page's own Turnstile widget in Chrome — DEFAULT, always on
 *   --dry            print the resolved plan and exit (no writes, no network)
 *   --help
 *
 * Your proxy list is OPTIONAL: pass --pool (or INFERBASE_PROXIES) and every
 * request — the browser included — goes through an exit from it, fail-closed;
 * without a pool the tool connects DIRECTLY.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// The browser/captcha engine (raw CDP + Chrome + the Turnstile widget), the exit
// transport and the temp.tf mailbox live in src/solver.js and are required from
// there; only the panel flow stays in this file. Every engine name is imported
// (and re-exported) so nothing the lab drives disappears.
const {
  NS, SITE, BASE, API, TEMPTF, TURNSTILE_SITEKEY, TIMEOUT_MS, CODE_TIMEOUT_MS, HEADLESS, ROOT, OUT_DIR, SHOTS_DIR,
  sleep, log, withTimeout,
  parseProxy, labelOf, directConnect, connectThrough, exitFetch, exitJson,
  extractLink, newMailbox, inboxList, pickMailbox, baseline, isBrandMail, waitForLink,
  WsClient, CDP, findChrome, killChromeTree, freePort, launchChrome, clickAt, Page,
  pageHelper, widgetToken, ensureHelper, solveCaptcha,
} = require('./solver.js');

const KEYS_FILE = path.join(ROOT, 'keys.txt');
const KEYS_DEAD_FILE = path.join(ROOT, 'keys-dead.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');
const DEFAULT_MODEL = 'auto';

// ------------------------------------------------------------------- options
const argv = process.argv.slice(2);
function arg(name, dflt) {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return dflt;
}
const has = (name) => argv.includes(`--${name}`) || argv.includes(`-${name}`);

if (has('help') || has('h')) {
  console.log(`inferbase-bulk-apikey — mint Inferbase (inferbase.ai) accounts, one key each, verified by a live chat call.

  node src/cli.js --count N          mint N accounts (e-mail verify in a real Chrome; Turnstile solved automatically)
  node src/cli.js --count N --dry    print the resolved plan, touch nothing
  node src/cli.js --verify-only      re-check every key in keys.txt
  node src/cli.js --screen           screen the exit list (page + widget + token)
  node src/cli.js --connect-9router  register the provider + its keys on a local 9Router
  node src/cli.js --help

  --count N      accounts to mint, serial                                [1]
  --auto         solve the page's own Turnstile widget in Chrome — DEFAULT, always on
  --dry          print the resolved plan and exit (no writes, no network)
  --model <id>   model used for the live gate                            [auto]
  --pool <file>  proxy list, one exit per line (env INFERBASE_PROXIES) [optional]
  --tries N      exit candidates screened per account                    [3]
  --mail-timeout S   seconds to wait for the verification mail          [240]
  --mint-tries N full sign-up attempts (fresh mailbox each) per exit      [2]
  --keys <file>  key file for --verify-only                          [keys.txt]
  --headless     DIAGNOSTIC ONLY — Turnstile will not mint, every mint fails
  --debug-port N Chrome DevTools port — a free nonzero one picked by default

Registration carries a Cloudflare Turnstile token, and the widget only mints in a
headed Chrome on this panel, so the tool drives a real browser instead of calling
the endpoint directly. Every exit is screened for that ability before an account
is spent on it. The verification e-mail is read from the public temp.tf API.

Free tier: the panel allows 100 requests per UTC day per account (organisation)
on its own models; that counter resets at 00:00 UTC.

Requests go through the exits in your proxy list when one is provided (--pool or
the INFERBASE_PROXIES env). Without a pool the tool connects DIRECTLY.
`);
  process.exit(0);
}

const COUNT = Math.max(1, parseInt(arg('count', '1'), 10) || 1);
const MODEL = arg('model', process.env.INFERBASE_MODEL || DEFAULT_MODEL);
const TRIES = Math.max(1, parseInt(arg('tries', '3'), 10) || 3);
const GAP_MS = Math.max(0, parseInt(arg('gap', '20000'), 10) || 0);
const MINT_TRIES = Math.max(1, parseInt(arg('mint-tries', '2'), 10) || 2);
/** The chat gate must fail fast: a hung exit costs this per candidate model. */
const GATE_MS = Math.max(15000, Math.min(TIMEOUT_MS, 45000));
/** The panel throttles the whole IP to ~5 requests/min — space its API calls. */
const PANEL_GAP_MS = Math.max(0, parseInt(arg('panel-gap', '14000'), 10) || 14000);
const VERIFY_ONLY = has('verify-only');
const SCREEN = has('screen');
const CONNECT_9ROUTER = has('connect-9router');
const KEYS_ARG = arg('keys', KEYS_FILE);
const KEYS_PATH = path.isAbsolute(KEYS_ARG) ? KEYS_ARG : fs.existsSync(KEYS_ARG) ? path.resolve(KEYS_ARG) : path.resolve(ROOT, KEYS_ARG);
// `--auto` is the default and the only captcha path: the widget is minted by the
// embedded engine (src/solver.js). This CLI takes no token of its own, so there
// is nothing a `--no-auto` could fall back to.
const DRY = has('dry');

const rand = (n) => crypto.randomBytes(32).toString('hex').slice(0, n);

// `--dry` is a plan-only run: it prints what would happen and exits 0 without
// writing a file or opening a socket (the pool file is read, nothing else).
if (DRY && require.main === module) {
  let pool = 'direct — no pool configured';
  try {
    const exits = loadExits();
    pool = exits.filter(Boolean).length ? `${exits.filter(Boolean).length} exit(s)` : 'direct';
  } catch (e) { pool = `direct — ${e.message}`; }
  let chrome = '';
  try { chrome = ` · Chrome ${findChrome()}`; } catch (e) { chrome = ` · Chrome NOT found (${e.message})`; }
  console.log('inferbase plan (dry run — no writes, no network)');
  console.log(`  accounts : ${COUNT}`);
  console.log(`  model    : ${MODEL} — the gate probes up to 4 ids`);
  console.log(`  routes   : ${pool}`);
  console.log(`  solver   : auto (src/solver.js, own Turnstile widget)${chrome}`);
  console.log(`  keys     : ${KEYS_PATH}`);
  process.exit(0);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

// ------------------------------------------------------- fail-class ledger
/** One line per failure: {ts, account, exit, class, stage, detail} in out/attempts.jsonl. */
function ledger(rec) {
  try {
    fs.appendFileSync(path.join(OUT_DIR, 'attempts.jsonl'), JSON.stringify({ ts: new Date().toISOString(), ...rec }) + '\n');
  } catch (e) { /* diagnostics must never break the run */ }
}
function classify(e) {
  const m = String((e && e.message) || e || '');
  if (/already|exists|in use/i.test(m)) return 'account-exists';
  if (/no verification code|code arrived/i.test(m)) return 'mail';
  if (/cannot mint a turnstile token|cannot mint/i.test(m)) return 'exit-screen';
  if (/verification rejected|register failed|form never rendered/i.test(m)) return 'register';
  if (/login failed|no token for login/i.test(m)) return 'login';
  if (/token row|key reveal|no key/i.test(m)) return 'token';
  if (/chat gate|no model answered/i.test(m)) return 'chat-gate';
  if (/chrome|websocket|DevTools/i.test(m)) return 'browser';
  if (/proxy|connect|timeout|socket|ECONN|EPIPE|reset|TLS/i.test(m)) return 'exit';
  return 'other';
}

// ------------------------------------------------------------------- pool
function loadExits() {
  const poolArg = arg('pool', process.env.INFERBASE_PROXIES || 'proxies.txt');
  const poolFile = fs.existsSync(poolArg) ? path.resolve(poolArg) : path.resolve(ROOT, poolArg);
  if (!fs.existsSync(poolFile)) {
    // No pool = DIRECT mode: the tool works without a proxy too.
    console.log(`no proxy list at ${poolFile} — running WITHOUT a proxy (direct).`);
    return [null];
  }
  const lines = fs.readFileSync(poolFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const exits = [];
  let skipped = 0;
  for (const line of lines) {
    const p = parseProxy(line);
    if (!p) { skipped++; continue; }
    // Chrome cannot authenticate to a SOCKS5 proxy; such lines are unusable in
    // the browser rail and are dropped here (fail-closed, never silently direct).
    if (p.protocol === 'socks5' && p.username) { skipped++; continue; }
    exits.push(p);
  }
  if (skipped) console.log(`pool: ${skipped} line(s) skipped (unparsable or socks5-with-auth — Chrome cannot use those)`);
  if (!exits.length) throw new Error(`${poolFile} has no usable exits`);
  return exits;
}

/**
 * Exit vet. The HTTP half only proves the page and the API are reachable; the
 * half that decides whether an exit can be *used* — does the Turnstile widget
 * mount and mint inside Chrome — can only be answered by a browser, so the mint
 * screens every exit again at `stage = 'screen'` before spending a mailbox.
 */
async function vetExit(exit) {
  const t0 = Date.now();
  const su = await exitFetch(exit, `${SITE}/login`, { timeoutMs: 25000, redirects: 3 });
  if (su.status !== 200) return { ok: false, why: `login ${su.status}` };
  // 2026-10-22: the panel now serves a client-rendered SPA shell — accept it (the Chrome screen at mint is the real gate).
  const spa = /id=["']root["']/.test(su.body || '') && /\/static\/js\//.test(su.body || '');
  if (!/password|sign in|log in|登录/i.test(su.body || '') && !spa) return { ok: false, why: 'login page did not render' };
  let script = { status: 0 };
  try {
    // 2026-10-22: CF 302s the bare api.js to a versioned path — follow it.
    script = await exitFetch(exit, 'https://challenges.cloudflare.com/turnstile/v0/api.js', { timeoutMs: 25000, redirects: 3 });
  } catch (e) {
    return { ok: false, why: `turnstile script unreachable: ${String(e.message).slice(0, 50)}` };
  }
  if (script.status !== 200) return { ok: false, why: `turnstile script ${script.status}` };
  let api = { status: 0 };
  try {
    api = await exitFetch(exit, `${API}/models`, { timeoutMs: 25000 });
  } catch (e) {
    return { ok: false, why: `api unreachable: ${String(e.message).slice(0, 60)}` };
  }
  // No key here, so 401/403/404 all prove reachability; only a network failure is fatal.
  return { ok: true, ms: Date.now() - t0, api: api.status, signupBytes: su.body.length };
}

async function screen(exits) {
  let ok = 0;
  for (const e of exits) {
    try {
      const v = await vetExit(e);
      if (v.ok) ok++;
      console.log(`  ${v.ok ? '✔' : '✘'} ${labelOf(e)} ${v.ok ? `ok ${v.ms}ms (api ${v.api})` : v.why}`);
    } catch (err) {
      console.log(`  ✘ ${labelOf(e)} ${String(err.message).slice(0, 90)}`);
    }
  }
  console.log(`screened ${exits.length} exit(s): ${ok} pass the HTTP screen (sign-in + turnstile script + api)`);
  console.log(`note: the browser half is decided during minting — the flow refuses to register on an exit whose widget never mints (stage "screen")`);
  return ok;
}

// ------------------------------------------------------------ account flow
async function mintOnExit(n, exit) {
  const started = Date.now();
  const box = await pickMailbox(exit);
  log(`account ${n}: mailbox ${box.address}`);

  const chrome = await launchChrome(exit);
  const page = new Page(chrome.cdp, chrome.sessionId);
  let ua = null;
  let stage = 'browser';
  // The mutating endpoints are CSRF-guarded and the session rides a cookie, so
  // the walk keeps a tiny jar: every call sends what it has and stores what came
  // back (login sets `csrf_token`, mirrored into X-CSRF-Token).
  const jar = new Map();
  const api = async (path_, opts = {}) => {
    const headers = { ...(opts.headers || {}) };
    if (jar.size) headers.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    const r = await exitJson(exit, `${BASE}${path_}`, { ...opts, headers });
    for (const raw of [].concat((r.headers && r.headers['set-cookie']) || [])) {
      const m = /^([^=;]+)=([^;]*)/.exec(String(raw));
      if (m) jar.set(m[1], m[2]);
    }
    return r;
  };
  try {
    const password = `Ib${rand(8)}!7a${rand(2)}`;
    const fullName = `Ib ${rand(4)}`;
    const company = `${rand(4)} Labs`;
    const email = box.address;

    log(`account ${n}: goto ${SITE}/register via ${labelOf(exit)}`);
    await page.goto(`${SITE}/register`);
    await sleep(6000);
    ua = await page.eval('navigator.userAgent');
    if (!(await ensureHelper(page))) throw new Error('page helper could not be installed on /register');
    await page.shoot('01-signup');

    // The exit screen doubles as the registration token: the widget must mount
    // AND mint before an account is spent on the exit.
    stage = 'screen';
    const token = await widgetToken(page, 'register', { timeoutMs: 60000, note: log });
    if (!token) throw Object.assign(new Error('exit cannot mint a turnstile token'), { exitShaped: true });
    log(`  turnstile ok — token len=${token.length}`);

    stage = 'register';
    const reg = await api('/api/v1/auth/register', {
      method: 'POST',
      body: { email, password, full_name: fullName, company, turnstile_token: token },
    });
    log(`  register -> ${reg.status} ${String(reg.text).slice(0, 140)}`);
    if (reg.status >= 400 || !reg.json || !/created/i.test(String(reg.json.message || ''))) {
      throw new Error(`register failed: ${String(reg.text).slice(0, 140)}`);
    }

    stage = 'verify-mail';
    const skip = await baseline(exit, box);
    const hit = await waitForLink(exit, box, skip, { timeoutMs: Math.min(CODE_TIMEOUT_MS, 180000) });
    log(`  mail «${hit.subject}» from ${hit.from}`);
    const vtoken = new URL(hit.link).searchParams.get('token') || '';
    if (!vtoken) throw new Error('verification mail carried no token');

    stage = 'verify';
    const v = await api('/api/v1/auth/verify-email', { method: 'POST', body: { token: vtoken } });
    log(`  verify-email -> ${v.status} ${String(v.text).slice(0, 120)}`);
    if (v.status >= 400) throw new Error(`verify-email failed: ${String(v.text).slice(0, 120)}`);

    stage = 'login';
    const lg = await api('/api/v1/auth/login', { method: 'POST', body: { email, password } });
    log(`  login -> ${lg.status}`);
    if (lg.status >= 400) throw new Error(`login failed: ${String(lg.text).slice(0, 140)}`);
    const me = await api('/api/v1/auth/me');
    if (me.status >= 400) throw new Error(`me failed: ${String(me.text).slice(0, 120)}`);

    stage = 'key';
    const csrf = jar.get('csrf_token') || '';
    const mk = await api('/api/v1/inference/keys', {
      method: 'POST',
      headers: csrf ? { 'x-csrf-token': csrf } : {},
      body: { name: 'main' },
    });
    const key = mk.json && mk.json.key;
    if (!key) throw new Error(`key create failed (${mk.status}): ${String(mk.text).slice(0, 160)}`);
    log(`  key ${key.slice(0, 10)}… (${key.length})`);

    // Persist before the gate: the key must survive a gate failure.
    stage = 'gate';
    const rec = {
      provider: 'inferbase',
      email,
      password,
      key,
      exit: labelOf(exit),
      ua,
      ts: new Date().toISOString(),
      gate: 'pending',
    };
    const accounts = loadAccounts();
    accounts.push(rec);
    saveAccounts(accounts);
    await page.shoot('03-key');

    const proof = await proveKey(exit, key);
    if (!proof.ok) {
      rec.gate = `failed:${proof.status}`;
      rec.sample = String(proof.sample).slice(0, 200);
      saveAccounts(accounts);
      throw new Error(`chat gate ${proof.status}: ${String(proof.sample).slice(0, 120)}`);
    }
    rec.gate = 200;
    rec.models = proof.models;
    rec.via = proof.via;
    saveAccounts(accounts);
    await page.shoot('04-live');
    log(`account ${n}: key LIVE on ${proof.model} (${proof.models} models, via ${proof.via}) · ${key.slice(0, 10)}… · ${Math.round((Date.now() - started) / 1000)}s`);
    return rec;
  } catch (e) {
    await page.shoot(`99-fatal-${stage}`).catch(() => {});
    e.skStage = stage;
    throw e;
  } finally {
    await chrome.close();
  }
}

async function attemptAccount(n, exits, seed) {
  const limit = Math.min(TRIES, exits.length);
  for (let t = 0; t < limit; t++) {
    const exit = exits[(seed + t) % exits.length];
    let vet;
    try {
      vet = await vetExit(exit);
    } catch (e) {
      vet = { ok: false, why: String(e.message).slice(0, 90) };
    }
    if (!vet.ok) {
      log(`account ${n}: exit ${labelOf(exit)} failed the vet (${vet.why}) — trying the next one`);
      ledger({ account: n, exit: labelOf(exit), class: 'exit-vet', detail: vet.why });
      continue;
    }
    log(`account ${n}: exit pinned ${labelOf(exit)} (vet ${vet.ms}ms)`);
    // The mailbox rail is the flaky half: a dead box costs one full attempt,
    // then the next try builds a new box (and a new Chrome) on the same exit.
    for (let m = 1; m <= MINT_TRIES; m++) {
      try {
        return await mintOnExit(n, exit);
      } catch (e) {
        const cls = classify(e);
        log(`account ${n}: ${cls} failed (try ${m}/${MINT_TRIES}) — ${String(e.message).slice(0, 150)}`);
        ledger({ account: n, exit: labelOf(exit), class: cls, stage: e.skStage, try: m, detail: String(e.message).slice(0, 300) });
        if (m < MINT_TRIES && GAP_MS) await sleep(GAP_MS);
      }
    }
  }
  return null;
}

// ------------------------------------------------------------ key handling
function readKeys(file = KEYS_PATH) {
  try {
    return fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
function appendKey(key) {
  fs.appendFileSync(KEYS_PATH, (fs.existsSync(KEYS_PATH) && fs.statSync(KEYS_PATH).size ? '\n' : '') + key + '\n');
}
/** A dead key is never dropped silently: out of the key file, into keys-dead.txt. */
function buryKeys(dead) {
  if (!dead.length) return 0;
  const parked = readKeys(KEYS_DEAD_FILE).filter(Boolean);
  for (const k of dead) if (!parked.includes(k)) parked.push(k);
  fs.writeFileSync(KEYS_DEAD_FILE, parked.map((k) => k + '\n').join(''));
  fs.writeFileSync(KEYS_PATH, readKeys().filter((k) => !dead.includes(k)).map((k) => k + '\n').join(''));
  return dead.length;
}
function loadAccounts() {
  try { return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); } catch { return []; }
}
function saveAccounts(list) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2) + '\n');
}

// ------------------------------------------------------------------- proof
/** Chat-capable candidates, free/cheap-looking first, embedding ids excluded. */
function pickCandidates(ids) {
  const chat = (ids || []).filter((id) => id && !/embedding|rerank/i.test(id));
  const out = [MODEL];
  for (const hint of ['free', 'flash', 'lite', 'mini', 'small', 'qwen']) {
    for (const id of chat) if (!out.includes(id) && id.toLowerCase().includes(hint)) out.push(id);
  }
  for (const id of chat) if (!out.includes(id)) out.push(id);
  return out.slice(0, 4);
}

async function listModels(exit, key) {
  const r = await exitJson(exit, `${API}/models`, { headers: { authorization: `Bearer ${key}` }, timeoutMs: TIMEOUT_MS });
  return { status: r.status, ids: ((r.json && r.json.data) || []).map((m) => m.id).filter(Boolean) };
}

const RL_HEADERS = [
  'x-ratelimit-limit-requests',
  'x-ratelimit-remaining-requests',
  'x-ratelimit-limit-tokens',
  'x-ratelimit-remaining-tokens',
  'retry-after',
];
/** One real completion; 200 with content (or reasoning) = the key is live. */
async function chatGate(exit, key, model) {
  const r = await exitJson(exit, `${API}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}` },
    timeoutMs: GATE_MS,
    body: { model, messages: [{ role: 'user', content: 'Reply with the single word: ok' }], max_tokens: 16, stream: false },
  });
  const msg = r.json && r.json.choices && r.json.choices[0] && r.json.choices[0].message;
  // This relay answers reasoning routes with an EMPTY `content` and the text in
  // `reasoning` (DeepSeek-V4-Flash on the live panel does exactly that), so a
  // content-only gate would call 18 live keys dead (measured 2026-10-21).
  const content = msg && (msg.content || msg.reasoning_content || msg.reasoning || '');
  const rateLimits = {};
  for (const k of RL_HEADERS) if (r.headers && r.headers[k] != null) rateLimits[k] = String(r.headers[k]);
  return {
    ok: r.status === 200 && !!String(content).trim(),
    status: r.status,
    model,
    via: msg && msg.content ? 'content' : 'reasoning',
    sample: content ? String(content).slice(0, 60) : String(r.text).slice(0, 140),
    rateLimits,
  };
}

/**
 * Models + a completion on the first model that answers — the keep/drop gate.
 *
 * Two measured classes are retried instead of read as a verdict: a pass that
 * only produced exit-class errors, and **`401 API key is disabled`** — on
 * 2026-10-21 three keys answered that from one exit and 200 from another in the
 * same minute, so the panel/relay, not the key, decides that answer. Rotating
 * exits needs a pool: pass `exits` for --verify-only.
 */
async function proveKey(exit, key, { attempts = 2, exits = null } = {}) {
  const pool = Array.isArray(exits) && exits.length ? exits : [exit];
  const retryable = (g) => !g || g.status === 0 || (g.status === 401 && /key is disabled/i.test(String(g.sample || '')));
  let last = null;
  for (let a = 1; a <= attempts; a++) {
    const use = pool[(a - 1) % pool.length];
    let models;
    try {
      models = await listModels(use, key);
    } catch (e) {
      last = { ok: false, status: 0, models: 0, sample: `GET /v1/models: ${String(e.message).slice(0, 100)}`, rateLimits: {} };
      await sleep(2000);
      continue;
    }
    if (models.status !== 200 || !models.ids.length) {
      last = { ok: false, status: models.status, models: 0, sample: `GET /v1/models -> ${models.status}`, rateLimits: {} };
      if (a < attempts) continue;
      return last;
    }
    let retry = false;
    for (const model of pickCandidates(models.ids)) {
      try {
        const g = await chatGate(use, key, model);
        if (g.ok) return { ok: true, status: 200, model: g.model, via: g.via, sample: g.sample, models: models.ids.length, rateLimits: g.rateLimits };
        last = { ...g, models: models.ids.length };
        if (retryable(g)) retry = true;
        else break; // a real answer (bad model id, quota, …) — no exit will change it
      } catch (e) {
        last = { status: 0, model, sample: String(e.message).slice(0, 120), rateLimits: {} };
        retry = true;
      }
    }
    if (!retry) break;
    if (a < attempts) await sleep(2500);
  }
  return { ok: false, status: last && last.status, models: (last && last.models) || 0, sample: (last && last.sample) || 'no model answered', rateLimits: (last && last.rateLimits) || {} };
}

// ------------------------------------------------------------------- modes
async function mint(exits) {
  log(`inferbase mint · ${COUNT} account(s) · model ${MODEL} · exits ${exits.filter(Boolean).length || 'direct'} · keys land in ${KEYS_FILE}`);
  let made = 0;
  for (let i = 0; i < COUNT; i++) {
    const rec = await attemptAccount(i + 1, exits, i);
    // mintOnExit has already recorded the account (key + gate result) in
    // accounts.json; keys.txt is the only file written here.
    if (rec) {
      appendKey(rec.key);
      made++;
    }
    if (i < COUNT - 1 && GAP_MS) await sleep(GAP_MS);
  }
  log(`done — ${made}/${COUNT} key(s) written to ${KEYS_FILE}`);
  process.exit(made === COUNT ? 0 : 1);
}

async function verifyOnly(exits) {
  const keys = readKeys();
  if (!keys.length) {
    console.log(`no keys in ${KEYS_PATH}`);
    process.exit(0);
  }
  console.log(`keys: ${keys.length} from ${KEYS_PATH} · exits ${exits.filter(Boolean).length || 'direct'}`);
  let live = 0;
  let modelCount = null;
  const dead = [];
  for (let i = 0; i < keys.length; i++) {
    const exit = exits[i % exits.length];
    try {
      if (modelCount === null) {
        const m = await listModels(exit, keys[i]);
        modelCount = m.ids.length;
        console.log(`  /v1/models -> ${m.status}, ${modelCount} models`);
      }
      const g = await proveKey(exit, keys[i], { attempts: Math.max(2, Math.min(4, exits.length)), exits });
      if (g.ok) live++;
      else dead.push(keys[i]);
      console.log(`  ${g.ok ? '✔' : '✘'} ${keys[i].slice(0, 12)}… chat=${g.ok ? 200 : g.status || 0} ${g.ok ? `${g.model} "${g.sample}" rl=${JSON.stringify(g.rateLimits)}` : String(g.sample).slice(0, 90)}`);
    } catch (e) {
      dead.push(keys[i]);
      console.log(`  ✘ ${keys[i].slice(0, 12)}… ${String(e.message).slice(0, 90)}`);
    }
  }
  if (dead.length) console.log(`verified dead: ${buryKeys(dead)} key(s) → ${KEYS_DEAD_FILE} (out of ${path.basename(KEYS_PATH)})`);
  console.log(`verify: ${live}/${keys.length} keys live`);
  process.exit(live === keys.length ? 0 : 1);
}

// ------------------------------------------------------------ 9Router
/** Register the provider-node + one connection per key on a local 9Router. */
async function connect9router() {
  const base = (arg('9router-base', 'http://localhost:20128')).replace(/\/$/, '');
  const password = arg('9router-password', '123456');
  const name = arg('9router-name', 'Inferbase');
  const prefix = arg('9router-prefix', 'inferbase');
  const baseUrl = arg('base-url', `${API}`);
  const r9ua = 'inferbase-bulk-9router-connector/1.0';
  const keys = arg('api-key', '') ? [arg('api-key', '')] : readKeys();
  if (!keys.length) {
    console.log(`no keys — mint one first (node src/cli.js --count 1), or pass --api-key <key>`);
    process.exit(1);
  }

  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': r9ua },
    body: JSON.stringify({ password }),
  });
  const setCookie = typeof login.headers.getSetCookie === 'function' ? login.headers.getSetCookie() : [];
  const cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  console.log(`9Router login: ${login.ok ? 'ok' : `not required/failed ${(await login.text()).slice(0, 120)}`}`);

  const api = async (route, init = {}) => {
    const res = await fetch(`${base}${route}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'User-Agent': r9ua, ...(cookie ? { Cookie: cookie } : {}), ...(init.headers || {}) },
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-JSON reported as text */ }
    return { status: res.status, ok: res.ok, json, text: text.slice(0, 300) };
  };

  const nodes = await api('/api/provider-nodes');
  let node = (((nodes.json || {}).nodes) || []).find((n) => n.prefix === prefix || n.name === name);
  if (node) {
    console.log(`provider-node exists: ${node.id} (prefix ${node.prefix})`);
  } else {
    const created = await api('/api/provider-nodes', {
      method: 'POST',
      body: JSON.stringify({ name, prefix, apiType: 'chat', type: 'openai-compatible', baseUrl }),
    });
    if (!created.ok) throw new Error(`create node failed ${created.status}: ${created.text}`);
    node = created.json.node;
    console.log(`provider-node created: ${node.id} (${baseUrl})`);
  }

  const conns = await api('/api/providers');
  const existing = (((conns.json || {}).connections) || []).filter((c) => c.provider === node.id || c.name === name);
  let added = 0;
  for (let i = 0; i < keys.length; i++) {
    const connName = keys.length === 1 ? name : `${prefix}-${String(i + 1).padStart(3, '0')}`;
    if (existing.some((c) => c.name === connName)) {
      console.log(`connection exists: ${connName}`);
      continue;
    }
    const created = await api('/api/providers', {
      method: 'POST',
      body: JSON.stringify({ provider: node.id, apiKey: keys[i], name: connName, priority: 1, defaultModel: MODEL }),
    });
    if (!created.ok && created.status !== 409) throw new Error(`create connection ${connName} failed ${created.status}: ${created.text}`);
    added++;
    console.log(`connection created: ${connName}`);
  }
  console.log(`\nDone — ${added} new connection(s). Models are served as ${prefix}/<model id>:\n  ${prefix}/${MODEL}`);
}

// ------------------------------------------------------------------- main
if (require.main === module) {
  (async () => {
    if (CONNECT_9ROUTER) {
      await connect9router();
      process.exit(0);
    }
    const exits = loadExits();
    if (SCREEN) {
      const pass = await screen(exits);
      process.exit(pass ? 0 : 1);
    }
    if (VERIFY_ONLY) {
      await verifyOnly(exits);
      return;
    }
    await mint(exits);
  })().catch((e) => {
    console.error('[fatal]', e.message);
    process.exit(1);
  });
}

// Exported so the lab can drive parts of the rail directly (page probe); the
// CLI itself only runs its main flow when executed as a script. The engine comes
// from solver.js.
module.exports = {
  NS, SITE, BASE, API, TEMPTF, TURNSTILE_SITEKEY, TIMEOUT_MS, CODE_TIMEOUT_MS, HEADLESS, ROOT, OUT_DIR, SHOTS_DIR,
  sleep, log, withTimeout,
  parseProxy, labelOf, directConnect, connectThrough, exitFetch, exitJson,
  extractLink, newMailbox, inboxList, pickMailbox, baseline, isBrandMail, waitForLink,
  WsClient, CDP, findChrome, killChromeTree, freePort, launchChrome, clickAt, Page,
  pageHelper, widgetToken, ensureHelper, solveCaptcha,
  loadExits, vetExit, screen, mintOnExit, attemptAccount, pickCandidates, proveKey,
  parseArgs: arg,
};
