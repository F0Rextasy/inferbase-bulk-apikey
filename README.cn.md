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

**批量创建 Inferbase (inferbase.ai) 账户并自动生成 API 密钥 —— 一个兼容 OpenAI 的端点（127 个模型 ID、`auto` 路由），支持工具调用，另附 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[⚡ 一条命令](#-one-command) · [🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-127-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [⚠️ 条款](#️-terms-and-account-risk) · [🐞 问题](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么存在

Inferbase 是一个普通的兼容 OpenAI 的网关（`https://api.inferbase.ai/v1`），其注册流程是**受 Turnstile 保护的注册加一封电子邮件链接**。新账户在 Inferbase 自有模型上每天（UTC）可获得 **100 次请求** —— 足以运行真实的工作负载，而且计数器在 **00:00 UTC** 重置而非过期。一个账户携带**一个密钥**（`auto_scope: inferbase`，`rate_limit_rpm: 6`）。该工具通过 CDP 驱动**真实的有头 Chrome**，因为 Cloudflare 组件只在那里生成，并且它不会在组件从不响应的出口上浪费任何东西。

## 🎁 免费额度 —— 你能得到多少

| 项目 | 值 |
| --- | --- |
| 免费额度 | 在 Inferbase 自有模型上**每账户（组织）每个 UTC 日 100 次请求** |
| 重置 | **00:00 UTC** —— 实测：已用完的计数器返回 `402 Free plan limit: 100 requests per UTC day … all used`，重置后同一密钥返回 `200` |
| 套餐限制（来自提供商） | 每月 5000 次请求 · 每天 100 次托管请求 · 每天 $0.50 托管额度 |
| 每密钥速率限制 | `rate_limit_rpm: 6`（创建密钥时返回） |
| 信用卡 / 电话 | **无需** —— 没有支付步骤，也不要求电话号码 |
| 每账户密钥数 | **1**（该工具为每个账户生成一个密钥） |

> 💡 免费额度由 Inferbase 设定，可能随时变化。请在 [inferbase.ai](https://inferbase.ai) 查看实时数字 —— 并让工具自身的闸门来判断：

```bash
node src/cli.js --verify-only     # keys.txt 中的每个密钥都会用真实聊天调用重新测试
```

## 🤖 模型 —— 全部 127 个

该端点公布 **127 个 ID**；`GET /v1/models` 返回的正是该账户可以调用的内容，而 `auto` 会路由到一个可用模型（实测：`auto` 以 `qwen3-8-max` 应答）。

| 模型 ID | 备注 |
| --- | --- |
| `auto` | 路由器 —— 工具把关所用的默认值 |
| `qwen3-8-max` | 在实测运行中 `auto` 解析到的模型 |
| `deepseek-v4-flash`、`deepseek-v4-pro` | 聊天，已验证工具调用 |
| `meta-llama-3-1-8b-instruct`、`bytedance-seed-2-0-*` | 更多文本路由 |

图像 ID（`bfl-flux-*`）和 `deepseek-ocr-2` 也被列出，但它们不是聊天路由；工具的闸门始终使用 `auto`。

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

## ⚡ 一条命令

```bash
node src/cli.js --count N        # N 个账户 → N 个密钥，一条命令，无需作答
```

Cloudflare Turnstile 组件由嵌入式浏览器引擎（`src/solver.js`）在真实的**有头** Chrome 中生成 —— `--auto` 是**默认**且始终开启，因此没有需要粘贴的验证码，也没有浏览器问题挡路。指定 `--dry` 会打印解析后的计划（数量、模型、路由、求解器、Chrome 路径）并以退出码 0 退出，不写入文件也不打开套接字：

```bash
node src/cli.js --count N --dry
```

`npm start`（或 `node src/launcher.js`）从菜单执行相同操作：选择 **1) Mint keys**，回答 "How many keys?"（回车 = 10），它会运行 `node src/cli.js --auto --count N`。当 `proxies.txt` 存在时会自动加载，否则运行为直连。

## 🛠 快速开始

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # 可选 —— 没有它则工具直连运行
node src/launcher.js        # 交互式：生成 / 验证 / 筛选
# 或者直接：
node src/cli.js --count 1        # 在真实 Chrome 中完成一次注册 + 邮件验证
node src/cli.js --verify-only    # 重新测试 keys.txt 中已有的每个密钥
node src/cli.js --screen         # 对出口列表进行 HTTP 筛选
```

注册需要真实、**有头**的 Chrome：Turnstile 组件只在那里生成，并且对于组件从不响应的出口，流程会拒绝注册。只有在该密钥上真实完成一次补全应答之后，才会写入 `keys.txt`。

### 🖱️ 启动器

`node src/launcher.js` 是同一组模块上的菜单：**生成**、**验证**、**筛选**、**9Router**、**设置**。设置持久化在 `launcher.config.json` 中。

## ✅ 验证可用 —— 每个密钥都经过测试

在 **2026-10-23** 从随附的 CLI 实测（出口列表，无 WARP）。

| 检查项 | 结果 |
| --- | --- |
| 出口审查（HTTP） | 登录页面 + Turnstile 脚本 + API 可达 |
| Chrome 筛选（流程中） | 组件从不生成的线路会在消耗邮箱**之前**被拒绝 |
| 注册 | `POST /api/v1/auth/register` → **200** `Account created` |
| 邮件验证 | `hello@inferbase.ai` 邮件 → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| 密钥 | `POST /api/v1/inference/keys`（X-CSRF-Token）→ **201/200**，52 字符的 `inf_…` |
| 聊天闸门 | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| 工具闸门 | 请求中包含 `get_time` 工具 schema → 应答中包含 `tool_calls` |
| 实时闸门 | `keys.txt` 中的每个密钥在交付前都通过了实时 `chat-200`；CLI 还会端到端生成一个新密钥作为自检 |

> **质量闸门。** 这里的每个密钥在写入 `keys.txt` 之前都通过了实时 `chat-200`
>（死密钥绝不交付）。路由器组合在模型层面遵循同样的规则：只有当模型能应答 `chat-200`
> 并能调用工具时才会添加条目 —— 不支持工具的模型、死密钥或死提供商会直接丢弃而不会被添加。
> 随时可重新运行验证步骤；失败会被报告，绝不隐藏。

## 🧭 工作原理

```
收件箱（每个账户一个地址）                                  每个账户一个全新地址
   │
   ├─▶ 注册：Inferbase 页面 → 电子邮件地址 → 从收件箱获取验证码 / 链接
   ├─▶ 会话：拿到账户的 cookie 或访问令牌
   ├─▶ 密钥生成：账户的密钥端点 → 明文密钥只返回一次（立即写入磁盘）
   └─▶ 实时证明：POST https://api.inferbase.ai/v1/chat/completions → 真实内容 = 密钥可用
```

| 步骤 | 调用 | 说明 |
| --- | --- | --- |
| 筛选 | Chrome 中的注册页面 | 组件必须**挂载**并生成；对于无法做到的线路不消耗其他任何东西 |
| 邮箱 | `temp.tf`（`providers=gmail`） | 公共 API，无需密钥；该面板发送邮件至 `hello@inferbase.ai` |
| 注册 | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` —— 令牌必须来自同一出口 |
| 验证 | `POST /api/v1/auth/verify-email` | 邮件携带 `?token=` |
| 登录 | `POST /api/v1/auth/login` | 设置会话 cookie 和 `csrf_token` |
| 密钥 | `POST /api/v1/inference/keys` | 变更路由 → 需要 `X-CSRF-Token`（缺少时返回 403 `CSRF token missing`） |
| 闸门 | `GET /v1/models` + 一次补全 | 只有带内容的真实 200 才会被保留 |

## ⚙️ CLI 选项

```bash
node src/cli.js --count 5                  # 五个注册，串行
node src/cli.js --model auto
node src/cli.js --verify-only              # 重新检查 keys.txt
node src/cli.js --screen                   # 对出口列表进行 HTTP 筛选
node src/cli.js --connect-9router          # 在本地 9Router 上注册提供商 + 密钥
node src/cli.js --help
```

| 标志 | 默认值 | 含义 |
| --- | --- | --- |
| `--count N` | `1` | 要生成的账户数量，串行 |
| `--model <id>` | `auto` | 用于实时闸门的模型 |
| `--pool <file>` | `proxies.txt` | 出口列表，每行一个代理 —— 可选 |
| `--tries N` | `3` | 每个账户筛选的出口候选数 |
| `--mint-tries N` | `2` | 每个出口的完整注册尝试次数（全新邮箱） |
| `--code-timeout S` | `240` | 等待验证邮件的秒数 |
| `--keys <file>` | `keys.txt` | 用于 `--verify-only` / `--connect-9router` 的密钥文件 |
| `--headless` | 关闭 | 仅用于诊断 —— 组件不会生成 |

## 🛰️ 在代理之后

**可选 —— 大规模使用时推荐（每 IP 限制、封禁）。** 该工具在没有代理时也能工作。

- **有代理池时：** 传入 `--pool <file>`（或设置 `INFERBASE_PROXIES`），每个请求 —— 包括 Chrome 浏览器 —— 都会经过该列表中的一个出口，故障即关闭。
- **没有代理池时：** CLI 会打印 `direct` 模式并直接连接；注册、密钥生成和闸门均不变。
- 出口质量决定成败：流程中的 Chrome 筛选会在消耗邮箱之前，拒绝 Turnstile 组件从不生成的线路。

## 📄 文件

| 路径 | 内容 |
| --- | --- |
| `keys.txt` | 每行一个经过实时验证的密钥 —— 已被 git 忽略 |
| `accounts.json` | 电子邮件 / 密码 / 密钥 / 闸门结果，包括失败的尝试 |
| `proxies.txt` | 你的出口 —— 已被 git 忽略 |
| `out/` | 运行日志、失败截图、账本 —— 已被 git 忽略 |

## 🔌 连接到 9Router

[9Router](https://9router.com) 是一个自托管、兼容 OpenAI 的路由器：

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix inferbase`、`--base-url https://api.inferbase.ai/v1`、`--model auto`。模型以 `inferbase/<model id>` 形式提供。CLI 可以一步完成相同操作：`node src/cli.js --connect-9router`。

## 🔌 连接到 OmniRoute

[OmniRoute](https://omniroute.online) 是一个自托管、兼容 OpenAI 的路由器：

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

默认值：`--prefix inferbase`、`--base-url https://api.inferbase.ai/v1`、`--model auto`。模型以 `inferbase/<model id>` 形式提供。CLI 可以一步完成相同操作：`node src/cli.js --connect-omniroute`。

## 🔑 一个密钥能给你什么

| | |
| --- | --- |
| 🏢 提供商 | **Inferbase** —— [inferbase.ai](https://inferbase.ai) |
| 🎁 提供商给出的额度 | 在其自有模型上**每账户每个 UTC 日 100 次请求**（计数器在 00:00 UTC 滚动）；无需信用卡，无需电话 |
| 🔑 一个密钥能给你什么 | `https://api.inferbase.ai/v1` 上该账户的模型列表（127 个 ID，`auto` 会挑选一个可用模型） |
| 🌐 API 形态 | 兼容 OpenAI：`POST https://api.inferbase.ai/v1/chat/completions`，包含工具调用 |
| 🔒 你的数据 | 仅会联系 `inferbase.ai`、Turnstile 脚本和 `temp.tf` 收件箱后端 |

## ⚠️ 条款与账户风险

此工具自动化了注册流程，因此**你**要对它的行为负责：自动化提供商的注册可能违反该提供商的服务条款，而账户给你的免费额度是提供商可随时限流、更改或收回的 —— 无论是按账户还是按 IP。请仅为你被允许创建的账户运行它，妥善保管你自己的代理列表，并且不要将这些密钥当作生产容量。这里没有任何内容构成绕过提供商规则的许可。

## 🐞 问题

如果 Inferbase 更改其注册形态、其 Turnstile 站点密钥（`0x4AAAAAAEE8v-wpU5kytU0i`）、每日 100 次请求额度或模型目录，工具会在该步骤停止并说明原因。请附上命令和确切输出**[提交问题](../../issues)**。

## 📄 许可证

MIT © 2026 —— 见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey 贡献者

</div>
