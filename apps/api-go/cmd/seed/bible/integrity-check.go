package main

import "fmt"

func integrityCheck(results []fetchResult) (passed bool, errs []string) {
	var abbreviationErrs []string
	okCount := 0

	for _, r := range results {
		if r.ok {
			okCount++
			continue
		}

		abbreviationErrs = append(abbreviationErrs, fmt.Sprintf("[%s] %s", r.abbreviation, r.reason))
	}

	if len(abbreviationErrs) > 0 {
		return false, abbreviationErrs
	}

	if len(results) != expectedBookCount {
		return false, []string{
			fmt.Sprintf("Total de resultados (%d) diferente do esperado (%d).", len(results), expectedBookCount),
		}
	}

	return expectedBookCount == okCount, nil
}
