import { BibleVerseRepository } from "@/repositories";
import { prisma, Prisma } from "@/libs/prisma";

export interface FetchVersesParams {
  chapterId: string;
  page: number;
  limit: number;
}

export class BibleVersesService {
  private verseRepository: BibleVerseRepository;

  constructor(repository: BibleVerseRepository) {
    this.verseRepository = repository ?? new BibleVerseRepository(prisma);
  }

  async fetchVerses({ chapterId, page, limit }: FetchVersesParams) {
    const skip = (page - 1) * limit;

    const args: Prisma.BibleVerseFindManyArgs = {
      where: { chapterId },
      skip,
      take: limit,
      orderBy: { number: "asc" },
    };

    const countArgs: Prisma.BibleVerseCountArgs = { where: { chapterId } };

    const [verses, totalVerses] = await Promise.all([
      this.verseRepository.findMany(args),
      this.verseRepository.count(countArgs),
    ]);

    const totalPages = Math.ceil(totalVerses / limit);

    return {
      verses,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalVerses,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async fetchVerseById({ verseId }: { verseId: string }) {
    return this.verseRepository.findWithRelations({ verseId });
  }

  async fetchVerseByNumber({
    chapterId,
    verseNumber,
  }: {
    chapterId: string;
    verseNumber: number;
  }) {
    return this.verseRepository.findByChapterAndNumber({
      chapterId,
      verseNumber,
    });
  }
}
