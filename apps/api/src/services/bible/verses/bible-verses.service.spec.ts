import { mockBibleDb } from "@/db/__mocks__/mock-db";
import { BibleVerse } from "@/repositories";
import { createMockedBibleVerseRepository } from "@/repositories/bible/verses/__mocks__/bible-verse.repository.mock";
import type { MockedBibleVerseRepository } from "@/repositories/bible/verses/__mocks__/bible-verse.repository.mock";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BibleVersesService } from "./bible-verses.service";

const mockVerses = mockBibleDb.verses;

describe("Bible verses service", () => {
  let bibleVerseMockRepo: MockedBibleVerseRepository;
  let bibleVerseService: BibleVersesService;

  beforeEach(() => {
    vi.clearAllMocks();
    bibleVerseMockRepo = createMockedBibleVerseRepository();
    bibleVerseService = new BibleVersesService(bibleVerseMockRepo);
  });

  describe("fetchVerses", () => {
    it("returns verses with correct pagination for a given chapterId", async () => {
      const chapterId = "5af68e97-265a-415b-baf7-7fe0b886ee8b"; // Genesis Chapter 1 ID
      const limit = 2;
      const page = 1;
      const filteredVerses = mockVerses.filter(
        (v: BibleVerse) => v.chapterId === chapterId,
      );

      vi.mocked(bibleVerseMockRepo.findMany.orderBy).mockResolvedValue(
        filteredVerses.slice(0, limit),
      );
      bibleVerseMockRepo.__setCount(filteredVerses.length);

      const data = await bibleVerseService.fetchVerses({
        chapterId,
        page: page.toString(),
        limit: limit.toString(),
      });

      expect(
        bibleVerseMockRepo.findMany.where,
        "where method of findMany should be called!",
      ).toHaveBeenCalled();
      expect(
        data.pagination.totalItems,
        "Total items should be equal to filtered verses length",
      ).toBe(filteredVerses.length);
      expect(
        data.verses.length,
        "Verses length should be equal to the limit",
      ).toBe(limit);
      expect(data.pagination.currentPage).toBe(page);
      expect(data.pagination.itemsPerPage).toBe(limit);
    });

    it("uses default pagination when params are not provided", async () => {
      const chapterId = "5af68e97-265a-415b-baf7-7fe0b886ee8b"; // Genesis Chapter 1 ID
      const defaultLimit = 10;
      const defaultPage = 1;
      const filteredVerses = mockVerses.filter(
        (v: BibleVerse) => v.chapterId === chapterId,
      );

      vi.mocked(bibleVerseMockRepo.findMany.orderBy).mockResolvedValue(
        filteredVerses.slice(0, defaultLimit),
      );
      bibleVerseMockRepo.__setCount(filteredVerses.length);

      const data = await bibleVerseService.fetchVerses({ chapterId });

      expect(data.pagination.currentPage).toBe(defaultPage);
      expect(data.pagination.itemsPerPage).toBe(defaultLimit);
      expect(bibleVerseMockRepo.findMany.offset).toHaveBeenCalledWith(0);
      expect(bibleVerseMockRepo.findMany.limit).toHaveBeenCalledWith(
        defaultLimit,
      );
    });

    it("throws invalid limit error", async () => {
      const chapterId = "5af68e97-265a-415b-baf7-7fe0b886ee8b"; // Genesis Chapter 1 ID
      await expect(
        bibleVerseService.fetchVerses({
          chapterId,
          limit: "-1",
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");

      await expect(
        bibleVerseService.fetchVerses({
          chapterId,
          limit: "101",
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");

      await expect(
        bibleVerseService.fetchVerses({
          chapterId,
          limit: "invalid_limit",
        }),
      ).rejects.toThrowError("Limit must be a number between 1 and 100!");
    });

    it("throws invalid page error", async () => {
      const chapterId = "5af68e97-265a-415b-baf7-7fe0b886ee8b"; // Genesis Chapter 1 ID
      await expect(
        bibleVerseService.fetchVerses({
          chapterId,
          page: "0",
        }),
      ).rejects.toThrowError("Page must be a positive number!");

      await expect(
        bibleVerseService.fetchVerses({
          chapterId,
          page: "invalid_page",
        }),
      ).rejects.toThrowError("Page must be a positive number!");
    });
  });

  describe("fetchVerseById", () => {
    it("returns verse when id is valid", async () => {
      const verseId = "verse1";
      const expectedVerse: BibleVerse | undefined = mockVerses.find(
        (v: BibleVerse) => v.id === verseId,
      );
      bibleVerseMockRepo.__setFindWithRelations(expectedVerse);

      const data = await bibleVerseService.fetchVerseById({
        verseId,
      });
      expect(data).toEqual(expectedVerse);
    });

    it("returns null when verse is not found", async () => {
      const verseId = "non-existent-verse";
      bibleVerseMockRepo.__setFindWithRelations(null);

      const data = await bibleVerseService.fetchVerseById({
        verseId,
      });
      expect(data).toBeNull();
    });
  });

  describe("fetchVerseByNumber", () => {
    it("returns verse when chapter id and verse number are valid", async () => {
      const chapterId = "5af68e97-265a-415b-baf7-7fe0b886ee8b"; // Genesis Chapter 1 ID
      const verseNumber = 1;
      const expectedVerse: BibleVerse | undefined = mockVerses.find(
        (v: BibleVerse) =>
          v.chapterId === chapterId && v.number === verseNumber,
      );
      bibleVerseMockRepo.__setFindByChapterAndNumber(expectedVerse);

      const data = await bibleVerseService.fetchVerseByNumber({
        chapterId,
        verseNumber,
      });
      expect(data).toEqual(expectedVerse);
    });

    it("returns null when verse is not found by chapter id and number", async () => {
      const chapterId = "5af68e97-265a-415b-baf7-7fe0b886ee8b"; // Genesis Chapter 1 ID
      const verseNumber = 999;
      bibleVerseMockRepo.__setFindByChapterAndNumber(null);

      const data = await bibleVerseService.fetchVerseByNumber({
        chapterId,
        verseNumber,
      });
      expect(data).toBeNull();
    });
  });
});
