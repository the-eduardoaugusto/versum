import { describe, expect, it } from "vitest";
import { generateVerseSuggestions } from "../utils/verse-suggestions";

describe("generateVerseSuggestions", () => {
  it("returns first 8 verses when partial is empty", () => {
    const result = generateVerseSuggestions(31, "");
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("returns verses starting with partial", () => {
    const result = generateVerseSuggestions(31, "1");
    expect(result).toContain(1);
    expect(result).toContain(10);
    expect(result).toContain(11);
    expect(result).not.toContain(2);
  });

  it("caps at 8 results", () => {
    expect(generateVerseSuggestions(31, "1").length).toBeLessThanOrEqual(8);
  });

  it("bounds results to totalVerses", () => {
    const result = generateVerseSuggestions(5, "");
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns empty when partial exceeds totalVerses", () => {
    expect(generateVerseSuggestions(10, "99")).toEqual([]);
  });

  it("handles Apocalipse 22:21 (verse 21 of 21)", () => {
    const result = generateVerseSuggestions(21, "21");
    expect(result).toEqual([21]);
  });

  it("handles partial '2' with max verses 21", () => {
    const result = generateVerseSuggestions(21, "2");
    expect(result).toContain(2);
    expect(result).toContain(20);
    expect(result).toContain(21);
    expect(result).not.toContain(30);
  });
});
