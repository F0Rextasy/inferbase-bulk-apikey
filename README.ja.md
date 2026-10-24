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

**自動生成された API キーで Inferbase (inferbase.ai) アカウントを一括作成 — ツール呼び出し対応の OpenAI 互換エンドポイント（127 個のモデル ID、`auto` ルーティング）、さらに 9Router コネクタ付き。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[⚡ ワンコマンド](#-one-command) · [🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-127-of-them) · [🧪 API の使い方](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [⚠️ 利用規約](#️-terms-and-account-risk) · [🐞 イシュー](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ なぜこれが存在するのか

Inferbase は素の OpenAI 互換ゲートウェイ（`https://api.inferbase.ai/v1`）で、そのサインアップは **Turnstile で保護された登録とメールのリンク**です。新規アカウントには Inferbase 自身のモデルに対して **UTC 1 日あたり 100 リクエスト**が付与されます — 実際のワークロードを動かすのに十分で、カウンターは失効するのではなく **00:00 UTC** にリセットされます。1 アカウントにつきキーは **1 つ**（`auto_scope: inferbase`、`rate_limit_rpm: 6`）。Cloudflare ウィジェットが発行されるのはそこだけなので、このツールは CDP 経由で **実際のヘッド付き Chrome** を操作し、ウィジェットが応答しない出口には一切コストをかけません。

## 🎁 無料枠 — どれだけ使えるか

| 項目 | 値 |
| --- | --- |
| 無料枠 | Inferbase 自身のモデルに対して **UTC 1 日あたりアカウント（組織）ごとに 100 リクエスト** |
| リセット | **00:00 UTC** — 計測済み: 使い切ったカウンターが `402 Free plan limit: 100 requests per UTC day … all used` を返し、同じキーがリセット後に `200` を返した |
| プラン制限（プロバイダーより） | 月 5000 リクエスト · 1 日 100 マネージドリクエスト · 1 日 $0.50 マネージド |
| キーごとのレート制限 | `rate_limit_rpm: 6`（キー作成時に返される） |
| カード / 電話 | **不要** — 支払い手順も電話番号の要求もなし |
| アカウントごとのキー | **1**（ツールはアカウントごとにキーを 1 つ発行） |

> 💡 無料枠は Inferbase が設定するもので、変更される可能性があります。最新の数値は [inferbase.ai](https://inferbase.ai) で確認してください — そしてツール自身のゲートに判断させましょう:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — 全 127 個

エンドポイントは **127 個の ID** を公表しています。`GET /v1/models` はそのアカウントが呼べるものを正確に返し、`auto` は稼働中のものへルーティングします（計測済み: `auto` は `qwen3-8-max` として応答）。

| モデル ID | 備考 |
| --- | --- |
| `auto` | ルーター — ツールがゲートに使うデフォルト |
| `qwen3-8-max` | 計測実行で `auto` が解決された先 |
| `deepseek-v4-flash`, `deepseek-v4-pro` | チャット、ツール呼び出し検証済み |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | その他のテキストルート |

画像 ID（`bfl-flux-*`）と `deepseek-ocr-2` も一覧にありますがチャットルートではありません。ツールのゲートは常に `auto` を使います。

## 🧪 API の使い方

ベース URL **`https://api.inferbase.ai/v1`** — OpenAI 互換。キーは 52 文字、`inf_` プレフィックス。

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

## ⚡ ワンコマンド

```bash
node src/cli.js --count N        # N accounts → N keys, one command, nothing to answer
```

Cloudflare Turnstile ウィジェットは、組み込みブラウザエンジン（`src/solver.js`）によって実際の **ヘッド付き** Chrome で発行されます — `--auto` は **デフォルト** でオンのままなので、貼り付けるキャプチャも、邪魔するブラウザの質問もありません。`--dry` を指定すると、解決されたプラン（カウント、モデル、ルート、ソルバー、Chrome パス）を出力し、ファイルを書いたりソケットを開いたりせずに終了コード 0 で終了します:

```bash
node src/cli.js --count N --dry
```

`npm start`（または `node src/launcher.js`）はメニューから同じことを行います: **1) Mint keys** を選び、「How many keys?」に答えると（Enter = 10）、`node src/cli.js --auto --count N` を実行します。`proxies.txt` が存在すれば自動的に読み込まれ、なければ実行は直接接続になります。

## 🛠 クイックスタート

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen
# or directly:
node src/cli.js --count 1        # one sign-up + e-mail verify in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

登録には実際の **ヘッド付き** Chrome が必要です: Turnstile ウィジェットが発行されるのはそこだけで、ウィジェットが応答しない出口ではフローは登録を拒否します。`keys.txt` は、そのキーで実際の完了応答が返ってから初めて書き込まれます。

### 🖱️ ランチャー

`node src/launcher.js` は同じモジュール群の上に載ったメニューです: **mint**、**verify**、**screen**、**9Router**、**settings**。設定は `launcher.config.json` に永続化されます。

## ✅ 動作検証済み — すべてのキーがテストされている

**2026-10-23** に、出荷された CLI で計測（出口リスト使用、WARP なし）。

| チェック | 結果 |
| --- | --- |
| 出口審査（HTTP） | ログインページ + Turnstile スクリプト + API に到達可能 |
| Chrome スクリーン（フロー内） | ウィジェットが発行されない行は、メールボックスを消費する **前に** 拒否される |
| 登録 | `POST /api/v1/auth/register` → **200** `Account created` |
| メール検証 | `hello@inferbase.ai` のメール → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| キー | `POST /api/v1/inference/keys`（X-CSRF-Token） → **201/200**、52 文字の `inf_…` |
| チャットゲート | `POST /v1/chat/completions` の `auto` → **200** `OK.` |
| ツールゲート | リクエストに `get_time` ツールスキーマ → 応答に `tool_calls` |
| ライブゲート | 出荷前に `keys.txt` のすべてのキーがライブ `chat-200` を通過; CLI はセルフチェックとして新しいキーをエンドツーエンドで発行することもできる |

> **品質ゲート。** ここにあるすべてのキーは、`keys.txt` に書き込まれる前にライブ `chat-200` を通過しています
> （死んだキーは出荷されません）。ルーターのコンボもモデルレベルで同じルールに従います: エントリは
> **モデルが `chat-200` を返し、ツールを呼び出せる場合にのみ** 追加されます — ツール非対応のモデル、
> 死んだキー、死んだプロバイダーは追加されずに除外されます。検証ステップはいつでも再実行できます;
> 失敗は報告され、決して隠されません。

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| ステップ | 呼び出し | 備考 |
| --- | --- | --- |
| screen | Chrome の登録ページ | ウィジェットがマウント **し、かつ** 発行されなければならない; できない行にはそれ以外何も費やさない |
| mailbox | `temp.tf`（`providers=gmail`） | 公開 API、キー不要; パネルは `hello@inferbase.ai` にメールを送る |
| register | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — トークンは同じ出口から来たものでなければならない |
| verify | `POST /api/v1/auth/verify-email` | メールに `?token=` が含まれる |
| login | `POST /api/v1/auth/login` | セッション Cookie と `csrf_token` を設定 |
| key | `POST /api/v1/inference/keys` | 変更系ルート → `X-CSRF-Token` が必要（なければ 403 `CSRF token missing`） |
| gate | `GET /v1/models` + 完了リクエスト | 実際の内容を伴う 200 のみが保持される |

## ⚙️ CLI オプション

```bash
node src/cli.js --count 5                  # five sign-ups, serial
node src/cli.js --model auto
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| フラグ | デフォルト | 意味 |
| --- | --- | --- |
| `--count N` | `1` | 発行するアカウント数、直列 |
| `--model <id>` | `auto` | ライブゲートに使うモデル |
| `--pool <file>` | `proxies.txt` | 出口リスト、1 行につき 1 プロキシ — 任意 |
| `--exits N` | `6` | アカウントごとに審査する出口候補 |
| `--mint-tries N` | `2` | 出口ごとの完全なサインアップ試行（新しいメールボックス） |
| `--code-timeout S` | `240` | 検証メールを待つ秒数 |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router` 用のキーファイル |
| `--headless` | off | 診断専用 — ウィジェットは発行されない |

## 🛰️ プロキシの背後で

**任意 — 規模を問うなら推奨（IP ごとの制限、BAN）。** このツールはプロキシなしでも動作します。

- **プールあり:** `--pool <file>`（または `INFERBASE_PROXIES` の設定）を渡すと、すべてのリクエスト — Chrome ブラウザを含む — がそのリストの出口を経由し、フェイルクローズになります。
- **プールなし:** CLI は `direct` モードを表示して直接接続します; サインアップ、キー発行、ゲートは変わりません。
- 出口の品質が成否を決めます: フロー内の Chrome スクリーンは、Turnstile ウィジェットが発行されない行を、メールボックスを消費する前に拒否します。

## 📄 ファイル

| パス | 内容 |
| --- | --- |
| `keys.txt` | 1 行につきライブ検証済みのキー 1 つ — git 管理外 |
| `accounts.json` | メール / パスワード / キー / ゲート結果、失敗した試行も含む |
| `proxies.txt` | あなたの出口 — git 管理外 |
| `out/` | 実行ログ、失敗時のスクリーンショット、台帳 — git 管理外 |

## 🔌 9Router に接続

[9Router](https://9router.com) はセルフホスト型の OpenAI 互換ルーターです:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

デフォルト: `--prefix inferbase`、`--base-url https://api.inferbase.ai/v1`、`--model auto`。モデルは `inferbase/<model id>` として提供されます。CLI でも一度に同じことができます: `node src/cli.js --connect-9router`。

## 🔌 OmniRoute に接続

[OmniRoute](https://omniroute.online) はセルフホスト型の OpenAI 互換ルーターです:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

デフォルト: `--prefix inferbase`、`--base-url https://api.inferbase.ai/v1`、`--model auto`。モデルは `inferbase/<model id>` として提供されます。CLI でも一度に同じことができます: `node src/cli.js --connect-omniroute`。

## 🔑 1 つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダー | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 プロバイダーが提供するもの | 自身のモデルに対して **UTC 1 日あたりアカウントごとに 100 リクエスト**（カウンターは 00:00 UTC に切り替わる）; カード不要、電話不要 |
| 🔑 1 つのキーで得られるもの | `https://api.inferbase.ai/v1` でそのアカウントのモデルリスト（127 個の ID、`auto` が稼働中のものを選ぶ） |
| 🌐 API の形式 | OpenAI 互換: `POST https://api.inferbase.ai/v1/chat/completions`、ツール呼び出し込み |
| 🔒 あなたのデータ | 接続先は `inferbase.ai`、Turnstile スクリプト、`temp.tf` メールボックスバックエンドのみ |

## ⚠️ 利用規約とアカウントのリスク

このツールはサインアップフローを自動化するため、**あなた**がその動作の責任を負います: プロバイダーのサインアップを自動化することは、そのプロバイダーの利用規約に違反する可能性があり、アカウントが提供する無料枠は、プロバイダーがいつでもスロットル、変更、取り戻すことができるものです — アカウントごと、および IP ごとに。作成が許可されているアカウントにのみ使用し、プロキシリストは自分専用に保ち、これらのキーを本番キャパシティとして扱わないでください。ここにあるものは、プロバイダーのルールを回避するライセンスではありません。

## 🐞 イシュー

Inferbase がサインアップの形、Turnstile サイトキー（`0x4AAAAAAEE8v-wpU5kytU0i`）、1 日 100 リクエストの許容量、またはモデルカタログを変更した場合、ツールはそのステップで停止し、そう報告します。コマンドと正確な出力を添えて **[イシューを開いてください](../../issues)**。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照。

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>
