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

**批量创建 Inferbase (inferbase.ai) 账户并自动生成 API 密钥 —— 一个兼容 OpenAI 的端点（127 个模型 ID，`auto` 路由），支持工具调用，另附一个 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-127-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题反馈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个项目

Inferbase 是一个普通的兼容 OpenAI 的网关（`https://api.inferbase.ai/v1`），其注册流程是**受 Turnstile 保护的注册加上一封电子邮件链接**。新账户在 Inferbase 自有模型上每天（UTC）可获得 **100 次请求** —— 足以运行真实工作负载，而且计数器在 **00:00 UTC** 重置，而非过期。一个账户携带**一个密钥**（`auto_scope: inferbase`，`rate_limit_rpm: 6`）。该工具通过 CDP 驱动**真实的带界面 Chrome**，因为 Cloudflare 组件只在那里生成令牌，并且它不会在一个组件从不响应的出口上浪费任何资源。

## 🎁 免费额度 —— 你能获得多少

| 项目 | 值 |
| --- | --- |
| 免费额度 | 在 Inferbase 自有模型上**每个账户（组织）每个 UTC 日 100 次请求** |
| 重置 | **00:00 UTC** —— 实测：已用完的计数器返回 `402 Free plan limit: 100 requests per UTC day … all used`，重置后同一密钥返回 `200` |
| 套餐限制（来自提供商） | 每月 5000 次请求 · 每天 100 次托管请求 · 每天 $0.50 托管额度 |
| 每密钥速率限制 | `rate_limit_rpm: 6`（创建密钥时返回） |
| 银行卡 / 手机号 | **无** —— 没有支付步骤，也不要求手机号 |
| 每账户密钥数 | **1**（该工具为每个账户生成一个密钥） |

> 💡 免费额度由 Inferbase 设定，可能会变化。请在 [inferbase.ai](https://inferbase.ai) 查看实时数字 —— 并让工具自身的门控来判定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型 —— 全部 127 个

该端点公布 **127 个 ID**；`GET /v1/models` 返回的正是该账户可以调用的模型，而 `auto` 会路由到一个可用模型（实测：`auto` 以 `qwen3-8-max` 应答）。

| 模型 ID | 备注 |
| --- | --- |
| `auto` | 路由器 —— 工具门控所用的默认值 |
| `qwen3-8-max` | 在实测运行中 `auto` 解析到的模型 |
| `deepseek-v4-flash`、`deepseek-v4-pro` | 对话，已验证工具调用 |
| `meta-llama-3-1-8b-instruct`、`bytedance-seed-2-0-*` | 更多文本路由 |

图像 ID（`bfl-flux-*`）和 `deepseek-ocr-2` 也被列出，但不是对话路由；该工具的门控始终使用 `auto`。

## 🧪 如何使用 API

基础 URL **`https://api.inferbase.ai/v1`** —— 兼容 OpenAI。密钥为 52 个字符，前缀 `inf_`。

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

## 🛠 快速开始

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + e-mail verify in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

注册需要真实、**带界面**的 Chrome：Turnstile 组件只在那里生成令牌，并且该流程会拒绝在组件从不响应的出口上注册。`keys.txt` 仅在该密钥上真实完成一次补全应答后才会写入。

### 🖱️ 启动器

`node src/launcher.js` 是一个覆盖相同模块的菜单：**生成**、**验证**、**筛选**、**9Router**、**设置**。设置持久化在 `launcher.config.json` 中。

## ✅ 已验证可用 —— 每个密钥都经过测试

于 **2026-10-23** 从随附的 CLI 实测（出口列表，无 WARP）。

| 检查项 | 结果 |
| --- | --- |
| 出口审查（HTTP） | 登录页面 + Turnstile 脚本 + API 可达 |
| Chrome 筛选（流程内） | 组件从不生成的线路会在消耗邮箱**之前**被拒绝 |
| 注册 | `POST /api/v1/auth/register` → **200** `Account created` |
| 电子邮件验证 | `hello@inferbase.ai` 邮件 → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| 密钥 | `POST /api/v1/inference/keys`（X-CSRF-Token）→ **201/200**，52 字符的 `inf_…` |
| 对话门控 | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| 工具门控 | 请求中的 `get_time` 工具 schema → 应答中的 `tool_calls` |
| 密钥存活 | **10/10** 个密钥在一次扫描中对话返回 200，且 CLI 在 **40 秒**内端到端生成了另一个 |

> **质量门控。** 这里的每个密钥在写入 `keys.txt` 之前都通过了实时 `chat-200`
> （绝不发布失效密钥）。路由器组合在模型层面遵循相同规则：仅当模型应答 `chat-200` 且能调用工具时，
> 才会添加条目 —— 不支持工具的模型、失效密钥或失效提供商会直接被丢弃而非添加。
> 可随时重新运行验证步骤；失败会被报告，绝不隐藏。

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| 步骤 | 调用 | 备注 |
| --- | --- | --- |
| 筛选 | Chrome 中的注册页面 | 组件必须挂载**并**生成令牌；对于无法做到的线路不会消耗其他任何东西 |
| 邮箱 | `temp.tf`（`providers=gmail`） | 公共 API，无需密钥；面板向 `hello@inferbase.ai` 发信 |
| 注册 | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` —— 令牌必须来自同一出口 |
| 验证 | `POST /api/v1/auth/verify-email` | 邮件携带 `?token=` |
| 登录 | `POST /api/v1/auth/login` | 设置会话 cookie 和 `csrf_token` |
| 密钥 | `POST /api/v1/inference/keys` | 变更类路由 → 需要 `X-CSRF-Token`（没有则返回 403 `CSRF token missing`） |
| 门控 | `GET /v1/models` + 一次补全 | 仅保留带内容的真实 200 |

## ⚙️ CLI 选项

```bash
node src/cli.js --count 5                  # five sign-ups, serial
node src/cli.js --model auto
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| 标志 | 默认值 | 含义 |
| --- | --- | --- |
| `--count N` | `1` | 要生成的账户数，串行 |
| `--model <id>` | `auto` | 用于实时门控的模型 |
| `--pool <file>` | `proxies.txt` | 出口列表，每行一个代理 —— 可选 |
| `--tries N` | `3` | 每个账户筛选的出口候选数 |
| `--mint-tries N` | `2` | 每个出口的完整注册尝试次数（全新邮箱） |
| `--code-timeout S` | `240` | 等待验证邮件的秒数 |
| `--keys <file>` | `keys.txt` | 用于 `--verify-only` / `--connect-9router` 的密钥文件 |
| `--headless` | 关闭 | 仅用于诊断 —— 组件不会生成令牌 |

## 🛰️ 在代理后面

**可选 —— 大规模使用时推荐（每 IP 限制、封禁）。** 该工具在没有代理时也能工作。

- **有代理池时：** 传入 `--pool <file>`（或设置 `INFERBASE_PROXIES`），每个请求 —— 包括 Chrome 浏览器 —— 都通过该列表中的一个出口，失败即关闭。
- **没有代理池时：** CLI 打印 `direct` 模式并直接连接；注册、密钥生成和门控保持不变。
- 出口质量决定成败：流程内的 Chrome 筛选会在消耗邮箱之前拒绝 Turnstile 组件从不生成的线路。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 每行一个经实时验证的密钥 —— 已被 git 忽略 |
| `accounts.json` | 电子邮件 / 密码 / 密钥 / 门控结果，包括失败的尝试 |
| `proxies.txt` | 你的出口 —— 已被 git 忽略 |
| `out/` | 运行日志、失败截图、账本 —— 已被 git 忽略 |

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管、兼容 OpenAI 的路由器：

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix inferbase`、`--base-url https://api.inferbase.ai/v1`、`--model auto`。模型以 `inferbase/<model id>` 形式提供。CLI 可以一步完成同样操作：`node src/cli.js --connect-9router`。

## 🔌 连接到 OmniRoute

[OmniRoute](https://omniroute.online) 是一个自托管、兼容 OpenAI 的路由器：

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix inferbase`、`--base-url https://api.inferbase.ai/v1`、`--model auto`。模型以 `inferbase/<model id>` 形式提供。CLI 可以一步完成同样操作：`node src/cli.js --connect-omniroute`。

## 🔑 一个密钥能给你带来什么

| | |
| --- | --- |
| 🏢 提供商 | **Inferbase** —— [inferbase.ai](https://inferbase.ai) |
| 🎁 提供商提供的内容 | 在其自有模型上**每个账户每个 UTC 日 100 次请求**（计数器在 00:00 UTC 滚动）；无需银行卡，无需手机号 |
| 🔑 一个密钥能给你带来什么 | `https://api.inferbase.ai/v1` 上该账户的模型列表（127 个 ID，`auto` 会挑选一个可用模型） |
| 🌐 API 形态 | 兼容 OpenAI：`POST https://api.inferbase.ai/v1/chat/completions`，包含工具调用 |
| 🔒 你的数据 | 仅联系 `inferbase.ai`、Turnstile 脚本和 `temp.tf` 收件箱后端 |

## 🐞 问题反馈

如果 Inferbase 更改其注册形态、其 Turnstile 站点密钥（`0x4AAAAAAEE8v-wpU5kytU0i`）、每日 100 次请求额度或模型目录，该工具会在该步骤停止并说明原因。请**[提交 issue](../../issues)**，附上命令和确切输出。

## 📄 许可证

MIT © 2026 —— 见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>