import type { BibleVerseRepository, BibleVerse } from "@/repositories/bible/verses/bible-verse.repository";
import { vi } from "vitest";
import { bibleVerses } from "@/db/schema";
import type { QueryPromise } from "drizzle-orm/query-promise";
import type { QueryBuilder } from "drizzle-orm/query-builders/query";


// Inferir o tipo do retorno de findWithRelations e findByChapterAndNumber
type FindWithRelationsResult = Awaited<ReturnType<BibleVerseRepository['findWithRelations']>>;
type FindByChapterAndNumberResult = Awaited<ReturnType<BibleVerseRepository['findByChapterAndNumber']>>;

// Tipo simplificado para o objeto retornado por db.select().from(table) para mock
// O Drizzle retorna um QueryBuilder, precisamos simular isso
type MockQueryBuilder<T> = {
  where: ReturnType<typeof vi.fn> & ((...args: any[]) => MockQueryBuilder<T>);
  orderBy: ReturnType<typeof vi.fn> & ((...args: any[]) => Promise<T[] | undefined>); // Onde o valor final é resolvido
  offset: ReturnType<typeof vi.fn> & ((...args: any[]) => MockQueryBuilder<T>);
  limit: ReturnType<typeof vi.fn> & ((...args: any[]) => MockQueryBuilder<T>);
};

// Tipo simplificado para o objeto retornado por db.select({ count: count(...) }).from(table) para mock
type MockCountQueryBuilder = {
  where: ReturnType<typeof vi.fn> & ((...args: any[]) => MockCountQueryBuilder);
  then: (
    onFulfilled: (value: { count: number }[]) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise<{ count: number }[]>;
};


export type MockedBibleVerseRepository = {
  table: typeof bibleVerses;
  db: BibleVerseRepository['db']; // Manter o tipo do db
  findByChapterAndNumber: ReturnType<typeof vi.fn> & ((params: Parameters<BibleVerseRepository['findByChapterAndNumber']>[0]) => Promise<FindByChapterAndNumberResult>);
  findByChapterId: ReturnType<typeof vi.fn> & ((params: Parameters<BibleVerseRepository['findByChapterId']>[0]) => Promise<BibleVerse[]>);
  findWithRelations: ReturnType<typeof vi.fn> & ((params: Parameters<BibleVerseRepository['findWithRelations']>[0]) => Promise<FindWithRelationsResult>);
  findMany: MockQueryBuilder<BibleVerse>; // Usar o tipo do QueryBuilder mockado
  count: MockCountQueryBuilder; // Usar o tipo do CountQueryBuilder mockado
  __setCount(value: number): void;
  __setFindWithRelations(value: FindWithRelationsResult): void;
  __setFindByChapterAndNumber(value: FindByChapterAndNumberResult): void;
};

export const createMockedBibleVerseRepository =
  (): MockedBibleVerseRepository => {
    let countValue = 0;
    let findWithRelationsValue: FindWithRelationsResult = null;
    let findByChapterAndNumberValue: FindByChapterAndNumberResult = null;

    const findManyMock: MockQueryBuilder<BibleVerse> = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn(), // Este é o que recebe mockResolvedValue nos testes
      offset: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    };

    const countMock: MockCountQueryBuilder = {
      where: vi.fn().mockReturnThis(),
      then: vi.fn((
        onFulfilled: (value: { count: number }[]) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve([{ count: countValue }]).then(onFulfilled, onRejected)),
    };

    const repo: MockedBibleVerseRepository = {
      table: bibleVerses,
      db: {} as BibleVerseRepository["db"], // Mantido para compatibilidade, pode ser aprimorado

      findByChapterAndNumber: vi
        .fn<[Parameters<BibleVerseRepository['findByChapterAndNumber']>[0]], Promise<FindByChapterAndNumberResult>>()
        .mockImplementation(async () => findByChapterAndNumberValue),
      findByChapterId: vi.fn<[Parameters<BibleVerseRepository['findByChapterId']>[0]], Promise<BibleVerse[]>>(),
      findWithRelations: vi
        .fn<[Parameters<BibleVerseRepository['findWithRelations']>[0]], Promise<FindWithRelationsResult>>()
        .mockImplementation(async () => findWithRelationsValue),

      findMany: findManyMock,
      count: countMock,

      __setCount(value: number) {
        countValue = value;
      },
      __setFindWithRelations(value: FindWithRelationsResult) {
        findWithRelationsValue = value;
      },
      __setFindByChapterAndNumber(value: FindByChapterAndNumberResult) {
        findByChapterAndNumberValue = value;
      },
    };

    return repo;
  };
