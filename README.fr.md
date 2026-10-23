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

**Créez en masse des comptes Inferbase (inferbase.ai) avec des clés API générées automatiquement — un point de terminaison compatible OpenAI (127 identifiants de modèles, routage `auto`) avec appel d'outils, plus un connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Niveau gratuit](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-127-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi ce projet existe

Inferbase est une simple passerelle compatible OpenAI (`https://api.inferbase.ai/v1`) dont l'inscription est une **inscription protégée par Turnstile plus un lien par e-mail**. Un nouveau compte obtient **100 requêtes par jour UTC** sur les modèles propres d'Inferbase — de quoi exécuter une charge de travail réelle, et le compteur se réinitialise à **00:00 UTC** plutôt que d'expirer. Un compte porte **une clé** (`auto_scope: inferbase`, `rate_limit_rpm: 6`). L'outil pilote un **vrai Chrome avec interface** via CDP, car le widget Cloudflare ne s'émet que là, et il ne dépense rien sur une sortie dont le widget ne répond jamais.

## 🎁 Niveau gratuit — ce que vous obtenez

| Quoi | Valeur |
| --- | --- |
| Allocation gratuite | **100 requêtes par jour UTC par compte (organisation)** sur les modèles propres d'Inferbase |
| Réinitialisation | **00:00 UTC** — mesuré : un compteur épuisé a répondu `402 Free plan limit: 100 requests per UTC day … all used` et la même clé a répondu `200` après la réinitialisation |
| Limites du forfait (du fournisseur) | 5000 requêtes/mois · 100 requêtes gérées/jour · 0,50 $/jour gérés |
| Limite de débit par clé | `rate_limit_rpm: 6` (renvoyé lors de la création de la clé) |
| Carte / téléphone | **aucun** — aucune étape de paiement et aucun numéro de téléphone demandé |
| Clé par compte | **1** (l'outil génère une clé par compte) |

> 💡 Le niveau gratuit est défini par Inferbase et peut changer. Vérifiez les chiffres en direct sur [inferbase.ai](https://inferbase.ai) — et laissez la propre barrière de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 127

Le point de terminaison annonce **127 identifiants** ; `GET /v1/models` renvoie exactement ce que le compte peut appeler, et `auto` route vers un modèle actif (mesuré : `auto` a répondu en tant que `qwen3-8-max`).

| ID du modèle | remarque |
| --- | --- |
| `auto` | routeur — la valeur par défaut sur laquelle l'outil filtre |
| `qwen3-8-max` | ce vers quoi `auto` s'est résolu lors des exécutions mesurées |
| `deepseek-v4-flash`, `deepseek-v4-pro` | chat, appel d'outils vérifié |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | autres routes de texte |

Les identifiants d'image (`bfl-flux-*`) et `deepseek-ocr-2` sont également listés mais ne sont pas des routes de chat ; la barrière de l'outil utilise toujours `auto`.

## 🧪 Comment utiliser l'API

URL de base **`https://api.inferbase.ai/v1`** — compatible OpenAI. Les clés font 52 caractères, préfixe `inf_`.

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

## 🛠 Démarrage rapide

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + e-mail verify in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

L'inscription nécessite un vrai Chrome **avec interface** : le widget Turnstile ne s'émet que là, et le flux refuse de s'inscrire sur une sortie dont le widget ne répond jamais. `keys.txt` n'est écrit qu'après qu'une vraie complétion a répondu sur cette clé.

### 🖱️ Le lanceur

`node src/launcher.js` est un menu au-dessus des mêmes modules : **mint**, **verify**, **screen**, **9Router**, **settings**. Les paramètres persistent dans `launcher.config.json`.

## ✅ Vérifié fonctionnel — chaque clé est testée

Mesuré le **2026-10-23** depuis la CLI livrée (liste de sortie, sans WARP).

| Vérification | Résultat |
| --- | --- |
| vérification de sortie (HTTP) | page de connexion + script Turnstile + API joignable |
| écran Chrome (dans le flux) | une ligne dont le widget ne s'émet jamais est refusée **avant** qu'une boîte mail ne soit dépensée |
| inscription | `POST /api/v1/auth/register` → **200** `Account created` |
| vérification e-mail | mail de `hello@inferbase.ai` → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| clé | `POST /api/v1/inference/keys` (X-CSRF-Token) → **201/200**, `inf_…` de 52 caractères |
| barrière de chat | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| barrière d'outils | schéma d'outil `get_time` dans la requête → `tool_calls` dans la réponse |
| clés actives | **10/10** clés chat-200 en un seul balayage, et la CLI en a généré une autre de bout en bout en **40 s** |

> **Barrières de qualité.** Chaque clé ici a passé un `chat-200` en direct avant d'être écrite dans `keys.txt`
> (les clés mortes ne sont jamais livrées). Les combinaisons de routeurs suivent la même règle au niveau du modèle : une entrée n'est
> ajoutée **que si le modèle répond `chat-200` et peut appeler des outils** — un modèle sans prise en charge des outils,
> une clé morte ou un fournisseur mort est écarté au lieu d'être ajouté. Relancez l'étape de vérification à tout moment ;
> les échecs sont signalés, jamais masqués.

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| Étape | Appel | Remarques |
| --- | --- | --- |
| écran | la page d'inscription dans Chrome | le widget doit se monter **et** s'émettre ; rien d'autre n'est dépensé sur une ligne qui ne le peut pas |
| boîte mail | `temp.tf` (`providers=gmail`) | API publique, sans clé ; le panneau envoie à `hello@inferbase.ai` |
| inscription | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — le jeton doit provenir de la même sortie |
| vérification | `POST /api/v1/auth/verify-email` | le mail porte `?token=` |
| connexion | `POST /api/v1/auth/login` | définit le cookie de session et `csrf_token` |
| clé | `POST /api/v1/inference/keys` | route mutante → nécessite `X-CSRF-Token` (403 `CSRF token missing` sans lui) |
| barrière | `GET /v1/models` + une complétion | seul un vrai 200 avec contenu est conservé |

## ⚙️ Options de la CLI

```bash
node src/cli.js --count 5                  # five sign-ups, serial
node src/cli.js --model auto
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Option | Défaut | Signification |
| --- | --- | --- |
| `--count N` | `1` | comptes à générer, en série |
| `--model <id>` | `auto` | modèle utilisé pour la barrière en direct |
| `--pool <file>` | `proxies.txt` | liste de sorties, une ligne par proxy — facultatif |
| `--tries N` | `3` | candidats de sortie filtrés par compte |
| `--mint-tries N` | `2` | tentatives d'inscription complètes (nouvelle boîte mail) par sortie |
| `--code-timeout S` | `240` | secondes d'attente du mail de vérification |
| `--keys <file>` | `keys.txt` | fichier de clés pour `--verify-only` / `--connect-9router` |
| `--headless` | désactivé | DIAGNOSTIC uniquement — le widget ne s'émettra pas |

## 🛰️ Derrière un proxy

**Facultatif — recommandé à grande échelle (limites par IP, bannissements).** L'outil fonctionne aussi sans proxy.

- **Avec un pool :** passez `--pool <file>` (ou définissez `INFERBASE_PROXIES`) et chaque requête — le navigateur Chrome inclus — passe par une sortie de cette liste, en échec fermé.
- **Sans pool :** la CLI affiche le mode `direct` et se connecte directement ; l'inscription, la génération de clés et la barrière sont inchangées.
- La qualité des sorties décide du succès : l'écran Chrome dans le flux refuse une ligne dont le widget Turnstile ne s'émet jamais avant qu'une boîte mail ne soit dépensée.

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | une clé vérifiée en direct par ligne — ignoré par git |
| `accounts.json` | e-mail / mot de passe / clé / résultat de la barrière, y compris les tentatives échouées |
| `proxies.txt` | vos sorties — ignoré par git |
| `out/` | journal d'exécution, captures d'écran d'échec, registre — ignoré par git |

## 🔌 Connexion à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé compatible OpenAI :

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Défauts : `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Les modèles sont servis sous `inferbase/<model id>`. La CLI peut faire de même en une seule commande : `node src/cli.js --connect-9router`.

## 🔌 Connexion à OmniRoute

[OmniRoute](https://omniroute.online) est un routeur auto-hébergé compatible OpenAI :

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Défauts : `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Les modèles sont servis sous `inferbase/<model id>`. La CLI peut faire de même en une seule commande : `node src/cli.js --connect-omniroute`.

## 🔑 Ce qu'une clé vous apporte

| | |
| --- | --- |
| 🏢 Fournisseur | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 Ce que le fournisseur donne | **100 requêtes par jour UTC par compte** sur ses propres modèles (le compteur se réinitialise à 00:00 UTC) ; pas de carte, pas de téléphone |
| 🔑 Ce qu'une clé vous apporte | la liste des modèles du compte sur `https://api.inferbase.ai/v1` (127 identifiants, `auto` en choisit un actif) |
| 🌐 Forme de l'API | compatible OpenAI : `POST https://api.inferbase.ai/v1/chat/completions`, appel d'outils inclus |
| 🔒 Vos données | seuls `inferbase.ai`, le script Turnstile et le backend de boîte mail `temp.tf` sont contactés |

## 🐞 Problèmes

Si Inferbase modifie la forme de son inscription, sa clé de site Turnstile (`0x4AAAAAAEE8v-wpU5kytU0i`), l'allocation quotidienne de 100 requêtes ou le catalogue de modèles, l'outil s'arrête à cette étape et le signale. **[Ouvrez un ticket](../../issues)** avec la commande et la sortie exacte.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>