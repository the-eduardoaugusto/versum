import { bibleVerseRepoMock } from "@/repositories/bible/verses/bible-verse.repository.mock";
import { describe, it } from "node:test";
import { strict, assert } from "poku";
import { BibleVersesService } from "./bible-verses.service";

describe("Bible verses services", async () => {
  await describe("fetchVerses", async () => {
    await it("should return verses with correct pagination", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "chapter-1-1"; // Exemplo de ID de capítulo
      const page = 1;
      const limit = 10;
      
      const data = await bibleVersesService.fetchVerses({ chapterId, page, limit });
      
      // Verifica se os versículos pertencem ao capítulo correto
      if (data.verses.length > 0) {
        data.verses.forEach(verse => {
          strict.strictEqual(
            verse.chapterId,
            chapterId,
            "All verses should belong to the specified chapter"
          );
        });
      }
      
      // Verifica se o número de itens respeita o limite
      assert.ok(
        data.verses.length <= limit,
        "Items length respects pagination limit"
      );
      
      // Verifica a paginação
      strict.strictEqual(
        data.pagination.currentPage,
        page,
        "Current page should be correct"
      );
      
      strict.ok(
        data.pagination.totalItems >= data.verses.length,
        "Total items should be greater than or equal to items returned"
      );
    });

    await it("should handle pagination correctly with different page sizes", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "chapter-1-1"; // Exemplo de ID de capítulo
      const page = 1; // Usando página 1 para garantir que exista
      const limit = 5;

      const data = await bibleVersesService.fetchVerses({ chapterId, page, limit });

      // Verifica se o número de itens respeita o limite
      assert.ok(
        data.verses.length <= limit,
        "Items length respects pagination limit"
      );

      // Verifica se a página atual é a esperada
      strict.strictEqual(
        data.pagination.currentPage,
        page,
        "Current page should be correct"
      );

      // Verifica se a paginação está funcionando corretamente
      strict.ok(
        data.pagination.currentPage >= 1,
        "Current page should be at least 1"
      );
    });

    await it("should return empty array when chapter has no verses", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "non-existent-chapter-id";
      const page = 1;
      const limit = 10;
      
      const data = await bibleVersesService.fetchVerses({ chapterId, page, limit });
      
      strict.strictEqual(
        data.verses.length,
        0,
        "Should return empty array when chapter has no verses"
      );
      
      strict.strictEqual(
        data.pagination.totalItems,
        0,
        "Total items should be 0 when chapter has no verses"
      );
    });
  });

  await describe("fetchVerseById", async () => {
    await it("should return verse with relations when found", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const verseId = "verse-1"; // Exemplo de ID de versículo
      
      const verse = await bibleVersesService.fetchVerseById({ verseId });
      
      strict.ok(verse !== null, "Verse should be found");
      if (verse) {
        strict.strictEqual(verse.id, verseId, "Verse id should match");
        strict.ok(verse.likes !== undefined, "Verse should have likes relation");
        strict.ok(verse.marks !== undefined, "Verse should have marks relation");
        strict.ok(verse.readings !== undefined, "Verse should have readings relation");
      }
    });

    await it("should return null when verse is not found", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const verseId = "non-existent-verse-id";
      
      const verse = await bibleVersesService.fetchVerseById({ verseId });
      
      strict.strictEqual(verse, null, "Verse should be null when not found");
    });
  });

  await describe("fetchVerseByNumber", async () => {
    await it("should return verse by chapter id and verse number when found", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "chapter-1-1";
      const verseNumber = 1;
      
      const verse = await bibleVersesService.fetchVerseByNumber({ 
        chapterId, 
        verseNumber 
      });
      
      strict.ok(verse !== null, "Verse should be found");
      if (verse) {
        strict.strictEqual(verse.number, verseNumber, "Verse number should match");
        strict.strictEqual(verse.chapterId, chapterId, "Verse should belong to the correct chapter");
      }
    });

    await it("should return null when verse is not found by chapter id and number", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "non-existent-chapter-id";
      const verseNumber = 999; // Número que não existe
      
      const verse = await bibleVersesService.fetchVerseByNumber({ 
        chapterId, 
        verseNumber 
      });
      
      strict.strictEqual(verse, null, "Verse should be null when not found by chapter id and number");
    });

    await it("should return null when verse number is invalid", async () => {
      const bibleVersesService = new BibleVersesService(bibleVerseRepoMock);
      const chapterId = "chapter-1-1";
      const verseNumber = 0; // Número inválido
      
      const verse = await bibleVersesService.fetchVerseByNumber({ 
        chapterId, 
        verseNumber 
      });
      
      strict.strictEqual(verse, null, "Verse should be null when verse number is invalid");
    });
  });
});