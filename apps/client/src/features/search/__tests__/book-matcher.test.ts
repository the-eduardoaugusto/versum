import { describe, expect, it } from "vitest";
import type { Book } from "@/dal/orval/zod/schemas";
import { matchBooks } from "../utils/book-matcher";

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
  makeBook({
    id: "1",
    order: 1,
    name: "genesis",
    slug: "gn",
    niceName: "Gênesis",
    totalChapters: 50,
  }),
  makeBook({
    id: "2",
    order: 2,
    name: "exodo",
    slug: "ex",
    niceName: "Êxodo",
    totalChapters: 40,
  }),
  makeBook({
    id: "3",
    order: 43,
    name: "joao",
    slug: "jo",
    niceName: "João",
    totalChapters: 21,
  }),
  makeBook({
    id: "4",
    order: 62,
    name: "1joao",
    slug: "1jo",
    niceName: "1 João",
    totalChapters: 5,
  }),
  makeBook({
    id: "5",
    order: 63,
    name: "2joao",
    slug: "2jo",
    niceName: "2 João",
    totalChapters: 1,
  }),
  makeBook({
    id: "6",
    order: 66,
    name: "apocalipse",
    slug: "ap",
    niceName: "Apocalipse",
    totalChapters: 22,
  }),
];

describe("matchBooks", () => {
  it("returns empty array for empty partial", () => {
    expect(matchBooks("", BOOKS)).toEqual([]);
  });

  it("matches by exact slug", () => {
    const result = matchBooks("gn", BOOKS);
    expect(result[0].slug).toBe("gn");
  });

  it("matches by slug prefix", () => {
    const result = matchBooks("g", BOOKS);
    expect(result[0].slug).toBe("gn");
  });

  it("matches accent-insensitive niceName", () => {
    const result = matchBooks("Gene", BOOKS);
    expect(result[0].slug).toBe("gn");
  });

  it("matches without accent for accented niceName", () => {
    const result = matchBooks("Exo", BOOKS);
    expect(result[0].slug).toBe("ex");
  });

  it("is case-insensitive", () => {
    expect(matchBooks("GENESIS", BOOKS)[0]?.slug).toBe("gn");
    expect(matchBooks("genesis", BOOKS)[0]?.slug).toBe("gn");
  });

  it("returns no results for unmatched input", () => {
    expect(matchBooks("xyz", BOOKS)).toEqual([]);
  });

  it("caps results at 5", () => {
    const manyBooks = Array.from({ length: 10 }, (_, i) =>
      makeBook({
        id: String(i),
        slug: `sl${i}`,
        name: `salmos${i}`,
        niceName: `Salmos ${i}`,
        order: 100 + i,
      }),
    );
    expect(
      matchBooks("s", [...BOOKS, ...manyBooks]).length,
    ).toBeLessThanOrEqual(5);
  });

  it("ranks exact slug match first", () => {
    const result = matchBooks("jo", BOOKS);
    expect(result[0].slug).toBe("jo");
  });

  it("matches numbered books by slug (1jo)", () => {
    const result = matchBooks("1jo", BOOKS);
    expect(result[0].slug).toBe("1jo");
  });

  it("matches numbered books by niceName prefix", () => {
    const result = matchBooks("1 Jo", BOOKS);
    expect(result[0].slug).toBe("1jo");
  });
});
