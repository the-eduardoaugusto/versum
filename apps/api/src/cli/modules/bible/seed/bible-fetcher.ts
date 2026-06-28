import type { NormalizedBook } from "../bible-json-normalize";
import { normalizeLivroBibliaDB } from "../bible-json-normalize";
import {
  BASE_RAW_URL,
  BIBLE_BOOKS,
  EXPECTED_BOOK_COUNT,
} from "./bible-books.constants";
import type { BibleBookEntry } from "./bible-books.constants";

export type FetchResult =
  | { ok: true; book: NormalizedBook; testament: "OLD" | "NEW" }
  | { ok: false; slug: string; reason: string };

function bookUrl(entry: BibleBookEntry): string {
  const dir =
    entry.testament === "OLD" ? "antigotestamento" : "novotestamento";
  return `${BASE_RAW_URL}/${dir}/${entry.slug}.json`;
}

async function fetchBook(
  entry: BibleBookEntry,
  index: number,
): Promise<FetchResult> {
  const url = bookUrl(entry);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        ok: false,
        slug: entry.slug,
        reason: `HTTP ${res.status} em ${url}`,
      };
    }
    const raw: unknown = await res.json();
    const book = normalizeLivroBibliaDB(raw, entry, index);
    return { ok: true, book, testament: entry.testament };
  } catch (err) {
    return {
      ok: false,
      slug: entry.slug,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchAllBibleBooks(): Promise<{
  books: Array<{ book: NormalizedBook; testament: "OLD" | "NEW" }>;
  errors: Array<{ slug: string; reason: string }>;
}> {
  const results = await Promise.all(
    BIBLE_BOOKS.map((entry, index) => fetchBook(entry, index)),
  );

  const books: Array<{ book: NormalizedBook; testament: "OLD" | "NEW" }> = [];
  const errors: Array<{ slug: string; reason: string }> = [];

  for (const result of results) {
    if (result.ok) {
      books.push({ book: result.book, testament: result.testament });
    } else {
      errors.push({ slug: result.slug, reason: result.reason });
    }
  }

  return { books, errors };
}

export function integrityCheck(results: FetchResult[]): {
  passed: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const slugErrors: string[] = [];
  for (const result of results) {
    if (!result.ok) {
      slugErrors.push(`[${result.slug}] ${result.reason}`);
    }
  }

  if (slugErrors.length > 0) {
    errors.push(...slugErrors);
  } else if (results.length !== EXPECTED_BOOK_COUNT) {
    errors.push(
      `Total de resultados (${results.length}) diferente do esperado (${EXPECTED_BOOK_COUNT}).`,
    );
  }

  const okCount = results.filter((r) => r.ok).length;
  return { passed: errors.length === 0 && okCount === EXPECTED_BOOK_COUNT, errors };
}
