import type { BibleBookRepository } from "@/repositories/bible/books/bible-book.repository";
import { vi } from "vitest";
import { bibleBooks } from "@/db/schema";

export type MockedBibleBookRepository = BibleBookRepository & {
  __setCount(value: number): void;
};

export const createMockedBibleBookRepository =
  (): MockedBibleBookRepository => {
    let countValue = 0;

    // ---------- findMany ----------
    const findManyChain = {
      where: vi.fn(),
      orderBy: vi.fn(),
      offset: vi.fn(),
      limit: vi.fn(),
    };

    findManyChain.where.mockReturnValue(findManyChain);
    findManyChain.orderBy.mockReturnValue(findManyChain);
    findManyChain.offset.mockReturnValue(findManyChain);
    findManyChain.limit.mockResolvedValue([]);

    // ---------- count ----------
    const countChain = {
      where: vi.fn().mockImplementation(async () => [{ count: countValue }]),

      then: (
        onFulfilled: (value: number) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(countValue).then(onFulfilled, onRejected),
    };

    const repo = {
      table: bibleBooks,
      db: {} as BibleBookRepository["db"],

      findByName: vi.fn(),
      findByOrder: vi.fn(),
      findByTestament: vi.fn(),
      findWithChapters: vi.fn(),
      findAllOrderedByOrder: vi.fn(),
      findById: vi.fn(),

      findMany: findManyChain as never as BibleBookRepository["findMany"],
      count: countChain as never as BibleBookRepository["count"],

      __setCount(value: number) {
        countValue = value;
      },
    };

    return repo as MockedBibleBookRepository;
  };
