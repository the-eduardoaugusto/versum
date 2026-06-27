import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError } from "@/utils/app/errors/index";
import type {
  ChapterWithContent,
  JourneyRepositoryV1,
} from "../repositories/journey.v1.repository";
import { JourneyServiceV1 } from "./journey.v1.service";

const mockChapterData: ChapterWithContent = {
  chapter: {
    id: "223e4567-e89b-12d3-a456-426614174001",
    number: 1,
    totalVerses: 31,
    bookId: "123e4567-e89b-12d3-a456-426614174000",
  },
  book: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    order: 1,
    name: "Genesis",
    slug: "genesis",
    niceName: "Gênesis",
    testament: "OLD" as const,
    totalChapters: 50,
  },
  verses: [
    {
      id: "323e4567-e89b-12d3-a456-426614174002",
      chapterId: "223e4567-e89b-12d3-a456-426614174001",
      number: 1,
      text: "In the beginning God created the heavens and the earth.",
    },
    {
      id: "423e4567-e89b-12d3-a456-426614174003",
      chapterId: "223e4567-e89b-12d3-a456-426614174001",
      number: 2,
      text: "And the earth was without form, and void.",
    },
  ],
};

const createMockRepository = () => ({
  findNextChapterToRead: vi.fn<() => Promise<ChapterWithContent | null>>(),
  findChaptersAfter: vi
    .fn<() => Promise<ChapterWithContent[]>>()
    .mockResolvedValue([]),
  markChapterAsRead: vi.fn<() => Promise<void>>(),
  getReadChaptersCount: vi.fn<() => Promise<number>>(),
  getTotalChapters: vi.fn<() => Promise<number>>(),
  isChapterRead: vi.fn<() => Promise<boolean>>().mockResolvedValue(false),
  findChapterById: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
});

const createMockTransaction = () =>
  vi.fn((callback: (tx: unknown) => unknown) =>
    callback({}),
  ) as unknown as typeof import("../../../../infrastructure/db").db.transaction;

describe("JourneyServiceV1", () => {
  let service: JourneyServiceV1;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getFeed", () => {
    it("should return feed with current chapter and next items for new user", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findNextChapterToRead.mockResolvedValue(mockChapterData);
      mockRepo.findChaptersAfter.mockResolvedValue([]);
      mockRepo.getTotalChapters.mockResolvedValue(1189);
      mockRepo.getReadChaptersCount.mockResolvedValue(0);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
      });

      const result = await service.getFeed("new-user", 4);

      expect(result.current).not.toBeNull();
      expect(result.current?.chapter.id).toBe(mockChapterData.chapter.id);
      expect(result.current?.book.name).toBe("Genesis");
      expect(result.nextItems).toEqual([]);
      expect(result.progress.chaptersRead).toBe(0);
      expect(result.progress.chaptersRemaining).toBe(1189);
      expect(result.progress.isAtEnd).toBe(false);
    });

    it("should return feed with next items when bufferSize > 0", async () => {
      const nextChapter = {
        ...mockChapterData,
        chapter: {
          ...mockChapterData.chapter,
          id: "next-chapter-id",
          number: 2,
        },
      };
      const mockRepo = createMockRepository();
      mockRepo.findNextChapterToRead.mockResolvedValue(mockChapterData);
      mockRepo.findChaptersAfter.mockResolvedValue([nextChapter]);
      mockRepo.getTotalChapters.mockResolvedValue(1189);
      mockRepo.getReadChaptersCount.mockResolvedValue(0);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
      });

      const result = await service.getFeed("user-123", 4);

      expect(result.current).not.toBeNull();
      expect(result.nextItems).toHaveLength(1);
      expect(result.nextItems[0]?.chapter.id).toBe("next-chapter-id");
      expect(mockRepo.findChaptersAfter).toHaveBeenCalledWith(
        mockChapterData.chapter.id,
        4,
      );
    });

    it("should return empty nextItems when bufferSize is 0", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findNextChapterToRead.mockResolvedValue(mockChapterData);
      mockRepo.getTotalChapters.mockResolvedValue(1189);
      mockRepo.getReadChaptersCount.mockResolvedValue(0);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
      });

      const result = await service.getFeed("user-123", 0);

      expect(result.nextItems).toHaveLength(0);
      expect(mockRepo.findChaptersAfter).not.toHaveBeenCalled();
    });

    it("should return null current when no chapter found", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findNextChapterToRead.mockResolvedValue(null);
      mockRepo.getTotalChapters.mockResolvedValue(1189);
      mockRepo.getReadChaptersCount.mockResolvedValue(1189);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
      });

      const result = await service.getFeed("user-123", 4);

      expect(result.current).toBeNull();
      expect(result.progress.isAtEnd).toBe(true);
    });

    it("should calculate correct progress when user has readings", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findNextChapterToRead.mockResolvedValue(mockChapterData);
      mockRepo.findChaptersAfter.mockResolvedValue([]);
      mockRepo.getTotalChapters.mockResolvedValue(100);
      mockRepo.getReadChaptersCount.mockResolvedValue(50);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
      });

      const result = await service.getFeed("user-123", 4);

      expect(result.progress.chaptersRead).toBe(50);
      expect(result.progress.chaptersRemaining).toBe(50);
      expect(result.progress.percentComplete).toBe(50);
      expect(result.progress.isAtEnd).toBe(false);
    });
  });

  describe("markCurrentAsRead", () => {
    it("should mark chapter as read when it matches the expected current chapter", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findChapterById.mockResolvedValue(true);
      mockRepo.isChapterRead.mockResolvedValue(false);
      mockRepo.findNextChapterToRead.mockResolvedValue(mockChapterData);
      mockRepo.markChapterAsRead.mockResolvedValue();
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
        transaction: createMockTransaction(),
      });

      const result = await service.markCurrentAsRead(
        "user-123",
        mockChapterData.chapter.id,
      );

      expect(result).toEqual({ success: true });
      expect(mockRepo.markChapterAsRead).toHaveBeenCalledWith(
        {
          userId: "user-123",
          chapterId: mockChapterData.chapter.id,
        },
        expect.anything(),
      );
    });

    it("should be idempotent when the chapter was already marked as read", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findChapterById.mockResolvedValue(true);
      mockRepo.isChapterRead.mockResolvedValue(true);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
        transaction: createMockTransaction(),
      });

      const result = await service.markCurrentAsRead(
        "user-123",
        mockChapterData.chapter.id,
      );

      expect(result).toEqual({ success: true });
      expect(mockRepo.markChapterAsRead).not.toHaveBeenCalled();
      expect(mockRepo.findNextChapterToRead).not.toHaveBeenCalled();
    });

    it("should throw ConflictError when chapterId does not match the expected current chapter", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findChapterById.mockResolvedValue(true);
      mockRepo.isChapterRead.mockResolvedValue(false);
      mockRepo.findNextChapterToRead.mockResolvedValue(mockChapterData);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
        transaction: createMockTransaction(),
      });

      await expect(
        service.markCurrentAsRead("user-123", "stale-chapter-id"),
      ).rejects.toThrow(ConflictError);
      expect(mockRepo.markChapterAsRead).not.toHaveBeenCalled();
    });

    it("should throw ConflictError when there is no chapter pending confirmation", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findChapterById.mockResolvedValue(true);
      mockRepo.isChapterRead.mockResolvedValue(false);
      mockRepo.findNextChapterToRead.mockResolvedValue(null);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
        transaction: createMockTransaction(),
      });

      await expect(
        service.markCurrentAsRead("user-123", mockChapterData.chapter.id),
      ).rejects.toThrow(ConflictError);
      expect(mockRepo.markChapterAsRead).not.toHaveBeenCalled();
    });

    it("should throw NotFoundError when chapterId does not exist", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findChapterById.mockResolvedValue(false);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
        transaction: createMockTransaction(),
      });

      await expect(
        service.markCurrentAsRead("user-123", "non-existent-chapter-id"),
      ).rejects.toThrow(NotFoundError);
      expect(mockRepo.isChapterRead).not.toHaveBeenCalled();
      expect(mockRepo.markChapterAsRead).not.toHaveBeenCalled();
    });

    it("should mark the first chapter as read for a user with no reading history", async () => {
      const mockRepo = createMockRepository();
      mockRepo.findChapterById.mockResolvedValue(true);
      mockRepo.isChapterRead.mockResolvedValue(false);
      mockRepo.findNextChapterToRead.mockResolvedValue(mockChapterData);
      mockRepo.markChapterAsRead.mockResolvedValue();
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
        transaction: createMockTransaction(),
      });

      const result = await service.markCurrentAsRead(
        "new-user",
        mockChapterData.chapter.id,
      );

      expect(result).toEqual({ success: true });
    });
  });

  describe("getStatus", () => {
    it("should return correct status for user with readings", async () => {
      const mockRepo = createMockRepository();
      mockRepo.getReadChaptersCount.mockResolvedValue(100);
      mockRepo.getTotalChapters.mockResolvedValue(1189);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
      });

      const result = await service.getStatus("user-123");

      expect(result.chaptersRead).toBe(100);
      expect(result.chaptersRemaining).toBe(1089);
      expect(result.totalChapters).toBe(1189);
      expect(result.percentComplete).toBe(8);
      expect(result.isAtEnd).toBe(false);
    });

    it("should return isAtEnd true when all chapters read", async () => {
      const mockRepo = createMockRepository();
      mockRepo.getReadChaptersCount.mockResolvedValue(1189);
      mockRepo.getTotalChapters.mockResolvedValue(1189);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
      });

      const result = await service.getStatus("user-123");

      expect(result.isAtEnd).toBe(true);
      expect(result.chaptersRemaining).toBe(0);
    });

    it("should return 0 percent when no chapters read", async () => {
      const mockRepo = createMockRepository();
      mockRepo.getReadChaptersCount.mockResolvedValue(0);
      mockRepo.getTotalChapters.mockResolvedValue(1189);
      service = new JourneyServiceV1({
        repository: mockRepo as unknown as JourneyRepositoryV1,
      });

      const result = await service.getStatus("new-user");

      expect(result.chaptersRead).toBe(0);
      expect(result.percentComplete).toBe(0);
      expect(result.isAtEnd).toBe(false);
    });
  });
});
