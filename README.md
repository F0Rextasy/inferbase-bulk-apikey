<div align="center">

```
██╗███╗   ██╗███████╗███████╗██████╗ ██████╗  █████╗ ███████╗███████╗
██║████╗  ██║██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝
██║██╔██╗ ██║█████╗  █████╗  ██████╔╝██████╔╝███████║███████╗█████╗
██║██║╚██╗██║██╔══╝  ██╔══╝  ██╔══██╗██╔══██╗██╔══██║╚════██║██╔══╝
██║██║ ╚████║██║     ███████╗██║  ██║██████╔╝██║  ██║███████║███████╗
╚═╝╚═╝  ╚═══╝╚═╝     ╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
```

# inferbase-bulk-apikey

**Bulk-create Inferbase (inferbase.ai) accounts with auto-generated API keys — an OpenAI-compatible endpoint (127 model ids, `auto` routing) with tool-calling, plus a 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[⚡ One command](#-one-command) · [🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-127-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [⚠️ Terms](#️-terms-and-account-risk) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

Inferbase is a plain OpenAI-compatible gateway (`https://api.inferbase.ai/v1`) whose sign-up is a **Turnstile-gated registration plus an e-mail link**. A fresh account gets **100 requests per UTC day** on Inferbase's own models — enough to run a real workload, and the counter resets at **00:00 UTC** rather than expiring. One account carries **one key** (`auto_scope: inferbase`, `rate_limit_rpm: 6`). The tool drives a **real headed Chrome** over CDP because the Cloudflare widget only mints there, and it spends nothing on an exit whose widget never answers.

## 🎁 Free tier — how much you get

| What | Value |
| --- | --- |
| Free allowance | **100 requests per UTC day per account (organisation)** on Inferbase's own models |
| Reset | **00:00 UTC** — measured: a spent counter answered `402 Free plan limit: 100 requests per UTC day … all used` and the same key answered `200` after the reset |
| Plan limits (from the provider) | 5000 requests/month · 100 managed requests/day · $0.50/day managed |
| Per-key rate limit | `rate_limit_rpm: 6` (returned when the key is created) |
| Card / phone | **none** — no payment step and no phone number is asked for |
| Key per account | **1** (the tool mints one key per account) |

> 💡 The free tier is set by Inferbase and can change. Check the live numbers at [inferbase.ai](https://inferbase.ai) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 127 of them

The endpoint advertises **127 ids**; `GET /v1/models` returns exactly what the account may call, and `auto` routes to a live one (measured: `auto` answered as `qwen3-8-max`).

| Model ID | note |
| --- | --- |
| `auto` | router — the default the tool gates on |
| `qwen3-8-max` | what `auto` resolved to in the measured runs |
| `deepseek-v4-flash`, `deepseek-v4-pro` | chat, tool-calling verified |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | more text routes |

Image ids (`bfl-flux-*`) and `deepseek-ocr-2` are listed too but are not chat routes; the tool's gate always uses `auto`.

## 🧪 How to use the API

Base URL **`https://api.inferbase.ai/v1`** — OpenAI-compatible. Keys are 52 characters, `inf_` prefix.

```bash
curl https://api.inferbase.ai/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY…" -H "Content-Type: application/json" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Say OK."}],"max_tokens":16}'
```

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.inferbase.ai/v1", api_key="YOUR_KEY…")
print(c.chat.completions.create(model="auto",
      messages=[{"role": "user", "content": "Say OK."}], max_tokens=16).choices[0].message.content)
```

## ⚡ One command

```bash
node src/cli.js --count N        # N accounts → N keys, one command, nothing to answer
```

The Cloudflare Turnstile widget is minted by the embedded browser engine (`src/solver.js`) in a real **headed** Chrome — `--auto` is the **default** and stays on, so there is no captcha to paste and no browser question in the way. Naming `--dry` prints the resolved plan (count, model, route, solver, Chrome path) and exits 0 without writing a file or opening a socket:

```bash
node src/cli.js --count N --dry
```

`npm start` (or `node src/launcher.js`) does the same from a menu: pick **1) Mint keys**, answer "How many keys?" (Enter = 10) and it runs `node src/cli.js --auto --count N`. `proxies.txt` is picked up automatically when it exists, otherwise the run is direct.

## 🛠 Quick start

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen
# or directly:
node src/cli.js --count 1        # one sign-up + e-mail verify in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

Registration needs a real, **headed** Chrome: the Turnstile widget only mints there, and the flow refuses to register on an exit whose widget never answers. `keys.txt` is written only after a real completion answered on that key.

### 🖱️ The launcher

`node src/launcher.js` is a menu over the same modules: **mint**, **verify**, **screen**, **9Router**, **settings**. Settings persist in `launcher.config.json`.

## ✅ Verified working — every key is tested

Measured on **2026-10-23** from the shipped CLI (exit list, no WARP).

| Check | Result |
| --- | --- |
| exit vet (HTTP) | login page + Turnstile script + API reachable |
| Chrome screen (in flow) | a line whose widget never mints is refused **before** a mailbox is spent |
| register | `POST /api/v1/auth/register` → **200** `Account created` |
| e-mail verify | `hello@inferbase.ai` mail → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| key | `POST /api/v1/inference/keys` (X-CSRF-Token) → **201/200**, 52-char `inf_…` |
| chat gate | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| tools gate | `get_time` tool schema in the request → `tool_calls` in the answer |
| live gate | every key in `keys.txt` passed a live `chat-200` before it shipped; the CLI also mints a fresh key end-to-end as a self-check |

> **Quality gates.** Every key here passed a live `chat-200` before it was written to `keys.txt`
> (dead keys are never shipped). Router combos follow the same rule at the model level: an entry is
> added **only if the model answers `chat-200` and can call tools** — a model without tool support,
> a dead key or a dead provider is dropped instead of added. Re-run the verify step any time;
> failures are reported, never hidden.

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| Step | Call | Notes |
| --- | --- | --- |
| screen | the register page in Chrome | the widget must mount **and** mint; nothing else is spent on a line that cannot |
| mailbox | `temp.tf` (`providers=gmail`) | public API, no key; the panel mails `hello@inferbase.ai` |
| register | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — the token must come from the same exit |
| verify | `POST /api/v1/auth/verify-email` | the mail carries `?token=` |
| login | `POST /api/v1/auth/login` | sets the session cookie and `csrf_token` |
| key | `POST /api/v1/inference/keys` | mutating route → needs `X-CSRF-Token` (403 `CSRF token missing` without it) |
| gate | `GET /v1/models` + a completion | only a real 200 with content is kept |

## ⚙️ CLI options

```bash
node src/cli.js --count 5                  # five sign-ups, serial
node src/cli.js --model auto
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--count N` | `1` | accounts to mint, serial |
| `--model <id>` | `auto` | model used for the live gate |
| `--pool <file>` | `proxies.txt` | exit list, one line per proxy — optional |
| `--exits N` | `6` | exit candidates screened per account |
| `--mint-tries N` | `2` | full sign-up attempts (fresh mailbox) per exit |
| `--code-timeout S` | `240` | seconds to wait for the verification mail |
| `--keys <file>` | `keys.txt` | key file for `--verify-only` / `--connect-9router` |
| `--headless` | off | DIAGNOSTIC only — the widget will not mint |

## 🛰️ Behind a proxy

**Optional — recommended at scale (per-IP limits, bans).** The tool works without a proxy too.

- **With a pool:** pass `--pool <file>` (or set `INFERBASE_PROXIES`) and every request — the Chrome browser included — goes through an exit from that list, fail-closed.
- **Without a pool:** the CLI prints the `direct` mode and connects directly; sign-up, key minting and the gate are unchanged.
- Exit quality decides success: the in-flow Chrome screen refuses a line whose Turnstile widget never mints before a mailbox is spent.

## 📄 Files

| Path | Contents |
| --- | --- |
| `keys.txt` | one live-verified key per line — git-ignored |
| `accounts.json` | e-mail / password / key / gate result, incl. failed attempts |
| `proxies.txt` | your exits — git-ignored |
| `out/` | run log, failure screenshots, ledger — git-ignored |

## 🔌 Connect to 9Router

[9Router](https://9router.com) is a self-hosted, OpenAI-compatible router:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Defaults: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Models are served as `inferbase/<model id>`. The CLI can do the same in one shot: `node src/cli.js --connect-9router`.

## 🔌 Connect to OmniRoute

[OmniRoute](https://omniroute.online) is a self-hosted, OpenAI-compatible router:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Defaults: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Models are served as `inferbase/<model id>`. The CLI can do the same in one shot: `node src/cli.js --connect-omniroute`.

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 What the provider gives | **100 requests per UTC day per account** on its own models (the counter rolls at 00:00 UTC); no card, no phone |
| 🔑 What one key gets you | the account's model list on `https://api.inferbase.ai/v1` (127 ids, `auto` picks a live one) |
| 🌐 API shape | OpenAI-compatible: `POST https://api.inferbase.ai/v1/chat/completions`, tool-calling included |
| 🔒 Your data | only `inferbase.ai`, the Turnstile script and the `temp.tf` inbox backend are contacted |

## ⚠️ Terms and account risk

This tool automates a sign-up flow, so **you** own what it does: automating a provider's sign-up can break that provider's terms of service, and the free tier an account hands you is the provider's to throttle, change or claw back at any time — per account and per IP. Run it only for accounts you are allowed to create, keep your proxy list your own, and do not treat these keys as production capacity. Nothing here is a licence to bypass a provider's rules.

## 🐞 Issues

If Inferbase changes its sign-up shape, its Turnstile site key (`0x4AAAAAAEE8v-wpU5kytU0i`), the daily 100-request allowance or the model catalogue, the tool stops at that step and says so. **[Open an issue](../../issues)** with the command and the exact output.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>
