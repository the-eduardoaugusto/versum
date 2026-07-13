package githubraw

import (
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

var (
	nonAlphanumeric = regexp.MustCompile(`[^a-z0-9]+`)
	trimDashes      = regexp.MustCompile(`^-+|-+$`)
)

func Slugfy(text string) string {
	text = strings.ToLower(text)

	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	result, _, err := transform.String(t, text)
	if err != nil {
		result = text
	}

	result = nonAlphanumeric.ReplaceAllString(result, "-")
	result = trimDashes.ReplaceAllString(result, "")

	return result
}
