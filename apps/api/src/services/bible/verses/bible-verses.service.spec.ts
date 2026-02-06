import { bibleVerseRepoMock } from "@/repositories/bible/verses/bible-verse.repository.mock";
import { describe, it, expect } from "vitest";
import { BibleVersesService } from "./bible-verses.service";

describe("Bible verses services", () => {
  describe("fetchVerses", () => {
    it("should return verses with correct pagination", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "chapter-1-1";
      const page = 1;
      const limit = 10;

      const data = await bibleVersesService.fetchVerses({
        chapterId,
        page: String(page),
        limit: String(limit),
      });

      // Verifica se os versículos pertencem ao capítulo correto
      if (data.verses.length > 0) {
        data.verses.forEach((verse) => {
          expect(verse.chapterId).toBe(chapterId);
        });
      }



      // Verifica se o número de itens respeita o limite
      expect(data.verses.length).toBeLessThanOrEqual(limit);

      // Verifica a paginação
      expect(data.pagination.currentPage).toBe(page);

      expect(data.pagination.totalItems).toBeGreaterThanOrEqual(
        data.verses.length,
      );
    });

    it("should handle pagination correctly with different page sizes", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "chapter-1-1"; // Exemplo de ID de capítulo
      const page = 1; // Usando página 1 para garantir que exista
      const limit = 5;

      const data = await bibleVersesService.fetchVerses({
        chapterId,
        page: String(page),
        limit: String(limit),
      });

      // Verifica se o número de itens respeita o limite
      expect(data.verses.length).toBeLessThanOrEqual(limit);

      // Verifica se a página atual é a esperada
      expect(data.pagination.currentPage).toBe(page);

      // Verifica se a paginação está funcionando corretamente
      expect(data.pagination.currentPage).toBeGreaterThanOrEqual(1);
    });

    it("should return empty array when chapter has no verses", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "non-existent-chapter-id";
      const page = 1;
      const limit = 10;

      const data = await bibleVersesService.fetchVerses({
        chapterId,
        page: String(page),
        limit: String(limit),
      });

      expect(data.verses).toHaveLength(0);

      expect(data.pagination.totalItems).toBe(0);
    });
  });

  describe("fetchVerseById", () => {
    it("should return verse with relations when found", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const verseId = "verse-1"; // Exemplo de ID de versículo

      const verse = await bibleVersesService.fetchVerseById({ verseId });

      expect(verse).not.toBeNull();
      expect(verse?.id).toBe(verseId);
      expect(verse?.likes).toBeDefined();
      expect(verse?.marks).toBeDefined();
      expect(verse?.readings).toBeDefined();
    });

    it("should return null when verse is not found", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const verseId = "non-existent-verse-id";

      const verse = await bibleVersesService.fetchVerseById({ verseId });

      expect(verse).toBeNull();
    });
  });

  describe("fetchVerseByNumber", () => {
    it("should return verse by chapter id and verse number when found", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "chapter-1-1";
      const verseNumber = 1;

      const verse = await bibleVersesService.fetchVerseByNumber({
        chapterId,
        verseNumber,
      });

      expect(verse).not.toBeNull();
      expect(verse?.number).toBe(verseNumber);
      expect(verse?.chapterId).toBe(chapterId);
    });

    it("should return null when verse is not found by chapter id and number", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "non-existent-chapter-id";
      const verseNumber = 999; // Número que não existe

      const verse = await bibleVersesService.fetchVerseByNumber({
        chapterId,
        verseNumber,
      });

      expect(verse).toBeNull();
    });

    it("should return null when verse number is invalid", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "chapter-1-1";
      const verseNumber = 0; // Número inválido

      const verse = await bibleVersesService.fetchVerseByNumber({
        chapterId,
        verseNumber,
      });

      expect(verse).toBeNull();
    });
  });
});
