import { BibleChapterRepository } from "@/repositories";
import { prisma, Prisma } from "@/libs/prisma";

export interface FetchChaptersParams {
  bookId: string;
  page: number;
  limit: number;
}

export class BibleChaptersService {
  private chapterRepository: BibleChapterRepository;

  constructor(repository?: BibleChapterRepository) {
    this.chapterRepository = repository ?? new BibleChapterRepository(prisma);
  }

  async fetchChapters({ bookId, page, limit }: FetchChaptersParams) {
    const skip = (page - 1) * limit;

    const args: Prisma.BibleChapterFindManyArgs = {
      where: { bookId },
      skip,
      take: limit,
      orderBy: { number: "asc" },
    };

    const countArgs: Prisma.BibleChapterCountArgs = { where: { bookId } };

    const [chapters, totalChapters] = await Promise.all([
      this.chapterRepository.findMany(args),
      this.chapterRepository.count(countArgs),
    ]);

    const totalPages = Math.ceil(totalChapters / limit);

    return {
      chapters,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalChapters,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
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
