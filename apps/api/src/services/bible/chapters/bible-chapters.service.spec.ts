import { mockBibleDb } from "@/db/__mocks__/mock-db";
import { BibleBook, BibleChapter, BibleVerse } from "@/repositories";
import { createMockedBibleChapterRepository } from "@/repositories/bible/chapters/__mocks__/bible-chapter.repository.mock";
import type { MockedBibleChapterRepository } from "@/repositories/bible/chapters/__mocks__/bible-chapter.repository.mock";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BibleChaptersService } from "./bible-chapters.service";

const mockChapters: BibleChapter[] = mockBibleDb.chapters;

describe("Bible chapters service", () => {
  let bibleChapterMockRepo: MockedBibleChapterRepository;
  let bibleChapterService: BibleChaptersService;

  beforeEach(() => {
    vi.clearAllMocks();
    bibleChapterMockRepo = createMockedBibleChapterRepository();
    bibleChapterService = new BibleChaptersService(bibleChapterMockRepo);
  });

  describe("fetchChapters", () => {
    it("returns chapters with correct pagination for a given bookId", async () => {
      const bookId = mockBibleDb.books[0].id;
      const limit = 2;
      const page = 1;
      const filteredChapters = mockChapters.filter(
        (c: BibleChapter) => c.bookId === bookId,
      );

      vi.mocked(bibleChapterMockRepo.findMany.orderBy).mockResolvedValue(
        filteredChapters.slice(0, limit),
      );
      vi.mocked(bibleChapterMockRepo.count.where).mockResolvedValue([
        { count: filteredChapters.length },
      ]);

      const data = await bibleChapterService.fetchChapters({
        bookId,
        page: page,
        limit: limit,
      });

      expect(
        bibleChapterMockRepo.findMany.where,
        "where method of findMany should be called!",
      ).toHaveBeenCalled();
      expect(
        data.pagination.totalItems,
        "Total items should be equal to filtered chapters length",
      ).toBe(filteredChapters.length);
      expect(
        data.chapters.length,
        "Chapters length should be equal to the limit",
      ).toBe(limit);
      expect(data.pagination.currentPage).toBe(page);
      expect(data.pagination.itemsPerPage).toBe(limit);
    });

    it("uses default pagination when params are not provided", async () => {
      const bookId = "4a331c13-6ebb-42a6-94b7-060c4774f9d7"; // Genesis ID
      const defaultLimit = 10;
      const defaultPage = 1;
      const filteredChapters = mockChapters.filter(
        (c: BibleChapter) => c.bookId === bookId,
      );

      vi.mocked(bibleChapterMockRepo.findMany.orderBy).mockResolvedValue(
        filteredChapters.slice(0, defaultLimit),
      );
      vi.mocked(bibleChapterMockRepo.count.where).mockResolvedValue([
        { count: filteredChapters.length },
      ]);

      const data = await bibleChapterService.fetchChapters({ bookId });

      expect(data.pagination.currentPage).toBe(defaultPage);
      expect(data.pagination.itemsPerPage).toBe(defaultLimit);
      expect(bibleChapterMockRepo.findMany.offset).toHaveBeenCalledWith(0);
      expect(bibleChapterMockRepo.findMany.limit).toHaveBeenCalledWith(
        defaultLimit,
      );
    });

    it("throws invalid limit error", async () => {
      const bookId = "4a331c13-6ebb-42a6-94b7-060c4774f9d7"; // Genesis ID
      await expect(
        bibleChapterService.fetchChapters({
          bookId,
          limit: "-1",
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");

      await expect(
        bibleChapterService.fetchChapters({
          bookId,
          limit: "101",
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");

      await expect(
        bibleChapterService.fetchChapters({
          bookId,
          limit: "invalid_limit",
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");
    });

    it("throws invalid page error", async () => {
      const bookId = "4a331c13-6ebb-42a6-94b7-060c4774f9d7"; // Genesis ID
      await expect(
        bibleChapterService.fetchChapters({
          bookId,
          page: "0",
        }),
      ).rejects.toThrowError("Page must be a positive number!");

      await expect(
        bibleChapterService.fetchChapters({
          bookId,
          page: "invalid_page",
        }),
      ).rejects.toThrowError("Page must be a positive number!");
    });
  });

  describe("fetchChapterById", () => {
    it("returns chapter when id is valid", async () => {
      const chapterId = "chapter1";
      const chapter = mockChapters.find(
        (c: BibleChapter) => c.id === chapterId,
      );
      const expectedChapter:
        | (BibleChapter & { verses: BibleVerse[] })
        | undefined = chapter
        ? {
            ...chapter,
            verses: mockBibleDb.verses.filter(
              (v: BibleVerse) => v.chapterId === chapterId,
            ),
          }
        : undefined;

      bibleChapterMockRepo.__setFindWithVerses(expectedChapter);

      const data = await bibleChapterService.fetchChapterById({
        chapterId,
      });
      expect(data).toEqual(expectedChapter);
    });

    it("returns null when chapter is not found", async () => {
      const chapterId = "non-existent-chapter";
      bibleChapterMockRepo.__setFindWithVerses(null as unknown as undefined);

      const data = await bibleChapterService.fetchChapterById({
        chapterId,
      });
      expect(data).toBeNull();
    });
  });

  describe("fetchChapterByBookAndNumber", () => {
    it("returns chapter when book order and chapter number are valid", async () => {
      const bookOrder = 1;
      const chapterNumber = 1;
      // In a real scenario, this mock would return a chapter associated with the bookId derived from bookOrder.
      // For unit testing the service, we mock the direct repository call.
      const expectedChapter: BibleChapter = {
        id: "5af68e97-265a-415b-baf7-7fe0b886ee8b", // Genesis Chapter 1 ID
        bookId: "4a331c13-6ebb-42a6-94b7-060c4774f9d7", // Genesis ID
        number: 1,
        totalVerses: 31,
      };
      bibleChapterMockRepo.__setFindByBookAndNumber(expectedChapter);

      const data = await bibleChapterService.fetchChapterByBookAndNumber({
        bookOrder,
        chapterNumber,
      });
      expect(data).toEqual(expectedChapter);
    });

    it("returns null when chapter is not found by book order and number", async () => {
      const bookOrder = 999;
      const chapterNumber = 999;
      bibleChapterMockRepo.__setFindByBookAndNumber(null);

      const data = await bibleChapterService.fetchChapterByBookAndNumber({
        bookOrder,
        chapterNumber,
      });
      expect(data).toBeNull();
    });
  });
});
