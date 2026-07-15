---
title: "Módulo Seed — Montagem Final (main.go)"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, seed, clean-architecture]
up: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord]]"
next: "[[Plans/Feature Plans/Port para Go/04 - Roadmap e Status]]"
related: []
depth: 3
---

# 🔧 Módulo Seed — Montagem Final (main.go)

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] › **Montagem Final**

---

## `cmd/seed/bible/main.go` — a única peça que conhece tudo

Esse é o único arquivo do módulo que importa `internal/postgres/bible`, `internal/discord/webhook`, `internal/remote-log` **e** `internal/taskrun` ao mesmo tempo — é a "raiz de composição" (*composition root*): o lugar cuja única responsabilidade é decidir **quais implementações concretas** entram em cada interface, e injetar isso em quem só conhece a interface (`seed.go`, que só fala com `*bible.BibleService` e `*taskrun.Run`, ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência|página 3]] e [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|página 4]]).

Carrega `POSTGRES_URL` e `DISCORD_WEBHOOK_URL` do `.env` sem depender de `internal/config.Config` (esse struct também serve o `cmd/api`, que não deve exigir uma env var que só o seed usa).

```go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/discord/webhook"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres"
	postgres_bible "github.com/eduardoaugustolb/versum/apps/api-go/internal/postgres/bible"
	remotelog "github.com/eduardoaugustolb/versum/apps/api-go/internal/remote-log"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/taskrun"
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
	db, err := postgres.New(ctx, postgresURL)
	if err != nil {
		log.Fatalf("erro ao criar pool do Postgres: %v", err)
	}
	defer db.Close()

	// --- bible module: domain + repository (Postgres) + service ---
	bookRepo := postgres_bible.NewBookRepository(db.Pool)
	chapterRepo := postgres_bible.NewChapterRepository(db.Pool, bookRepo)
	verseRepo := postgres_bible.NewVerseRepository(db.Pool, chapterRepo)
	bibleService := bible.NewBibleService(bookRepo, chapterRepo, verseRepo)

	// --- discord/webhook: raw client + adapter for remote-log ---
	webhookClient := webhook.NewClient(discordWebhookURL, &http.Client{})
	discordLogs := webhook.NewRemoteLogRepository(webhookClient)

	// --- remote-log module: domain + service, built on top of the adapter above ---
	logService := remotelog.NewService(discordLogs)

	// --- taskrun: the "long task reporting progress" pattern, decoupled
	// from remote-log itself — logService satisfies taskrun.Notifier
	// implicitly, no adapter code needed ---
	run := taskrun.New(logService, "seed-bible")

	if err := runSeed(ctx, bibleService, run); err != nil {
		log.Fatalf("seed falhou: %v", err)
	}
}
```

Repare a simetria com `cmd/api/main.go`: os dois montam `bookRepo`/`chapterRepo`/`verseRepo`/`bibleService` exatamente do mesmo jeito — é o mesmo módulo Bible, reaproveitado sem alteração nenhuma. A única coisa que muda de um binário pro outro é o que cada um faz com o `bibleService` depois de montado (`cmd/api` registra rotas HTTP; `cmd/seed` chama `runSeed`).

Repare também a cadeia explícita: `webhook.NewClient` monta o cliente HTTP puro do Webhook do Discord; `webhook.NewRemoteLogRepository` embrulha esse cliente numa implementação de `remotelog.Publisher`/`remotelog.Editor`; `remotelog.NewService` embrulha isso numa API de log; `taskrun.New` embrulha isso no padrão de "tarefa longa". Cada `New*` diz exatamente o que constrói — nenhuma peça se chama só "Repository" ou só "discord" de um jeito que esconda o que ela realmente é. `*remotelog.Service` satisfaz `taskrun.Notifier` implicitamente (tem `Notify`/`Update` com a assinatura certa) — esse é o único ponto onde "implícito" continua sendo o comportamento certo, porque é assim que interfaces funcionam em Go (ver [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]]); a diferença é que agora não tem mais nenhuma suposição escondida sobre *capacidade* (editável ou não) por trás disso.

## Execução

```
cd apps/api-go
go run ./cmd/seed/bible
```

Sem menu, sem confirmação, sem seleção de etapas — a execução do comando já é a confirmação. Sempre insere livros, capítulos e versículos juntos (default do multiselect do TS, ver decisão em [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|índice do módulo]]).

## Estrutura de pastas final do módulo

```
apps/api-go/
  cmd/seed/bible/
    main.go              → raiz de composição (só aqui)
    books.go               → fonte de dados do seed (73 abreviações), não é domínio bible
    fetcher.go              → download concorrente do biblia-db
    normalize.go              → parse do JSON bruto do biblia-db
    integrity-check.go         → valida resultado do fetch
    seed.go                     → orquestração do caso de uso (processBook, runSeed) — só fala com bible.BibleService e taskrun.Run
  internal/
    bible/                  → domínio + repository (interface) + service (já existia, reaproveitado 100%)
    postgres/
      database.go            → conexão (já existia)
      bible/                  → repository (implementação Postgres, já existia, reaproveitado 100%)
    remote-log/               → domínio: Publisher (obrigatório) + Editor (opcional) + Service (novo)
    taskrun/                    → o padrão "tarefa longa reportando progresso" — usa remote-log, não faz parte dele (novo)
    discord/
      embed.go                   → vocabulário puro do Discord (Embed, cores, limites) — sem HTTP, sem remote-log (novo)
      webhook/
        client.go                  → cliente HTTP explícito da API de Webhook do Discord — sem remote-log (novo)
        remotelog_repository.go     → adapter: remote-log ⇄ webhook.Client (novo, substitui internal/discord/remote-log/)
    idgen/                            → geração de UUID v4 (já existia como internal/id-gen/, só renomeia a pasta)
```

Nenhum arquivo dentro de `cmd/seed/bible/` importa `internal/postgres/bible` ou `internal/discord/...` diretamente, exceto `main.go`. Nenhum arquivo dentro de `internal/remote-log/` sabe que `internal/taskrun/` existe. Nenhum arquivo dentro de `internal/discord/embed.go` sabe que `remotelog` existe. A dependência sempre vai numa única direção: `taskrun` → `remote-log` ← `webhook` → `discord`. É essa regra — raiz de composição conhece tudo, cada pacote de domínio/adapter conhece só o que está imediatamente abaixo dele — que resolve os travamentos anteriores: a lógica de "como enviar pro Discord" não vaza pra dentro de `seed.go`; a lógica de "como o seed quer usar o log" não vaza pra dentro de `remote-log`; e a lógica de "isso é especificamente um webhook" não fica escondida atrás de um nome de pacote genérico demais.

## Checklist de fechamento da migração

- [ ] `internal/remote-log/{log,publisher,editor,service}.go` — ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|checklist da página 4]]
- [ ] `internal/taskrun/run.go` — ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|checklist da página 4]]
- [ ] `internal/discord/embed.go` — ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|checklist da página 4]]
- [ ] `internal/discord/webhook/{client,remotelog_repository}.go` — ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|checklist da página 4]]
- [ ] `cmd/seed/bible/seed.go` — ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência|página 3]]
- [ ] `cmd/seed/bible/main.go` — wiring acima
- [ ] Apagar qualquer `internal/discord/repository.go`, `internal/discord/remote-log/` ou `internal/remote-log/session.go`/`repository.go` de rodadas anteriores desta página
- [ ] Renomear `internal/id-gen/` → `internal/idgen/` (dir bate com o nome do `package`, ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência|página 3]])
- [ ] `go build ./...` limpo
- [ ] `go mod tidy` — remove dependências não usadas, promove `golang.org/x/sync` de indireto pra direto
- [ ] Rodar `go run ./cmd/seed/bible` contra um Postgres local com as tabelas `bible_books`/`bible_chapters`/`bible_verses` vazias — confirmar que os 73 livros, capítulos e versículos aparecem, e que rodar de novo não duplica nada
- [ ] Confirmar que a mensagem no canal do Discord aparece e é editada durante a execução, com o resumo final correto
- [ ] Só depois de validar o Go: apagar `apps/api/src/cli/modules/bible/seed/` inteiro, a parte não usada de `bible-json-normalize.ts`, e remover a opção "Seed" de `bible.action.ts`. **Não apagar o TS antes do Go estar validado rodando contra um banco de verdade.**

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|Log no Discord]] · 🌱 [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] · [[Plans/Feature Plans/Port para Go/04 - Roadmap e Status|Roadmap e Status]] ▶
