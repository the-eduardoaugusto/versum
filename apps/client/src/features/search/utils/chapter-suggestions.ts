const MAX_SUGGESTIONS = 8;

export function generateChapterSuggestions(
  totalChapters: number,
  partial: string,
): number[] {
  const results: number[] = [];

  for (let n = 1; n <= totalChapters; n++) {
    if (!partial || String(n).startsWith(partial)) {
      results.push(n);
      if (results.length >= MAX_SUGGESTIONS) break;
    }
  }

  return results;
}
