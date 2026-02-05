import { BaseRepository } from "../../base.repository";
import { PrismaClient } from "@/libs/prisma";
import type {
  BibleChapter,
  BibleChapterFindManyArgs,
  BibleChapterCountArgs,
  BibleChapterUncheckedCreateInput,
} from "@/libs/prisma";

export interface CreateBibleChapterInput {
  bookId: string;
  number: number;
  totalVerses: number;
}

export interface UpdateBibleChapterInput {
  number?: number;
  totalVerses?: number;
}

export class BibleChapterRepository extends BaseRepository<
  BibleChapter,
  BibleChapterUncheckedCreateInput,
  UpdateBibleChapterInput
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
    return this.prisma.bibleChapter.findUnique({
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
    args?: Omit<BibleChapterFindManyArgs, "where">;
  }): Promise<BibleChapter[]> {
    return this.prisma.bibleChapter.findMany({
      where: { bookId },
      orderBy: { number: "asc" },
      ...args,
    });
  }

  async findWithVerses({ chapterId }: { chapterId: string }) {
    return this.prisma.bibleChapter.findUnique({
      where: { id: chapterId },
      include: {
        verses: {
          orderBy: { number: "asc" },
        },
      },
    });
  }
}
