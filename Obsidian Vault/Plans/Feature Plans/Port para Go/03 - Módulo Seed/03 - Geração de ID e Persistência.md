---
title: "Módulo Seed — Geração de ID e Persistência"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, seed]
up: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check]]"
next: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord]]"
related: []
depth: 3
---

# 🗂️ Módulo Seed — Geração de ID e Persistência

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] › **Geração de ID e Persistência**

---

## Por que precisa gerar ID no Go

No TS, `db.insert(bibleBooks).values({...}).returning()` deixa o Postgres/Drizzle decidir o `id` (schema Drizzle com `.$defaultFn(() => crypto.randomUUID())` ou similar) e devolve a linha completa. Em Go não tem ORM — e a migration (`db/migrations/000001_create-bible-tables.up.sql`) não tem `DEFAULT` nenhum na coluna `id varchar(36)`. Os métodos já existentes `BookRepository.CreateBook`, `ChapterRepository.CreateChapter` e `VerseRepository.CreateVerse(s)` (`internal/postgres/bible/*.go`) já assumem isso: recebem um `*bible.Book`/`*bible.Chapter`/`*bible.Verse` com `ID` **já preenchido**. O seed é o primeiro lugar do projeto Go que precisa gerar esse ID.

## `internal/idgen/uuid.go` — UUID v4 sem dependência externa

Consistente com a decisão de "sem ORM, sem lib escondendo o fundamento" já tomada pro resto do port ([[Plans/Feature Plans/Port para Go/00 - Contexto e Objetivo|Contexto e Objetivo]]): em vez de importar `google/uuid`, um UUID v4 é só 16 bytes aleatórios com 2 bits fixados por especificação (RFC 4122) — dá pra gerar com `crypto/rand` da própria `stdlib`.

```go
package idgen

import (
	"crypto/rand"
	"fmt"
)

// New gera um UUID v4 (aleatório), formatado como
// "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".
func New() string {
	var b [16]byte
	// crypto/rand.Read só falha se o SO não tiver fonte de entropia
	// disponível — praticamente nunca acontece em produção, mas o erro
	// não pode ser silenciado: panic é aceitável aqui porque não há
	// como continuar sem um ID válido.
	if _, err := rand.Read(b[:]); err != nil {
		panic(fmt.Sprintf("idgen: falha ao ler bytes aleatórios: %v", err))
	}

	b[6] = (b[6] & 0x0f) | 0x40 // versão 4
	b[8] = (b[8] & 0x3f) | 0x80 // variante RFC 4122

	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
```

## `seed.go` — `processBook` e `Run`

Porta de `processBook` + `seedBibleFromRemote` do TS. A diferença estrutural principal: o TS consulta `existingBooks` (um slice carregado uma vez no início) e também faz `select count(*)` antes/depois de inserir versículos pra saber quantos foram realmente inseridos (por causa do `onConflictDoNothing`). Em Go, como os repositories já devolvem `bible.ErrBookAlreadyExists`/`ErrChapterAlreadyExists`/`ErrVerseAlreadyExists` quando o `ON CONFLICT (id) DO NOTHING` não insere nada, o "já existe?" é resolvido tentando buscar primeiro (mesma estratégia do TS: busca, se não achou, cria) — sem precisar carregar a tabela inteira em memória.

```go
package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	"github.com/eduardoaugustolb/versum/apps/api-go/internal/idgen"
)

type seedCounters struct {
	Books    int
	Chapters int
	Verses   int
}

type seedDeps struct {
	Books    bible.BookRepository
	Chapters bible.ChapterRepository
	Verses   bible.VerseRepository
	Discord  *discordLogger
}

func processBook(ctx context.Context, deps seedDeps, book normalizedBook, testament bible.BookTestament, counters *seedCounters) error {
	fmt.Printf("📖 %s (%s) - %s\n", book.Name, book.Slug, testament)

	existing, err := deps.Books.FindBookByDynamicID(ctx, book.Slug)
	if err != nil && !errors.Is(err, bible.ErrBookNotFound) {
		return fmt.Errorf("buscando livro %q: %w", book.Slug, err)
	}

	if existing != nil {
		deps.Discord.addLog(ctx, fmt.Sprintf("♻️ [%s] %s - já existe", testament, book.Name))
	} else {
		created, err := deps.Books.CreateBook(ctx, &bible.Book{
			ID:           idgen.New(),
			Order:        book.Order,
			Name:         book.Name,
			Abbreviation: book.Slug,
			Testament:    testament,
		})
		if err != nil && !errors.Is(err, bible.ErrBookAlreadyExists) {
			return fmt.Errorf("criando livro %q: %w", book.Slug, err)
		}
		if created != nil {
			existing = created
			counters.Books++
			deps.Discord.addLog(ctx, fmt.Sprintf(
				"📖 [%s] %s (%s) - %d caps", testament, book.Name, book.Slug, len(book.Chapters),
			))
		}
	}

	if existing == nil {
		deps.Discord.addLog(ctx, fmt.Sprintf("❌ Livro não encontrado após tentativa de inserção: %s", book.Name))
		return nil
	}

	for _, chapterData := range book.Chapters {
		chapter, err := deps.Chapters.FindChapterByNumberAndBookDynamicID(ctx, chapterData.Number, book.Slug)
		if err != nil && !errors.Is(err, bible.ErrChapterNotFound) {
			return fmt.Errorf("buscando capítulo %d de %q: %w", chapterData.Number, book.Slug, err)
		}

		if chapter == nil {
			created, err := deps.Chapters.CreateChapter(ctx, &bible.Chapter{
				ID:     idgen.New(),
				BookID: existing.ID,
				Number: chapterData.Number,
			})
			if err != nil && !errors.Is(err, bible.ErrChapterAlreadyExists) {
				return fmt.Errorf("criando capítulo %d de %q: %w", chapterData.Number, book.Slug, err)
			}
			chapter = created
			if chapter != nil {
				counters.Chapters++
			}
		}

		if chapter == nil {
			continue
		}

		verses := make([]*bible.Verse, 0, len(chapterData.Verses))
		for _, v := range chapterData.Verses {
			verses = append(verses, &bible.Verse{
				ID:        idgen.New(),
				ChapterID: chapter.ID,
				Number:    v.Number,
				Text:      v.Text,
			})
		}

		if len(verses) == 0 {
			continue
		}

		_, inserted, err := deps.Verses.CreateVerses(ctx, verses)
		if err != nil && !errors.Is(err, bible.ErrVerseAlreadyExists) {
			return fmt.Errorf("criando versículos do capítulo %d de %q: %w", chapterData.Number, book.Slug, err)
		}
		counters.Verses += inserted
	}

	return nil
}

func runSeed(ctx context.Context, deps seedDeps) error {
	deps.Discord.start(ctx)

	fmt.Printf("⬇️  Baixando %d livros do GitHub...\n", len(bibleBooks))
	deps.Discord.addLog(ctx, fmt.Sprintf("⬇️  Baixando %d livros do GitHub...", len(bibleBooks)))

	results := fetchAllBibleBooks(ctx)
	passed, integrityErrs := integrityCheck(results)
	if !passed {
		msg := fmt.Sprintf("❌ INTEGRITY CHECK FALHOU:\n%s", joinLines(integrityErrs))
		deps.Discord.finish(ctx, true, msg)
		return errors.New(msg)
	}

	okCount := 0
	for _, r := range results {
		if r.ok {
			okCount++
		}
	}
	deps.Discord.addLog(ctx, fmt.Sprintf("✅ Integrity OK — %d livros recebidos", okCount))

	counters := &seedCounters{}
	deps.Discord.addLog(ctx, "📜 Processando livros...")

	for _, r := range results {
		if err := processBook(ctx, deps, r.book, r.testament, counters); err != nil {
			deps.Discord.finish(ctx, true, fmt.Sprintf("❌ ERRO: %v", err))
			return err
		}
	}

	deps.Discord.addLog(ctx, "🎉 FINALIZADO!")
	deps.Discord.finish(ctx, false, fmt.Sprintf(
		"📊 Livros: %d | Capítulos: %d | Versículos: %d", counters.Books, counters.Chapters, counters.Verses,
	))
	fmt.Println("✅ FINALIZADO")

	return nil
}
```

`joinLines` é um helper trivial (`strings.Join(lines, "\n")`) — declarado junto de `seed.go` mesmo, não merece arquivo próprio.

### Diferença de comportamento a documentar: contagem de versículos

O TS conta versículos **antes** e **depois** do insert (`beforeCount`/`afterCount`) pra saber quantos entraram de fato, porque `onConflictDoNothing()` do Drizzle não informa quantas linhas afetou. Em Go, `VerseRepository.CreateVerses` já devolve `inserted int` (contagem de linhas que o `RETURNING` do batch realmente trouxe de volta — as que bateram em conflito não aparecem no resultado). Resultado observável é o mesmo (contagem de versículos novos), só o caminho pra chegar lá é mais direto.

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check|Fetch Concorrente e Integrity Check]] · [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/04 - Log no Discord|Log no Discord]] ▶
