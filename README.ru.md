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

**Массовое создание аккаунтов Inferbase (inferbase.ai) с автоматически сгенерированными API-ключами — OpenAI-совместимый эндпоинт (127 идентификаторов моделей, маршрутизация `auto`) с вызовом инструментов, плюс коннектор для 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-127-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

Inferbase — это обычный OpenAI-совместимый шлюз (`https://api.inferbase.ai/v1`), регистрация в котором представляет собой **регистрацию с защитой Turnstile плюс ссылку в письме**. Новый аккаунт получает **100 запросов в сутки по UTC** на собственные модели Inferbase — этого достаточно для реальной рабочей нагрузки, а счётчик сбрасывается в **00:00 UTC**, а не истекает. Один аккаунт несёт **один ключ** (`auto_scope: inferbase`, `rate_limit_rpm: 6`). Инструмент управляет **настоящим Chrome с графическим интерфейсом** через CDP, потому что виджет Cloudflare создаёт токен только там, и он ничего не тратит на выход, виджет которого никогда не отвечает.

## 🎁 Бесплатный тариф — сколько вы получаете

| Что | Значение |
| --- | --- |
| Бесплатный лимит | **100 запросов в сутки по UTC на аккаунт (организацию)** на собственные модели Inferbase |
| Сброс | **00:00 UTC** — измерено: исчерпанный счётчик ответил `402 Free plan limit: 100 requests per UTC day … all used`, и тот же ключ ответил `200` после сброса |
| Лимиты тарифа (от провайдера) | 5000 запросов/месяц · 100 управляемых запросов/день · $0.50/день управляемых |
| Лимит на ключ | `rate_limit_rpm: 6` (возвращается при создании ключа) |
| Карта / телефон | **нет** — шаг оплаты отсутствует, номер телефона не запрашивается |
| Ключей на аккаунт | **1** (инструмент создаёт один ключ на аккаунт) |

> 💡 Бесплатный тариф устанавливается Inferbase и может измениться. Проверяйте актуальные цифры на [inferbase.ai](https://inferbase.ai) — и пусть собственный гейт инструмента решает:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Модели — все 127

Эндпоинт объявляет **127 идентификаторов**; `GET /v1/models` возвращает ровно то, что аккаунт может вызывать, а `auto` маршрутизирует к живой модели (измерено: `auto` ответил как `qwen3-8-max`).

| ID модели | примечание |
| --- | --- |
| `auto` | маршрутизатор — значение по умолчанию, на котором проверяет инструмент |
| `qwen3-8-max` | то, во что разрешился `auto` в измеренных запусках |
| `deepseek-v4-flash`, `deepseek-v4-pro` | чат, вызов инструментов проверен |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | другие текстовые маршруты |

Идентификаторы изображений (`bfl-flux-*`) и `deepseek-ocr-2` тоже перечислены, но не являются чат-маршрутами; гейт инструмента всегда использует `auto`.

## 🧪 Как использовать API

Базовый URL **`https://api.inferbase.ai/v1`** — OpenAI-совместимый. Ключи длиной 52 символа, с префиксом `inf_`.

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

## 🛠 Быстрый старт

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + e-mail verify in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

Для регистрации требуется настоящий Chrome **с графическим интерфейсом**: виджет Turnstile создаёт токен только там, и процесс отказывается регистрироваться на выходе, виджет которого никогда не отвечает. `keys.txt` записывается только после того, как на этом ключе ответил реальный запрос на завершение.

### 🖱️ Лаунчер

`node src/launcher.js` — это меню поверх тех же модулей: **mint**, **verify**, **screen**, **9Router**, **settings**. Настройки сохраняются в `launcher.config.json`.

## ✅ Проверено в работе — каждый ключ протестирован

Измерено **2026-10-23** из поставляемого CLI (список выходов, без WARP).

| Проверка | Результат |
| --- | --- |
| проверка выхода (HTTP) | страница входа + скрипт Turnstile + API доступны |
| проверка Chrome (в процессе) | строка, виджет которой никогда не создаёт токен, отклоняется **до** того, как потрачен почтовый ящик |
| регистрация | `POST /api/v1/auth/register` → **200** `Account created` |
| подтверждение e-mail | письмо от `hello@inferbase.ai` → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| ключ | `POST /api/v1/inference/keys` (X-CSRF-Token) → **201/200**, 52-символьный `inf_…` |
| гейт чата | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| гейт инструментов | схема инструмента `get_time` в запросе → `tool_calls` в ответе |
| живые ключи | **10/10** ключей отвечают chat-200 за один прогон, и CLI создал ещё один от начала до конца за **40 с** |

> **Контроль качества.** Каждый ключ здесь прошёл живой `chat-200` до того, как был записан в `keys.txt`
> (мёртвые ключи никогда не поставляются). Комбинации маршрутизатора следуют тому же правилу на уровне модели: запись
> добавляется **только если модель отвечает `chat-200` и умеет вызывать инструменты** — модель без поддержки инструментов,
> мёртвый ключ или мёртвый провайдер отбрасывается, а не добавляется. Перезапускайте шаг проверки в любое время;
> сбои сообщаются, а не скрываются.

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| Шаг | Вызов | Примечания |
| --- | --- | --- |
| проверка | страница регистрации в Chrome | виджет должен смонтироваться **и** создать токен; ничего другого не тратится на строку, которая не может |
| почтовый ящик | `temp.tf` (`providers=gmail`) | публичный API, без ключа; панель отправляет письма на `hello@inferbase.ai` |
| регистрация | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — токен должен прийти с того же выхода |
| подтверждение | `POST /api/v1/auth/verify-email` | письмо содержит `?token=` |
| вход | `POST /api/v1/auth/login` | устанавливает cookie сессии и `csrf_token` |
| ключ | `POST /api/v1/inference/keys` | изменяющий маршрут → требует `X-CSRF-Token` (403 `CSRF token missing` без него) |
| гейт | `GET /v1/models` + завершение | сохраняется только реальный 200 с содержимым |

## ⚙️ Опции CLI

```bash
node src/cli.js --count 5                  # five sign-ups, serial
node src/cli.js --model auto
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Флаг | По умолчанию | Значение |
| --- | --- | --- |
| `--count N` | `1` | сколько аккаунтов создать, последовательно |
| `--model <id>` | `auto` | модель, используемая для живого гейта |
| `--pool <file>` | `proxies.txt` | список выходов, по одной строке на прокси — необязательно |
| `--tries N` | `3` | кандидаты выходов, проверяемые на аккаунт |
| `--mint-tries N` | `2` | полные попытки регистрации (свежий почтовый ящик) на выход |
| `--code-timeout S` | `240` | секунды ожидания письма с подтверждением |
| `--keys <file>` | `keys.txt` | файл ключей для `--verify-only` / `--connect-9router` |
| `--headless` | выкл. | ТОЛЬКО ДИАГНОСТИКА — виджет не создаст токен |

## 🛰️ За прокси

**Необязательно — рекомендуется при масштабировании (лимиты на IP, блокировки).** Инструмент работает и без прокси.

- **С пулом:** передайте `--pool <file>` (или задайте `INFERBASE_PROXIES`), и каждый запрос — включая браузер Chrome — идёт через выход из этого списка, с отказом при сбое.
- **Без пула:** CLI выводит режим `direct` и подключается напрямую; регистрация, создание ключей и гейт не меняются.
- Качество выходов определяет успех: проверка Chrome в процессе отклоняет строку, виджет Turnstile которой никогда не создаёт токен, до того как потрачен почтовый ящик.

## 📄 Файлы

| Путь | Содержимое |
| --- | --- |
| `keys.txt` | по одному проверенному в работе ключу на строку — игнорируется git |
| `accounts.json` | e-mail / пароль / ключ / результат гейта, включая неудачные попытки |
| `proxies.txt` | ваши выходы — игнорируется git |
| `out/` | журнал запуска, скриншоты сбоев, реестр — игнорируется git |

## 🔌 Подключение к 9Router

[9Router](https://9router.com) — это самостоятельно размещаемый OpenAI-совместимый маршрутизатор:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

По умолчанию: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Модели подаются как `inferbase/<model id>`. CLI может сделать то же самое одной командой: `node src/cli.js --connect-9router`.

## 🔌 Подключение к OmniRoute

[OmniRoute](https://omniroute.online) — это самостоятельно размещаемый OpenAI-совместимый маршрутизатор:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

По умолчанию: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Модели подаются как `inferbase/<model id>`. CLI может сделать то же самое одной командой: `node src/cli.js --connect-omniroute`.

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 Что даёт провайдер | **100 запросов в сутки по UTC на аккаунт** на собственные модели (счётчик сбрасывается в 00:00 UTC); без карты, без телефона |
| 🔑 Что даёт один ключ | список моделей аккаунта на `https://api.inferbase.ai/v1` (127 идентификаторов, `auto` выбирает живую) |
| 🌐 Форма API | OpenAI-совместимый: `POST https://api.inferbase.ai/v1/chat/completions`, включая вызов инструментов |
| 🔒 Ваши данные | контакт только с `inferbase.ai`, скриптом Turnstile и бэкендом почтового ящика `temp.tf` |

## 🐞 Проблемы

Если Inferbase изменит форму регистрации, свой site key Turnstile (`0x4AAAAAAEE8v-wpU5kytU0i`), суточный лимит в 100 запросов или каталог моделей, инструмент остановится на этом шаге и сообщит об этом. **[Откройте issue](../../issues)** с командой и точным выводом.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>