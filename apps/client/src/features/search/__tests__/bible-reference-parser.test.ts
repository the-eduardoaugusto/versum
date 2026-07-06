import { describe, expect, it } from "vitest";
import type { Book } from "@/dal/orval/zod/schemas";
import { parseReference } from "../utils/bible-reference-parser";

const makeBook = (overrides: Partial<Book>): Book => ({
  id: "1",
  order: 1,
  name: "genesis",
  slug: "gn",
  niceName: "Gênesis",
  testament: "OLD",
  totalChapters: 50,
  ...overrides,
});

const BOOKS: Book[] = [
  makeBook({ id: "1", slug: "gn", niceName: "Gênesis", totalChapters: 50 }),
  makeBook({
    id: "2",
    order: 66,
    slug: "ap",
    name: "apocalipse",
    niceName: "Apocalipse",
    totalChapters: 22,
  }),
  makeBook({
    id: "3",
    order: 62,
    slug: "1jo",
    name: "1joao",
    niceName: "1 João",
    totalChapters: 5,
  }),
  // Real production niceName shape: contains "." — reproduces the REF_REGEX
  // bug where the book part's character class rejected punctuation.
  makeBook({
    id: "4",
    order: 71,
    slug: "3jo",
    name: "Terceira Epístolas de S. João",
    niceName: "Terceira Epístolas de S. João",
    totalChapters: 1,
  }),
  // Real production niceName shape: contains "(" and ")".
  makeBook({
    id: "5",
    order: 18,
    slug: "job",
    name: "Livro de Job (Jó)",
    niceName: "Livro de Job (Jó)",
    totalChapters: 42,
  }),
];

describe("parseReference", () => {
  it("returns idle for empty input", () => {
    expect(parseReference("", BOOKS)).toEqual({ stage: "idle" });
  });

  it("returns idle for whitespace-only input", () => {
    expect(parseReference("   ", BOOKS)).toEqual({ stage: "idle" });
  });

  it("returns book stage for partial book name", () => {
    const result = parseReference("Gên", BOOKS);
    expect(result.stage).toBe("book");
    if (result.stage === "book") expect(result.partial).toBe("Gên");
  });

  it("returns book stage for slug abbreviation", () => {
    const result = parseReference("Gn", BOOKS);
    expect(result.stage).toBe("book");
  });

  it("returns chapter stage when book resolves and chapter partial present", () => {
    const result = parseReference("Gênesis 1", BOOKS);
    expect(result.stage).toBe("chapter");
    if (result.stage === "chapter") {
      expect(result.book.slug).toBe("gn");
      expect(result.chapterPartial).toBe("1");
    }
  });

  it("returns chapter stage with slug abbreviation", () => {
    const result = parseReference("Gn 1", BOOKS);
    expect(result.stage).toBe("chapter");
    if (result.stage === "chapter") expect(result.book.slug).toBe("gn");
  });

  it("returns chapter stage when colon is present (ignores verse part)", () => {
    const result = parseReference("Gênesis 1:", BOOKS);
    expect(result.stage).toBe("chapter");
    if (result.stage === "chapter") {
      expect(result.book.slug).toBe("gn");
      expect(result.chapterPartial).toBe("1");
    }
  });

  it("returns chapter stage with verse partial (ignores verse part)", () => {
    const result = parseReference("Gênesis 1:10", BOOKS);
    expect(result.stage).toBe("chapter");
    if (result.stage === "chapter") {
      expect(result.book.slug).toBe("gn");
      expect(result.chapterPartial).toBe("1");
    }
  });

  it("handles Apocalipse 22:21 — resolves to chapter stage", () => {
    const result = parseReference("Apocalipse 22:21", BOOKS);
    expect(result.stage).toBe("chapter");
    if (result.stage === "chapter") {
      expect(result.book.slug).toBe("ap");
      expect(result.chapterPartial).toBe("22");
    }
  });

  it("handles numbered books like 1 João with colon — resolves to chapter stage", () => {
    const result = parseReference("1 João 3:5", BOOKS);
    expect(result.stage).toBe("chapter");
    if (result.stage === "chapter") {
      expect(result.book.slug).toBe("1jo");
      expect(result.chapterPartial).toBe("3");
    }
  });

  it("handles abbreviated numbered books like 1Jo", () => {
    const result = parseReference("1Jo 3", BOOKS);
    expect(result.stage).toBe("chapter");
    if (result.stage === "chapter") expect(result.book.slug).toBe("1jo");
  });

  it("stays in book stage when no books match", () => {
    const result = parseReference("XYZ 1", BOOKS);
    expect(result.stage).toBe("book");
  });

  it("returns idle for empty books array", () => {
    const result = parseReference("Gênesis 1", []);
    expect(result.stage).toBe("book");
  });

  it("resolves book stage for full niceName containing a period (e.g. 'S. João')", () => {
    const result = parseReference("Terceira Epístolas de S. João", BOOKS);
    expect(result.stage).toBe("book");
    if (result.stage === "book") {
      expect(result.partial).toBe("Terceira Epístolas de S. João");
    }
  });

  it("resolves chapter stage after a period-containing niceName plus chapter number", () => {
    const result = parseReference("Terceira Epístolas de S. João 1", BOOKS);
    expect(result.stage).toBe("chapter");
    if (result.stage === "chapter") {
      expect(result.book.slug).toBe("3jo");
      expect(result.chapterPartial).toBe("1");
    }
  });

  it("resolves book stage for niceName containing parentheses (e.g. 'Job (Jó)')", () => {
    const result = parseReference("Livro de Job (Jó)", BOOKS);
    expect(result.stage).toBe("book");
    if (result.stage === "book") {
      expect(result.partial).toBe("Livro de Job (Jó)");
    }
  });

  it("resolves chapter stage after a parentheses-containing niceName plus chapter number", () => {
    const result = parseReference("Livro de Job (Jó) 5", BOOKS);
    expect(result.stage).toBe("chapter");
    if (result.stage === "chapter") {
      expect(result.book.slug).toBe("job");
      expect(result.chapterPartial).toBe("5");
    }
  });
});
