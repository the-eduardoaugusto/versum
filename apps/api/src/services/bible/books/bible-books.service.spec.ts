import { bibleBookRepoMock } from "@/repositories/bible/books/bible-book.repository.mock";
import { describe, it, expect } from "vitest";
import { BibleBooksService } from "./bible-books.service";
import { Testament } from "@/libs/prisma";

describe("Bible books services", () => {
  describe("fetchBooks", () => {
    it("should return list of books with correct pagination", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const limit = "10";
      const page = "1";
      const data = await bibleBookService.fetchBooks({ page, limit });

      expect(data.pagination.currentPage).toBe(parseInt(page));

      expect(data.pagination.hasNextPage).toBe(
        data.pagination.currentPage < data.pagination.totalPages,
      );

      expect(data.pagination.hasPrevPage).toBe(data.pagination.currentPage > 1);

      // Verifica se o número de itens retornados não excede o limite
      expect(data.books.length).toBeLessThanOrEqual(Number(limit));

      // Verifica se o total de itens está correto (deve ser o total de todos os livros)
      expect(data.pagination.totalItems).toBe(66); // Total de livros bíblicos

      // Verifica se o número de itens retornados respeita o limite
      expect(data.books.length).toBeLessThanOrEqual(Number(limit));

      // Verifica se o total de itens está correto
      expect(data.pagination.totalItems).toBeGreaterThanOrEqual(
        data.books.length,
      );
    });

    it("should filter by testament when provided", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const testament: Testament = "NEW";
      const data = await bibleBookService.fetchBooks({
        testament,
      });

      data.books.forEach((b) => {
        expect(b.testament).toBe(testament);
      });
    });

    it("should throw error for invalid testament", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const invalidTestament = "INVALID" as Testament;

      await expect(
        bibleBookService.fetchBooks({ testament: invalidTestament }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`
        {
          "message": "Testament must be 'OLD' or 'NEW'",
          "success": false,
        }
      `);
    });

    it("should handle pagination correctly with different page sizes", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const limit = "5";
      const page = "2";
      const data = await bibleBookService.fetchBooks({ page, limit });

      // Verifica se o número de itens respeita o limite
      expect(data.books.length).toBeLessThanOrEqual(Number(limit));

      // Verifica se a página atual é a esperada
      expect(data.pagination.currentPage).toBe(parseInt(page));

      // Verifica se a paginação está funcionando
      expect(data.pagination.totalPages).toBeGreaterThan(1);
    });
  });

  describe("fetchBookById", () => {
    it("should return book by id when found", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const bookId = "uuid1"; // Gênesis

      const book = await bibleBookService.fetchBookById({ bookId });

      expect(book).not.toBeNull();
      expect(book?.id).toBe(bookId);
      expect(book?.name).toBe("Gênesis");
    });

    it("should return null when book is not found", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const bookId = "non-existent-id";

      const book = await bibleBookService.fetchBookById({ bookId });

      expect(book).toBeNull();
    });
  });

  describe("fetchBookByOrder", () => {
    it("should return book by order when found", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const bookOrder = 1; // Gênesis

      const book = await bibleBookService.fetchBookByOrder({ bookOrder });

      expect(book).not.toBeNull();
      expect(book?.order).toBe(bookOrder);
      expect(book?.name).toBe("Gênesis");
    });

    it("should return null when book is not found by order", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const bookOrder = 999; // Order that doesn't exist

      const book = await bibleBookService.fetchBookByOrder({ bookOrder });

      expect(book).toBeNull();
    });
  });

  describe("fetchBookByTestament", () => {
    it("should return books filtered by testament with pagination", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const testament: Testament = "NEW";
      const limit = "5";
      const page = "1";

      const data = await bibleBookService.fetchBookByTestament({
        testament,
        limit,
        page,
      });

      // Verifica se todos os livros retornados têm o testamento correto
      data.books.forEach((book) => {
        expect(book.testament).toBe(testament);
      });

      // Verifica se o número de itens respeita o limite
      expect(data.books.length).toBeLessThanOrEqual(Number(limit));

      // Verifica a paginação
      expect(data.pagination.currentPage).toBe(parseInt(page));
    });

    it("should return all books for OLD testament", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const testament: Testament = "OLD";

      const data = await bibleBookService.fetchBookByTestament({ testament });

      // Verifica se todos os livros retornados têm o testamento correto
      data.books.forEach((book) => {
        expect(book.testament).toBe(testament);
      });

      // Verifica se temos o número esperado de livros do Antigo Testamento
      expect(data.books.length).toBeGreaterThan(0);
    });

    it("should handle pagination correctly in fetchBookByTestament", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const testament: Testament = "NEW";
      const limit = "3";
      const page = "1";

      const data = await bibleBookService.fetchBookByTestament({
        testament,
        limit,
        page,
      });

      // Verifica se o número de itens respeita o limite
      expect(data.books.length).toBeLessThanOrEqual(Number(limit));

      // Verifica se todos os livros têm o testamento correto
      data.books.forEach((book) => {
        expect(book.testament).toBe(testament);
      });
    });
  });
});
