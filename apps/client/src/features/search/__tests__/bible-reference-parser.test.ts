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

  it("returns verse stage when colon is present", () => {
    const result = parseReference("Gênesis 1:", BOOKS);
    expect(result.stage).toBe("verse");
    if (result.stage === "verse") {
      expect(result.book.slug).toBe("gn");
      expect(result.chapterNumber).toBe(1);
      expect(result.versePartial).toBe("");
    }
  });

  it("returns verse stage with verse partial", () => {
    const result = parseReference("Gênesis 1:10", BOOKS);
    expect(result.stage).toBe("verse");
    if (result.stage === "verse") {
      expect(result.chapterNumber).toBe(1);
      expect(result.versePartial).toBe("10");
    }
  });

  it("handles Apocalipse 22:21 (last verse of Bible)", () => {
    const result = parseReference("Apocalipse 22:21", BOOKS);
    expect(result.stage).toBe("verse");
    if (result.stage === "verse") {
      expect(result.book.slug).toBe("ap");
      expect(result.chapterNumber).toBe(22);
      expect(result.versePartial).toBe("21");
    }
  });

  it("handles numbered books like 1 João", () => {
    const result = parseReference("1 João 3:5", BOOKS);
    expect(result.stage).toBe("verse");
    if (result.stage === "verse") {
      expect(result.book.slug).toBe("1jo");
      expect(result.chapterNumber).toBe(3);
      expect(result.versePartial).toBe("5");
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
});
