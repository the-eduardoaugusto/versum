import { BaseRepository } from "../../base.repository";
import { PrismaClient } from "@/libs/prisma";
import type {
  BibleVerse,
  BibleVerseFindManyArgs,
  BibleVerseCountArgs,
  BibleVerseUncheckedCreateInput,
} from "@/libs/prisma";

export interface CreateBibleVerseInput {
  chapterId: string;
  number: number;
  text: string;
}

export interface UpdateBibleVerseInput {
  number?: number;
  text?: string;
}

export class BibleVerseRepository extends BaseRepository<
  BibleVerse,
  BibleVerseUncheckedCreateInput,
  UpdateBibleVerseInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.bibleVerse);
  }

  async findByChapterAndNumber({
    chapterId,
    verseNumber,
  }: {
    chapterId: string;
    verseNumber: number;
  }): Promise<BibleVerse | null> {
    return this.prisma.bibleVerse.findUnique({
      where: {
        chapterId_number: { chapterId, number: verseNumber },
      },
    });
  }

  async findByChapterId(
    { chapterId }: { chapterId: string },
    args?: Omit<BibleVerseFindManyArgs, "where">,
  ): Promise<BibleVerse[]> {
    return this.prisma.bibleVerse.findMany({
      where: { chapterId },
      orderBy: { number: "asc" },
      ...args,
    });
  }

  async findWithRelations({ verseId }: { verseId: string }) {
    return this.prisma.bibleVerse.findUnique({
      where: { id: verseId },
      include: {
        likes: true,
        marks: true,
        readings: true,
      },
    });
  }
}
