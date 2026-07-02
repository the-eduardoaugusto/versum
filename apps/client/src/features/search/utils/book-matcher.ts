import type { Book } from "@/dal/orval/zod/schemas";
import { normalizeText } from "./normalize-text";

const MAX_BOOK_SUGGESTIONS = 5;

type NormalizedBook = {
  book: Book;
  slug: string;
  niceName: string;
  name: string;
};

// Order = priority. To add/change a criterion, only change here.
const MATCH_TIERS: ((b: NormalizedBook, norm: string) => boolean)[] = [
  (b, norm) => b.slug === norm,
  (b, norm) => b.slug.startsWith(norm),
  (b, norm) => b.niceName.startsWith(norm),
  (b, norm) => b.name.startsWith(norm),
  (b, norm) => b.niceName.includes(norm),
  (b, norm) => b.name.includes(norm),
];

export function matchBooks(partial: string, books: Book[]): Book[] {
  const normalizedPartial = normalizeText(partial);
  if (!normalizedPartial) return [];

  const normalizedBooks: NormalizedBook[] = books.map((book) => ({
    book,
    slug: normalizeText(book.slug),
    niceName: normalizeText(book.niceName),
    name: normalizeText(book.name),
  }));

  const tiers: Book[][] = MATCH_TIERS.map(() => []);
  const matched = new Set<Book>();

  for (const b of normalizedBooks) {
    const tierIndex = MATCH_TIERS.findIndex((matches) =>
      matches(b, normalizedPartial),
    );
    if (tierIndex === -1 || matched.has(b.book)) continue;
    tiers[tierIndex].push(b.book);
    matched.add(b.book);
  }

  return tiers.flat().slice(0, MAX_BOOK_SUGGESTIONS);
}
