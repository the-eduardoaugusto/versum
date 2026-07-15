---
title: "Módulo Seed — Livros e Normalização"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, seed]
up: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
next: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check]]"
related: []
depth: 3
---

# 📚 Módulo Seed — Livros e Normalização

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] › **Livros e Normalização**

---

## `books.go` — a lista dos 73 livros

Porta direta de `cli/modules/bible/seed/bible-books.constants.ts`: mesma URL base, mesma contagem esperada, mesma lista de slugs na mesma ordem canônica (Pentateuco → Históricos → Sapienciais → Proféticos → Evangelhos/Atos → Epístolas → Apocalipse). O tipo `BibleBookEntry` do TS vira um struct Go com o `Testament` já usando o tipo `bible.BookTestament` (`"old"`/`"new"`, minúsculo — ver `internal/bible/book.go`) em vez das strings `"OLD"`/`"NEW"` do TS, pra não precisar converter na hora de inserir.

```go
package main

import "github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"

const (
	baseRawURL        = "https://raw.githubusercontent.com/Dancrf/biblia-db/refs/heads/main"
	expectedBookCount = 73
)

type bibleBookEntry struct {
	Abbreviation string
	Testament bible.BookTestament
}

var bibleBooks = []bibleBookEntry{
	// Old Testament (46) — canonical Catholic order
	// Pentateuch
	{Abbreviation: "gn", Testament: bible.OldTestament},
	{Abbreviation: "ex", Testament: bible.OldTestament},
	{Abbreviation: "lv", Testament: bible.OldTestament},
	{Abbreviation: "nm", Testament: bible.OldTestament},
	{Abbreviation: "dt", Testament: bible.OldTestament},
	// Historical Books
	{Abbreviation: "js", Testament: bible.OldTestament},
	{Abbreviation: "ju", Testament: bible.OldTestament},
	{Abbreviation: "rt", Testament: bible.OldTestament},
	{Abbreviation: "1sm", Testament: bible.OldTestament},
	{Abbreviation: "2sm", Testament: bible.OldTestament},
	{Abbreviation: "1rs", Testament: bible.OldTestament},
	{Abbreviation: "2rs", Testament: bible.OldTestament},
	{Abbreviation: "1pa", Testament: bible.OldTestament},
	{Abbreviation: "2pa", Testament: bible.OldTestament},
	{Abbreviation: "esd", Testament: bible.OldTestament},
	{Abbreviation: "ne", Testament: bible.OldTestament},
	{Abbreviation: "tob", Testament: bible.OldTestament},
	{Abbreviation: "jdi", Testament: bible.OldTestament},
	{Abbreviation: "est", Testament: bible.OldTestament},
	{Abbreviation: "1ma", Testament: bible.OldTestament},
	{Abbreviation: "2ma", Testament: bible.OldTestament},
	// Wisdom Books
	{Abbreviation: "job", Testament: bible.OldTestament},
	{Abbreviation: "ps", Testament: bible.OldTestament},
	{Abbreviation: "pv", Testament: bible.OldTestament},
	{Abbreviation: "ees", Testament: bible.OldTestament},
	{Abbreviation: "cc", Testament: bible.OldTestament},
	{Abbreviation: "sa", Testament: bible.OldTestament},
	{Abbreviation: "eus", Testament: bible.OldTestament},
	// Prophetic Books
	{Abbreviation: "is", Testament: bible.OldTestament},
	{Abbreviation: "je", Testament: bible.OldTestament},
	{Abbreviation: "lm", Testament: bible.OldTestament},
	{Abbreviation: "ba", Testament: bible.OldTestament},
	{Abbreviation: "ez", Testament: bible.OldTestament},
	{Abbreviation: "dn", Testament: bible.OldTestament},
	{Abbreviation: "os", Testament: bible.OldTestament},
	{Abbreviation: "jl", Testament: bible.OldTestament},
	{Abbreviation: "am", Testament: bible.OldTestament},
	{Abbreviation: "ab", Testament: bible.OldTestament},
	{Abbreviation: "jn", Testament: bible.OldTestament},
	{Abbreviation: "mic", Testament: bible.OldTestament},
	{Abbreviation: "na", Testament: bible.OldTestament},
	{Abbreviation: "hc", Testament: bible.OldTestament},
	{Abbreviation: "so", Testament: bible.OldTestament},
	{Abbreviation: "ag", Testament: bible.OldTestament},
	{Abbreviation: "zc", Testament: bible.OldTestament},
	{Abbreviation: "ml", Testament: bible.OldTestament},
	// New Testament (27) — canonical order
	// Gospels and Acts
	{Abbreviation: "mt", Testament: bible.NewTestament},
	{Abbreviation: "mc", Testament: bible.NewTestament},
	{Abbreviation: "lc", Testament: bible.NewTestament},
	{Abbreviation: "jo", Testament: bible.NewTestament},
	{Abbreviation: "act", Testament: bible.NewTestament},
	// Pauline Epistles
	{Abbreviation: "rm", Testament: bible.NewTestament},
	{Abbreviation: "1co", Testament: bible.NewTestament},
	{Abbreviation: "2co", Testament: bible.NewTestament},
	{Abbreviation: "gl", Testament: bible.NewTestament},
	{Abbreviation: "ef", Testament: bible.NewTestament},
	{Abbreviation: "fp", Testament: bible.NewTestament},
	{Abbreviation: "cl", Testament: bible.NewTestament},
	{Abbreviation: "1ts", Testament: bible.NewTestament},
	{Abbreviation: "2ts", Testament: bible.NewTestament},
	{Abbreviation: "1tm", Testament: bible.NewTestament},
	{Abbreviation: "2tm", Testament: bible.NewTestament},
	{Abbreviation: "tt", Testament: bible.NewTestament},
	{Abbreviation: "fm", Testament: bible.NewTestament},
	// Epistle to the Hebrews
	{Abbreviation: "hb", Testament: bible.NewTestament},
	// Catholic Epistles
	{Abbreviation: "tg", Testament: bible.NewTestament},
	{Abbreviation: "1pe", Testament: bible.NewTestament},
	{Abbreviation: "2pe", Testament: bible.NewTestament},
	{Abbreviation: "1jo", Testament: bible.NewTestament},
	{Abbreviation: "2jo", Testament: bible.NewTestament},
	{Abbreviation: "3jo", Testament: bible.NewTestament},
	{Abbreviation: "jda", Testament: bible.NewTestament},
	// Revelation
	{Abbreviation: "ap", Testament: bible.NewTestament},
}
```

## `normalize.go` — só o caminho que é usado de verdade

O TS (`bible-json-normalize.ts`) suporta três formatos de entrada, mas só um chega a rodar em produção: o formato bruto do `biblia-db`, `{ livro: string, capitulos: [{ capitulo, versiculos: [{ numero, texto }] }] }`. Os outros dois formatos (mapa `{ "genesis": { chapters: {...} } }` e `{ "books": [...] }` já normalizado) não têm nenhum chamador — `bible-fetcher.ts` só chama `normalizeBibleBookDB`. A versão Go porta só esse caminho.

Os campos `niceName` (não existe em `internal/bible.Book`), `totalChapters` (dado derivado, já removido do domínio Go — ver [[Plans/Feature Plans/Port para Go/04 - Roadmap e Status|Roadmap]]) e `group_start`/`group_end` de `NormalizedVerse` (nunca usados por `processBook`, nem existem em `bible_verses`) também não são portados.

```go
package main

import (
	"encoding/json"
	"fmt"
	"regexp"
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
	Name     string
	Abbreviation string
	Order    int
	Chapters []normalizedChapter
}

// rawBibleBookDB is the raw format served by the biblia-db repository
// (https://github.com/Dancrf/biblia-db): one book per JSON file.
type rawBibleBookDB struct {
	Livro     string `json:"livro"`
	Capitulos []struct {
		Capitulo   int `json:"capitulo"`
		Versiculos []struct {
			Numero int    `json:"numero"`
			Texto  string `json:"texto"`
		} `json:"versiculos"`
	} `json:"capitulos"`
}

var verseNumberPrefix = regexp.MustCompile(`^\[\d+\]\s*`)

// stripVerseNumberPrefix removes the "[N] " prefix that some biblia-db
// files include at the start of the verse text.
func stripVerseNumberPrefix(text string) string {
	return verseNumberPrefix.ReplaceAllString(text, "")
}

func normalizeBibleBookDB(raw []byte, entry bibleBookEntry, index int) (normalizedBook, error) {
	var parsed rawBibleBookDB
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return normalizedBook{}, fmt.Errorf("livro %q: JSON inválido: %w", entry.Abbreviation, err)
	}
	if parsed.Livro == "" || len(parsed.Capitulos) == 0 {
		return normalizedBook{}, fmt.Errorf(
			"livro %q: JSON inválido — esperado {livro, capitulos: [...]}", entry.Abbreviation,
		)
	}

	chapters := make([]normalizedChapter, 0, len(parsed.Capitulos))
	for _, cap := range parsed.Capitulos {
		verses := make([]normalizedVerse, 0, len(cap.Versiculos))
		for _, v := range cap.Versiculos {
			verses = append(verses, normalizedVerse{
				Number: v.Numero,
				Text:   stripVerseNumberPrefix(v.Texto),
			})
		}
		chapters = append(chapters, normalizedChapter{Number: cap.Capitulo, Verses: verses})
	}

	return normalizedBook{
		Name:     parsed.Livro,
		Abbreviation:     entry.Abbreviation,
		Order:    index + 1,
		Chapters: chapters,
	}, nil
}
```

Diferença de assinatura em relação ao TS: `normalizeBibleBookDB` do TypeScript recebe `raw: unknown` já parseado (o `fetch().json()` faz o parse). Em Go, `json.Unmarshal` faz parse e validação de forma no mesmo passo — por isso a função Go recebe `[]byte` (o corpo cru da resposta HTTP) em vez de um valor já decodificado, evitando duas passagens (`Decode` genérico + type guard manual, que é o que `isRawLivroBibliaDB` fazia no TS).

## `github-raw/json-normalize.go` — removido

Esse arquivo já existe hoje em `cmd/seed/bible/github-raw/json-normalize.go` com uma função `Slugfy` (porta de `slugify()` do TS), mas **nenhum código chama ela** — nem no TS o `slugify` chega a rodar de verdade (`bookData.abbreviation` já vem preenchido, ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Índice do módulo]]), nem o `normalizeBibleBookDB` em Go precisa dele (o abbreviation já vem de `entry.Abbreviation`, sempre presente). Mantê-lo seria portar código morto para código morto. A pasta `cmd/seed/bible/github-raw/` inteira é apagada, e a dependência `golang.org/x/text` (usada só por esse arquivo) sai do `go.mod` num `go mod tidy` ao final da migração.

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] · [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check|Fetch Concorrente e Integrity Check]] ▶
