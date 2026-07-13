package main

import "github.com/eduardoaugustolb/versum/apps/api-go/internal/bible"

const (
	baseRawURL        = "https://raw.githubusercontent.com/Dancrf/biblia-db/refs/heads/main"
	expectedBookCount = 73
)

type bibleBookEntry struct {
	Abbreviation string
	Testament    bible.BookTestament
}

var bibleBooks = []bibleBookEntry{
	// Antigo Testamento (46) — ordem canônica católica
	// Pentateuco
	{Abbreviation: "gn", Testament: bible.OldTestament},
	{Abbreviation: "ex", Testament: bible.OldTestament},
	{Abbreviation: "lv", Testament: bible.OldTestament},
	{Abbreviation: "nm", Testament: bible.OldTestament},
	{Abbreviation: "dt", Testament: bible.OldTestament},
	// Livros Históricos
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
	// Livros Sapienciais
	{Abbreviation: "job", Testament: bible.OldTestament},
	{Abbreviation: "ps", Testament: bible.OldTestament},
	{Abbreviation: "pv", Testament: bible.OldTestament},
	{Abbreviation: "ees", Testament: bible.OldTestament},
	{Abbreviation: "cc", Testament: bible.OldTestament},
	{Abbreviation: "sa", Testament: bible.OldTestament},
	{Abbreviation: "eus", Testament: bible.OldTestament},
	// Livros Proféticos
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
	// Novo Testamento (27) — ordem canônica
	// Evangelhos e Atos
	{Abbreviation: "mt", Testament: bible.NewTestament},
	{Abbreviation: "mc", Testament: bible.NewTestament},
	{Abbreviation: "lc", Testament: bible.NewTestament},
	{Abbreviation: "jo", Testament: bible.NewTestament},
	{Abbreviation: "act", Testament: bible.NewTestament},
	// Epístolas Paulinas
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
	// Epístola aos Hebreus
	{Abbreviation: "hb", Testament: bible.NewTestament},
	// Epístolas Católicas
	{Abbreviation: "tg", Testament: bible.NewTestament},
	{Abbreviation: "1pe", Testament: bible.NewTestament},
	{Abbreviation: "2pe", Testament: bible.NewTestament},
	{Abbreviation: "1jo", Testament: bible.NewTestament},
	{Abbreviation: "2jo", Testament: bible.NewTestament},
	{Abbreviation: "3jo", Testament: bible.NewTestament},
	{Abbreviation: "jda", Testament: bible.NewTestament},
	// Apocalipse
	{Abbreviation: "ap", Testament: bible.NewTestament},
}
