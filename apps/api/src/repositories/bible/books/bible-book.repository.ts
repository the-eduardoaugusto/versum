import { BaseRepository } from "../../base.repository";
import { PrismaClient } from "@/libs/prisma";
import type {
  BibleBook,
  BibleBookFindManyArgs,
  BibleBookCountArgs,
  BibleBookUncheckedCreateInput,
  Testament,
} from "@/libs/prisma";

export interface CreateBibleBookInput {
  name: string;
  order: number;
  testament: Testament;
  totalChapters: number;
}

export interface UpdateBibleBookInput {
  name?: string;
  testament?: Testament;
  totalChapters?: number;
}

export class BibleBookRepository extends BaseRepository<
  BibleBook,
  BibleBookUncheckedCreateInput,
  UpdateBibleBookInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.bibleBook);
  }

  async findByName({
    bookName,
  }: {
    bookName: string;
  }): Promise<BibleBook | null> {
    return this.prisma.bibleBook.findUnique({ where: { name: bookName } });
  }

  async findByOrder({
    bookOrder,
  }: {
    bookOrder: number;
  }): Promise<BibleBook | null> {
    return this.prisma.bibleBook.findUnique({ where: { order: bookOrder } });
  }

  async findByTestament({
    testament,
    args,
  }: {
    testament: Testament;
    args?: Omit<BibleBookFindManyArgs, "where">;
  }): Promise<BibleBook[]> {
    return this.prisma.bibleBook.findMany({
      where: { testament },
      ...args,
    });
  }

  async findWithChapters({ bookId }: { bookId: string }) {
    return this.prisma.bibleBook.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          orderBy: { number: "asc" },
        },
      },
    });
  }

  async findAllOrderedByOrder(
    args?: Omit<BibleBookFindManyArgs, "orderBy">,
  ): Promise<BibleBook[]> {
    return this.prisma.bibleBook.findMany({
      orderBy: { order: "asc" },
      ...args,
    });
  }
}
