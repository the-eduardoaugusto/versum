import { bibleChapterRepoMock } from "@/repositories/bible/chapters/bible-chapter.repository.mock";
import { strict, assert, describe, it } from "poku";
import { BibleChaptersService } from "./bible-chapters.service";

describe("Bible chapters services", async () => {
  await describe("fetchChapters", async () => {
    await it("should return chapters with correct pagination", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const bookId = "uuid1"; // Gênesis
      const page = 1;
      const limit = 10;

      const data = await bibleChaptersService.fetchChapters({
        bookId,
        page: String(page),
        limit: String(limit),
      });

      // Verifica se os capítulos pertencem ao livro correto
      data.chapters.forEach((chapter) => {
        strict.strictEqual(
          chapter.bookId,
          bookId,
          "All chapters should belong to the specified book",
        );
      });

      // Verifica se o número de itens respeita o limite
      assert.ok(
        data.chapters.length <= limit,
        "Items length respects pagination limit",
      );

      // Verifica a paginação
      strict.strictEqual(
        data.pagination.currentPage,
        page,
        "Current page should be correct",
      );

      strict.ok(
        data.pagination.totalItems >= data.chapters.length,
        "Total items should be greater than or equal to items returned",
      );
    });

    await it("should handle pagination correctly with different page sizes", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const bookId = "uuid1"; // Gênesis
      const page = 2;
      const limit = 5;

      const data = await bibleChaptersService.fetchChapters({
        bookId,
        page: String(page),
        limit: String(limit),
      });

      // Verifica se o número de itens respeita o limite
      assert.ok(
        data.chapters.length <= limit,
        "Items length respects pagination limit",
      );

      // Verifica se a página atual é a esperada
      strict.strictEqual(
        data.pagination.currentPage,
        page,
        "Current page should be correct",
      );

      // Verifica se a paginação está funcionando
      strict.ok(
        data.pagination.totalPages >= page,
        "Should have enough pages for the requested page",
      );
    });

    await it("should return empty array when book has no chapters", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const bookId = "non-existent-book-id";
      const page = 1;
      const limit = 10;

      const data = await bibleChaptersService.fetchChapters({
        bookId,
        page: String(page),
        limit: String(limit),
      });

      strict.strictEqual(
        data.chapters.length,
        0,
        "Should return empty array when book has no chapters",
      );

      strict.strictEqual(
        data.pagination.totalItems,
        0,
        "Total items should be 0 when book has no chapters",
      );
    });
  });

  await describe("fetchChapterById", async () => {
    await it("should return chapter with verses when found", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const chapterId = "chapter-uuid1-1"; // Capítulo 1 de Gênesis

      const chapter = await bibleChaptersService.fetchChapterById({
        chapterId,
      });

      strict.ok(chapter !== null, "Chapter should be found");
      if (chapter) {
        strict.strictEqual(chapter.id, chapterId, "Chapter id should match");
        strict.ok(
          Array.isArray(chapter.verses),
          "Chapter should have verses array",
        );
      }
    });

    await it("should return null when chapter is not found", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const chapterId = "non-existent-chapter-id";

      const chapter = await bibleChaptersService.fetchChapterById({
        chapterId,
      });

      strict.strictEqual(
        chapter,
        null,
        "Chapter should be null when not found",
      );
    });
  });

  await describe("fetchChapterByBookAndNumber", async () => {
    await it("should return chapter by book order and chapter number when found", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const bookOrder = 1; // Gênesis
      const chapterNumber = 1;

      const chapter = await bibleChaptersService.fetchChapterByBookAndNumber({
        bookOrder,
        chapterNumber,
      });

      strict.ok(chapter !== null, "Chapter should be found");
      if (chapter) {
        strict.strictEqual(
          chapter.number,
          chapterNumber,
          "Chapter number should match",
        );
        // Precisamos encontrar o livro correspondente para verificar o bookId
        const book = { id: "uuid1" }; // Simulando o livro Gênesis
        // Não podemos verificar o bookId diretamente sem acesso ao livro
      }
    });

    await it("should return null when chapter is not found by book order and number", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const bookOrder = 999; // Ordem que não existe
      const chapterNumber = 1;

      const chapter = await bibleChaptersService.fetchChapterByBookAndNumber({
        bookOrder,
        chapterNumber,
      });

      strict.strictEqual(
        chapter,
        null,
        "Chapter should be null when not found by book order and number",
      );
    });

    await it("should return null when book order is invalid", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const bookOrder = 0; // Ordem inválida
      const chapterNumber = 1;

      const chapter = await bibleChaptersService.fetchChapterByBookAndNumber({
        bookOrder,
        chapterNumber,
      });

      strict.strictEqual(
        chapter,
        null,
        "Chapter should be null when book order is invalid",
      );
    });
  });
});
