import { BaseRepository } from "../../base.repository";
import { PrismaClient } from "@/libs/prisma";
import type { BibleBook, Prisma, Testament } from "@/libs/prisma";

export class BibleBookRepository extends BaseRepository<
  BibleBook,
  Prisma.BibleBookUncheckedCreateInput,
  Prisma.BibleBookUncheckedUpdateInput,
  Prisma.BibleBookFindManyArgs,
  Prisma.BibleBookCountArgs
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
    args?: Omit<Prisma.BibleBookFindManyArgs, "where">;
  }): Promise<BibleBook[]> {
    return await this.prisma.bibleBook.findMany({
      where: { testament },
      ...args,
    });
  }

  async findWithChapters({ bookId }: { bookId: string }) {
    return await this.prisma.bibleBook.findUnique({
      where: { id: bookId },
      include: {
        chapters: {
          orderBy: { number: "asc" },
        },
      },
    });
  }

  async findAllOrderedByOrder(
    args?: Omit<Prisma.BibleBookFindManyArgs, "orderBy">,
  ): Promise<BibleBook[]> {
    return await this.prisma.bibleBook.findMany({
      orderBy: { order: "asc" },
      ...args,
    });
  }
}
