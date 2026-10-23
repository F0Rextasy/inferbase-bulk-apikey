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

**Crie contas em massa no Inferbase (inferbase.ai) com chaves de API geradas automaticamente — um endpoint compatível com OpenAI (127 ids de modelos, roteamento `auto`) com chamada de ferramentas, além de um conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-127%20served-412991?style=for-the-badge)](https://inferbase.ai)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Camada gratuita](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-127-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isto existe

O Inferbase é um gateway simples compatível com OpenAI (`https://api.inferbase.ai/v1`) cujo cadastro é um **registro protegido por Turnstile mais um link por e-mail**. Uma conta nova recebe **100 requisições por dia UTC** nos modelos próprios do Inferbase — o suficiente para executar uma carga de trabalho real, e o contador é reiniciado às **00:00 UTC** em vez de expirar. Uma conta carrega **uma chave** (`auto_scope: inferbase`, `rate_limit_rpm: 6`). A ferramenta controla um **Chrome real com interface gráfica** via CDP porque o widget da Cloudflare só é emitido ali, e não gasta nada em uma saída cujo widget nunca responde.

## 🎁 Camada gratuita — quanto você recebe

| O quê | Valor |
| --- | --- |
| Franquia gratuita | **100 requisições por dia UTC por conta (organização)** nos modelos próprios do Inferbase |
| Reinício | **00:00 UTC** — medido: um contador esgotado respondeu `402 Free plan limit: 100 requests per UTC day … all used` e a mesma chave respondeu `200` após o reinício |
| Limites do plano (do provedor) | 5000 requisições/mês · 100 requisições gerenciadas/dia · $0.50/dia gerenciado |
| Limite de taxa por chave | `rate_limit_rpm: 6` (retornado quando a chave é criada) |
| Cartão / telefone | **nenhum** — nenhuma etapa de pagamento e nenhum número de telefone é solicitado |
| Chave por conta | **1** (a ferramenta emite uma chave por conta) |

> 💡 A camada gratuita é definida pelo Inferbase e pode mudar. Confira os números ao vivo em [inferbase.ai](https://inferbase.ai) — e deixe o próprio portão da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 127

O endpoint anuncia **127 ids**; `GET /v1/models` retorna exatamente o que a conta pode chamar, e `auto` roteia para um ativo (medido: `auto` respondeu como `qwen3-8-max`).

| ID do modelo | observação |
| --- | --- |
| `auto` | roteador — o padrão no qual a ferramenta faz o portão |
| `qwen3-8-max` | para o que `auto` resolveu nas execuções medidas |
| `deepseek-v4-flash`, `deepseek-v4-pro` | chat, chamada de ferramentas verificada |
| `meta-llama-3-1-8b-instruct`, `bytedance-seed-2-0-*` | mais rotas de texto |

Ids de imagem (`bfl-flux-*`) e `deepseek-ocr-2` também estão listados, mas não são rotas de chat; o portão da ferramenta sempre usa `auto`.

## 🧪 Como usar a API

URL base **`https://api.inferbase.ai/v1`** — compatível com OpenAI. As chaves têm 52 caracteres, prefixo `inf_`.

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

## 🛠 Início rápido

```bash
cd inferbase-bulk-apikey
printf 'socks5://host:port\n' > proxies.txt   # optional — without it the tool runs direct
node src/launcher.js        # interactive: mint / verify / screen

# or directly:
node src/cli.js --count 1        # one sign-up + e-mail verify in a real Chrome
node src/cli.js --verify-only    # re-test every key already in keys.txt
node src/cli.js --screen         # HTTP screen of the exit list
```

O registro exige um Chrome real, **com interface gráfica**: o widget Turnstile só é emitido ali, e o fluxo se recusa a registrar em uma saída cujo widget nunca responde. `keys.txt` só é escrito depois que uma conclusão real respondeu naquela chave.

### 🖱️ O launcher

`node src/launcher.js` é um menu sobre os mesmos módulos: **mint**, **verify**, **screen**, **9Router**, **settings**. As configurações persistem em `launcher.config.json`.

## ✅ Verificado e funcionando — toda chave é testada

Medido em **2026-10-23** a partir da CLI distribuída (lista de saídas, sem WARP).

| Verificação | Resultado |
| --- | --- |
| vet de saída (HTTP) | página de login + script Turnstile + API acessível |
| tela do Chrome (no fluxo) | uma linha cujo widget nunca é emitido é recusada **antes** de gastar uma caixa de correio |
| registro | `POST /api/v1/auth/register` → **200** `Account created` |
| verificação de e-mail | e-mail de `hello@inferbase.ai` → `?token=` → `POST /api/v1/auth/verify-email` → **200** `Email verified successfully.` |
| chave | `POST /api/v1/inference/keys` (X-CSRF-Token) → **201/200**, `inf_…` de 52 caracteres |
| portão de chat | `POST /v1/chat/completions` `auto` → **200** `OK.` |
| portão de ferramentas | esquema da ferramenta `get_time` na requisição → `tool_calls` na resposta |
| chaves ativas | **10/10** chaves com chat-200 em uma varredura, e a CLI emitiu outra de ponta a ponta em **40 s** |

> **Portões de qualidade.** Toda chave aqui passou por um `chat-200` ao vivo antes de ser escrita em `keys.txt`
> (chaves mortas nunca são distribuídas). As combinações de roteador seguem a mesma regra no nível do modelo: uma entrada é
> adicionada **somente se o modelo responder `chat-200` e puder chamar ferramentas** — um modelo sem suporte a ferramentas,
> uma chave morta ou um provedor morto é descartado em vez de adicionado. Reexecute a etapa de verificação a qualquer momento;
> as falhas são relatadas, nunca ocultadas.

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: Inferbase page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://api.inferbase.ai/v1/chat/completions → real content = the key is live
```

| Etapa | Chamada | Observações |
| --- | --- | --- |
| screen | a página de registro no Chrome | o widget precisa montar **e** ser emitido; nada mais é gasto em uma linha que não consegue |
| caixa de correio | `temp.tf` (`providers=gmail`) | API pública, sem chave; o painel envia e-mail para `hello@inferbase.ai` |
| registro | `POST /api/v1/auth/register` | `{email,password,full_name,company,turnstile_token}` — o token deve vir da mesma saída |
| verificação | `POST /api/v1/auth/verify-email` | o e-mail carrega `?token=` |
| login | `POST /api/v1/auth/login` | define o cookie de sessão e o `csrf_token` |
| chave | `POST /api/v1/inference/keys` | rota de mutação → precisa de `X-CSRF-Token` (403 `CSRF token missing` sem ele) |
| portão | `GET /v1/models` + uma conclusão | apenas um 200 real com conteúdo é mantido |

## ⚙️ Opções da CLI

```bash
node src/cli.js --count 5                  # five sign-ups, serial
node src/cli.js --model auto
node src/cli.js --verify-only              # re-check keys.txt
node src/cli.js --screen                   # HTTP screen of the exit list
node src/cli.js --connect-9router          # register provider + keys on a local 9Router
node src/cli.js --help
```

| Flag | Padrão | Significado |
| --- | --- | --- |
| `--count N` | `1` | contas a emitir, em série |
| `--model <id>` | `auto` | modelo usado para o portão ao vivo |
| `--pool <file>` | `proxies.txt` | lista de saídas, uma linha por proxy — opcional |
| `--tries N` | `3` | candidatos de saída triados por conta |
| `--mint-tries N` | `2` | tentativas completas de registro (caixa de correio nova) por saída |
| `--code-timeout S` | `240` | segundos para aguardar o e-mail de verificação |
| `--keys <file>` | `keys.txt` | arquivo de chaves para `--verify-only` / `--connect-9router` |
| `--headless` | desativado | SOMENTE DIAGNÓSTICO — o widget não será emitido |

## 🛰️ Atrás de um proxy

**Opcional — recomendado em escala (limites por IP, banimentos).** A ferramenta funciona sem proxy também.

- **Com um pool:** passe `--pool <file>` (ou defina `INFERBASE_PROXIES`) e toda requisição — incluindo o navegador Chrome — passa por uma saída dessa lista, fail-closed.
- **Sem um pool:** a CLI exibe o modo `direct` e conecta diretamente; registro, emissão de chave e portão permanecem inalterados.
- A qualidade da saída decide o sucesso: a tela do Chrome no fluxo recusa uma linha cujo widget Turnstile nunca é emitido antes de gastar uma caixa de correio.

## 📄 Arquivos

| Caminho | Conteúdo |
| --- | --- |
| `keys.txt` | uma chave verificada ao vivo por linha — ignorada pelo git |
| `accounts.json` | e-mail / senha / chave / resultado do portão, incl. tentativas falhas |
| `proxies.txt` | suas saídas — ignorado pelo git |
| `out/` | log de execução, capturas de tela de falhas, ledger — ignorado pelo git |

## 🔌 Conectar ao 9Router

[9Router](https://9router.com) é um roteador auto-hospedado e compatível com OpenAI:

```bash
node src/connect-9router.js --base http://localhost:20128 --password 123456
```

Padrões: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Os modelos são servidos como `inferbase/<model id>`. A CLI pode fazer o mesmo em um único comando: `node src/cli.js --connect-9router`.

## 🔌 Conectar ao OmniRoute

[OmniRoute](https://omniroute.online) é um roteador auto-hospedado e compatível com OpenAI:

```bash
node src/connect-omniroute.js --base http://localhost:20128 --password 123456
```

Padrões: `--prefix inferbase`, `--base-url https://api.inferbase.ai/v1`, `--model auto`. Os modelos são servidos como `inferbase/<model id>`. A CLI pode fazer o mesmo em um único comando: `node src/cli.js --connect-omniroute`.

## 🔑 O que uma chave oferece

| | |
| --- | --- |
| 🏢 Provedor | **Inferbase** — [inferbase.ai](https://inferbase.ai) |
| 🎁 O que o provedor oferece | **100 requisições por dia UTC por conta** nos seus próprios modelos (o contador reinicia às 00:00 UTC); sem cartão, sem telefone |
| 🔑 O que uma chave oferece | a lista de modelos da conta em `https://api.inferbase.ai/v1` (127 ids, `auto` escolhe um ativo) |
| 🌐 Formato da API | compatível com OpenAI: `POST https://api.inferbase.ai/v1/chat/completions`, chamada de ferramentas incluída |
| 🔒 Seus dados | apenas `inferbase.ai`, o script Turnstile e o backend de caixa de correio `temp.tf` são contatados |

## 🐞 Problemas

Se o Inferbase mudar o formato do seu cadastro, sua site key do Turnstile (`0x4AAAAAAEE8v-wpU5kytU0i`), a franquia diária de 100 requisições ou o catálogo de modelos, a ferramenta para nessa etapa e informa isso. **[Abra uma issue](../../issues)** com o comando e a saída exata.

## 📄 Licença

MIT © 2026 — consulte [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 inferbase-bulk-apikey contributors

</div>