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

**자동 생성된 API 키로 Inferbase(inferbase.ai) 계정을 대량 생성 — 도구 호출을 지원하는 OpenAI 호환 엔드포인트(127개 모델 ID, `auto` 라우팅)와 9Router 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[⚡ 단일 명령](#-one-command) · [🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-127-of-them) · [🧪 API 사용](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [⚠️ 약관](#️-terms-and-account-risk) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 이 도구가 존재하는 이유

Inferbase는 평범한 OpenAI 호환 게이트웨이(`https://api.inferbase.ai/v1`)로, 가입 절차가 **Turnstile로 보호된 등록과 이메일 링크**로 이루어져 있습니다. 새 계정은 Inferbase 자체 모델에 대해 **UTC 기준 하루 100회 요청**을 받으며, 실제 워크로드를 돌리기에 충분하고, 카운터는 만료되지 않고 **UTC 00:00**에 초기화됩니다. 계정 하나당 **키 하나**(`auto_scope: inferbase`, `rate_limit_rpm: 6`)를 가집니다. 이 도구는 **실제 헤드 모드 Chrome**을 CDP로 구동하는데, Cloudflare 위젯이 거기서만 발급되기 때문이며, 위젯이 응답하지 않는 출구에는 아무것도 낭비하지 않습니다.

## 🎁 무료 티어 — 얼마나 받을 수 있나

| 항목 | 값 |
| --- | --- |
| 무료 허용량 | Inferbase 자체 모델에 대해 **계정(조직)당 UTC 기준 하루 100회 요청** |
| 초기화 | **UTC 00:00** — 실측: 소진된 카운터는 `402 Free plan limit: 100 requests per UTC day … all used`로 응답했고, 초기화 후 같은 키가 `200`을 응답함 |
| 플랜 한도(제공자 기준) | 월 5000회 요청 · 하루 100회 관리 요청 · 하루 $0.50 관리 |
| 키별 속도 제한 | `rate_limit_rpm: 6` (키 생성 시 반환됨) |
| 카드 / 전화 | **없음** — 결제 단계도 없고 전화번호도 요구하지 않음 |
| 계정당 키 | **1** (도구는 계정당 키 하나를 발급함) |

> 💡 무료 티어는 Inferbase가 정하며 변경될 수 있습니다. 최신 수치는 [inferbase.ai](https://inferbase.ai)에서 확인하세요 — 그리고 도구 자체의 게이트가 판단하게 하세요:

```bash
node src/cli.js --verify-only     # keys.txt의 모든 키가 실제 채팅 호출로 재검증됨
```

## 🤖 모델 — 127개 전부

이 엔드포인트는 **127개 ID**를 광고하며, `GET /v1/models`는 계정이 호출할 수 있는 것을 정확히 반환하고, `auto`는 살아있는 모델로 라우팅합니다(실측: `auto`가 `qwen3-8-max`로 응답함).

| 모델 ID | 비고 |
| --- | --- |
| `auto` | 라우터 — 도구가 게이트로 삼는 기본값 |
| `qwen3-8-max` | 실측 실행에서 `auto`가 해석된 대상 |
| `deepseek-v4-flash`, `deepseek-v4-pro` | 채팅, 도구 호출 검증됨 |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | 추가 텍스트 라우트 |

이미지 ID(`bfl-flux-*`)와 `deepseek-ocr-2`도 목록에 있지만 채팅 라우트가 아니며, 도구의 게이트는 항상 `auto`를 사용합니다.

## 🧪 API 사용 방법

Base URL **`https://api.inferbase.ai/v1`** — OpenAI 호환. 키는 52자이며 `inf_` 접두사를 가집니다.

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

## ⚡ 단일 명령

```bash
node src/cli.js --count N        # N개 계정 → N개 키, 명령 하나, 답할 것 없음
```

Cloudflare Turnstile 위젯은 내장 브라우저 엔진(`src/solver.js`)에 의해 실제 **헤드** Chrome에서 발급되며 — `--auto`가 **기본값**이고 계속 켜져 있으므로 붙여넣을 캡차도, 앞을 막는 브라우저 질문도 없습니다. `--dry`를 지정하면 결정된 계획(개수, 모델, 라우트, 솔버, Chrome 경로)을 출력하고 파일을 쓰거나 소켓을 열지 않은 채 종료 코드 0으로 끝납니다:

```bash
node src/cli.js --count N --dry
```

`npm start`(또는 `node src/launcher.js`)는 메뉴에서 같은 일을 합니다: **1) Mint keys**를 선택하고 "How many keys?"에 답하면(Enter = 10) `node src/cli.js --auto --count N`을 실행합니다. `proxies.txt`가 있으면 자동으로 사용되고, 없으면 직접 실행됩니다.

## 🛠 빠른 시작

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # 선택 사항 — 없으면 도구는 직접 실행됨
node src/launcher.js        # 대화형: 발급 / 검증 / 스크린
# 또는 직접:
node src/cli.js --count 1        # 실제 Chrome에서 가입 1회 + 이메일 인증
node src/cli.js --verify-only    # keys.txt에 이미 있는 모든 키 재검증
node src/cli.js --screen         # 출구 목록 HTTP 스크린
```

가입에는 실제 **헤드** Chrome이 필요합니다: Turnstile 위젯은 거기서만 발급되며, 위젯이 응답하지 않는 출구에서는 흐름이 가입을 거부합니다. `keys.txt`는 해당 키로 실제 완성이 응답한 뒤에만 기록됩니다.

### 🖱️ 런처

`node src/launcher.js`는 같은 모듈들 위의 메뉴입니다: **발급**, **검증**, **스크린**, **9Router**, **설정**. 설정은 `launcher.config.json`에 유지됩니다.

## ✅ 검증됨 — 모든 키가 테스트됨

**2026-10-23**에 배포된 CLI로 실측(출구 목록, WARP 없음).

| 검사 | 결과 |
| --- | --- |
| 출구 심사(HTTP) | 로그인 페이지 + Turnstile 스크립트 + API 도달 가능 |
| Chrome 스크린(흐름 내) | 위젯이 발급되지 않는 회선은 메일함을 소비하기 **전에** 거부됨 |
| 등록 | `POST /api/v1/auth/register` → **200** `Account created` |
| 이메일 인증 | `hello@inferbase.ai` 메일 → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| 키 | `POST /api/v1/inference/keys` (X-CSRF-Token) → **201/200**, 52자 `inf_…` |
| 채팅 게이트 | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| 도구 게이트 | 요청에 `get_time` 도구 스키마 → 응답에 `tool_calls` |
| 라이브 게이트 | `keys.txt`의 모든 키가 배포 전 실제 `chat-200`을 통과함; CLI는 자체 점검으로 새 키를 처음부터 끝까지 발급하기도 함 |

> **품질 게이트.** 여기 있는 모든 키는 `keys.txt`에 기록되기 전에 실제 `chat-200`을 통과했습니다
> (죽은 키는 절대 배포되지 않습니다). 라우터 조합도 모델 수준에서 같은 규칙을 따릅니다: 항목은
> **모델이 `chat-200`으로 응답하고 도구를 호출할 수 있을 때만** 추가됩니다 — 도구 지원이 없는 모델,
> 죽은 키, 죽은 제공자는 추가되지 않고 제거됩니다. 검증 단계를 언제든 다시 실행하세요;
> 실패는 보고되며, 절대 숨겨지지 않습니다.

## 🧭 작동 방식

```
inbox (계정당 주소 하나)                                  계정마다 새 주소
   │
   ├─▶ 가입: Inferbase 페이지 → 이메일 주소 → 메일함에서 코드 / 링크
   ├─▶ 세션: 계정의 쿠키 또는 액세스 토큰 확보
   ├─▶ 키 발급: 계정의 키 엔드포인트 → 평문 키가 한 번 반환됨 (즉시 디스크에 기록)
   └─▶ 라이브 증명: POST https://api.inferbase.ai/v1/chat/completions → 실제 콘텐츠 = 키가 살아있음
```

| 단계 | 호출 | 비고 |
| --- | --- | --- |
| 스크린 | Chrome에서 등록 페이지 | 위젯이 **마운트되고** 발급되어야 함; 발급할 수 없는 회선에는 다른 것을 소비하지 않음 |
| 메일함 | `temp.tf` (`providers=gmail`) | 공개 API, 키 불필요; 패널이 `hello@inferbase.ai`로 메일을 보냄 |
| 등록 | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — 토큰은 같은 출구에서 나와야 함 |
| 인증 | `POST /api/v1/auth/verify-email` | 메일에 `?token=`이 포함됨 |
| 로그인 | `POST /api/v1/auth/login` | 세션 쿠키와 `csrf_token`을 설정함 |
| 키 | `POST /api/v1/inference/keys` | 변경 라우트 → `X-CSRF-Token` 필요(없으면 403 `CSRF token missing`) |
| 게이트 | `GET /v1/models` + 완성 요청 | 콘텐츠가 있는 실제 200만 유지됨 |

## ⚙️ CLI 옵션

```bash
node src/cli.js --count 5                  # 가입 5회, 순차 실행
node src/cli.js --model auto
node src/cli.js --verify-only              # keys.txt 재검사
node src/cli.js --screen                   # 출구 목록 HTTP 스크린
node src/cli.js --connect-9router          # 로컬 9Router에 제공자 + 키 등록
node src/cli.js --help
```

| 플래그 | 기본값 | 의미 |
| --- | --- | --- |
| `--count N` | `1` | 발급할 계정 수, 순차 실행 |
| `--model <id>` | `auto` | 라이브 게이트에 사용할 모델 |
| `--pool <file>` | `proxies.txt` | 출구 목록, 한 줄에 프록시 하나 — 선택 사항 |
| `--tries N` | `3` | 계정당 스크린할 출구 후보 수 |
| `--mint-tries N` | `2` | 출구당 전체 가입 시도(새 메일함) 수 |
| `--code-timeout S` | `240` | 인증 메일을 기다리는 시간(초) |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router`용 키 파일 |
| `--headless` | 꺼짐 | 진단 전용 — 위젯이 발급되지 않음 |

## 🛰️ 프록시 뒤에서

**선택 사항 — 규모가 클 때 권장(IP별 제한, 차단).** 이 도구는 프록시 없이도 작동합니다.

- **풀이 있을 때:** `--pool <file>`을 전달하거나 `INFERBASE_PROXIES`를 설정하면 모든 요청 — Chrome 브라우저 포함 — 이 그 목록의 출구를 통해 나가며, 실패 시 닫힘(fail-closed)입니다.
- **풀이 없을 때:** CLI는 `direct` 모드를 출력하고 직접 연결합니다; 가입, 키 발급, 게이트는 변하지 않습니다.
- 출구 품질이 성공을 좌우합니다: 흐름 내 Chrome 스크린은 Turnstile 위젯이 발급되지 않는 회선을 메일함을 소비하기 전에 거부합니다.

## 📄 파일

| 경로 | 내용 |
| --- | --- |
| `keys.txt` | 한 줄에 라이브 검증된 키 하나 — git 무시됨 |
| `accounts.json` | 이메일 / 비밀번호 / 키 / 게이트 결과, 실패한 시도 포함 |
| `proxies.txt` | 사용자의 출구 — git 무시됨 |
| `out/` | 실행 로그, 실패 스크린샷, 원장 — git 무시됨 |

## 🔌 9Router에 연결

[9Router](https://9router.com)는 자체 호스팅, OpenAI 호환 라우터입니다:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

기본값: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. 모델은 `inferbase/<model id>`로 제공됩니다. CLI도 한 번에 같은 일을 할 수 있습니다: `node src/cli.js --connect-9router`.

## 🔌 OmniRoute에 연결

[OmniRoute](https://omniroute.online)는 자체 호스팅, OpenAI 호환 라우터입니다:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

기본값: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. 모델은 `inferbase/<model id>`로 제공됩니다. CLI도 한 번에 같은 일을 할 수 있습니다: `node src/cli.js --connect-omniroute`.

## 🔑 키 하나로 얻는 것

| | |
| --- | --- |
| 🏢 제공자 | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 제공자가 주는 것 | 자체 모델에 대해 **계정당 UTC 기준 하루 100회 요청**(카운터는 UTC 00:00에 갱신); 카드 없음, 전화 없음 |
| 🔑 키 하나로 얻는 것 | `https://api.inferbase.ai/v1`의 계정 모델 목록(127개 ID, `auto`가 살아있는 것을 선택) |
| 🌐 API 형태 | OpenAI 호환: `POST https://api.inferbase.ai/v1/chat/completions`, 도구 호출 포함 |
| 🔒 데이터 | `inferbase.ai`, Turnstile 스크립트, `temp.tf` 메일함 백엔드만 접속됨 |

## ⚠️ 약관 및 계정 위험

이 도구는 가입 흐름을 자동화하므로, 그 결과에 대한 책임은 **사용자**에게 있습니다: 제공자의 가입을 자동화하면 해당 제공자의 서비스 약관을 위반할 수 있으며, 계정이 부여하는 무료 티어는 제공자가 언제든 계정별, IP별로 제한하거나 변경하거나 회수할 수 있습니다. 생성이 허용된 계정에만 사용하고, 프록시 목록은 본인만의 것으로 유지하며, 이 키들을 프로덕션 용량으로 취급하지 마세요. 여기 있는 어떤 것도 제공자의 규칙을 우회할 권리를 부여하지 않습니다.

## 🐞 이슈

Inferbase가 가입 형태, Turnstile 사이트 키(`0x4AAAAAAEE8v-wpU5kytU0i`), 하루 100회 요청 허용량 또는 모델 카탈로그를 변경하면, 도구는 해당 단계에서 멈추고 그렇게 알립니다. 명령과 정확한 출력을 함께 **[이슈를 열어주세요](../../issues)**.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>
