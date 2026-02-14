import { BibleChapterRepository } from "@/repositories";
import { BadRequestError, NotFoundError } from "@/utils/error-model";
import { Pagination, validateQueryPaginationAndParse } from "@/utils";
import { PaginationViewModel } from "@/viewmodels";
import { asc, eq } from "drizzle-orm";
import { sanitizeId, sanitizePaginationParams } from "@/utils/sanitize-input";

export interface FetchChaptersParams {
  bookId: string;
  page?: string;
  limit?: string;
}

export class BibleChaptersService {
  private chapterRepository: BibleChapterRepository;

  constructor(repository?: BibleChapterRepository) {
    this.chapterRepository = repository ?? new BibleChapterRepository();
  }

  async fetchChapters({
    bookId,
    page = "1",
    limit = "10",
  }: Partial<Pagination> & { bookId: string }) {
    const sanitizedBookId = sanitizeId(bookId);
    const sanitizedParams = sanitizePaginationParams({ page, limit });
    const { limit: parsedLimit, page: parsedPage } =
      validateQueryPaginationAndParse({
        page: sanitizedParams.page,
        limit: sanitizedParams.limit,
      });

    const offset = (parsedPage - 1) * parsedLimit;
    const where = eq(this.chapterRepository.table.bookId, sanitizedBookId);

    const [chapters, totalChaptersQuery] = await Promise.all([
      this.chapterRepository.findMany
        .where(where)
        .limit(parsedLimit)
        .offset(offset)
        .orderBy(asc(this.chapterRepository.table.number)),
      this.chapterRepository.count.where(where),
    ]);

    const totalChapters = Number(totalChaptersQuery[0]?.count || 0);

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
    const sanitizedChapterId = sanitizeId(chapterId);
    return this.chapterRepository.findWithVerses({
      chapterId: sanitizedChapterId,
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
