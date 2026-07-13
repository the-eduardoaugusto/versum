package main

import (
	"context"
	"errors"
	"fmt"
	"strings"
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

func joinLines(lines []string) string {
	return strings.Join(lines, "\n")
}
