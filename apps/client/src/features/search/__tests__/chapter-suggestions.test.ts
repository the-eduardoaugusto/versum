import { describe, expect, it } from "vitest";
import { generateChapterSuggestions } from "../utils/chapter-suggestions";

describe("generateChapterSuggestions", () => {
  it("returns first 8 chapters when partial is empty", () => {
    const result = generateChapterSuggestions(50, "");
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("returns chapters starting with partial", () => {
    const result = generateChapterSuggestions(50, "1");
    expect(result).toContain(1);
    expect(result).toContain(10);
    expect(result).toContain(11);
    expect(result).not.toContain(2);
  });

  it("caps at 8 results", () => {
    expect(generateChapterSuggestions(50, "1").length).toBeLessThanOrEqual(8);
  });

  it("returns empty array when partial exceeds totalChapters", () => {
    expect(generateChapterSuggestions(5, "9")).toEqual([]);
  });

  it("returns exact match for single-chapter book", () => {
    expect(generateChapterSuggestions(1, "1")).toEqual([1]);
  });

  it("handles multi-digit prefix", () => {
    const result = generateChapterSuggestions(50, "15");
    expect(result).toEqual([15]);
  });

  it("returns empty for partial larger than any chapter", () => {
    expect(generateChapterSuggestions(22, "99")).toEqual([]);
  });

  it("respects totalChapters upper bound", () => {
    const result = generateChapterSuggestions(3, "");
    expect(result).toEqual([1, 2, 3]);
  });
});
