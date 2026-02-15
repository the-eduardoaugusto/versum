import { BibleVerseRepository } from "@/repositories";
import { BadRequestError, NotFoundError } from "@/utils/error-model";
import { Pagination, validateQueryPaginationAndParse } from "@/utils";
import { PaginationViewModel } from "@/viewmodels";
import { asc, eq } from "drizzle-orm";
import { sanitizeId, sanitizePaginationParams } from "@/utils/sanitize-input";

export interface FetchVersesParams {
  chapterId: string;
  page?: string;
  limit?: string;
}

export class BibleVersesService {
  private verseRepository: BibleVerseRepository;

  constructor(repository?: BibleVerseRepository) {
    this.verseRepository = repository ?? new BibleVerseRepository();
  }

  async fetchVerses({
    chapterId,
    page = "1",
    limit = "10",
  }: Partial<Pagination> & { chapterId: string }) {
    const sanitizedChapterId = sanitizeId(chapterId);
    const sanitizedParams = sanitizePaginationParams({ page, limit });
    const { limit: parsedLimit, page: parsedPage } =
      validateQueryPaginationAndParse({
        page: sanitizedParams.page,
        limit: sanitizedParams.limit,
      });

    const offset = (parsedPage - 1) * parsedLimit;
    const where = eq(
      (this.verseRepository as any).table.chapterId,
      sanitizedChapterId,
    );

    const [verses, totalVersesQuery] = await Promise.all([
      this.verseRepository.findMany
        .where(where)
        .limit(parsedLimit)
        .offset(offset)
        .orderBy(asc((this.verseRepository as any).table.number)),

      this.verseRepository.count.where(where),
    ]);

    const totalVerses = totalVersesQuery[0]?.count || 0;

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
    const sanitizedVerseId = sanitizeId(verseId);
    return this.verseRepository.findWithRelations({
      verseId: sanitizedVerseId,
    });
  }

  async fetchVerseByNumber({
    chapterId,
    verseNumber,
  }: {
    chapterId: string;
    verseNumber: number;
  }) {
    const sanitizedChapterId = sanitizeId(chapterId);
    return this.verseRepository.findByChapterAndNumber({
      chapterId: sanitizedChapterId,
      verseNumber,
    });
  }
}
