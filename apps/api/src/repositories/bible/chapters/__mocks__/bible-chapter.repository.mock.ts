import type {
  BibleChapterRepository,
  BibleChapter,
} from "@/repositories/bible/chapters/bible-chapter.repository";
import { vi } from "vitest";
import { bibleChapters } from "@/db/schema";

export type MockedBibleChapterRepository = BibleChapterRepository & {
  __setCount(value: number): void;
  __setFindWithVerses(
    value: Awaited<ReturnType<BibleChapterRepository["findWithVerses"]>>,
  ): void;
  __setFindByBookAndNumber(
    value: Awaited<ReturnType<BibleChapterRepository["findByBookAndNumber"]>>,
  ): void;
  __setFindByBookId(value: BibleChapter[]): void;
};

export const createMockedBibleChapterRepository =
  (): MockedBibleChapterRepository => {
    let countValue = 0;
    let findWithVersesValue: Awaited<
      ReturnType<BibleChapterRepository["findWithVerses"]>
    > = undefined;
    let findByBookAndNumberValue: Awaited<
      ReturnType<BibleChapterRepository["findByBookAndNumber"]>
    > = null;
    let findByBookIdValue: BibleChapter[] = [];

    const findManyChain = {
      where: vi.fn(),
      orderBy: vi.fn(),
      offset: vi.fn(),
      limit: vi.fn(),
    };

    findManyChain.where.mockReturnValue(findManyChain);
    findManyChain.orderBy.mockReturnValue(findManyChain);
    findManyChain.offset.mockReturnValue(findManyChain);
    findManyChain.limit.mockReturnValue(findManyChain);

    const countChain = {
      where: vi.fn().mockImplementation(() => ({
        then: (
          onFulfilled: (value: number) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) => Promise.resolve(countValue).then(onFulfilled, onRejected),
      })),
    };

    const repo = {
      table: bibleChapters,
      db: {} as BibleChapterRepository["db"],

      findByBookAndNumber: vi
        .fn()
        .mockImplementation(async () => findByBookAndNumberValue),
      findByBookId: vi.fn().mockImplementation(async () => findByBookIdValue),
      findWithVerses: vi
        .fn()
        .mockImplementation(async () => findWithVersesValue),

      findMany: findManyChain as unknown as BibleChapterRepository["findMany"],
      count: countChain as unknown as BibleChapterRepository["count"],

      __setCount(value: number) {
        countValue = value;
      },
      __setFindWithVerses(
        value: Awaited<ReturnType<BibleChapterRepository["findWithVerses"]>>,
      ) {
        findWithVersesValue = value;
      },
      __setFindByBookAndNumber(
        value: Awaited<
          ReturnType<BibleChapterRepository["findByBookAndNumber"]>
        >,
      ) {
        findByBookAndNumberValue = value;
      },
      __setFindByBookId(value: BibleChapter[]) {
        findByBookIdValue = value;
      },
    };

    return repo as MockedBibleChapterRepository;
  };
