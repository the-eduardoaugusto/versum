import { describe, expect, it } from "vitest";
import { integrityCheck } from "./bible-fetcher";
import type { FetchResult } from "./bible-fetcher";
import { EXPECTED_BOOK_COUNT } from "./bible-books.constants";

const makeOkResult = (slug: string): FetchResult => ({
  ok: true,
  book: {
    name: slug,
    niceName: slug,
    slug,
    order: 1,
    chapters: [{ chapter: 1, verses: [{ verse: 1, text: "texto" }] }],
  },
  testament: "OLD",
});

const makeErrResult = (slug: string): FetchResult => ({
  ok: false,
  slug,
  reason: "HTTP 404",
});

describe("integrityCheck", () => {
  it("passes when all 73 results are ok", () => {
    const results: FetchResult[] = Array.from({ length: EXPECTED_BOOK_COUNT }, (_, i) =>
      makeOkResult(`slug${i}`),
    );
    const { passed, errors } = integrityCheck(results);
    expect(passed).toBe(true);
    expect(errors).toHaveLength(0);
  });

  it("fails when any result is not ok", () => {
    const results: FetchResult[] = [
      ...Array.from({ length: EXPECTED_BOOK_COUNT - 1 }, (_, i) =>
        makeOkResult(`slug${i}`),
      ),
      makeErrResult("gn"),
    ];
    const { passed, errors } = integrityCheck(results);
    expect(passed).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("gn");
  });

  it("fails and lists all failed slugs when multiple errors", () => {
    const results: FetchResult[] = [
      makeOkResult("mt"),
      makeErrResult("gn"),
      makeErrResult("ex"),
    ];
    const { passed, errors } = integrityCheck(results);
    expect(passed).toBe(false);
    expect(errors).toHaveLength(2);
  });

  it("fails when total results < EXPECTED_BOOK_COUNT", () => {
    const results: FetchResult[] = [makeOkResult("gn")];
    const { passed, errors } = integrityCheck(results);
    expect(passed).toBe(false);
    expect(errors.some((e) => e.includes("73"))).toBe(true);
  });
});
