import type { Book } from "@/dal/orval/zod/schemas";
import { normalizeText } from "./normalize-text";

const MAX_BOOK_SUGGESTIONS = 5;

export function matchBooks(partial: string, books: Book[]): Book[] {
  const norm = normalizeText(partial);
  if (!norm) return [];

  const exactSlug: Book[] = [];
  const prefixSlug: Book[] = [];
  const prefixNiceName: Book[] = [];
  const prefixName: Book[] = [];

  for (const book of books) {
    const slug = normalizeText(book.slug);
    const niceName = normalizeText(book.niceName);
    const name = normalizeText(book.name);

    if (slug === norm) exactSlug.push(book);
    else if (slug.startsWith(norm)) prefixSlug.push(book);
    else if (niceName.startsWith(norm)) prefixNiceName.push(book);
    else if (name.startsWith(norm)) prefixName.push(book);
  }

  return [...exactSlug, ...prefixSlug, ...prefixNiceName, ...prefixName].slice(
    0,
    MAX_BOOK_SUGGESTIONS,
  );
}
