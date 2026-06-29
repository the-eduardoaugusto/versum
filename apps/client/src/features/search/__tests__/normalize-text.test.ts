import { describe, expect, it } from "vitest";
import { normalizeText } from "../utils/normalize-text";

describe("normalizeText", () => {
  it("removes accents", () => {
    expect(normalizeText("Gênesis")).toBe("genesis");
    expect(normalizeText("Êxodo")).toBe("exodo");
    expect(normalizeText("João")).toBe("joao");
  });

  it("lowercases", () => {
    expect(normalizeText("GENESIS")).toBe("genesis");
    expect(normalizeText("Gn")).toBe("gn");
  });

  it("trims whitespace", () => {
    expect(normalizeText("  genesis  ")).toBe("genesis");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeText("")).toBe("");
  });
});
