import { BaseRepository } from "../../base.repository";
import { PrismaClient } from "@/libs/prisma";
import type { BibleChapter, Prisma } from "@/libs/prisma";

export class BibleChapterRepository extends BaseRepository<
  BibleChapter,
  Prisma.BibleChapterUncheckedCreateInput,
  Prisma.BibleChapterUncheckedUpdateInput,
  Prisma.BibleChapterFindManyArgs,
  Prisma.BibleChapterCountArgs
> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.bibleChapter);
  }

  async findByBookAndNumber({
    bookOrder,
    chapterNumber,
  }: {
    bookOrder: number;
    chapterNumber: number;
  }): Promise<BibleChapter | null> {
    const book = await this.prisma.bibleBook.findFirst({
      where: {
        order: bookOrder,
      },
      select: {
        id: true,
      },
    });
    if (!book) return null;
    return await this.prisma.bibleChapter.findUnique({
      where: {
        bookId_number: { bookId: book.id, number: chapterNumber },
      },
    });
  }

  async findByBookId({
    bookId,
    args,
  }: {
    bookId: string;
    args?: Omit<Prisma.BibleChapterFindManyArgs, "where">;
  }): Promise<BibleChapter[]> {
    return await this.prisma.bibleChapter.findMany({
      where: { bookId },
      orderBy: { number: "asc" },
      ...args,
    });
  }

  async findWithVerses({ chapterId }: { chapterId: string }) {
    return await this.prisma.bibleChapter.findUnique({
      where: { id: chapterId },
      include: {
        verses: {
          orderBy: { number: "asc" },
        },
      },
    });
  }
}
