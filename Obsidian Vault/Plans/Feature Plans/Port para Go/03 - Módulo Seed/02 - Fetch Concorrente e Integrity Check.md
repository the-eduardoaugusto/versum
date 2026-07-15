---
title: "Módulo Seed — Fetch Concorrente e Integrity Check"
section: "Plans"
subsection: "Feature Plans"
tags: [versum, plans, go, aprendizado, bible, seed, concorrencia]
up: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index]]"
prev: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/01 - Livros e Normalização]]"
next: "[[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência]]"
related: []
depth: 3
---

# ⬇️ Módulo Seed — Fetch Concorrente e Integrity Check

🏠 [[_Index|Home]] › 🗺️ [[Plans/_Index|Plans]] › 🚀 [[Plans/Feature Plans/_Index|Feature Plans]] › 🐹 [[Plans/Feature Plans/Port para Go/_Index|Port para Go]] › [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/_Index|Módulo Seed]] › **Fetch Concorrente**

---

## `Promise.all` vira `errgroup.Group`

`bible-fetcher.ts` baixa os 73 arquivos JSON em paralelo com `Promise.all(BIBLE_BOOKS.map(fetchBook))`. O equivalente idiomático em Go é [`golang.org/x/sync/errgroup`](https://pkg.go.dev/golang.org/x/sync/errgroup) — já é uma dependência indireta do projeto (puxada transitivamente, ver `go.mod`), então usar ela direto só promove de indireta pra direta, sem adicionar nada novo.

`errgroup.Group` gerencia um grupo de goroutines (ver [[Plans/Feature Plans/Port para Go/01 - Conceitos de Go|Conceitos de Go]] se "goroutine" for novo) que rodam concorrentemente; `g.Wait()` bloqueia até todas terminarem. Diferente de `Promise.all`, que rejeita a promise combinada no primeiro erro, o fetch de cada livro aqui **nunca retorna erro pro `errgroup`** — cada resultado (sucesso ou falha) é guardado num slice pré-alocado por índice, porque queremos coletar todos os 73 resultados (inclusive as falhas) pra rodar o `integrityCheck` depois, igual o TS faz com `results: FetchResult[]`.

```go
package main

import (
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"
	"golang.org/x/sync/errgroup"
)

type fetchResult struct {
	ok        bool
	book      normalizedBook
	testament bible.BookTestament
	abbreviation      string
	reason    string
}

func bookURL(entry bibleBookEntry) string {
	dir := "antigotestamento"
	if entry.Testament == bible.NewTestament {
		dir = "novotestamento"
	}
	return fmt.Sprintf("%s/%s/%s.json", baseRawURL, dir, entry.Abbreviation)
}

func fetchBook(ctx context.Context, client *http.Client, entry bibleBookEntry, index int) fetchResult {
	url := bookURL(entry)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fetchResult{ok: false, abbreviation: entry.Abbreviation, reason: err.Error()}
	}

	res, err := client.Do(req)
	if err != nil {
		return fetchResult{ok: false, abbreviation: entry.Abbreviation, reason: err.Error()}
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return fetchResult{ok: false, abbreviation: entry.Abbreviation, reason: fmt.Sprintf("HTTP %d em %s", res.StatusCode, url)}
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return fetchResult{ok: false, abbreviation: entry.Abbreviation, reason: err.Error()}
	}

	book, err := normalizeBibleBookDB(body, entry, index)
	if err != nil {
		return fetchResult{ok: false, abbreviation: entry.Abbreviation, reason: err.Error()}
	}

	return fetchResult{ok: true, book: book, testament: entry.Testament}
}

// fetchAllBibleBooks downloads the 73 books concurrently. The result keeps
// successes and failures side by side, in bibleBooks order — the caller
// decides what to do with the failures via integrityCheck.
func fetchAllBibleBooks(ctx context.Context) []fetchResult {
	client := &http.Client{}
	results := make([]fetchResult, len(bibleBooks))

	g, ctx := errgroup.WithContext(ctx)
	for i, entry := range bibleBooks {
		i, entry := i, entry // capture by value (see Conceitos de Go)
		g.Go(func() error {
			results[i] = fetchBook(ctx, client, entry, i)
			return nil
		})
	}
	g.Wait()

	return results
}
```

> **Novo em Conceitos de Go:** cada goroutine dentro do `for` precisa da sua própria cópia de `i` e `entry` (`i, entry := i, entry`) — sem isso, todas as goroutines veriam a última iteração da variável de loop compartilhada. Em Go 1.22+ isso deixou de ser obrigatório pra `for range` simples (cada iteração já ganha uma variável nova), mas continua valendo a pena deixar explícito em código que lança goroutines, por clareza.

## `integrityCheck`

Porta direta de `integrityCheck` do TS: se **qualquer** livro falhou, a lista de erros é a lista de falhas; senão, confere se a quantidade de resultados bate com `expectedBookCount`. `passed` só é `true` se não houver erros **e** a quantidade de sucessos bater com o esperado.

```go
func integrityCheck(results []fetchResult) (passed bool, errs []string) {
	var slugErrors []string
	okCount := 0

	for _, r := range results {
		if r.ok {
			okCount++
			continue
		}
		slugErrors = append(slugErrors, fmt.Sprintf("[%s] %s", r.abbreviation, r.reason))
	}

	if len(slugErrors) > 0 {
		return false, slugErrors
	}
	if len(results) != expectedBookCount {
		return false, []string{fmt.Sprintf(
			"Total de resultados (%d) diferente do esperado (%d).", len(results), expectedBookCount,
		)}
	}

	return okCount == expectedBookCount, nil
}
```

---

◀ [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/01 - Livros e Normalização|Livros e Normalização]] · [[Plans/Feature Plans/Port para Go/03 - Módulo Seed/03 - Geração de ID e Persistência|Geração de ID e Persistência]] ▶
