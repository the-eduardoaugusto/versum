import { mockBibleDb } from "@/db/__mocks__/mock-db";
import { BibleBook } from "@/repositories";
import { createMockedBibleBookRepository } from "@/repositories/bible/books/__mocks__/bible-book.repository.mock";
import type { MockedBibleBookRepository } from "@/repositories/bible/books/__mocks__/bible-book.repository.mock";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BibleBooksService } from "./bible-books.service";

const mockBooks = mockBibleDb.books;

describe("Bible books service", () => {
  let bibleBookMockRepo: MockedBibleBookRepository;
  let bibleBookService: BibleBooksService;

  beforeEach(() => {
    vi.clearAllMocks();
    bibleBookMockRepo = createMockedBibleBookRepository();
    bibleBookService = new BibleBooksService(bibleBookMockRepo);
  });

  describe("fetchBooks", () => {
    it("returns books with correct pagination", async () => {
      const limit = 20;
      const page = 1;

      vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(mockBooks);

      bibleBookMockRepo.__setCount(mockBooks.length);
      //unt: mockBooks.length }]);

      const data = await bibleBookService.fetchBooks({ page, limit });

      expect(
        bibleBookMockRepo.findMany.where,
        "where method of findMany should be called!",
      ).toHaveBeenCalled();
      expect(
        data.pagination.totalItems,
        "Total items should be equal to mockBooks.length",
      ).toBe(mockBooks.length);
      expect(
        data.books.length,
        "Books length should be equal to mockBooks.length",
      ).toBe(mockBooks.length);
    });

    it("uses default pagination when params are not provided", async () => {
      vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(mockBooks);
      bibleBookMockRepo.__setCount(mockBooks.length);

      const data = await bibleBookService.fetchBooks({});

      // Default: page=1 ; limit=10
      expect(data.pagination.currentPage, "Current page should be 1").toBe(1);
      expect(data.pagination.itemsPerPage, "Items per page should be 10").toBe(
        10,
      );
      expect(
        bibleBookMockRepo.findMany.offset,
        "Offset should be 0",
      ).toHaveBeenCalledWith(0);
      expect(
        bibleBookMockRepo.findMany.limit,
        "Limit should be 10",
      ).toHaveBeenCalledWith(10);
    });

    it("uses provided page value of pagination", async () => {
      vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(mockBooks);
      bibleBookMockRepo.__setCount(mockBooks.length);

      const data = await bibleBookService.fetchBooks({
        page: 2,
      });

      expect(data.pagination.currentPage, "Current page should be 2").toBe(2);
      expect(data.pagination.itemsPerPage, "Items per page should be 10").toBe(
        10,
      );
      expect(
        bibleBookMockRepo.findMany.offset,
        "Offset should be 10",
      ).toHaveBeenCalledWith(10);
      expect(
        bibleBookMockRepo.findMany.limit,
        "Limit should be 10",
      ).toHaveBeenCalledWith(10);
    });

    it("uses provided limit value of pagination", async () => {
      vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(mockBooks);
      bibleBookMockRepo.__setCount(mockBooks.length);

      const data = await bibleBookService.fetchBooks({
        limit: 20,
      });

      expect(data.pagination.currentPage, "Current page should be 1").toBe(1);
      expect(data.pagination.itemsPerPage, "Items per page should be 20").toBe(
        20,
      );
      expect(
        bibleBookMockRepo.findMany.offset,
        "Offset should be 0",
      ).toHaveBeenCalledWith(0);
      expect(
        bibleBookMockRepo.findMany.limit,
        "Limit should be 20",
      ).toHaveBeenCalledWith(20);
    });

    it("throws invalid limit error", async () => {
      await expect(
        bibleBookService.fetchBooks({
          limit: -1,
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");

      await expect(
        bibleBookService.fetchBooks({
          limit: 101,
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");

      await expect(
        bibleBookService.fetchBooks({
          limit: "invalid_limit ",
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");
    });

    it("provides all pagination parameters", async () => {
      vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(mockBooks);
      bibleBookMockRepo.__setCount(mockBooks.length);

      const data = await bibleBookService.fetchBooks({
        page: 2,
        limit: 5,
      });

      expect(data.pagination.currentPage, "Current page should be 2").toBe(2);
      expect(data.pagination.itemsPerPage, "Items per page should be 5").toBe(
        5,
      );
      expect(
        bibleBookMockRepo.findMany.offset,
        "Offset should be 5",
      ).toHaveBeenCalledWith(5);
      expect(
        bibleBookMockRepo.findMany.limit,
        "Limit should be 5",
      ).toHaveBeenCalledWith(5);
    });

    describe("fetchBookById", () => {
      it("returns book when id is valid", async () => {
        vi.mocked(bibleBookMockRepo.findById).mockResolvedValue(mockBooks[0]);
        const data = await bibleBookService.fetchBookById({
          bookId: mockBooks[0].id,
        });
        expect(data, "Book should be returned").toEqual(mockBooks[0]);
      });

      it("throws invalid id error", async () => {
        await expect(
          bibleBookService.fetchBookById({
            bookId: "invalid",
          }),
        ).rejects.toThrowError(`Book with id invalid not found!`);
      });

      it("throws book not found", async () => {
        vi.mocked(bibleBookMockRepo.findById).mockResolvedValue(
          null as unknown as BibleBook,
        );
        await expect(
          bibleBookService.fetchBookById({
            bookId: mockBooks[0].id,
          }),
        ).rejects.toThrowError(`Book with id ${mockBooks[0].id} not found!`);
      });
    });

    describe("fetchBookByTestament", () => {
      it("filters books by testament", async () => {
        vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(
          mockBooks,
        );
        bibleBookMockRepo.__setCount(mockBooks.length);

        const data = await bibleBookService.fetchBooksByTestament({
          testament: "OLD",
        });

        expect(data.pagination.currentPage, "Current page should be 1").toBe(1);
        expect(
          data.pagination.itemsPerPage,
          "Items per page should be 10",
        ).toBe(10);
        expect(
          bibleBookMockRepo.findMany.offset,
          "Offset should be 0",
        ).toHaveBeenCalledWith(0);
        expect(
          bibleBookMockRepo.findMany.limit,
          "Limit should be 10",
        ).toHaveBeenCalledWith(10);
      });

      it("throws invalid testament error", async () => {
        await expect(
          bibleBookService.fetchBooksByTestament({
            // @ts-ignore This is a test case
            testament: "invalid",
          }),
        ).rejects.toThrowError(`Testament must be 'OLD' or 'NEW'`);
      });

      it("uses provided pagination parameters", async () => {
        vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(
          mockBooks,
        );
        bibleBookMockRepo.__setCount(mockBooks.length);

        const data = await bibleBookService.fetchBooksByTestament({
          testament: "OLD",
          page: 2,
          limit: 5,
        });

        expect(data.pagination.currentPage, "Current page should be 2").toBe(2);
        expect(data.pagination.itemsPerPage, "Items per page should be 5").toBe(
          5,
        );
        expect(
          bibleBookMockRepo.findMany.offset,
          "Offset should be 5",
        ).toHaveBeenCalledWith(5);
        expect(
          bibleBookMockRepo.findMany.limit,
          "Limit should be 5",
        ).toHaveBeenCalledWith(5);
      });
      it("uses provided page value of pagination", async () => {
        vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(
          mockBooks,
        );
        bibleBookMockRepo.__setCount(mockBooks.length);

        const data = await bibleBookService.fetchBooksByTestament({
          testament: "OLD",
          page: 2,
        });

        expect(data.pagination.currentPage, "Current page should be 2").toBe(2);
      });

      it("uses provided limit value of pagination", async () => {
        vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(
          mockBooks,
        );
        bibleBookMockRepo.__setCount(mockBooks.length);

        const data = await bibleBookService.fetchBooksByTestament({
          testament: "OLD",
          limit: 5,
        });

        expect(data.pagination.itemsPerPage, "Items per page should be 5").toBe(
          5,
        );
      });

      it("throws an error when limit is less than 1", async () => {
        vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(
          mockBooks,
        );
        bibleBookMockRepo.__setCount(mockBooks.length);

        await expect(
          bibleBookService.fetchBooksByTestament({
            testament: "OLD",
            limit: 0,
          }),
        ).rejects.toThrowError("Limit must be a number between 1 and 100!");
      });
    });

    it("throws an error when page is less than 1", async () => {
      vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(mockBooks);
      bibleBookMockRepo.__setCount(mockBooks.length);

      await expect(
        bibleBookService.fetchBooksByTestament({
          testament: "OLD",
          page: 0,
        }),
      ).rejects.toThrowError("Page must be a positive number!");
    });

    it("throws an error when page is a invalid number", async () => {
      vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(mockBooks);
      bibleBookMockRepo.__setCount(mockBooks.length);

      await expect(
        bibleBookService.fetchBooksByTestament({
          testament: "OLD",
          page: "invalid",
        }),
      ).rejects.toThrowError("Page must be a positive number!");
    });
    it("throws an error when limit is greater than 100", async () => {
      vi.mocked(bibleBookMockRepo.findMany.limit).mockResolvedValue(mockBooks);
      bibleBookMockRepo.__setCount(mockBooks.length);

      await expect(
        bibleBookService.fetchBooksByTestament({
          testament: "OLD",
          limit: 101,
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");
    });
    it("throws an error when limit is not a number", async () => {
      vi.mocked(bibleBookMockRepo.findById).mockResolvedValue(
        mockBooks[0] as unknown as BibleBook,
      );
      await expect(
        bibleBookService.fetchBooksByTestament({
          testament: "OLD",
          limit: "invalid",
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");
    });
  });
  describe("fetchBookById", () => {
    it("returns a book when id is valid", async () => {
      vi.mocked(bibleBookMockRepo.findById).mockResolvedValue(
        mockBooks[0] as unknown as BibleBook,
      );
      bibleBookMockRepo.__setCount(mockBooks.length);
      const book = await bibleBookService.fetchBookById({
        bookId: mockBooks[0].id,
      });
      expect(book).toBeDefined();
    });
    it("returns undefined when id is invalid", async () => {
      vi.mocked(bibleBookMockRepo.findById).mockResolvedValue(null);
      bibleBookMockRepo.__setCount(mockBooks.length);
      await expect(
        bibleBookService.fetchBookById({
          bookId: "invalid",
        }),
      ).rejects.toThrowError("Book with id invalid not found!");
    });
  });
});
