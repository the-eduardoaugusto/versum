---
title: "API — CLI"
section: "Docs"
subsection: "Apps"
tags: [versum, api, cli, seed, bible]
up: "[[Docs/Apps/API/_Overview]]"
related: ["[[Docs/Apps/API/Services]]", "[[Docs/Apps/API/Database]]"]
depth: 2
---

# 🖥️ API — CLI

Ferramenta interativa de linha de comando para operações de manutenção da API.

**Localização:** `apps/api/src/cli/`  
**Execução:** `bun run cli` (dentro de `apps/api/`)

## Estrutura

```
src/cli/
├── index.ts                  # Entrypoint — inicializa o menu principal
├── constants.ts              # Paths de output
├── menus/                    # Menus compartilhados
└── modules/
    ├── bible/                # Seed da bíblia
    ├── db/                   # Operações de banco (truncate)
    ├── build/                # Build do projeto
    ├── deploy/               # Deploy
    └── openapi-doc/          # Geração de documentação OpenAPI
```

---

## Módulo: Bible Seed

Popula o banco com os dados da bíblia buscando os JSONs diretamente do repositório público [biblia-db](https://github.com/Dancrf/biblia-db).

**Fluxo:**

```
Menu Bíblia → Seed
  → Confirmar operação
  → Selecionar o que inserir (livros / capítulos / versículos)
  → Fetch paralelo de 73 livros via GitHub raw API
  → Integrity check (valida todos os 73 antes de tocar no banco)
  → Seed no banco (idempotente via onConflictDoNothing)
  → Log no Discord webhook
```

**Fonte dos dados:** `https://raw.githubusercontent.com/Dancrf/biblia-db/refs/heads/main/`

**Distribuição:** 46 livros do Antigo Testamento + 27 do Novo Testamento = 73 livros.

**Integrity check:** Se qualquer fetch falhar ou o JSON estiver malformado (sem `livro`, sem `capitulos`, ou `capitulos` vazio), o seed é abortado antes de qualquer escrita no banco e imprime quais slugs falharam.

**Arquivos principais:**

| Arquivo | Responsabilidade |
|---|---|
| `seed/bible-books.constants.ts` | Lista canônica hardcoded dos 73 slugs com testamento |
| `seed/bible-fetcher.ts` | Fetch paralelo + `integrityCheck` |
| `bible-json-normalize.ts` | Normaliza `{ livro, capitulos }` → `NormalizedBook` |
| `seed/seed.action.ts` | Orquestra fetch → check → seed no banco |
| `seed/seed.menus.ts` | Prompts interativos da CLI |

---

## Módulo: Database

Operações de banco via CLI:

- **Truncate** — limpa tabelas selecionadas (com confirmação)

---

◀ [[Docs/Apps/API/Database|Database]] · [[Docs/Apps/API/_Overview|Overview]] ▶
