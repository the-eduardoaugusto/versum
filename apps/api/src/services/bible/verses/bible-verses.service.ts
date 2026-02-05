import { BibleVerseRepository } from "@/repositories";
import { prisma, Prisma } from "@/libs/prisma";
import { Pagination, validateQueryPaginationAndParse } from "@/utils";
import { PaginationViewModel } from "@/viewmodels";

export interface FetchVersesParams {
  chapterId: string;
  page?: string;
  limit?: string;
}

export class BibleVersesService {
  private verseRepository: BibleVerseRepository;

  constructor(repository?: BibleVerseRepository) {
    this.verseRepository = repository ?? new BibleVerseRepository(prisma);
  }

  async fetchVerses({
    chapterId,
    page = "1",
    limit = "10",
  }: Partial<Pagination> & { chapterId: string }) {
    const { limit: parsedLimit, page: parsedPage } =
      validateQueryPaginationAndParse({
        page,
        limit,
      });

    const skip = (parsedPage - 1) * parsedLimit;

    const args: Prisma.BibleVerseFindManyArgs = {
      where: { chapterId },
      skip,
      take: parsedLimit,
      orderBy: { number: "asc" },
    };

    const countArgs: Prisma.BibleVerseCountArgs = { where: { chapterId } };

    const [verses, totalVerses] = await Promise.all([
      this.verseRepository.findMany(args),
      this.verseRepository.count(countArgs),
    ]);

    const totalPages = Math.ceil(totalVerses / parsedLimit);

    return {
      verses,
      pagination: new PaginationViewModel({
        currentPage: parsedPage,
        totalPages,
        totalItems: totalVerses,
        itemsPerPage: parsedLimit,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
      }),
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
