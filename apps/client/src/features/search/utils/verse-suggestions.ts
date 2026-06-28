const MAX_SUGGESTIONS = 8;

export function generateVerseSuggestions(
  totalVerses: number,
  partial: string,
): number[] {
  const results: number[] = [];

  for (let n = 1; n <= totalVerses; n++) {
    if (!partial || String(n).startsWith(partial)) {
      results.push(n);
      if (results.length >= MAX_SUGGESTIONS) break;
    }
  }

  return results;
}
