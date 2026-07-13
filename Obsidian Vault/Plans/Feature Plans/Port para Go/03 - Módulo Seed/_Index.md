---
title: "Módulo Seed — Arquitetura e Plano de Migração"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, seed]
up: "[[Plans/Feature Plans/Port para Go/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index]]"
next: "[[Plans/Feature Plans/Port para Go/04 - Roadmap e Status]]"
related: []
depth: 2
---

# 🌱 Módulo Seed — Arquitetura e Plano de Migração

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › **Módulo Seed**

---

## O que está sendo migrado

`apps/api/src/cli/modules/bible/seed/*` (TypeScript) baixa os 73 livros da bíblia de um repositório GitHub ([`Dancrf/biblia-db`](https://github.com/Dancrf/biblia-db)), normaliza o JSON de cada livro e insere `bible_books` → `bible_chapters` → `bible_verses` no Postgres, reportando progresso em tempo real num canal do Discord via webhook. Hoje isso roda dentro do CLI interativo (`bun run src/cli/index.ts` → menu → confirmação → seleção de opções via `prompts`).

O destino é `apps/api-go/cmd/seed/bible`, executado direto com `go run cmd/seed/bible/main.go` — **sem** menu, sem confirmação, sem seleção de opções: toda execução insere livros, capítulos e versículos (as três etapas sempre juntas, igual ao default atual do multiselect do TS). O log pro Discord é mantido com o mesmo comportamento (mensagem criada no início, editada a cada passo, com resumo final de erro/sucesso).

## Por que "trash code" no TypeScript

`apps/api/src/cli/modules/bible/bible-json-normalize.ts` tem ~260 linhas, mas só uma fração é usada de verdade pelo fluxo de seed. `bible-fetcher.ts` chama só `normalizeLivroBibliaDB` — todo o resto do arquivo (`normalizeBibleJsonForSeed`, `normalizeBooks`, `normalizeBookEntry`, `isBookNode`, `normalizeBookKey`, `toVerse`, o tipo `CompactChapter`) existe pra suportar dois formatos de JSON (`{ "genesis": { chapters: {...} } }` e `{ "books": [...] }`) que **nunca chegam a ser usados** — o único fetch real (`bible-fetcher.ts`) sempre bate no formato `{ livro, capitulos: [...] }` do `biblia-db`. Confirmado com `grep` no restante do `apps/api`: nada mais importa `normalizeBibleJsonForSeed`.

Duas outras fontes de código morto/redundante:

- **`slugify` como fallback em `processBook`** (`const slug = bookData.slug || slugify(bookData.name)`): `bookData.slug` vem sempre preenchido por `normalizeLivroBibliaDB` (é o `entry.slug` da constante `BIBLE_BOOKS`), então o fallback nunca dispara.
- **Campos `niceName`, `totalChapters`, `group_start`/`group_end`**: existem em `NormalizedBook`/`NormalizedVerse` mas não têm correspondente nas tabelas Go (`internal/bible/book.go` só tem `ID`, `Order`, `Name`, `Abbreviation`, `Testament` — sem `niceName`/`totalChapters`, decisão já tomada no port do módulo Bible, ver [[Plans/Feature Plans/Port para Go/04 - Roadmap e Status|Roadmap]]). Não faz sentido portar campos que a versão Go do domínio já decidiu não ter.

A versão Go não porta nada disso: só o caminho real (`RawLivroBibliaDB` → `normalizedBook`) é escrito.

## Estrutura de pastas (destino)

```
apps/api-go/
  cmd/seed/bible/
    main.go              → ponto de entrada, monta dependências e chama Run()
    books.go              → constante BIBLE_BOOKS (73 entradas) + BASE_RAW_URL + EXPECTED_BOOK_COUNT
    normalize.go           → RawLivroBibliaDB, normalizedBook/Chapter/Verse, normalizeLivroBibliaDB, stripVerseNumberPrefix
    fetch.go               → fetchAllBibleBooks (concorrente), integrityCheck
    discord.go              → discordLogger (start/update/log, mesmo payload de embed do TS)
    seed.go                  → processBook + Run (orquestração, usa os repositories já existentes de internal/bible)
  internal/
    idgen/
      uuid.go              → geração de UUID v4 sem dependência externa (crypto/rand)
```

`cmd/seed/bible/github-raw/json-normalize.go` (o `Slugfy` que já existe hoje, sem uso) é **removido** — ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/01 - Livros e Normalização|Livros e Normalização]] pro motivo.

## As camadas, em ordem de execução

| # | Etapa | Página | Depende de |
|:--|:--|:--|:--|
| 1 | Constantes + normalização do JSON do `biblia-db` | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/01 - Livros e Normalização\|Livros e Normalização]] | nada (é a base) |
| 2 | Download concorrente dos 73 livros + checagem de integridade | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check\|Fetch Concorrente e Integrity Check]] | Etapa 1 |
| 3 | Geração de ID + inserção via repositories existentes | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência\|Geração de ID e Persistência]] | Etapa 2, `internal/bible` e `internal/postgres/bible` (já prontos) |
| 4 | Log de progresso no Discord | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord\|Log no Discord]] | Etapa 3 (chamado de dentro do `Run`) |
| 5 | `main.go` — monta tudo | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/05 - Montagem Final (main.go)\|Montagem Final]] | todas as anteriores |

## Decisões tomadas pra essa migração

- **Sem flags, sem confirmação.** `go run cmd/seed/bible/main.go` sempre insere livros + capítulos + versículos. Isso é uma mudança de comportamento consciente em relação ao multiselect do TS (que permitia desligar cada etapa) — decisão tomada junto com o usuário: o multiselect nunca foi usado pra rodar parcial na prática, e sem CLI não tem onde colocar esse menu sem reintroduzir a abstração que estamos tirando.
- **Discord webhook mantido.** Mesmo formato de embed (logs, horário de início/fim, cor por status), mesma variável de ambiente `DISCORD_WEBHOOK_URL` — só que carregada localmente em `cmd/seed/bible/main.go`, não via `internal/config.Config` (esse struct é usado também pelo `cmd/api`, que não precisa de webhook do Discord; acoplar os dois faria o servidor HTTP falhar ao subir por falta de uma env var que só o seed usa).
- **IDs gerados no Go, não no banco.** As migrations (`db/migrations/000001_create-bible-tables.up.sql`) não têm `DEFAULT gen_random_uuid()` nas colunas `id` — e os métodos `CreateBook`/`CreateChapter`/`CreateVerse(s)` dos repositories já esperam receber o `ID` preenchido (ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência|página 3]]). Por isso entra um pacote novo `internal/idgen`.
- **Reaproveita os repositories do módulo Bible.** Nada de SQL novo — `postgres_bible.BookRepository.CreateBook`, `ChapterRepository.CreateChapter` e `VerseRepository.CreateVerses` (em lote, via `pgx.Batch`) já existem e já tratam conflito (`ON CONFLICT (id) DO NOTHING` + erro sentinela `Err*AlreadyExists`). O seed só precisa saber checar "já existe" antes de tentar criar (mesma lógica do TS: busca por `FindBookByDynamicID`/`FindChapterByNumberAndBookDynamicID` antes de inserir).

## Correspondência com o CLI original (TypeScript)

| TypeScript | Go | Observação |
|:--|:--|:--|
| `cli/modules/bible/bible.action.ts` (menu + confirmação) | *(removido)* | Sem CLI: `go run` já é a confirmação |
| `cli/modules/bible/seed/seed.menus.ts` | *(removido)* | Sem multiselect: sempre roda tudo |
| `cli/modules/bible/seed/bible-books.constants.ts` | `cmd/seed/bible/books.go` | Mesma lista de 73 slugs, mesma ordem canônica |
| `cli/modules/bible/bible-json-normalize.ts` (só a parte usada) | `cmd/seed/bible/normalize.go` | Sem os formatos mortos, sem `niceName`/`group_start`/`group_end` |
| `cli/modules/bible/seed/bible-fetcher.ts` | `cmd/seed/bible/fetch.go` | `Promise.all` vira `errgroup.Group` (ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check\|página 2]]) |
| `cli/modules/bible/seed/seed.action.ts` (Discord) | `cmd/seed/bible/discord.go` | Mesmo payload de embed |
| `cli/modules/bible/seed/seed.action.ts` (`processBook`, `seedBibleFromRemote`) | `cmd/seed/bible/seed.go` | Usa `db.insert(...).returning()` do Drizzle → usa `CreateBook`/`CreateChapter`/`CreateVerses` dos repositories Go |
| *(nada — Postgres gera nada, Drizzle usa `.returning()` do `INSERT` com PK serial/uuid do schema)* | `internal/idgen/uuid.go` | Novo: Go precisa gerar o `id` antes de inserir |

---

◀ [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] · [[Plans/Feature Plans/Port para Go/04 - Roadmap e Status|Roadmap e Status]] ▶
