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

[⚡ Une seule commande](#-one-command) · [🛠 Démarrage rapide](#-quick-start) · [🎁 Offre gratuite](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-127-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [⚠️ Conditions](#️-terms-and-account-risk) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi ce projet existe

Inferbase est une simple passerelle compatible OpenAI (`https://api.inferbase.ai/v1`) dont l'inscription est une **inscription protégée par Turnstile suivie d'un lien par e-mail**. Un nouveau compte obtient **100 requêtes par jour UTC** sur les modèles propres à Inferbase — de quoi exécuter une charge de travail réelle, et le compteur se réinitialise à **00:00 UTC** plutôt que d'expirer. Un compte porte **une clé** (`auto_scope: inferbase`, `rate_limit_rpm: 6`). L'outil pilote un **Chrome réel en mode fenêtré** via CDP parce que le widget Cloudflare ne s'émet que là, et il ne dépense rien sur une sortie dont le widget ne répond jamais.

## 🎁 Offre gratuite — ce que vous obtenez

| Quoi | Valeur |
| --- | --- |
| Allocation gratuite | **100 requêtes par jour UTC par compte (organisation)** sur les modèles propres à Inferbase |
| Réinitialisation | **00:00 UTC** — mesuré : un compteur épuisé répondait `402 Free plan limit: 100 requests per UTC day … all used` et la même clé répondait `200` après la réinitialisation |
| Limites du forfait (fournies par le prestataire) | 5000 requêtes/mois · 100 requêtes gérées/jour · 0,50 $/jour gérés |
| Limite de débit par clé | `rate_limit_rpm: 6` (renvoyée à la création de la clé) |
| Carte / téléphone | **aucun** — aucune étape de paiement et aucun numéro de téléphone demandé |
| Clé par compte | **1** (l'outil génère une clé par compte) |

> 💡 L'offre gratuite est définie par Inferbase et peut changer. Consultez les chiffres en direct sur [inferbase.ai](https://inferbase.ai) — et laissez la propre barrière de l'outil décider :

```bash
node src/cli.js --verify-only     # chaque clé dans keys.txt est retestée avec un véritable appel de chat
```

## 🤖 Modèles — les 127

Le point de terminaison annonce **127 identifiants** ; `GET /v1/models` renvoie exactement ce que le compte peut appeler, et `auto` route vers un modèle actif (mesuré : `auto` a répondu en tant que `qwen3-8-max`).

| Identifiant du modèle | note |
| --- | --- |
| `auto` | routeur — la valeur par défaut sur laquelle l'outil filtre |
| `qwen3-8-max` | ce vers quoi `auto` s'est résolu lors des exécutions mesurées |
| `deepseek-v4-flash`, `deepseek-v4-pro` | chat, appel d'outils vérifié |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | autres routes textuelles |

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

## ⚡ Une seule commande

```bash
node src/cli.js --count N        # N comptes → N clés, une seule commande, rien à répondre
```

Le widget Cloudflare Turnstile est émis par le moteur de navigateur embarqué (`src/solver.js`) dans un Chrome réel **en mode fenêtré** — `--auto` est la valeur **par défaut** et reste activé, donc il n'y a aucun captcha à coller et aucune question de navigateur en travers du chemin. Indiquer `--dry` affiche le plan résolu (nombre, modèle, route, solveur, chemin de Chrome) et se termine avec le code 0 sans écrire de fichier ni ouvrir de socket :

```bash
node src/cli.js --count N --dry
```

`npm start` (ou `node src/launcher.js`) fait la même chose depuis un menu : choisissez **1) Mint keys**, répondez à « How many keys? » (Entrée = 10) et il exécute `node src/cli.js --auto --count N`. `proxies.txt` est pris en compte automatiquement lorsqu'il existe, sinon l'exécution se fait en direct.

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

L'inscription nécessite un Chrome réel, **en mode fenêtré** : le widget Turnstile ne s'émet que là, et le flux refuse de s'inscrire sur une sortie dont le widget ne répond jamais. `keys.txt` n'est écrit qu'après qu'une véritable complétion a répondu sur cette clé.

### 🖱️ Le lanceur

`node src/launcher.js` est un menu au-dessus des mêmes modules : **mint**, **verify**, **screen**, **9Router**, **settings**. Les paramètres persistent dans `launcher.config.json`.

## ✅ Vérifié et fonctionnel — chaque clé est testée

Mesuré le **2026-10-23** depuis l'interface CLI fournie (liste de sortie, sans WARP).

| Vérification | Résultat |
| --- | --- |
| vérification de la sortie (HTTP) | page de connexion + script Turnstile + API accessibles |
| Filtrage Chrome (dans le flux) | une ligne dont le widget ne s'émet jamais est refusée **avant** qu'une boîte mail ne soit dépensée |
| inscription | `POST /api/v1/auth/register` → **200** `Account created` |
| vérification e-mail | mail de `hello@inferbase.ai` → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| clé | `POST /api/v1/inference/keys` (X-CSRF-Token) → **201/200**, `inf_…` de 52 caractères |
| barrière de chat | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| barrière des outils | schéma d'outil `get_time` dans la requête → `tool_calls` dans la réponse |
| barrière en direct | chaque clé dans `keys.txt` a passé un `chat-200` en direct avant d'être livrée ; la CLI génère aussi une clé fraîche de bout en bout comme auto-vérification |

> **Barrières de qualité.** Chaque clé ici a passé un `chat-200` en direct avant d'être écrite dans `keys.txt`
> (les clés mortes ne sont jamais livrées). Les combinaisons de routeur suivent la même règle au niveau du modèle : une entrée est
> ajoutée **uniquement si le modèle répond `chat-200` et peut appeler des outils** — un modèle sans prise en charge des outils,
> une clé morte ou un fournisseur mort est écarté au lieu d'être ajouté. Relancez l'étape de vérification à tout moment ;
> les échecs sont signalés, jamais cachés.

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| Étape | Appel | Notes |
| --- | --- | --- |
| filtrage | la page d'inscription dans Chrome | le widget doit se monter **et** s'émettre ; rien d'autre n'est dépensé sur une ligne qui ne le peut pas |
| boîte mail | `temp.tf` (`providers=gmail`) | API publique, sans clé ; le panneau envoie à `hello@inferbase.ai` |
| inscription | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — le jeton doit provenir de la même sortie |
| vérification | `POST /api/v1/auth/verify-email` | le mail contient `?token=` |
| connexion | `POST /api/v1/auth/login` | définit le cookie de session et le `csrf_token` |
| clé | `POST /api/v1/inference/keys` | route mutante → nécessite `X-CSRF-Token` (403 `CSRF token missing` sans lui) |
| barrière | `GET /v1/models` + une complétion | seul un véritable 200 avec contenu est conservé |

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
| `--pool <file>` | `proxies.txt` | liste de sortie, une ligne par proxy — facultatif |
| `--tries N` | `3` | candidats de sortie filtrés par compte |
| `--mint-tries N` | `2` | tentatives d'inscription complètes (nouvelle boîte mail) par sortie |
| `--code-timeout S` | `240` | secondes d'attente du mail de vérification |
| `--keys <file>` | `keys.txt` | fichier de clés pour `--verify-only` / `--connect-9router` |
| `--headless` | désactivé | DIAGNOSTIC uniquement — le widget ne s'émettra pas |

## 🛰️ Derrière un proxy

**Facultatif — recommandé à grande échelle (limites par IP, bannissements).** L'outil fonctionne aussi sans proxy.

- **Avec un pool :** passez `--pool <file>` (ou définissez `INFERBASE_PROXIES`) et chaque requête — le navigateur Chrome inclus — passe par une sortie de cette liste, en échec fermé.
- **Sans pool :** la CLI affiche le mode `direct` et se connecte directement ; l'inscription, la génération de clés et la barrière sont inchangées.
- La qualité des sorties décide du succès : le filtrage Chrome dans le flux refuse une ligne dont le widget Turnstile ne s'émet jamais avant qu'une boîte mail ne soit dépensée.

## 📄 Fichiers

| Chemin | Contenu |
| --- | --- |
| `keys.txt` | une clé vérifiée en direct par ligne — ignorée par git |
| `accounts.json` | e-mail / mot de passe / clé / résultat de la barrière, y compris les tentatives échouées |
| `proxies.txt` | vos sorties — ignoré par git |
| `out/` | journal d'exécution, captures d'écran des échecs, registre — ignoré par git |

## 🔌 Connexion à 9Router

[9Router](https://9router.com) est un routeur auto-hébergé compatible OpenAI :

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Valeurs par défaut : `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Les modèles sont servis sous la forme `inferbase/<model id>`. La CLI peut faire la même chose en une seule fois : `node src/cli.js --connect-9router`.

## 🔌 Connexion à OmniRoute

[OmniRoute](https://omniroute.online) est un routeur auto-hébergé compatible OpenAI :

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Valeurs par défaut : `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Les modèles sont servis sous la forme `inferbase/<model id>`. La CLI peut faire la même chose en une seule fois : `node src/cli.js --connect-omniroute`.

## 🔑 Ce qu'une clé vous apporte

| | |
| --- | --- |
| 🏢 Fournisseur | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 Ce que le fournisseur donne | **100 requêtes par jour UTC par compte** sur ses propres modèles (le compteur repart à 00:00 UTC) ; ni carte, ni téléphone |
| 🔑 Ce qu'une clé vous apporte | la liste des modèles du compte sur `https://api.inferbase.ai/v1` (127 identifiants, `auto` en choisit un actif) |
| 🌐 Forme de l'API | compatible OpenAI : `POST https://api.inferbase.ai/v1/chat/completions`, appel d'outils inclus |
| 🔒 Vos données | seuls `inferbase.ai`, le script Turnstile et le backend de boîte mail `temp.tf` sont contactés |

## ⚠️ Conditions et risque lié au compte

Cet outil automatise un flux d'inscription, donc **vous** êtes responsable de ce qu'il fait : automatiser l'inscription d'un fournisseur peut enfreindre les conditions d'utilisation de ce fournisseur, et l'offre gratuite qu'un compte vous octroie appartient au fournisseur, qui peut la limiter, la modifier ou la reprendre à tout moment — par compte et par IP. Utilisez-le uniquement pour des comptes que vous êtes autorisé à créer, gardez votre liste de proxies pour vous, et ne traitez pas ces clés comme une capacité de production. Rien ici ne constitue une licence pour contourner les règles d'un fournisseur.

## 🐞 Problèmes

Si Inferbase modifie la structure de son inscription, sa clé de site Turnstile (`0x4AAAAAAEE8v-wpU5kytU0i`), l'allocation quotidienne de 100 requêtes ou le catalogue de modèles, l'outil s'arrête à cette étape et le signale. **[Ouvrez un ticket](../../issues)** avec la commande et la sortie exacte.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>
