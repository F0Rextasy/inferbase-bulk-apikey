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

**Massenhaftes Erstellen von Inferbase-Konten (inferbase.ai) mit automatisch generierten API-Schlüsseln — ein OpenAI-kompatibler Endpunkt (127 Modell-IDs, `auto`-Routing) mit Tool-Calling, plus ein 9Router-Konnektor.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Kostenlose Stufe](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-127-of-them) · [🧪 API verwenden](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 Funktionsweise](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Probleme](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

Inferbase ist ein einfaches OpenAI-kompatibles Gateway (`https://api.inferbase.ai/v1`), dessen Registrierung aus einer **Turnstile-geschützten Registrierung plus einem E-Mail-Link** besteht. Ein frisches Konto erhält **100 Anfragen pro UTC-Tag** auf Inferbase-eigenen Modellen — genug, um eine echte Arbeitslast zu bewältigen, und der Zähler wird um **00:00 UTC** zurückgesetzt, statt abzulaufen. Ein Konto trägt **einen Schlüssel** (`auto_scope: inferbase`, `rate_limit_rpm: 6`). Das Tool steuert ein **echtes, sichtbares Chrome** über CDP, weil das Cloudflare-Widget nur dort erzeugt wird, und es verschwendet nichts an einem Exit, dessen Widget nie antwortet.

## 🎁 Kostenlose Stufe — wie viel du bekommst

| Was | Wert |
| --- | --- |
| Kostenloses Kontingent | **100 Anfragen pro UTC-Tag pro Konto (Organisation)** auf Inferbase-eigenen Modellen |
| Zurücksetzung | **00:00 UTC** — gemessen: ein aufgebrauchter Zähler antwortete mit `402 Free plan limit: 100 requests per UTC day … all used` und derselbe Schlüssel antwortete nach der Zurücksetzung mit `200` |
| Plan-Limits (vom Anbieter) | 5000 Anfragen/Monat · 100 verwaltete Anfragen/Tag · $0,50/Tag verwaltet |
| Rate-Limit pro Schlüssel | `rate_limit_rpm: 6` (wird bei der Erstellung des Schlüssels zurückgegeben) |
| Karte / Telefon | **keine** — es wird weder ein Zahlungsschritt noch eine Telefonnummer verlangt |
| Schlüssel pro Konto | **1** (das Tool erzeugt einen Schlüssel pro Konto) |

> 💡 Die kostenlose Stufe wird von Inferbase festgelegt und kann sich ändern. Prüfe die aktuellen Zahlen auf [inferbase.ai](https://inferbase.ai) — und lass das Gate des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 127 davon

Der Endpunkt bewirbt **127 IDs**; `GET /v1/models` gibt genau das zurück, was das Konto aufrufen darf, und `auto` leitet an ein aktives weiter (gemessen: `auto` antwortete als `qwen3-8-max`).

| Modell-ID | Hinweis |
| --- | --- |
| `auto` | Router — der Standard, auf den das Tool prüft |
| `qwen3-8-max` | wozu `auto` in den gemessenen Läufen aufgelöst wurde |
| `deepseek-v4-flash`, `deepseek-v4-pro` | Chat, Tool-Calling verifiziert |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | weitere Text-Routen |

Bild-IDs (`bfl-flux-*`) und `deepseek-ocr-2` werden ebenfalls aufgeführt, sind aber keine Chat-Routen; das Gate des Tools verwendet immer `auto`.

## 🧪 So verwendest du die API

Basis-URL **`https://api.inferbase.ai/v1`** — OpenAI-kompatibel. Schlüssel sind 52 Zeichen lang, Präfix `inf_`.

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

## 🛠 Schnellstart

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + e-mail verify in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

Die Registrierung erfordert ein echtes, **sichtbares** Chrome: Das Turnstile-Widget wird nur dort erzeugt, und der Ablauf weigert sich, sich über einen Exit zu registrieren, dessen Widget nie antwortet. `keys.txt` wird erst geschrieben, nachdem eine echte Completion mit diesem Schlüssel geantwortet hat.

### 🖱️ Der Launcher

`node src/launcher.js` ist ein Menü über dieselben Module: **mint**, **verify**, **screen**, **9Router**, **settings**. Einstellungen werden in `launcher.config.json` gespeichert.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

Gemessen am **2026-10-23** mit der ausgelieferten CLI (Exit-Liste, kein WARP).

| Prüfung | Ergebnis |
| --- | --- |
| Exit-Prüfung (HTTP) | Login-Seite + Turnstile-Skript + API erreichbar |
| Chrome-Screen (im Ablauf) | eine Zeile, deren Widget nie erzeugt, wird abgelehnt, **bevor** ein Postfach verbraucht wird |
| Registrierung | `POST /api/v1/auth/register` → **200** `Account created` |
| E-Mail-Verifizierung | `hello@inferbase.ai`-Mail → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| Schlüssel | `POST /api/v1/inference/keys` (X-CSRF-Token) → **201/200**, 52-stelliges `inf_…` |
| Chat-Gate | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| Tools-Gate | `get_time`-Tool-Schema in der Anfrage → `tool_calls` in der Antwort |
| Schlüssel aktiv | **10/10** Schlüssel chat-200 in einem Durchlauf, und die CLI erzeugte einen weiteren Ende-zu-Ende in **40 s** |

> **Qualitäts-Gates.** Jeder Schlüssel hier hat ein Live-`chat-200` bestanden, bevor er in `keys.txt`
> geschrieben wurde (tote Schlüssel werden nie ausgeliefert). Router-Kombinationen folgen derselben Regel
> auf Modellebene: Ein Eintrag wird **nur hinzugefügt, wenn das Modell `chat-200` antwortet und Tools
> aufrufen kann** — ein Modell ohne Tool-Unterstützung, ein toter Schlüssel oder ein toter Anbieter wird
> verworfen statt hinzugefügt. Führe den Verifizierungsschritt jederzeit erneut aus; Fehler werden
> gemeldet, nie verborgen.

## 🧭 Funktionsweise

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| Schritt | Aufruf | Hinweise |
| --- | --- | --- |
| Screen | die Registrierungsseite in Chrome | das Widget muss sich **und** erzeugen; nichts anderes wird für eine Zeile verbraucht, die es nicht kann |
| Postfach | `temp.tf` (`providers=gmail`) | öffentliche API, kein Schlüssel; das Panel mailt an `hello@inferbase.ai` |
| Registrierung | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — das Token muss vom selben Exit stammen |
| Verifizierung | `POST /api/v1/auth/verify-email` | die Mail enthält `?token=` |
| Login | `POST /api/v1/auth/login` | setzt das Session-Cookie und `csrf_token` |
| Schlüssel | `POST /api/v1/inference/keys` | mutierende Route → benötigt `X-CSRF-Token` (403 `CSRF token missing` ohne) |
| Gate | `GET /v1/models` + eine Completion | nur ein echtes 200 mit Inhalt wird behalten |

## ⚙️ CLI-Optionen

```bash
node src/cli.js --count 5                  # five sign-ups, serial
node src/cli.js --model auto
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Flag | Standard | Bedeutung |
| --- | --- | --- |
| `--count N` | `1` | zu erzeugende Konten, seriell |
| `--model <id>` | `auto` | für das Live-Gate verwendetes Modell |
| `--pool <file>` | `proxies.txt` | Exit-Liste, eine Zeile pro Proxy — optional |
| `--tries N` | `3` | pro Konto geprüfte Exit-Kandidaten |
| `--mint-tries N` | `2` | vollständige Registrierungsversuche (frisches Postfach) pro Exit |
| `--code-timeout S` | `240` | Sekunden Wartezeit auf die Verifizierungsmail |
| `--keys <file>` | `keys.txt` | Schlüsseldatei für `--verify-only` / `--connect-9router` |
| `--headless` | aus | NUR DIAGNOSE — das Widget wird nicht erzeugt |

## 🛰️ Hinter einem Proxy

**Optional — bei Skalierung empfohlen (Limits pro IP, Sperren).** Das Tool funktioniert auch ohne Proxy.

- **Mit einem Pool:** übergib `--pool <file>` (oder setze `INFERBASE_PROXIES`) und jede Anfrage — einschließlich des Chrome-Browsers — geht fail-closed durch einen Exit aus dieser Liste.
- **Ohne Pool:** die CLI zeigt den `direct`-Modus an und verbindet direkt; Registrierung, Schlüsselerzeugung und Gate bleiben unverändert.
- Die Exit-Qualität entscheidet über den Erfolg: Der Chrome-Screen im Ablauf lehnt eine Zeile ab, deren Turnstile-Widget nie erzeugt, bevor ein Postfach verbraucht wird.

## 📄 Dateien

| Pfad | Inhalt |
| --- | --- |
| `keys.txt` | ein live-verifizierter Schlüssel pro Zeile — von Git ignoriert |
| `accounts.json` | E-Mail / Passwort / Schlüssel / Gate-Ergebnis, inkl. fehlgeschlagener Versuche |
| `proxies.txt` | deine Exits — von Git ignoriert |
| `out/` | Ausführungsprotokoll, Fehler-Screenshots, Ledger — von Git ignoriert |

## 🔌 Mit 9Router verbinden

[9Router](https://9router.com) ist ein selbst gehosteter, OpenAI-kompatibler Router:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Standardwerte: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Modelle werden als `inferbase/<model id>` bereitgestellt. Die CLI kann dasselbe in einem Schritt erledigen: `node src/cli.js --connect-9router`.

## 🔌 Mit OmniRoute verbinden

[OmniRoute](https://omniroute.online) ist ein selbst gehosteter, OpenAI-kompatibler Router:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Standardwerte: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Modelle werden als `inferbase/<model id>` bereitgestellt. Die CLI kann dasselbe in einem Schritt erledigen: `node src/cli.js --connect-omniroute`.

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Anbieter | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 Was der Anbieter gibt | **100 Anfragen pro UTC-Tag pro Konto** auf seinen eigenen Modellen (der Zähler rollt um 00:00 UTC); keine Karte, kein Telefon |
| 🔑 Was ein Schlüssel dir bringt | die Modellliste des Kontos auf `https://api.inferbase.ai/v1` (127 IDs, `auto` wählt ein aktives) |
| 🌐 API-Form | OpenAI-kompatibel: `POST https://api.inferbase.ai/v1/chat/completions`, Tool-Calling inklusive |
| 🔒 Deine Daten | nur `inferbase.ai`, das Turnstile-Skript und das `temp.tf`-Postfach-Backend werden kontaktiert |

## 🐞 Probleme

Wenn Inferbase seine Registrierungsform, seinen Turnstile-Site-Key (`0x4AAAAAAEE8v-wpU5kytU0i`), das tägliche Kontingent von 100 Anfragen oder den Modellkatalog ändert, stoppt das Tool an diesem Schritt und sagt es. **[Öffne ein Issue](../../issues)** mit dem Befehl und der exakten Ausgabe.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>