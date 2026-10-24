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

**Inferbase (inferbase.ai) hesaplarını otomatik oluşturulan API anahtarlarıyla toplu olarak açın — araç çağırma destekli, OpenAI uyumlu bir uç nokta (127 model kimliği, `auto` yönlendirme) ve bir 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[⚡ Tek komut](#-one-command) · [🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-127-of-them) · [🧪 API'yi kullanma](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [⚠️ Koşullar](#️-terms-and-account-risk) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

Inferbase, kaydı **Turnstile korumalı bir kayıt ve bir e-posta bağlantısı** olan, OpenAI uyumlu düz bir ağ geçididir (`https://api.inferbase.ai/v1`). Yeni bir hesap, Inferbase'in kendi modellerinde **UTC günü başına 100 istek** alır — gerçek bir iş yükünü çalıştırmaya yeter ve sayaç süresi dolmak yerine **00:00 UTC**'de sıfırlanır. Bir hesap **bir anahtar** taşır (`auto_scope: inferbase`, `rate_limit_rpm: 6`). Araç, Cloudflare widget'ı yalnızca orada üretildiği için CDP üzerinden **gerçek, başsız olmayan bir Chrome**'u sürer ve widget'ı hiçbir zaman yanıt vermeyen bir çıkış için hiçbir şey harcamaz.

## 🎁 Ücretsiz katman — ne kadar alırsınız

| Ne | Değer |
| --- | --- |
| Ücretsiz kota | Inferbase'in kendi modellerinde **hesap (organizasyon) başına UTC günü başına 100 istek** |
| Sıfırlama | **00:00 UTC** — ölçüldü: tükenmiş bir sayaç `402 Free plan limit: 100 requests per UTC day … all used` yanıtı verdi ve aynı anahtar sıfırlamadan sonra `200` yanıtı verdi |
| Plan limitleri (sağlayıcıdan) | Ayda 5000 istek · Günde 100 yönetilen istek · Günde 0,50 $ yönetilen |
| Anahtar başına hız limiti | `rate_limit_rpm: 6` (anahtar oluşturulduğunda döndürülür) |
| Kart / telefon | **yok** — ödeme adımı yok ve telefon numarası istenmez |
| Hesap başına anahtar | **1** (araç hesap başına bir anahtar üretir) |

> 💡 Ücretsiz katman Inferbase tarafından belirlenir ve değişebilir. Güncel sayıları [inferbase.ai](https://inferbase.ai) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # keys.txt içindeki her anahtar gerçek bir sohbet çağrısıyla yeniden test edilir
```

## 🤖 Modeller — 127'sinin tamamı

Uç nokta **127 kimlik** duyurur; `GET /v1/models` hesabın çağırabileceğini tam olarak döndürür ve `auto` canlı bir modele yönlendirir (ölçüldü: `auto`, `qwen3-8-max` olarak yanıt verdi).

| Model kimliği | not |
| --- | --- |
| `auto` | yönlendirici — aracın üzerinde kapı oluşturduğu varsayılan |
| `qwen3-8-max` | ölçülen çalıştırmalarda `auto`'nun çözümlendiği model |
| `deepseek-v4-flash`, `deepseek-v4-pro` | sohbet, araç çağırma doğrulandı |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | daha fazla metin rotası |

Görsel kimlikleri (`bfl-flux-*`) ve `deepseek-ocr-2` de listelenir ancak sohbet rotaları değildir; aracın kapısı her zaman `auto` kullanır.

## 🧪 API'yi nasıl kullanırsınız

Temel URL **`https://api.inferbase.ai/v1`** — OpenAI uyumlu. Anahtarlar 52 karakterdir, `inf_` önekine sahiptir.

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

## ⚡ Tek komut

```bash
node src/cli.js --count N        # N hesap → N anahtar, tek komut, yanıtlanacak hiçbir şey yok
```

Cloudflare Turnstile widget'ı, gömülü tarayıcı motoru (`src/solver.js`) tarafından gerçek, **başsız olmayan** bir Chrome'da üretilir — `--auto` **varsayılandır** ve açık kalır, böylece yapıştırılacak bir captcha ve yolda bir tarayıcı sorusu yoktur. `--dry` belirtmek, çözümlenen planı (sayı, model, rota, çözücü, Chrome yolu) yazdırır ve bir dosya yazmadan veya bir soket açmadan 0 ile çıkar:

```bash
node src/cli.js --count N --dry
```

`npm start` (veya `node src/launcher.js`) bir menüden aynısını yapar: **1) Mint keys** seçin, "How many keys?" sorusunu yanıtlayın (Enter = 10) ve `node src/cli.js --auto --count N` çalışır. `proxies.txt` mevcut olduğunda otomatik olarak alınır, aksi takdirde çalıştırma doğrudan yapılır.

## 🛠 Hızlı başlangıç

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen
# or directly:
node src/cli.js --count 1        # one sign-up + e-mail verify in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

Kayıt, gerçek, **başsız olmayan** bir Chrome gerektirir: Turnstile widget'ı yalnızca orada üretilir ve akış, widget'ı hiçbir zaman yanıt vermeyen bir çıkışta kaydolmayı reddeder. `keys.txt` yalnızca o anahtarda gerçek bir tamamlama yanıt verdikten sonra yazılır.

### 🖱️ Başlatıcı

`node src/launcher.js`, aynı modüller üzerinde bir menüdür: **mint**, **verify**, **screen**, **9Router**, **settings**. Ayarlar `launcher.config.json` içinde kalıcıdır.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

**2026-10-23** tarihinde, gönderilen CLI'dan ölçüldü (çıkış listesi, WARP yok).

| Kontrol | Sonuç |
| --- | --- |
| çıkış incelemesi (HTTP) | giriş sayfası + Turnstile betiği + API erişilebilir |
| Chrome ekranı (akış içinde) | widget'ı hiçbir zaman üretmeyen bir satır, bir posta kutusu harcanmadan **önce** reddedilir |
| kayıt | `POST /api/v1/auth/register` → **200** `Account created` |
| e-posta doğrulama | `hello@inferbase.ai` postası → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| anahtar | `POST /api/v1/inference/keys` (X-CSRF-Token) → **201/200**, 52 karakterli `inf_…` |
| sohbet kapısı | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| araçlar kapısı | istekte `get_time` araç şeması → yanıtta `tool_calls` |
| canlı kapı | `keys.txt` içindeki her anahtar gönderilmeden önce canlı bir `chat-200` geçti; CLI ayrıca bir öz kontrol olarak uçtan uca yeni bir anahtar üretir |

> **Kalite kapıları.** Buradaki her anahtar, `keys.txt` dosyasına yazılmadan önce canlı bir `chat-200` geçti
> (ölü anahtarlar asla gönderilmez). Yönlendirici kombinasyonları model düzeyinde aynı kuralı izler: bir giriş
> **yalnızca model `chat-200` yanıtlıyorsa ve araçları çağırabiliyorsa** eklenir — araç desteği olmayan bir model,
> ölü bir anahtar veya ölü bir sağlayıcı eklenmek yerine çıkarılır. Doğrulama adımını istediğiniz zaman yeniden çalıştırın;
> hatalar bildirilir, asla gizlenmez.

## 🧭 Nasıl çalışır

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| Adım | Çağrı | Notlar |
| --- | --- | --- |
| ekran | Chrome'da kayıt sayfası | widget **hem** bağlanmalı **hem** üretmeli; üretemeyen bir satır için başka hiçbir şey harcanmaz |
| posta kutusu | `temp.tf` (`providers=gmail`) | herkese açık API, anahtar yok; panel `hello@inferbase.ai` adresine posta gönderir |
| kayıt | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — token aynı çıkıştan gelmelidir |
| doğrulama | `POST /api/v1/auth/verify-email` | posta `?token=` taşır |
| giriş | `POST /api/v1/auth/login` | oturum çerezini ve `csrf_token` ayarlar |
| anahtar | `POST /api/v1/inference/keys` | değiştirici rota → `X-CSRF-Token` gerektirir (onsuz 403 `CSRF token missing`) |
| kapı | `GET /v1/models` + bir tamamlama | yalnızca içerikli gerçek bir 200 tutulur |

## ⚙️ CLI seçenekleri

```bash
node src/cli.js --count 5                  # five sign-ups, serial
node src/cli.js --model auto
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Bayrak | Varsayılan | Anlam |
| --- | --- | --- |
| `--count N` | `1` | üretilecek hesap sayısı, seri |
| `--model <id>` | `auto` | canlı kapı için kullanılan model |
| `--pool <file>` | `proxies.txt` | çıkış listesi, proxy başına bir satır — isteğe bağlı |
| `--exits N` | `6` | hesap başına taranan çıkış adayı |
| `--mint-tries N` | `2` | çıkış başına tam kayıt denemesi (yeni posta kutusu) |
| `--code-timeout S` | `240` | doğrulama postası için beklenecek saniye |
| `--keys <file>` | `keys.txt` | `--verify-only` / `--connect-9router` için anahtar dosyası |
| `--headless` | kapalı | YALNIZCA TEŞHİS için — widget üretilmez |

## 🛰️ Proxy arkasında

**İsteğe bağlı — ölçekte önerilir (IP başına limitler, yasaklar).** Araç proxy olmadan da çalışır.

- **Havuz varken:** `--pool <file>` geçirin (veya `INFERBASE_PROXIES` ayarlayın) ve her istek — Chrome tarayıcısı dahil — o listeden bir çıkış üzerinden geçer, başarısız durumda kapanır.
- **Havuz yokken:** CLI `direct` modunu yazdırır ve doğrudan bağlanır; kayıt, anahtar üretimi ve kapı değişmez.
- Çıkış kalitesi başarıyı belirler: akış içindeki Chrome ekranı, Turnstile widget'ı hiçbir zaman üretmeyen bir satırı posta kutusu harcanmadan önce reddeder.

## 📄 Dosyalar

| Yol | İçerik |
| --- | --- |
| `keys.txt` | satır başına canlı doğrulanmış bir anahtar — git tarafından yok sayılır |
| `accounts.json` | e-posta / parola / anahtar / kapı sonucu, başarısız denemeler dahil |
| `proxies.txt` | çıkışlarınız — git tarafından yok sayılır |
| `out/` | çalıştırma günlüğü, hata ekran görüntüleri, defter — git tarafından yok sayılır |

## 🔌 9Router'a bağlan

[9Router](https://9router.com) kendi sunucunuzda barındırılan, OpenAI uyumlu bir yönlendiricidir:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Varsayılanlar: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Modeller `inferbase/<model id>` olarak sunulur. CLI aynısını tek seferde yapabilir: `node src/cli.js --connect-9router`.

## 🔌 OmniRoute'a bağlan

[OmniRoute](https://omniroute.online) kendi sunucunuzda barındırılan, OpenAI uyumlu bir yönlendiricidir:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Varsayılanlar: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Modeller `inferbase/<model id>` olarak sunulur. CLI aynısını tek seferde yapabilir: `node src/cli.js --connect-omniroute`.

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 Sağlayıcının verdiği | kendi modellerinde **hesap başına UTC günü başına 100 istek** (sayaç 00:00 UTC'de döner); kart yok, telefon yok |
| 🔑 Bir anahtarın size kazandırdığı | `https://api.inferbase.ai/v1` üzerinde hesabın model listesi (127 kimlik, `auto` canlı birini seçer) |
| 🌐 API biçimi | OpenAI uyumlu: `POST https://api.inferbase.ai/v1/chat/completions`, araç çağırma dahil |
| 🔒 Verileriniz | yalnızca `inferbase.ai`, Turnstile betiği ve `temp.tf` posta kutusu arka ucuyla iletişim kurulur |

## ⚠️ Koşullar ve hesap riski

Bu araç bir kayıt akışını otomatikleştirir, bu nedenle yaptığı şeyin sorumluluğu **size** aittir: bir sağlayıcının kaydını otomatikleştirmek o sağlayıcının hizmet koşullarını ihlal edebilir ve bir hesabın size verdiği ücretsiz katman, sağlayıcının her an kısıtlayabileceği, değiştirebileceği veya geri alabileceği bir şeydir — hesap başına ve IP başına. Yalnızca oluşturmaya izinli olduğunuz hesaplar için çalıştırın, proxy listenizi kendinize saklayın ve bu anahtarları üretim kapasitesi olarak görmeyin. Buradaki hiçbir şey bir sağlayıcının kurallarını aşma lisansı değildir.

## 🐞 Sorunlar

Inferbase kayıt biçimini, Turnstile site anahtarını (`0x4AAAAAAEE8v-wpU5kytU0i`), günlük 100 istek kotasını veya model kataloğunu değiştirirse, araç o adımda durur ve bunu bildirir. Komut ve tam çıktıyla birlikte **[bir sorun açın](../../issues)**.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>
