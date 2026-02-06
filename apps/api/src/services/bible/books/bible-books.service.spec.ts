import { bibleBookRepoMock } from "@/repositories/bible/books/bible-book.repository.mock";
import { describe, it } from "node:test";
import { strict, assert } from "poku";
import { BibleBooksService } from "./bible-books.service";
import { Testament } from "@/libs/prisma";

describe("Bible books services", async () => {
  await describe("fetchBooks", async () => {
    await it("should return list of books with correct pagination", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const limit = "10";
      const page = "1";
      const data = await bibleBookService.fetchBooks({ page, limit });
      strict.strictEqual(
        data.pagination.currentPage,
        parseInt(page),
        "Current page is not correct!",
      );

      strict.strictEqual(
        data.pagination.currentPage < data.pagination.totalPages,
        data.pagination.hasNextPage,
        "Has next page is not correct!",
      );

      strict.strictEqual(
        data.pagination.currentPage > 1,
        data.pagination.hasPrevPage,
        "Has prev page is not correct!",
      );

      // Verifica se o número de itens retornados não excede o limite
      assert.ok(
        data.books.length <= Number(limit),
        "Items length respects pagination limit.",
      );

      // Verifica se o total de itens está correto (deve ser o total de todos os livros)
      strict.strictEqual(
        data.pagination.totalItems,
        66, // Total de livros bíblicos
        "Total items of pagination is not correct!",
      );

      // Verifica se o número de itens retornados respeita o limite
      assert.ok(
        data.books.length <= Number(limit),
        "Items length respects pagination limit.",
      );

      // Verifica se o total de itens está correto
      assert.ok(
        data.pagination.totalItems >= data.books.length,
        "Total items is greater than or equal to items returned.",
      );
    });

    await it("should filter by testament when provided", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const testament: Testament = "NEW";
      const data = await bibleBookService.fetchBooks({
        testament,
      });

      data.books.forEach((b) => {
        strict.strictEqual(
          b.testament,
          testament,
          "Service has returned an invalid list of books",
        );
      });
    });

    await it("should throw error for invalid testament", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const invalidTestament = "INVALID" as Testament;

      await assert.rejects(
        async () => {
          await bibleBookService.fetchBooks({ testament: invalidTestament });
        },
        {
          name: "BadRequestError",
          message: "Testament must be 'OLD' or 'NEW'",
        },
        "Should throw BadRequestError for invalid testament",
      );
    });

    await it("should handle pagination correctly with different page sizes", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const limit = "5";
      const page = "2";
      const data = await bibleBookService.fetchBooks({ page, limit });

      // Verifica se o número de itens respeita o limite
      assert.ok(
        data.books.length <= Number(limit),
        "Items length respects pagination limit.",
      );

      // Verifica se a página atual é a esperada
      strict.strictEqual(
        data.pagination.currentPage,
        parseInt(page),
        "Current page is not correct!",
      );

      // Verifica se a paginação está funcionando
      strict.ok(
        data.pagination.totalPages > 1,
        "Should have more than one page with this limit",
      );
    });
  });

  await describe("fetchBookById", async () => {
    await it("should return book by id when found", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const bookId = "uuid1"; // Gênesis

      const book = await bibleBookService.fetchBookById({ bookId });

      strict.ok(book !== null, "Book should be found");
      if (book) {
        strict.strictEqual(book.id, bookId, "Book id should match");
        strict.strictEqual(book.name, "Gênesis", "Book name should be Gênesis");
      }
    });

    await it("should return null when book is not found", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const bookId = "non-existent-id";

      const book = await bibleBookService.fetchBookById({ bookId });

      strict.strictEqual(book, null, "Book should be null when not found");
    });
  });

  await describe("fetchBookByOrder", async () => {
    await it("should return book by order when found", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const bookOrder = 1; // Gênesis

      const book = await bibleBookService.fetchBookByOrder({ bookOrder });

      strict.ok(book !== null, "Book should be found");
      if (book) {
        strict.strictEqual(book.order, bookOrder, "Book order should match");
        strict.strictEqual(book.name, "Gênesis", "Book name should be Gênesis");
      }
    });

    await it("should return null when book is not found by order", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const bookOrder = 999; // Order that doesn't exist

      const book = await bibleBookService.fetchBookByOrder({ bookOrder });

      strict.strictEqual(
        book,
        null,
        "Book should be null when not found by order",
      );
    });
  });

  await describe("fetchBookByTestament", async () => {
    await it("should return books filtered by testament with pagination", async () => {
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
        strict.strictEqual(
          book.testament,
          testament,
          "All books should have the correct testament",
        );
      });

      // Verifica se o número de itens respeita o limite
      assert.ok(
        data.books.length <= Number(limit),
        "Items length respects pagination limit",
      );

      // Verifica a paginação
      strict.strictEqual(
        data.pagination.currentPage,
        parseInt(page),
        "Current page should be correct",
      );
    });

    await it("should return all books for OLD testament", async () => {
      const bibleBookService = new BibleBooksService(bibleBookRepoMock);
      const testament: Testament = "OLD";

      const data = await bibleBookService.fetchBookByTestament({ testament });

      // Verifica se todos os livros retornados têm o testamento correto
      data.books.forEach((book) => {
        strict.strictEqual(
          book.testament,
          testament,
          "All books should have the OLD testament",
        );
      });

      // Verifica se temos o número esperado de livros do Antigo Testamento
      assert.ok(data.books.length > 0, "Should have books in OLD testament");
    });

    await it("should handle pagination correctly in fetchBookByTestament", async () => {
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
      assert.ok(
        data.books.length <= Number(limit),
        "Items length respects pagination limit",
      );

      // Verifica se todos os livros têm o testamento correto
      data.books.forEach((book) => {
        strict.strictEqual(
          book.testament,
          testament,
          "All books should have the correct testament",
        );
      });
    });
  });
});
