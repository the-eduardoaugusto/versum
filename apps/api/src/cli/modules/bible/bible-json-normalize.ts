export interface NormalizedVerse {
  verse: number;
  text: string;
  group_start?: number;
  group_end?: number;
}

export interface NormalizedChapter {
  chapter: number;
  verses: NormalizedVerse[];
}

export interface NormalizedBook {
  name: string;
  niceName: string;
  slug: string;
  order: number;
  chapters: NormalizedChapter[];
}

export interface NormalizedBible {
  books: NormalizedBook[];
}

interface CompactVerseWithGroup {
  text: string;
  group_start?: number;
  group_end?: number;
}

type CompactChapter = Record<string, string | CompactVerseWithGroup>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeBookKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function toNiceName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toVerse(
  input: string | CompactVerseWithGroup,
  verse: number,
): NormalizedVerse {
  if (typeof input === "string") {
    return { verse, text: input };
  }
  return {
    verse,
    text: input.text,
    group_start: input.group_start,
    group_end: input.group_end,
  };
}

function isBookNode(raw: unknown): raw is {
  name?: string;
  slug?: string;
  niceName?: string;
  chapters: CompactChapter;
} {
  if (typeof raw !== "object" || raw === null) return false;
  if (!("chapters" in raw)) return false;
  const ch = (raw as { chapters: unknown }).chapters;
  return typeof ch === "object" && ch !== null && !Array.isArray(ch);
}

function normalizeBookEntry(
  rawBook: unknown,
  bookKey: string,
  index: number,
  existingBooks: Array<{ name: string; slug: string; niceName: string }>,
): NormalizedBook {
  if (!isBookNode(rawBook)) {
    throw new Error(
      `Livro "${bookKey}": cada entrada deve ter "chapters" como mapa (capítulo → versículos).`,
    );
  }

  const normalizedKey = normalizeBookKey(bookKey);
  const existing = existingBooks.find((book) =>
    [book.name, book.slug, book.niceName]
      .filter(Boolean)
      .map(normalizeBookKey)
      .includes(normalizedKey),
  );

  const chapters = Object.entries(rawBook.chapters)
    .map(([chapterNumber, rawChapter]) => {
      if (
        typeof rawChapter !== "object" ||
        rawChapter === null ||
        Array.isArray(rawChapter)
      ) {
        throw new Error(
          `Livro "${bookKey}" capítulo ${chapterNumber}: esperado objeto de versículos.`,
        );
      }
      const verses = Object.entries(rawChapter as unknown as CompactChapter)
        .map(([verseNumber, verseContent]) =>
          toVerse(verseContent, Number(verseNumber)),
        )
        .sort((a, b) => a.verse - b.verse);

      return {
        chapter: Number(chapterNumber),
        verses,
      };
    })
    .sort((a, b) => a.chapter - b.chapter);

  return {
    name: existing?.name || rawBook.name || bookKey,
    niceName: existing?.niceName || rawBook.niceName || toNiceName(bookKey),
    slug: existing?.slug || rawBook.slug || slugify(bookKey).slice(0, 10),
    order: index + 1,
    chapters,
  };
}

function normalizeBooks(
  root: Record<string, unknown>,
  existingBooks: Array<{ name: string; slug: string; niceName: string }>,
): NormalizedBook[] {
  if ("books" in root && Array.isArray(root.books)) {
    return (root.books as unknown[]).map((book, index) => {
      const bookObj = book as Record<string, unknown>;
      const chaptersRaw = bookObj.chapters;
      if (!chaptersRaw || !Array.isArray(chaptersRaw)) {
        throw new Error(
          `Livro "${bookObj.name ?? index}": "chapters" deve ser um array.`,
        );
      }
      const chaptersMap: Record<string, Record<string, string>> = {};
      for (const ch of chaptersRaw) {
        const chObj = ch as {
          chapter?: number;
          verses?: Array<{ verse: number; text: string }>;
        };
        const chNum = String(chObj.chapter ?? 0);
        chaptersMap[chNum] = {};
        const verses = chObj.verses ?? [];
        for (const v of verses) {
          chaptersMap[chNum][String(v.verse)] = v.text;
        }
      }
      const wrappedBook = {
        name: bookObj.name as string,
        slug: bookObj.slug as string,
        niceName:
          (bookObj.niceName as string) || toNiceName(bookObj.name as string),
        chapters: chaptersMap,
      };
      return normalizeBookEntry(
        wrappedBook,
        wrappedBook.name,
        index,
        existingBooks,
      );
    });
  }

  return Object.entries(root).map(([bookKey, rawBook], index) =>
    normalizeBookEntry(rawBook, bookKey, index, existingBooks),
  );
}

import type { BibleBookEntry } from "./seed/bible-books.constants";

interface RawLivroBibliaDB {
  livro: string;
  capitulos: {
    capitulo: number;
    versiculos: { numero: number; texto: string }[];
  }[];
}

function isRawLivroBibliaDB(raw: unknown): raw is RawLivroBibliaDB {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  if (typeof r.livro !== "string" || r.livro.trim() === "") return false;
  if (!Array.isArray(r.capitulos) || r.capitulos.length === 0) return false;
  return true;
}

export function normalizeLivroBibliaDB(
  raw: unknown,
  entry: BibleBookEntry,
  index: number,
): NormalizedBook {
  if (!isRawLivroBibliaDB(raw)) {
    throw new Error(
      `Livro "${entry.slug}": JSON inválido — esperado { livro: string, capitulos: [...] }.`,
    );
  }

  const chapters: NormalizedChapter[] = raw.capitulos.map((cap) => ({
    chapter: cap.capitulo,
    verses: cap.versiculos.map((v) => ({
      verse: v.numero,
      text: v.texto,
    })),
  }));

  return {
    name: raw.livro,
    niceName: raw.livro,
    slug: entry.slug,
    order: index + 1,
    chapters,
  };
}

/**
 * Formato aceito:
 * - `{ "genesis": { "name": "...", "chapters": { "1": { "1": "..." } } } }` (formato original)
 * - `{ "books": [ { "name": "...", "chapters": [ { "chapter": 1, "verses": [...] } ] } ] }` (formato gerado)
 */
export function normalizeBibleJsonForSeed(
  parsedJson: unknown,
  existingBooks: Array<{ name: string; slug: string; niceName: string }>,
): NormalizedBible {
  if (
    typeof parsedJson !== "object" ||
    parsedJson === null ||
    Array.isArray(parsedJson)
  ) {
    throw new Error("bible.json deve ser um objeto na raiz.");
  }

  const root = parsedJson as Record<string, unknown>;

  const books = normalizeBooks(root, existingBooks);

  return { books };
}
