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
	Slug      string
	Testament bible.BookTestament
}

var bibleBooks = []bibleBookEntry{
	// Antigo Testamento (46) — ordem canônica católica
	// Pentateuco
	{Slug: "gn", Testament: bible.OldTestament},
	{Slug: "ex", Testament: bible.OldTestament},
	{Slug: "lv", Testament: bible.OldTestament},
	{Slug: "nm", Testament: bible.OldTestament},
	{Slug: "dt", Testament: bible.OldTestament},
	// Livros Históricos
	{Slug: "js", Testament: bible.OldTestament},
	{Slug: "ju", Testament: bible.OldTestament},
	{Slug: "rt", Testament: bible.OldTestament},
	{Slug: "1sm", Testament: bible.OldTestament},
	{Slug: "2sm", Testament: bible.OldTestament},
	{Slug: "1rs", Testament: bible.OldTestament},
	{Slug: "2rs", Testament: bible.OldTestament},
	{Slug: "1pa", Testament: bible.OldTestament},
	{Slug: "2pa", Testament: bible.OldTestament},
	{Slug: "esd", Testament: bible.OldTestament},
	{Slug: "ne", Testament: bible.OldTestament},
	{Slug: "tob", Testament: bible.OldTestament},
	{Slug: "jdi", Testament: bible.OldTestament},
	{Slug: "est", Testament: bible.OldTestament},
	{Slug: "1ma", Testament: bible.OldTestament},
	{Slug: "2ma", Testament: bible.OldTestament},
	// Livros Sapienciais
	{Slug: "job", Testament: bible.OldTestament},
	{Slug: "ps", Testament: bible.OldTestament},
	{Slug: "pv", Testament: bible.OldTestament},
	{Slug: "ees", Testament: bible.OldTestament},
	{Slug: "cc", Testament: bible.OldTestament},
	{Slug: "sa", Testament: bible.OldTestament},
	{Slug: "eus", Testament: bible.OldTestament},
	// Livros Proféticos
	{Slug: "is", Testament: bible.OldTestament},
	{Slug: "je", Testament: bible.OldTestament},
	{Slug: "lm", Testament: bible.OldTestament},
	{Slug: "ba", Testament: bible.OldTestament},
	{Slug: "ez", Testament: bible.OldTestament},
	{Slug: "dn", Testament: bible.OldTestament},
	{Slug: "os", Testament: bible.OldTestament},
	{Slug: "jl", Testament: bible.OldTestament},
	{Slug: "am", Testament: bible.OldTestament},
	{Slug: "ab", Testament: bible.OldTestament},
	{Slug: "jn", Testament: bible.OldTestament},
	{Slug: "mic", Testament: bible.OldTestament},
	{Slug: "na", Testament: bible.OldTestament},
	{Slug: "hc", Testament: bible.OldTestament},
	{Slug: "so", Testament: bible.OldTestament},
	{Slug: "ag", Testament: bible.OldTestament},
	{Slug: "zc", Testament: bible.OldTestament},
	{Slug: "ml", Testament: bible.OldTestament},
	// Novo Testamento (27) — ordem canônica
	// Evangelhos e Atos
	{Slug: "mt", Testament: bible.NewTestament},
	{Slug: "mc", Testament: bible.NewTestament},
	{Slug: "lc", Testament: bible.NewTestament},
	{Slug: "jo", Testament: bible.NewTestament},
	{Slug: "act", Testament: bible.NewTestament},
	// Epístolas Paulinas
	{Slug: "rm", Testament: bible.NewTestament},
	{Slug: "1co", Testament: bible.NewTestament},
	{Slug: "2co", Testament: bible.NewTestament},
	{Slug: "gl", Testament: bible.NewTestament},
	{Slug: "ef", Testament: bible.NewTestament},
	{Slug: "fp", Testament: bible.NewTestament},
	{Slug: "cl", Testament: bible.NewTestament},
	{Slug: "1ts", Testament: bible.NewTestament},
	{Slug: "2ts", Testament: bible.NewTestament},
	{Slug: "1tm", Testament: bible.NewTestament},
	{Slug: "2tm", Testament: bible.NewTestament},
	{Slug: "tt", Testament: bible.NewTestament},
	{Slug: "fm", Testament: bible.NewTestament},
	// Epístola aos Hebreus
	{Slug: "hb", Testament: bible.NewTestament},
	// Epístolas Católicas
	{Slug: "tg", Testament: bible.NewTestament},
	{Slug: "1pe", Testament: bible.NewTestament},
	{Slug: "2pe", Testament: bible.NewTestament},
	{Slug: "1jo", Testament: bible.NewTestament},
	{Slug: "2jo", Testament: bible.NewTestament},
	{Slug: "3jo", Testament: bible.NewTestament},
	{Slug: "jda", Testament: bible.NewTestament},
	// Apocalipse
	{Slug: "ap", Testament: bible.NewTestament},
}
```

## `normalize.go` — só o caminho que é usado de verdade

O TS (`bible-json-normalize.ts`) suporta três formatos de entrada, mas só um chega a rodar em produção: o formato bruto do `biblia-db`, `{ livro: string, capitulos: [{ capitulo, versiculos: [{ numero, texto }] }] }`. Os outros dois formatos (mapa `{ "genesis": { chapters: {...} } }` e `{ "books": [...] }` já normalizado) não têm nenhum chamador — `bible-fetcher.ts` só chama `normalizeLivroBibliaDB`. A versão Go porta só esse caminho.

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
	Slug     string
	Order    int
	Chapters []normalizedChapter
}

// rawLivroBibliaDB é o formato bruto servido pelo repositório biblia-db
// (https://github.com/Dancrf/biblia-db): um livro por arquivo JSON.
type rawLivroBibliaDB struct {
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

// stripVerseNumberPrefix remove o prefixo "[N] " que alguns arquivos do
// biblia-db incluem no início do texto do versículo.
func stripVerseNumberPrefix(text string) string {
	return verseNumberPrefix.ReplaceAllString(text, "")
}

func normalizeLivroBibliaDB(raw []byte, entry bibleBookEntry, index int) (normalizedBook, error) {
	var parsed rawLivroBibliaDB
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return normalizedBook{}, fmt.Errorf("livro %q: JSON inválido: %w", entry.Slug, err)
	}
	if parsed.Livro == "" || len(parsed.Capitulos) == 0 {
		return normalizedBook{}, fmt.Errorf(
			"livro %q: JSON inválido — esperado {livro, capitulos: [...]}", entry.Slug,
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
		Slug:     entry.Slug,
		Order:    index + 1,
		Chapters: chapters,
	}, nil
}
```

Diferença de assinatura em relação ao TS: `normalizeLivroBibliaDB` do TypeScript recebe `raw: unknown` já parseado (o `fetch().json()` faz o parse). Em Go, `json.Unmarshal` faz parse e validação de forma no mesmo passo — por isso a função Go recebe `[]byte` (o corpo cru da resposta HTTP) em vez de um valor já decodificado, evitando duas passagens (`Decode` genérico + type guard manual, que é o que `isRawLivroBibliaDB` fazia no TS).

## `github-raw/json-normalize.go` — removido

Esse arquivo já existe hoje em `cmd/seed/bible/github-raw/json-normalize.go` com uma função `Slugfy` (porta de `slugify()` do TS), mas **nenhum código chama ela** — nem no TS o `slugify` chega a rodar de verdade (`bookData.slug` já vem preenchido, ver [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Índice do módulo]]), nem o `normalizeLivroBibliaDB` em Go precisa dele (o slug já vem de `entry.Slug`, sempre presente). Mantê-lo seria portar código morto para código morto. A pasta `cmd/seed/bible/github-raw/` inteira é apagada, e a dependência `golang.org/x/text` (usada só por esse arquivo) sai do `go.mod` num `go mod tidy` ao final da migração.

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] · [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/02 - Fetch Concorrente e Integrity Check|Fetch Concorrente e Integrity Check]] ▶
