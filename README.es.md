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

**Crea cuentas de Inferbase (inferbase.ai) en masa con claves API autogeneradas — un endpoint compatible con OpenAI (127 ids de modelos, enrutamiento `auto`) con llamada a herramientas, más un conector para 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-127-of-them) · [🧪 Usar la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

Inferbase es una pasarela simple compatible con OpenAI (`https://api.inferbase.ai/v1`) cuyo registro es **un registro protegido por Turnstile más un enlace por correo electrónico**. Una cuenta nueva obtiene **100 solicitudes por día UTC** en los modelos propios de Inferbase — suficiente para ejecutar una carga de trabajo real, y el contador se reinicia a las **00:00 UTC** en lugar de expirar. Una cuenta lleva **una clave** (`auto_scope: inferbase`, `rate_limit_rpm: 6`). La herramienta controla un **Chrome real con interfaz gráfica** a través de CDP porque el widget de Cloudflare solo se genera ahí, y no gasta nada en una salida cuyo widget nunca responde.

## 🎁 Nivel gratuito — cuánto obtienes

| Qué | Valor |
| --- | --- |
| Asignación gratuita | **100 solicitudes por día UTC por cuenta (organización)** en los modelos propios de Inferbase |
| Reinicio | **00:00 UTC** — medido: un contador agotado respondió `402 Free plan limit: 100 requests per UTC day … all used` y la misma clave respondió `200` tras el reinicio |
| Límites del plan (del proveedor) | 5000 solicitudes/mes · 100 solicitudes gestionadas/día · $0.50/día gestionado |
| Límite de tasa por clave | `rate_limit_rpm: 6` (devuelto cuando se crea la clave) |
| Tarjeta / teléfono | **ninguno** — no se pide ningún paso de pago ni número de teléfono |
| Clave por cuenta | **1** (la herramienta genera una clave por cuenta) |

> 💡 El nivel gratuito lo define Inferbase y puede cambiar. Consulta los números en vivo en [inferbase.ai](https://inferbase.ai) — y deja que la propia verificación de la herramienta decida:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 127

El endpoint anuncia **127 ids**; `GET /v1/models` devuelve exactamente lo que la cuenta puede llamar, y `auto` enruta a uno activo (medido: `auto` respondió como `qwen3-8-max`).

| ID del modelo | nota |
| --- | --- |
| `auto` | enrutador — el predeterminado sobre el que la herramienta hace la verificación |
| `qwen3-8-max` | a lo que `auto` se resolvió en las ejecuciones medidas |
| `deepseek-v4-flash`, `deepseek-v4-pro` | chat, llamada a herramientas verificada |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | más rutas de texto |

Los ids de imagen (`bfl-flux-*`) y `deepseek-ocr-2` también aparecen listados pero no son rutas de chat; la verificación de la herramienta siempre usa `auto`.

## 🧪 Cómo usar la API

URL base **`https://api.inferbase.ai/v1`** — compatible con OpenAI. Las claves tienen 52 caracteres, prefijo `inf_`.

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

## 🛠 Inicio rápido

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + e-mail verify in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

El registro necesita un Chrome real, **con interfaz gráfica**: el widget de Turnstile solo se genera ahí, y el flujo se niega a registrarse en una salida cuyo widget nunca responde. `keys.txt` se escribe solo después de que una finalización real respondió con esa clave.

### 🖱️ El lanzador

`node src/launcher.js` es un menú sobre los mismos módulos: **mint**, **verify**, **screen**, **9Router**, **settings**. La configuración persiste en `launcher.config.json`.

## ✅ Verificado y funcionando — cada clave se prueba

Medido el **2026-10-23** desde la CLI distribuida (lista de salidas, sin WARP).

| Comprobación | Resultado |
| --- | --- |
| verificación de salida (HTTP) | página de inicio de sesión + script de Turnstile + API accesible |
| pantalla de Chrome (en el flujo) | una línea cuyo widget nunca se genera se rechaza **antes** de gastar un buzón |
| registro | `POST /api/v1/auth/register` → **200** `Account created` |
| verificación por correo | correo de `hello@inferbase.ai` → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| clave | `POST /api/v1/inference/keys` (X-CSRF-Token) → **201/200**, `inf_…` de 52 caracteres |
| verificación de chat | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| verificación de herramientas | esquema de herramienta `get_time` en la solicitud → `tool_calls` en la respuesta |
| claves activas | **10/10** claves con chat-200 en un solo barrido, y la CLI generó otra de extremo a extremo en **40 s** |

> **Controles de calidad.** Cada clave aquí pasó un `chat-200` en vivo antes de escribirse en `keys.txt`
> (las claves muertas nunca se distribuyen). Las combinaciones del enrutador siguen la misma regla a nivel de modelo: una entrada se
> añade **solo si el modelo responde `chat-200` y puede llamar a herramientas** — un modelo sin soporte de herramientas,
> una clave muerta o un proveedor muerto se descarta en lugar de añadirse. Vuelve a ejecutar el paso de verificación cuando quieras;
> los fallos se reportan, nunca se ocultan.

## 🧭 Cómo funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| Paso | Llamada | Notas |
| --- | --- | --- |
| pantalla | la página de registro en Chrome | el widget debe montarse **y** generarse; no se gasta nada más en una línea que no puede |
| buzón | `temp.tf` (`providers=gmail`) | API pública, sin clave; el panel envía correo a `hello@inferbase.ai` |
| registro | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — el token debe venir de la misma salida |
| verificación | `POST /api/v1/auth/verify-email` | el correo lleva `?token=` |
| inicio de sesión | `POST /api/v1/auth/login` | establece la cookie de sesión y `csrf_token` |
| clave | `POST /api/v1/inference/keys` | ruta mutadora → necesita `X-CSRF-Token` (403 `CSRF token missing` sin él) |
| verificación | `GET /v1/models` + una finalización | solo se conserva un 200 real con contenido |

## ⚙️ Opciones de la CLI

```bash
node src/cli.js --count 5                  # five sign-ups, serial
node src/cli.js --model auto
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Opción | Predeterminado | Significado |
| --- | --- | --- |
| `--count N` | `1` | cuentas a crear, en serie |
| `--model <id>` | `auto` | modelo usado para la verificación en vivo |
| `--pool <file>` | `proxies.txt` | lista de salidas, una línea por proxy — opcional |
| `--tries N` | `3` | salidas candidatas evaluadas por cuenta |
| `--mint-tries N` | `2` | intentos completos de registro (buzón nuevo) por salida |
| `--code-timeout S` | `240` | segundos de espera para el correo de verificación |
| `--keys <file>` | `keys.txt` | archivo de claves para `--verify-only` / `--connect-9router` |
| `--headless` | desactivado | solo DIAGNÓSTICO — el widget no se generará |

## 🛰️ Detrás de un proxy

**Opcional — recomendado a escala (límites por IP, bloqueos).** La herramienta también funciona sin proxy.

- **Con un pool:** pasa `--pool <file>` (o define `INFERBASE_PROXIES`) y cada solicitud — incluido el navegador Chrome — pasa por una salida de esa lista, con fallo cerrado.
- **Sin un pool:** la CLI muestra el modo `direct` y se conecta directamente; el registro, la generación de claves y la verificación no cambian.
- La calidad de la salida decide el éxito: la pantalla de Chrome en el flujo rechaza una línea cuyo widget de Turnstile nunca se genera antes de gastar un buzón.

## 📄 Archivos

| Ruta | Contenido |
| --- | --- |
| `keys.txt` | una clave verificada en vivo por línea — ignorada por git |
| `accounts.json` | correo / contraseña / clave / resultado de verificación, incl. intentos fallidos |
| `proxies.txt` | tus salidas — ignorado por git |
| `out/` | registro de ejecución, capturas de fallos, libro mayor — ignorado por git |

## 🔌 Conectar con 9Router

[9Router](https://9router.com) es un enrutador autoalojado compatible con OpenAI:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Predeterminados: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Los modelos se sirven como `inferbase/<model id>`. La CLI puede hacer lo mismo de una vez: `node src/cli.js --connect-9router`.

## 🔌 Conectar con OmniRoute

[OmniRoute](https://omniroute.online) es un enrutador autoalojado compatible con OpenAI:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Predeterminados: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Los modelos se sirven como `inferbase/<model id>`. La CLI puede hacer lo mismo de una vez: `node src/cli.js --connect-omniroute`.

## 🔑 Qué te da una clave

| | |
| --- | --- |
| 🏢 Proveedor | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 Qué da el proveedor | **100 solicitudes por día UTC por cuenta** en sus propios modelos (el contador se reinicia a las 00:00 UTC); sin tarjeta, sin teléfono |
| 🔑 Qué te da una clave | la lista de modelos de la cuenta en `https://api.inferbase.ai/v1` (127 ids, `auto` elige uno activo) |
| 🌐 Forma de la API | compatible con OpenAI: `POST https://api.inferbase.ai/v1/chat/completions`, con llamada a herramientas incluida |
| 🔒 Tus datos | solo se contacta con `inferbase.ai`, el script de Turnstile y el backend del buzón `temp.tf` |

## 🐞 Problemas

Si Inferbase cambia la forma de su registro, su clave de sitio de Turnstile (`0x4AAAAAAEE8v-wpU5kytU0i`), la asignación diaria de 100 solicitudes o el catálogo de modelos, la herramienta se detiene en ese paso y lo indica. **[Abre un issue](../../issues)** con el comando y la salida exacta.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>