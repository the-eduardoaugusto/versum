import { BibleBookRepository } from "@/repositories";
import { Prisma, prisma } from "@/libs/prisma";
import { Testament } from "@/libs/prisma/index";
import { BadRequestError } from "@/utils/error-model";
import { validateQueryPaginationAndParse } from "@/utils";
import { PaginationViewModel } from "@/viewmodels";

export interface Pagination {
  page?: string;
  limit?: string;
}

export class BibleBooksService {
  private bookRepository: BibleBookRepository;

  constructor(repository?: BibleBookRepository) {
    this.bookRepository = repository ?? new BibleBookRepository(prisma);
  }

  async fetchBooks({
    page = "1",
    limit = "10",
    testament,
  }: Partial<Pagination> & { testament?: Testament }) {
    if (testament && !Object.values(Testament).includes(testament)) {
      throw new BadRequestError("Testament must be 'OLD' or 'NEW'");
    }

    const { limit: parsedLimit, page: parsedPage } =
      validateQueryPaginationAndParse({
        page,
        limit,
      });

    const skip = (parsedPage - 1) * parsedLimit;

    const where: Prisma.BibleBookFindManyArgs["where"] = {};
    if (testament) {
      where.testament = testament;
    }

    const [books, totalBooks] = await Promise.all([
      this.bookRepository.findMany({
        where,
        skip,
        take: parsedLimit,
        orderBy: { order: "asc" },
      }),
      this.bookRepository.count({ where }),
    ]);

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
    return await this.bookRepository.findById(bookId);
  }

  async fetchBookByOrder({ bookOrder }: { bookOrder: number }) {
    return await this.bookRepository.findByOrder({ bookOrder });
  }

  async fetchBookByTestament({
    testament,
    limit = "10",
    page = "1",
  }: { testament: Testament } & Partial<Pagination>) {
    const { limit: parsedLimit, page: parsedPage } =
      validateQueryPaginationAndParse({
        page,
        limit,
      });

    const [books, totalBooks] = await Promise.all([
      this.bookRepository.findByTestament({
        testament,
        args: {
          skip: (parsedPage - 1) * parsedLimit,
          take: parsedLimit,
        },
      }),
      this.bookRepository.count({
        where: {
          testament,
        },
      }),
    ]);

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
}
