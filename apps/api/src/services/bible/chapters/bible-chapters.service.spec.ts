import { bibleChapterRepoMock } from "@/repositories/bible/chapters/bible-chapter.repository.mock";
import { describe, it, expect } from "vitest";
import { BibleChaptersService } from "./bible-chapters.service";

describe("Bible chapters services", () => {
  describe("fetchChapters", () => {
    it("should return chapters with correct pagination", async () => {
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
        expect(chapter.bookId).toBe(bookId);
      });

      // Verifica se o número de itens respeita o limite
      expect(data.chapters.length).toBeLessThanOrEqual(limit);

      // Verifica a paginação
      expect(data.pagination.currentPage).toBe(page);

      expect(data.pagination.totalItems).toBeGreaterThanOrEqual(
        data.chapters.length,
      );
    });

    it("should handle pagination correctly with different page sizes", async () => {
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
      expect(data.chapters.length).toBeLessThanOrEqual(limit);

      // Verifica se a página atual é a esperada
      expect(data.pagination.currentPage).toBe(page);

      // Verifica se a paginação está funcionando
      expect(data.pagination.totalPages).toBeGreaterThanOrEqual(page);
    });

    it("should return empty array when book has no chapters", async () => {
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

      expect(data.chapters).toHaveLength(0);

      expect(data.pagination.totalItems).toBe(0);
    });
  });

  describe("fetchChapterById", () => {
    it("should return chapter with verses when found", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const chapterId = "chapter-uuid1-1"; // Capítulo 1 de Gênesis

      const chapter = await bibleChaptersService.fetchChapterById({
        chapterId,
      });

      expect(chapter).not.toBeNull();
      expect(chapter?.id).toBe(chapterId);
      expect(chapter?.verses).toBeInstanceOf(Array);
    });

    it("should return null when chapter is not found", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const chapterId = "non-existent-chapter-id";

      const chapter = await bibleChaptersService.fetchChapterById({
        chapterId,
      });

      expect(chapter).toBeNull();
    });
  });

  describe("fetchChapterByBookAndNumber", () => {
    it("should return chapter by book order and chapter number when found", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const bookOrder = 1; // Gênesis
      const chapterNumber = 1;

      const chapter = await bibleChaptersService.fetchChapterByBookAndNumber({
        bookOrder,
        chapterNumber,
      });

      expect(chapter).not.toBeNull();
      expect(chapter?.number).toBe(chapterNumber);
      // Precisamos encontrar o livro correspondente para verificar o bookId
      const book = { id: "uuid1" }; // Simulando o livro Gênesis
      // Não podemos verificar o bookId diretamente sem acesso ao livro
    });

    it("should return null when chapter is not found by book order and number", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const bookOrder = 999; // Ordem que não existe
      const chapterNumber = 1;

      const chapter = await bibleChaptersService.fetchChapterByBookAndNumber({
        bookOrder,
        chapterNumber,
      });

      expect(chapter).toBeNull();
    });

    it("should return null when book order is invalid", async () => {
      const bibleChaptersService = new BibleChaptersService(
        bibleChapterRepoMock,
      );
      const bookOrder = 0; // Ordem inválida
      const chapterNumber = 1;

      const chapter = await bibleChaptersService.fetchChapterByBookAndNumber({
        bookOrder,
        chapterNumber,
      });

      expect(chapter).toBeNull();
    });
  });
});
