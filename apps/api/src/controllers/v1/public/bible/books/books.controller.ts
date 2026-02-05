import { Controller, Get, Param, Query, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { BibleBooksService } from "@/services";
import { v } from "azurajs/validators";
import { Swagger } from "azurajs/swagger";
import { bibleBooksV1Swagger } from "@/swaggers";
import {
  BibleBookViewModel,
  PaginationViewModel,
  ApiResponseViewModel,
} from "@/viewmodels";
import { Testament } from "@/libs/prisma/index";
import { BadRequestError, NotFoundError } from "@/utils/error-model";
import { handleError } from "@/utils/error-handler.util";

@Controller("/api/v1/public/bible/books")
export class BibleBooksV1Controller {
  private booksService: BibleBooksService;

  constructor() {
    this.booksService = new BibleBooksService();
  }

  @Get()
  @Swagger(bibleBooksV1Swagger.getBooks)
  async getBooks(
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Query("testament") testament: string | undefined,
    @Res() res: ResponseServer,
  ) {
    try {
      let testamentValue: Testament | undefined;
      if (testament) {
        if (!Object.values(Testament).includes(testament as Testament)) {
          throw new BadRequestError("Testament must be 'OLD' or 'NEW'");
        }
        testamentValue = testament as Testament;
      }

      const result = await this.booksService.fetchBooks({
        page,
        limit,
        testament: testamentValue,
      });

      const bookViewModels = result.books.map((book) =>
        new BibleBookViewModel(book).toJSON(),
      );
      const paginationViewModel = new PaginationViewModel(result.pagination);
      const response = new ApiResponseViewModel(
        bookViewModels,
        paginationViewModel,
      );

      return res.status(200).json(response.toJSON());
    } catch (error) {
      return handleError(error, res, "controller de livros");
    }
  }

  @Get("/:bookOrder")
  @Swagger(bibleBooksV1Swagger.getBookByOrder)
  async getBook(
    @Param("bookOrder") bookOrder: string,
    @Res() res: ResponseServer,
  ) {
    try {
      const parseBookOrder = v
        .number()
        .max(73)
        .min(1)
        .safeParse(Number(bookOrder));
      if (!parseBookOrder.success) {
        throw new BadRequestError(
          "Provide the book using its position (1-73).",
        );
      }

      const book = await this.booksService.fetchBookByOrder({
        bookOrder: parseBookOrder.data,
      });

      if (!book) {
        throw new NotFoundError("Book not found");
      }

      const viewModel = new BibleBookViewModel(book).toJSON();
      const response = new ApiResponseViewModel(viewModel);
      return res.status(200).json(response.toJSON());
    } catch (error) {
      return handleError(error, res, "controller de livro por ordem");
    }
  }
}
