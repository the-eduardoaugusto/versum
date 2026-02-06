import { BaseRepository } from "../../base.repository";
import type { PrismaClient, BibleVerse, Prisma } from "@/libs/prisma";
export class BibleVerseRepository extends BaseRepository<
  BibleVerse,
  Prisma.BibleVerseUncheckedCreateInput,
  Prisma.BibleVerseUncheckedUpdateInput,
  Prisma.BibleVerseFindManyArgs,
  Prisma.BibleVerseCountArgs
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
    return await this.prisma.bibleVerse.findUnique({
      where: {
        chapterId_number: { chapterId, number: verseNumber },
      },
    });
  }

  async findByChapterId(
    { chapterId }: { chapterId: string },
    args?: Omit<Prisma.BibleVerseFindManyArgs, "where">,
  ): Promise<BibleVerse[]> {
    return await this.prisma.bibleVerse.findMany({
      where: { chapterId },
      orderBy: { number: "asc" },
      ...args,
    });
  }

  async findWithRelations({ verseId }: { verseId: string }) {
    return await this.prisma.bibleVerse.findUnique({
      where: { id: verseId },
      include: {
        likes: true,
        marks: true,
        readings: true,
      },
    });
  }
}
