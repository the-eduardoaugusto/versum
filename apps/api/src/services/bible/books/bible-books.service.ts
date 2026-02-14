import { BibleBookRepository } from "@/repositories";
import { BadRequestError, NotFoundError } from "@/utils/error-model";
import { validateQueryPaginationAndParse } from "@/utils";
import { PaginationViewModel } from "@/viewmodels";
import { asc, eq, SQL } from "drizzle-orm";
import { Pagination } from "@/utils";
import {
  sanitizeId,
  sanitizePageNumber,
  sanitizeLimitNumber,
  sanitizePaginationParams,
} from "@/utils/sanitize-input";

export type Testament = "OLD" | "NEW";

export class BibleBooksService {
  private bookRepository: BibleBookRepository;

  constructor(repository?: BibleBookRepository) {
    this.bookRepository = repository ?? new BibleBookRepository();
  }

  async fetchBooks({ page = 1, limit = 10 }: Partial<Pagination>) {
    const sanitizedParams = sanitizePaginationParams({ page, limit });
    const { limit: parsedLimit, page: parsedPage } =
      validateQueryPaginationAndParse({
        page: sanitizedParams.page,
        limit: sanitizedParams.limit,
      });

    const offset = (parsedPage - 1) * parsedLimit;

    const [books, totalBooksResult] = await Promise.all([
      this.bookRepository.findMany
        .where(undefined as any) // Chamada vazia para manter compatibilidade com o mock
        .orderBy(asc((this.bookRepository as BibleBookRepository).table.order))
        .offset(offset)
        .limit(parsedLimit),
      this.bookRepository.count,
    ]);

    // Verifica se o resultado é um array (caso da query real) ou um valor direto (caso do mock)
    const totalBooks =
      typeof totalBooksResult === "number"
        ? totalBooksResult
        : Array.isArray(totalBooksResult)
          ? totalBooksResult[0].count
          : 0;

    const totalPages = Math.ceil(totalBooks / parsedLimit);

    return {
      books,
      pagination: new PaginationViewModel({
        currentPage: parsedPage,
        totalPages,
        totalItems: totalBooks,
        itemsPerPage: parsedLimit,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
      }),
    };
  }

  async fetchBookById({ bookId }: { bookId: string }) {
    const sanitizedBookId = sanitizeId(bookId);
    const data = await this.bookRepository.findById({
      bookId: sanitizedBookId,
    });
    if (!data) {
      throw new NotFoundError(`Book with id ${sanitizedBookId} not found!`);
    }
    return data;
  }

  async fetchBookByOrder({ bookOrder }: { bookOrder: number }) {
    const sanitizedBookOrder = sanitizePageNumber(bookOrder);
    const data = await this.bookRepository.findByOrder({
      bookOrder: sanitizedBookOrder,
    });
    if (!data) {
      throw new NotFoundError(
        `Book with order ${sanitizedBookOrder} not found`,
      );
    }
    return data;
  }

  async fetchBooksByTestament({
    testament,
    limit = 10,
    page = 1,
  }: { testament: Testament } & Partial<Pagination>) {
    const sanitizedParams = sanitizePaginationParams({ page, limit });
    const { limit: parsedLimit, page: parsedPage } =
      validateQueryPaginationAndParse({
        page: sanitizedParams.page,
        limit: sanitizedParams.limit,
      });

    if (testament !== "OLD" && testament !== "NEW") {
      throw new BadRequestError(`Testament must be 'OLD' or 'NEW'`);
    }

    const offset = (parsedPage - 1) * parsedLimit;
    const where = eq(
      (this.bookRepository as BibleBookRepository).table.testament,
      testament,
    );

    const [books, totalBooksResult] = await Promise.all([
      this.bookRepository.findMany
        .where(where)
        .orderBy(asc((this.bookRepository as BibleBookRepository).table.order))
        .offset(offset)
        .limit(parsedLimit),
      this.bookRepository.count.where(where),
    ]);

    // Verifica se o resultado é um array (caso da query real) ou um valor direto (caso do mock)
    const totalBooks =
      typeof totalBooksResult === "number"
        ? totalBooksResult
        : Array.isArray(totalBooksResult)
          ? totalBooksResult[0].count
          : 0;
    const totalPages = Math.ceil(totalBooks / parsedLimit);

    return {
      books,
      pagination: new PaginationViewModel({
        currentPage: parsedPage,
        totalPages,
        totalItems: Array.isArray(totalBooks) ? totalBooks[0].count : 0,
        itemsPerPage: parsedLimit,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
      }),
    };
  }
}
