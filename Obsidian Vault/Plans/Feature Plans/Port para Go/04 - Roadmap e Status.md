---
title: "Port para Go — Roadmap e Status"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, roadmap]
up: "[[Plans/Feature Plans/Port para Go/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
next: "[[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index]]"
related: []
depth: 2
---

# 🗺️ Port para Go — Roadmap e Status

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › **Roadmap e Status**

---

## Ordem de execução

Segue a ordem de dependência descrita em [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible — Arquitetura]]: cada camada depende da anterior, então não faz sentido pular pra frente.

| #   | Etapa                                                                                                                                | Status                                                                                                                            |
| :-- | :----------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Migrations (`bible_books`, `bible_chapters`, `bible_verses`)                                                                         | ✅ Concluído                                                                                                                       |
| 2   | Conexão com banco (pacote `database`)                                                                                                | ✅ Concluído                                                                                                                       |
| 3   | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/01 - Camada de Domínio\|Domínio]] — `book.go`                                   | ✅ Concluído                                                                                                                       |
| 4   | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/01 - Camada de Domínio\|Domínio]] — `chapter.go`, `verse.go`                    | ✅ Concluído                                                                                                                       |
| 5   | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/02 - Repository (Interface)\|Repository (Interface)]]                           | ✅ Concluído — `BookRepository`, `ChapterRepository`, `VerseRepository` (3 interfaces separadas por entidade, em vez de uma única) |
| 6   | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/03 - Repository (Implementação Postgres)\|Repository (Implementação Postgres)]] | ✅ Concluído — `BookRepository`, `ChapterRepository` e `VerseRepository` (Postgres), com injeção de dependência entre elas (verso resolve capítulo, capítulo resolve livro) |
| 7   | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/04 - Camada de Service\|Service]]                                               | ✅ Concluído — `BibleService` único, com `BookRepository`/`ChapterRepository`/`VerseRepository` como dependências (interfaces)      |
| 8   | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/05 - Camada de Handler HTTP\|Handler HTTP]]                                     | ✅ Concluído — seis rotas via `net/http.ServeMux` (Go 1.22+), pacote `httputil` compartilhado pra paginação/resposta/erro           |
| 9   | [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/06 - Montagem Final (main.go)\|Montagem Final (main.go)]]                       | ✅ Concluído — módulo `bible` inteiro de ponta a ponta                                                                             |

## Detalhes do que já existe

- **Migrations**: `apps/api-go/db/migrations/000001_create-bible-tables` (`.up.sql`/`.down.sql`), criando `bible_books`, `bible_chapters` e `bible_verses` numa migration só. Testado com `migrate up`/`migrate down` contra um Postgres local — reverte e reaplica sem erro.
- **Conexão com banco**: `apps/api-go/internal/database/database.go`. Struct `Database` com um `pool *pgxpool.Pool` privado, construtor `New(ctx, dbUrl) (*Database, error)` que abre o pool e confirma com `Ping`, e método `Close()` que fecha o pool.
- **Domínio**: `internal/bible/book.go`, `chapter.go`, `verse.go` — três structs com campos exportados, batendo com as colunas das migrations. `Book` tem um tipo próprio `BookTestament` pros valores "antigo"/"novo".
- **Repository (Interface)**: `internal/bible/repository.go` — três interfaces (`BookRepository`, `ChapterRepository`, `VerseRepository`), cada uma com os métodos de busca correspondentes (incluindo total de registros nos métodos paginados, pra alimentar a paginação da resposta HTTP depois).
- **Erros de domínio**: `internal/bible/errors.go` — `ErrBookNotFound`, `ErrChapterNotFound`, `ErrVerseNotFound`, erros sentinela usados pra "traduzir" o `pgx.ErrNoRows` (específico do driver de banco) num erro que o resto da aplicação entende sem precisar conhecer Postgres.
- **Repository (Implementação Postgres)**: `internal/postgres/bible/`, um arquivo por entidade.
	- `book.go` — `BookRepository`. `FindBooksPaginated` (query com `ORDER BY`/`LIMIT`/`OFFSET` + `COUNT` separado) e `FindBookByDynamicID` (busca por nome ou abreviação, traduzindo "não encontrado" pro erro de domínio). `Book` do domínio não tem mais `TotalChapters` (decisão consciente — é dado derivado, dá pra calcular com `COUNT` se precisar).
	- `chapter.go` — `ChapterRepository`. Recebe um `bible.BookRepository` (a interface, não o struct concreto) como dependência no construtor, e usa ele pra resolver o livro antes de buscar os capítulos — em vez de instanciar um `BookRepository` novo a cada chamada.
	- `verse.go` — `VerseRepository`. Segue o mesmo padrão: recebe um `bible.ChapterRepository` como dependência, que por sua vez já sabe resolver o livro. Isso forma uma cadeia (verso → capítulo → livro) sem que `VerseRepository` precise conhecer `BookRepository` diretamente.

## Módulo `bible` completo

Com a etapa 9 fechada, o módulo `bible` está funcional de ponta a ponta: migrations → conexão → domínio → repository (interface + Postgres) → service → handler HTTP → `main.go`. Além disso, ao longo do caminho surgiu um pacote `internal/config` (carregamento de env vars validado, sem depender de biblioteca externa tipo Zod) que não estava no plano original — solução idiomática em Go pra um problema que apareceu na prática.

## Módulo `seed` (bible) — plano de migração

Migração do CLI interativo `apps/api/src/cli/modules/bible/seed/*` (TypeScript, com menus `prompts`) pro binário `apps/api-go/cmd/seed/bible` (Go, `go run cmd/seed/bible/main.go`, sem CLI abstraindo nada). Detalhe completo em [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]].

| # | Etapa | Status |
|:--|:--|:--|
| 1 | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/01 - Livros e Normalização\|Livros e Normalização]] — `books.go`, `normalize.go` | ⬜ Planejado |
| 2 | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check\|Fetch Concorrente e Integrity Check]] — `fetch.go` | ⬜ Planejado |
| 3 | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência\|Geração de ID e Persistência]] — `internal/idgen`, `seed.go` | ⬜ Planejado |
| 4 | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord\|Log no Discord]] — `discord.go` | ⬜ Planejado |
| 5 | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/05 - Montagem Final (main.go)\|Montagem Final]] — `main.go` | ⬜ Planejado |

## Módulo `rate limit` (global) — plano de migração

Migração do rate limiter global (`apps/api/src/middlewares/rate-limiter/middleware.ts`, TS, fixed window via Redis) pro pacote `apps/api-go/internal/ratelimit` + `internal/redis`, usando `go-redis/v9`. Detalhe completo em [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]].

| # | Etapa | Status |
|:--|:--|:--|
| 1 | [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/01 - Camada de Domínio\|Camada de Domínio]] — `limiter.go`, `keys.go` | ⬜ Planejado |
| 2 | [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/02 - Middleware HTTP\|Middleware HTTP]] — `middleware.go`, `httputil.TooManyRequests`/`ServiceUnavailable` | ⬜ Planejado |
| 3 | [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/03 - Cliente Redis e Store Concreto\|Cliente Redis e Store Concreto]] — `internal/redis`, `internal/redis/ratelimit` | ⬜ Planejado |
| 4 | [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/04 - Config e Montagem Final\|Config e Montagem Final]] — `RedisURL`, wiring em `main.go` | ⬜ Planejado |

Escopo desta leva: só o limitador global (IP, 100 req/60s). Os três limitadores por rota do TS (magic-link send/consume, avatar upload) ficam pra quando as rotas de auth/users forem portadas — a camada de domínio já nasce genérica o bastante pra suportar isso sem retrabalho, ver [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]].

## Nada tem prazo

Esse roadmap existe pra saber "onde parei" caso o trabalho fique pausado por um tempo — não é uma cobrança de ritmo. Se decidir parar depois da etapa 3 e nunca voltar, o aprendizado até ali já valeu.

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] · [[Plans/Feature Plans/Port para Go/05 - Módulo Rate Limit/_Index|Módulo Rate Limit]] ▶
