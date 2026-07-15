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

## Estrutura de pastas (destino, com as 3 camadas de cada módulo)

```
apps/api-go/
  cmd/
    api/main.go               → raiz de composição do servidor HTTP (já existia)
    seed/bible/
      main.go                  → raiz de composição do seed — só aqui conhece implementações concretas
      books.go                  → fonte de dados do seed (73 abreviações) — não é domínio bible
      fetcher.go                 → download concorrente do biblia-db
      normalize.go                → parse do JSON bruto do biblia-db
      integrity-check.go           → valida resultado do fetch
      seed.go                       → orquestração (processBook, runSeed) — só fala com bible.BibleService e taskrun.Run
  internal/
    bible/                       → domínio + repository (interface) + service (já existia, reaproveitado 100% no seed)
    postgres/
      database.go                 → conexão (já existia)
      bible/                       → repository (implementação Postgres, já existia, reaproveitado 100%)
    remote-log/                   → domínio: Publisher (obrigatório) + Editor (capacidade opcional) + Service (novo)
      log.go, publisher.go, editor.go, service.go
    taskrun/                       → o padrão "tarefa longa reportando progresso" — usa remote-log, não é remote-log (novo)
      run.go
    discord/
      embed.go                      → vocabulário puro do Discord (Embed, cores, limites) — sem HTTP, sem remote-log (novo)
      webhook/                        → transporte específico de webhook — explícito no nome, não escondido atrás de "discord" (novo)
        client.go, remotelog_repository.go
    idgen/                              → geração de UUID v4 sem dependência externa (crypto/rand)
```

Cada módulo segue as mesmas camadas gerais: **domínio** (`remote-log`: `Publisher`/`Editor`/`Service`; `bible`: idem) → **adapter concreto** (`discord/webhook`, `postgres/bible` — só sabe falar com uma tecnologia específica) → **service** (decide "o que fazer": gerar ID, mapear capacidade). Duas diferenças em relação à primeira versão desta página, as duas motivadas pela mesma crítica (ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|página 4]] pro relato completo):

- `internal/taskrun` fica **ao lado** de `remote-log`, não dentro — "uma mensagem só, editada repetidamente" é uma decisão de uso, não uma verdade sobre "publicar log".
- `internal/discord` virou dois níveis: `discord/` é só o vocabulário (Embed, cores, limites), `discord/webhook/` é o transporte — explícito no nome que é especificamente webhook, deixando espaço pra um `discord/bot/` futuro sem mexer em nada existente. E `remote-log.Editor` é uma interface separada de `Publisher`, porque nem todo canal remoto suporta editar mensagem — só quem suporta (como o webhook do Discord) implementa as duas.

`cmd/seed/bible/seed.go` só importa `bible` e `taskrun` — nunca `postgres/bible`, `discord/webhook` nem `remote-log` diretamente. Só `main.go` conhece todos os lados.

`cmd/seed/bible/github-raw/json-normalize.go` (o `Slugfy` que existia sem uso) já foi **removido** — ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/01 - Livros e Normalização|Livros e Normalização]] pro motivo.

## As camadas, em ordem de execução

| # | Etapa | Página | Depende de |
|:--|:--|:--|:--|
| 1 | Constantes + normalização do JSON do `biblia-db` | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/01 - Livros e Normalização\|Livros e Normalização]] ✅ | nada (é a base) |
| 2 | Download concorrente dos 73 livros + checagem de integridade | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check\|Fetch Concorrente e Integrity Check]] ✅ | Etapa 1 |
| 3 | Orquestração (`seed.go`) chamando `bible.BibleService` (ID + persistência já ficam dentro do service) | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência\|Geração de ID e Persistência]] ⬜ | Etapa 2, `internal/bible` (já pronto) |
| 4 | Domínio de log genérico (`remote-log`) + padrão de tarefa longa (`taskrun`) + adapter (`discord`) | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord\|Log no Discord]] ⬜ | nenhuma (paralelo às demais — é usado por `seed.go`, não depende dele) |
| 5 | `main.go` — raiz de composição, monta tudo | [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/05 - Montagem Final (main.go)\|Montagem Final]] ⬜ | todas as anteriores |

## Decisões tomadas pra essa migração

- **Sem flags, sem confirmação.** `go run cmd/seed/bible/main.go` sempre insere livros + capítulos + versículos — decisão tomada junto com o usuário: o multiselect do TS nunca foi usado pra rodar parcial na prática, e sem CLI não tem onde colocar esse menu sem reintroduzir a abstração que estamos tirando.
- **Discord webhook mantido**, mesmo comportamento (mensagem única editada durante a execução), mas repensado em camadas explícitas: `remote-log` (genérico, `Publisher` obrigatório + `Editor` opcional) + `taskrun` (o padrão "mensagem única editada repetidamente", que é uma decisão de uso, não uma verdade sobre log) + `discord/webhook` (transporte nomeado pelo que é, não escondido atrás de "discord" genérico) — ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|página 4]].
- **Camada de Service é obrigatória em todo módulo, mesmo os pequenos** — e não basta ter Service: o que está *dentro* dele também precisa ser genérico de verdade, e isso levou três rodadas de correção no `remote-log`: (1) criar o Service que faltava — antes o repository decidia cor de embed e buffer ao mesmo tempo; (2) perceber que o Service criado (`Session`) ainda vinha desenhado em função do seed — número mágico do limite do Discord, rótulos fixos em português — mesmo injetado corretamente por interface; (3) perceber que a interface em si (`Repository.Edit` obrigatório pra todo canal) escondia uma suposição — nem todo canal remoto suporta editar mensagem — e que "discord" como nome de pacote escondia que só webhook estava implementado. **Acoplamento de dependência (quem importa o quê), acoplamento de implementação (o que o código atrás da interface sabe fazer) e capacidade assumida implicitamente pela própria interface são três problemas diferentes; resolver um não resolve os outros.** Ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|página 4]] pro relato completo.
- **`cmd/` é raiz de composição — só ele conhece implementações concretas.** `seed.go` fala só com `*bible.BibleService` e `*taskrun.Run` (interfaces/services); `postgres_bible.BookRepository`, `webhook.Client`/`webhook.RemoteLogRepository` e `remotelog.Service` só aparecem em `main.go`, na hora de montar tudo.
- **IDs gerados na camada de Service, não no `cmd/`.** Já resolvido: `BibleService.CreateBook`/`CreateChapter`/`CreateVerse(s)` geram o `ID` via `internal/idgen` antes de chamar o repository — o `cmd/seed` nunca importa `idgen` diretamente. Ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência|página 3]].
- **Reaproveita o módulo Bible inteiro.** Nenhum SQL novo, nenhuma mudança em `internal/bible` ou `internal/postgres/bible` — o seed só chama a API pública que já existe.

## Correspondência com o CLI original (TypeScript)

| TypeScript | Go | Observação |
|:--|:--|:--|
| `cli/modules/bible/bible.action.ts` (menu + confirmação) | *(removido)* | Sem CLI: `go run` já é a confirmação |
| `cli/modules/bible/seed/seed.menus.ts` | *(removido)* | Sem multiselect: sempre roda tudo |
| `cli/modules/bible/seed/bible-books.constants.ts` | `cmd/seed/bible/books.go` ✅ | Mesma lista de 73 abreviações, mesma ordem canônica |
| `cli/modules/bible/bible-json-normalize.ts` (só a parte usada) | `cmd/seed/bible/normalize.go` ✅ | Sem os formatos mortos, sem `niceName`/`group_start`/`group_end` |
| `cli/modules/bible/seed/bible-fetcher.ts` | `cmd/seed/bible/fetcher.go` + `integrity-check.go` ✅ | `Promise.all` vira `errgroup.Group` (ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check\|página 2]]) |
| — (nada equivalente: TS não tinha domínio de log genérico, era tudo ad-hoc em `seed.action.ts`) | `internal/remote-log/` ⬜ | Novo: `Publisher` obrigatório + `Editor` opcional + `Service` — nada específico de tarefa longa nem de Discord |
| `seed.action.ts` (`messageId`, `logs[]`, `addLog` — o estado de "uma mensagem sendo editada") | `internal/taskrun/` ⬜ | Novo: reutilizável por qualquer tarefa de fundo, não só o seed — não faz parte de `remote-log` |
| — (TS não separava "vocabulário do Discord" de "como falar com ele") | `internal/discord/embed.go` ⬜ | Novo: `Embed`/`EmbedField`/cores — sem HTTP, sem saber que `remote-log` existe |
| `seed.action.ts` (`updateDiscordMessage`) | `internal/discord/webhook/` ⬜ | Novo: `Client` (API de Webhook pura) + `RemoteLogRepository` (adapter pro `remote-log`) — inclusive o truncamento pro limite de embed |
| `cli/modules/bible/seed/seed.action.ts` (`processBook`, `seedBibleFromRemote`) | `cmd/seed/bible/seed.go` ⬜ | Usa `db.insert(...).returning()` do Drizzle → usa `BibleService.CreateBook/CreateChapter/CreateVerses` |
| *(nada — Drizzle usa `.returning()` do `INSERT`)* | `internal/idgen/` ✅ (dentro de `BibleService`) | Go precisa gerar o `id` antes de inserir |

---

◀ [[Plans/Feature Plans/Port para Go/02 - Módulo Bible/_Index|Módulo Bible]] · [[Plans/Feature Plans/Port para Go/04 - Roadmap e Status|Roadmap e Status]] ▶
