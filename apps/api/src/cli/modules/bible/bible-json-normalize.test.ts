import { describe, expect, it } from "vitest";
import { normalizeLivroBibliaDB } from "./bible-json-normalize";

const rawGn = {
  livro: "Gênesis",
  capitulos: [
    {
      capitulo: 1,
      versiculos: [
        { numero: 1, texto: "No princípio criou Deus os céus e a terra." },
        { numero: 2, texto: "A terra era sem forma e vazia." },
      ],
    },
    {
      capitulo: 2,
      versiculos: [{ numero: 1, texto: "Foram, pois, acabados os céus." }],
    },
  ],
};

describe("normalizeLivroBibliaDB", () => {
  it("normalizes name and niceName from livro field", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    expect(result.name).toBe("Gênesis");
    expect(result.niceName).toBe("Gênesis");
  });

  it("uses slug from entry", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    expect(result.slug).toBe("gn");
  });

  it("sets order as 1-based index", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    expect(result.order).toBe(1);
  });

  it("maps capitulos to chapters with correct shape", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0]!.chapter).toBe(1);
    expect(result.chapters[0]!.verses).toHaveLength(2);
    expect(result.chapters[0]!.verses[0]!.verse).toBe(1);
    expect(result.chapters[0]!.verses[0]!.text).toBe(
      "No princípio criou Deus os céus e a terra.",
    );
  });

  it("maps versiculos to verses with numero → verse and texto → text", () => {
    const result = normalizeLivroBibliaDB(
      rawGn,
      { slug: "gn", testament: "OLD" },
      0,
    );
    const firstVerse = result.chapters[0]!.verses[0]!;
    expect(firstVerse.verse).toBe(1);
    expect(firstVerse.text).toBe("No princípio criou Deus os céus e a terra.");
  });

  it("throws if raw is not an object", () => {
    expect(() =>
      normalizeLivroBibliaDB("invalid", { slug: "gn", testament: "OLD" }, 0),
    ).toThrow();
  });

  it("throws if livro is missing or empty", () => {
    expect(() =>
      normalizeLivroBibliaDB(
        { livro: "", capitulos: [] },
        { slug: "gn", testament: "OLD" },
        0,
      ),
    ).toThrow();
  });

  it("throws if capitulos is not an array", () => {
    expect(() =>
      normalizeLivroBibliaDB(
        { livro: "Gênesis", capitulos: {} },
        { slug: "gn", testament: "OLD" },
        0,
      ),
    ).toThrow();
  });
});
