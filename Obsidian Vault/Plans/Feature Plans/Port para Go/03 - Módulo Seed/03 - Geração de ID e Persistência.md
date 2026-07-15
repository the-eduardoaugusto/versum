---
title: "Módulo Seed — Geração de ID e Persistência"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, seed, clean-architecture]
up: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check]]"
next: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord]]"
related: []
depth: 3
---

# 🗂️ Módulo Seed — Geração de ID e Persistência

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] › **Geração de ID e Persistência**

---

> **Atualização:** esta página mudou depois da implementação real. O `id-gen` e a geração de ID já foram parar no lugar certo — o `BibleService`, não o `cmd/seed` — sem precisar de planejamento adicional. O que faltava era clareza sobre **quem chama o quê**: o `seed.go` não deve falar com `BookRepository`/`ChapterRepository`/`VerseRepository` diretamente, só com o `BibleService`. Essa página documenta o estado atual e fecha esse ponto.

## Por que precisa gerar ID no Go

A migration (`db/migrations/000001_create-bible-tables.up.sql`) não tem `DEFAULT` na coluna `id varchar(36)` — diferente do Drizzle no TS, que decide o `id` via `.returning()`. Em Go, quem gera o ID é a camada de aplicação, antes de persistir.

## Onde o ID já é gerado: `BibleService`, não o seed

Isso já está resolvido no código (`internal/bible/service.go`), e do jeito certo: `BibleService.CreateBook`/`CreateChapter`/`CreateVerse`/`CreateVerses` recebem um `RawBook`/`RawChapter`/`RawVerse` (o dado ainda **sem** ID — struct embutida em `Book`/`Chapter`/`Verse`, ver `internal/bible/book.go`), geram o `ID` com `internal/id-gen` (pacote `idgen`) e só então chamam o repository:

```go
// internal/bible/service.go (already exists)
func (s *BibleService) CreateBook(ctx context.Context, b RawBook) (*Book, error) {
	book := &Book{ID: idgen.New(), RawBook: b}
	return s.books.CreateBook(ctx, book)
}
```

Isso é exatamente a divisão de responsabilidade que faltava no módulo do Discord (ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|próxima página]]): **o Service decide o que persistir e como montar a entidade** (aqui, "gerar um ID novo"); **o Repository só sabe fazer `INSERT`/`SELECT`**, sem tomar nenhuma decisão de negócio. `BookRepository.CreateBook` nunca gera ID sozinho, nunca decide nada — só recebe um `*Book` já completo e grava.

> Pequeno ajuste de nomenclatura de pacote pra manter consistência: o diretório está como `internal/id-gen/` mas a declaração dentro do arquivo é `package idgen` (sem hífen). Go não proíbe isso — quem importa usa o nome do `package`, não o nome da pasta — mas deixa confuso pra quem for procurar o arquivo pelo nome do pacote. Renomear a pasta pra `internal/idgen/` (sem hífen) deixa os dois iguais, sem mudar nenhuma linha de código que já importa `idgen "…/internal/id-gen"`.

## O que falta: `cmd/seed/bible/seed.go`

Essa é a parte que ainda não foi escrita. A regra: **`seed.go` não importa `bible.BookRepository`/`ChapterRepository`/`VerseRepository`, só `*bible.BibleService`.** O `cmd/` é a "raiz de composição" (quem monta as dependências concretas, ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/05 - Montagem Final (main.go)|página 5]]) — mas a *orquestração* do caso de uso (baixar → checar → criar) fala só com a API pública do service, do mesmo jeito que `internal/bible/handler.go` fala só com `BibleService`, nunca com os repositories.

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	remotelog "github.com/eduardoaugustolb/versum/apps/api-go/internal/remote-log"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/taskrun"
)

type seedCounters struct {
	Books    int
	Chapters int
	Verses   int
}

func processBook(ctx context.Context, service *bible.BibleService, run *taskrun.Run, book normalizedBook, testament bible.BookTestament, counters *seedCounters) error {
	fmt.Printf("📖 %s (%s) - %s\n", book.Name, book.Abbreviation, testament)

	existing, err := service.FindBookByDynamicID(ctx, book.Abbreviation)
	if err != nil && !errors.Is(err, bible.ErrBookNotFound) {
		return fmt.Errorf("buscando livro %q: %w", book.Abbreviation, err)
	}

	if existing != nil {
		run.Append(ctx, remotelog.LevelInfo, fmt.Sprintf("♻️ [%s] %s - já existe", testament, book.Name))
	} else {
		created, err := service.CreateBook(ctx, bible.RawBook{
			Order:        book.Order,
			Name:         book.Name,
			Abbreviation: book.Abbreviation,
			Testament:    testament,
		})
		if err != nil && !errors.Is(err, bible.ErrBookAlreadyExists) {
			return fmt.Errorf("criando livro %q: %w", book.Abbreviation, err)
		}
		if created != nil {
			existing = created
			counters.Books++
			run.Append(ctx, remotelog.LevelInfo, fmt.Sprintf(
				"📖 [%s] %s (%s) - %d caps", testament, book.Name, book.Abbreviation, len(book.Chapters),
			))
		}
	}

	if existing == nil {
		run.Append(ctx, remotelog.LevelAlert, fmt.Sprintf("❌ Livro não encontrado após tentativa de inserção: %s", book.Name))
		return nil
	}

	for _, chapterData := range book.Chapters {
		chapter, err := service.FindChapterByNumberAndBookDynamicID(ctx, chapterData.Number, book.Abbreviation)
		if err != nil && !errors.Is(err, bible.ErrChapterNotFound) {
			return fmt.Errorf("buscando capítulo %d de %q: %w", chapterData.Number, book.Abbreviation, err)
		}

		if chapter == nil {
			created, err := service.CreateChapter(ctx, bible.RawChapter{
				BookID: existing.ID,
				Number: chapterData.Number,
			})
			if err != nil && !errors.Is(err, bible.ErrChapterAlreadyExists) {
				return fmt.Errorf("criando capítulo %d de %q: %w", chapterData.Number, book.Abbreviation, err)
			}
			chapter = created
			if chapter != nil {
				counters.Chapters++
			}
		}

		if chapter == nil {
			continue
		}

		rawVerses := make([]bible.RawVerse, 0, len(chapterData.Verses))
		for _, v := range chapterData.Verses {
			rawVerses = append(rawVerses, bible.RawVerse{
				ChapterID: chapter.ID,
				Number:    v.Number,
				Text:      v.Text,
			})
		}

		if len(rawVerses) == 0 {
			continue
		}

		_, inserted, err := service.CreateVerses(ctx, rawVerses)
		if err != nil && !errors.Is(err, bible.ErrVerseAlreadyExists) {
			return fmt.Errorf("criando versículos do capítulo %d de %q: %w", chapterData.Number, book.Abbreviation, err)
		}
		counters.Verses += inserted
	}

	return nil
}

func runSeed(ctx context.Context, service *bible.BibleService, run *taskrun.Run) error {
	startedAt := time.Now()
	run.Start(ctx)

	fmt.Printf("⬇️  Baixando %d livros do GitHub...\n", len(bibleBooks))
	run.Append(ctx, remotelog.LevelInfo, fmt.Sprintf("⬇️  Baixando %d livros do GitHub...", len(bibleBooks)))

	results := fetchAllBibleBooks(ctx)
	passed, integrityErrs := integrityCheck(results)
	if !passed {
		msg := fmt.Sprintf("❌ INTEGRITY CHECK FALHOU:\n%s", joinLines(integrityErrs))
		run.Finish(ctx, remotelog.LevelError, msg, summaryMeta(startedAt, true))
		return errors.New(msg)
	}

	okCount := 0
	for _, r := range results {
		if r.ok {
			okCount++
		}
	}
	run.Append(ctx, remotelog.LevelInfo, fmt.Sprintf("✅ Integrity OK — %d livros recebidos", okCount))

	counters := &seedCounters{}
	run.Append(ctx, remotelog.LevelInfo, "📜 Processando livros...")

	for _, r := range results {
		if err := processBook(ctx, service, run, r.book, r.testament, counters); err != nil {
			run.Finish(ctx, remotelog.LevelError, fmt.Sprintf("❌ ERRO: %v", err), summaryMeta(startedAt, true))
			return err
		}
	}

	run.Append(ctx, remotelog.LevelInfo, "🎉 FINALIZADO!")
	run.Finish(ctx, remotelog.LevelSuccess, fmt.Sprintf(
		"📊 Livros: %d | Capítulos: %d | Versículos: %d", counters.Books, counters.Chapters, counters.Verses,
	), summaryMeta(startedAt, false))
	fmt.Println("✅ FINALIZADO")

	return nil
}

// summaryMeta is the seed's own choice of what to show in the final
// Discord embed — taskrun.Run doesn't know these field names exist.
func summaryMeta(startedAt time.Time, hasError bool) []remotelog.MetaField {
	errValue := "Não"
	if hasError {
		errValue = "Sim"
	}
	return []remotelog.MetaField{
		{Key: "Começou em", Value: startedAt.Format("02/01/2006 - 15h04")},
		{Key: "Terminou em", Value: time.Now().Format("02/01/2006 - 15h04")},
		{Key: "Houve erros?", Value: errValue},
	}
}
```

`joinLines` é um helper trivial (`strings.Join(errs, "\n")`) — declarado junto de `seed.go` mesmo, não merece arquivo próprio.

Repare a diferença de responsabilidade em relação à primeira versão desta página: `run.Finish` não sabe mais o que é `"Começou em"` — é `summaryMeta`, uma função do próprio `seed.go`, que decide isso. `seed.go` não sabe nada sobre Discord, embed, webhook, cor ou limite de caracteres — só chama `run.Append`/`run.Start`/`run.Finish`, métodos de `*taskrun.Run` (ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|próxima página]]). Se amanhã o log de progresso for pra Slack em vez de Discord, `seed.go` não muda uma linha — só troca o que é injetado no `main.go`. E se amanhã o resumo final quiser um campo a mais, é `summaryMeta` que muda — nunca `taskrun`.

### Diferença de comportamento a documentar: contagem de versículos

O TS conta versículos **antes** e **depois** do insert (`beforeCount`/`afterCount`), porque `onConflictDoNothing()` do Drizzle não informa quantas linhas afetou. Em Go, `VerseRepository.CreateVerses` já devolve `inserted int` (linhas que o `RETURNING` do batch trouxe de volta — as que bateram em conflito não aparecem). Resultado observável é o mesmo, só o caminho é mais direto.

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check|Fetch Concorrente e Integrity Check]] · [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|Log no Discord]] ▶
