import { Controller, Get, Param, Query, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { validateQueryPagination } from "@/utils";
import { v } from "azurajs/validators";
import { BibleChaptersService, BibleBooksService } from "@/services";
import {
  BibleChapterViewModel,
  PaginationViewModel,
  ApiResponseViewModel,
} from "@/viewmodels";
import { Swagger } from "azurajs/swagger";
import { chaptersV1Swagger } from "@/swaggers";
import { BadRequestError, NotFoundError } from "@/utils/error-model";
import { handleError } from "@/utils/error-handler.util";

@Controller("/api/v1/public/bible/books/:bookOrder/chapters")
export class ChaptersController {
  private chaptersService: BibleChaptersService;
  private booksService: BibleBooksService;

  constructor() {
    this.chaptersService = new BibleChaptersService();
    this.booksService = new BibleBooksService();
  }

  @Get()
  @Swagger(chaptersV1Swagger.getChapters)
  async getChapters(
    @Param("bookOrder") bookOrder: string,
    @Res() res: ResponseServer,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
  ) {
    try {
      const parseBookOrder = v
        .number()
        .max(73)
        .min(1)
        .safeParse(Number(bookOrder));

      if (!parseBookOrder.success) {
        throw new BadRequestError("Provide the book using its position (1-73).");
      }

      const { page: parsedPage, limit: parsedLimit } = validateQueryPagination({
        page,
        limit,
      });

      // Get book by order to find its ID
      const book = await this.booksService.fetchBookByOrder({
        bookOrder: parseBookOrder.data,
      });
      if (!book) {
        throw new NotFoundError("Book not found.");
      }

      const result = await this.chaptersService.fetchChapters({
        bookId: book.id,
        page: parsedPage,
        limit: parsedLimit,
      });

      const chapterViewModels = result.chapters.map((chapter) =>
        new BibleChapterViewModel(chapter).toJSON(),
      );
      const paginationViewModel = new PaginationViewModel(result.pagination);
      const response = new ApiResponseViewModel(
        chapterViewModels,
        paginationViewModel,
      );

      return res.status(200).json(response.toJSON());
    } catch (error) {
      return handleError(error, res, "controller de capítulos");
    }
  }

  @Get("/:chapterNumber")
  @Swagger(chaptersV1Swagger.getChapterByNumber)
  async getChapterByNumber(
    @Param("chapterNumber") chapterNumber: string,
    @Param("bookOrder") bookOrder: string,
    @Res() res: ResponseServer,
  ) {
    try {
      const parseChapterNumber = v
        .number()
        .min(1)
        .safeParse(Number(chapterNumber));
      const parseBookOrder = v.number().min(1).max(73).safeParse(Number(bookOrder));

      if (!parseChapterNumber.success || !parseBookOrder.success) {
        throw new BadRequestError("Provide valid numbers for book and chapter.");
      }

      const chapter = await this.chaptersService.fetchChapterByBookAndNumber({
        bookOrder: parseBookOrder.data,
        chapterNumber: parseChapterNumber.data,
      });

      if (!chapter) {
        throw new NotFoundError("Chapter not found");
      }

      const viewModel = new BibleChapterViewModel(chapter).toJSON();
      const response = new ApiResponseViewModel(viewModel);
      return res.status(200).json(response.toJSON());
    } catch (error) {
      return handleError(error, res, "controller de capítulo por número");
    }
  }
}
