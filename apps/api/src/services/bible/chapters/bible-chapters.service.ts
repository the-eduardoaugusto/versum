import { BibleChapterRepository } from "@/repositories";
import { prisma, Prisma } from "@/libs/prisma";
import { Pagination, validateQueryPaginationAndParse } from "@/utils";
import { PaginationViewModel } from "@/viewmodels";

export interface FetchChaptersParams {
  bookId: string;
  page?: string;
  limit?: string;
}

export class BibleChaptersService {
  private chapterRepository: BibleChapterRepository;

  constructor(repository?: BibleChapterRepository) {
    this.chapterRepository = repository ?? new BibleChapterRepository(prisma);
  }

  async fetchChapters({
    bookId,
    page = "1",
    limit = "10",
  }: Partial<Pagination> & { bookId: string }) {
    const { limit: parsedLimit, page: parsedPage } =
      validateQueryPaginationAndParse({
        page,
        limit,
      });

    const skip = (parsedPage - 1) * parsedLimit;

    const args: Prisma.BibleChapterFindManyArgs = {
      where: { bookId },
      skip,
      take: parsedLimit,
      orderBy: { number: "asc" },
    };

    const countArgs: Prisma.BibleChapterCountArgs = { where: { bookId } };

    const [chapters, totalChapters] = await Promise.all([
      this.chapterRepository.findMany(args),
      this.chapterRepository.count(countArgs),
    ]);

    const totalPages = Math.ceil(totalChapters / parsedLimit);

    return {
      chapters,
      pagination: new PaginationViewModel({
        currentPage: parsedPage,
        totalPages,
        totalItems: totalChapters,
        itemsPerPage: parsedLimit,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
      }),
    };
  }

  async fetchChapterById({ chapterId }: { chapterId: string }) {
    return this.chapterRepository.findWithVerses({
      chapterId,
    });
  }

  async fetchChapterByBookAndNumber({
    bookOrder,
    chapterNumber,
  }: {
    bookOrder: number;
    chapterNumber: number;
  }) {
    return this.chapterRepository.findByBookAndNumber({
      bookOrder,
      chapterNumber,
    });
  }
}
