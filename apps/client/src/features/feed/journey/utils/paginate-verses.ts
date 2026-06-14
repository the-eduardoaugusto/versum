import type { VerseData, VersePage } from "../types";

export function paginateVerses(
  verses: VerseData[],
  versesPerPage: number,
): VersePage[] {
  if (verses.length === 0 || versesPerPage < 1) return [];

  const pages: VersePage[] = [];
  let i = 0;

  while (i < verses.length) {
    const chunk = verses.slice(i, i + versesPerPage);
    pages.push({
      startVerse: chunk[0].number,
      endVerse: chunk[chunk.length - 1].number,
      verses: chunk,
    });
    i += versesPerPage;
  }

  return pages;
}
