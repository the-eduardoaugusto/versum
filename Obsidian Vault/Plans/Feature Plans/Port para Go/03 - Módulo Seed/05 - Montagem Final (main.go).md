---
title: "Módulo Seed — Montagem Final (main.go)"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, seed]
up: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord]]"
next: "[[Plans/Feature Plans/Port para Go/04 - Roadmap e Status]]"
related: []
depth: 3
---

# 🔧 Módulo Seed — Montagem Final (main.go)

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] › **Montagem Final**

---

## `cmd/seed/bible/main.go`

Carrega `POSTGRES_URL` e `DISCORD_WEBHOOK_URL` do `.env` (mesmo arquivo `apps/api-go/.env` que o `cmd/api` usa — só que o seed lê só as duas env vars que precisa, sem depender de `internal/config.Config`, ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|página anterior]]), abre o pool do Postgres, monta os três repositories já existentes de `internal/postgres/bible` (nenhum código novo ali — são os mesmos usados pelo `cmd/api`) e chama `runSeed`.

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	postgres_bible "github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres/bible"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func loadSeedEnv() (postgresURL, discordWebhookURL string, err error) {
	if loadErr := godotenv.Load(); loadErr != nil {
		return "", "", fmt.Errorf("carregando .env: %w", loadErr)
	}

	var missing []string
	postgresURL, ok := os.LookupEnv("POSTGRES_URL")
	if !ok {
		missing = append(missing, "POSTGRES_URL")
	}
	discordWebhookURL, ok = os.LookupEnv("DISCORD_WEBHOOK_URL")
	if !ok {
		missing = append(missing, "DISCORD_WEBHOOK_URL")
	}
	if len(missing) > 0 {
		return "", "", fmt.Errorf("faltando env vars: %v", missing)
	}

	return postgresURL, discordWebhookURL, nil
}

func main() {
	postgresURL, discordWebhookURL, err := loadSeedEnv()
	if err != nil {
		log.Fatalf("erro ao carregar configuração: %v", err)
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, postgresURL)
	if err != nil {
		log.Fatalf("erro ao criar pool do Postgres: %v", err)
	}
	defer pool.Close()

	bookRepo := postgres_bible.NewBookRepository(pool)
	chapterRepo := postgres_bible.NewChapterRepository(pool, bookRepo)
	verseRepo := postgres_bible.NewVerseRepository(pool, chapterRepo)

	deps := seedDeps{
		Books:    bookRepo,
		Chapters: chapterRepo,
		Verses:   verseRepo,
		Discord:  newDiscordLogger(discordWebhookURL),
	}

	if err := runSeed(ctx, deps); err != nil {
		log.Fatalf("seed falhou: %v", err)
	}
}
```

## Execução

```
cd apps/api-go
go run ./cmd/seed/bible
```

Sem menu, sem confirmação, sem seleção de etapas — a execução do comando já é a confirmação. Sempre insere livros, capítulos e versículos juntos (default do multiselect do TS, ver decisão em [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|índice do módulo]]).

## Checklist de fechamento da migração

- [ ] `go build ./...` limpo com os arquivos novos (`books.go`, `normalize.go`, `fetch.go`, `discord.go`, `seed.go`, `main.go`, `internal/idgen/uuid.go`).
- [ ] `rm -r cmd/seed/bible/github-raw` — pasta com `Slugfy` sem uso (ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/01 - Livros e Normalização|página 1]]).
- [ ] `go mod tidy` — remove `golang.org/x/text` do `go.mod` (só era usado pelo `github-raw`) e promove `golang.org/x/sync` de indireto pra direto.
- [ ] Rodar `go run ./cmd/seed/bible` contra um Postgres local com as tabelas `bible_books`/`bible_chapters`/`bible_verses` vazias — confirmar que os 73 livros, capítulos e versículos aparecem, e que rodar de novo não duplica nada (idempotência via `FindBookByDynamicID`/`ON CONFLICT DO NOTHING`).
- [ ] Confirmar que a mensagem no canal do Discord aparece e é editada durante a execução, com o resumo final correto.
- [ ] Só depois de validar o Go: apagar `apps/api/src/cli/modules/bible/seed/` (`seed.action.ts`, `seed.menus.ts`, `bible-books.constants.ts`, `bible-fetcher.ts`, `bible-fetcher.test.ts`), a parte não usada de `bible-json-normalize.ts` (ou o arquivo inteiro, se `normalizeLivroBibliaDB`/`normalizeBookKey` não tiverem mais chamador nenhum fora do CLI), e remover a opção "Seed" de `bible.action.ts`/`bible.menu.ts`. **Não apagar o TS antes do Go estar validado rodando contra um banco de verdade** — é a única cópia funcional até lá.

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|Log no Discord]] · 🌱 [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] · [[Plans/Feature Plans/Port para Go/04 - Roadmap e Status|Roadmap e Status]] ▶
