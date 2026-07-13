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
	ok           bool
	book         normalizedBook
	testament    bible.BookTestament
	abbreviation string
	reason       string
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
		return fetchResult{ok: false, abbreviation: entry.Abbreviation, testament: entry.Testament, reason: err.Error()}
	}

	res, err := client.Do(req)
	if err != nil {
		return fetchResult{ok: false, abbreviation: entry.Abbreviation, testament: entry.Testament, reason: err.Error()}
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return fetchResult{
			ok:           false,
			abbreviation: entry.Abbreviation,
			reason:       fmt.Sprintf("HTTP %d in %s", res.StatusCode, url),
			testament:    entry.Testament,
		}
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return fetchResult{
			ok:           false,
			abbreviation: entry.Abbreviation,
			testament:    entry.Testament,
			reason:       err.Error(),
		}
	}

	book, err := normalizeBibleBookDB(body, entry, index)
	if err != nil {
		return fetchResult{
			ok:           false,
			abbreviation: entry.Abbreviation,
			testament:    entry.Testament,
			reason:       err.Error(),
		}
	}

	return fetchResult{
		ok:           true,
		book:         book,
		testament:    entry.Testament,
		abbreviation: entry.Abbreviation,
	}
}

func fetchAllBibleBooks(ctx context.Context) []fetchResult {
	client := &http.Client{}
	results := make([]fetchResult, len(bibleBooks))

	g, ctx := errgroup.WithContext(ctx)
	for i, entry := range bibleBooks {
		i, entry := i, entry

		g.Go(func() error {
			results[i] = fetchBook(ctx, client, entry, i)
			return nil
		})
	}

	g.Wait()

	return results
}
