package main

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

type normalizedVerse struct {
	Number int
	Text   string
}

type normalizedChapter struct {
	Number int
	Verses []normalizedVerse
}

type normalizedBook struct {
	Name         string
	Abbreviation string
	Order        int
	Chapters     []normalizedChapter
}

type rawBibleBookDB struct {
	BookName string `json:"livro"`
	Chapters []struct {
		Number int `json:"capitulo"`
		Verses []struct {
			Number int    `json:"numero"`
			Text   string `json:"texto"`
		} `json:"versiculos"`
	} `json:"capitulos"`
}

var verseNumberPrefix = regexp.MustCompile(`^\[\d+\]\s*`)

func stripVerseNumberPrefix(text string) string {
	return verseNumberPrefix.ReplaceAllString(text, "")
}

func normalizeBibleBookDB(raw []byte, entry bibleBookEntry, index int) (normalizedBook, error) {
	var parsed rawBibleBookDB
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return normalizedBook{}, fmt.Errorf("livro %q: JSON inválido: %w", entry.Abbreviation, err)
	}

	if parsed.BookName == "" || len(parsed.Chapters) == 0 {
		return normalizedBook{}, fmt.Errorf(
			"livro %q: JSON inválido — esperado {livro, capitulos: [...]}", entry.Abbreviation,
		)
	}

	chapters := make([]normalizedChapter, 0, len(parsed.Chapters))
	for _, chapter := range parsed.Chapters {
		verses := make([]normalizedVerse, 0, len(chapter.Verses))
		for _, verse := range chapter.Verses {
			verses = append(verses, normalizedVerse{
				Number: verse.Number,
				Text:   strings.TrimSpace(stripVerseNumberPrefix(verse.Text)),
			})
		}
		chapters = append(chapters, normalizedChapter{
			Number: chapter.Number,
			Verses: verses,
		})
	}

	return normalizedBook{
		Name:         parsed.BookName,
		Abbreviation: entry.Abbreviation,
		Order:        index + 1,
		Chapters:     chapters,
	}, nil
}
