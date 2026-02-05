import { Controller, Get, Param, Query, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { v } from "azurajs/validators";
import {
  BibleVersesService,
  BibleBooksService,
  BibleChaptersService,
} from "@/services";
import { validateQueryPagination } from "@/utils";
import {
  BibleVerseViewModel,
  PaginationViewModel,
  ApiResponseViewModel,
} from "@/viewmodels";
import { Swagger } from "azurajs/swagger";
import { versesV1Swagger } from "@/swaggers/v1/public/bible/books/chapters/verses/swagger";
import { BadRequestError, NotFoundError } from "@/utils/error-model";
import { handleError } from "@/utils/error-handler.util";

@Controller(
  "/api/v1/public/bible/books/:bookOrder/chapters/:chapterNumber/verses",
)
export class VersesController {
  private versesService: BibleVersesService;
  private booksService: BibleBooksService;
  private chaptersService: BibleChaptersService;

  constructor() {
    this.versesService = new BibleVersesService();
    this.booksService = new BibleBooksService();
    this.chaptersService = new BibleChaptersService();
  }

  @Get()
  @Swagger(versesV1Swagger.getVerses)
  async getVerses(
    @Param("bookOrder") bookOrder: string,
    @Param("chapterNumber") chapterNumber: string,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Res() res: ResponseServer,
  ) {
    try {
      const parsedBook = v.number().min(1).max(73).safeParse(Number(bookOrder));
      const parsedChapter = v.number().min(1).safeParse(Number(chapterNumber));

      if (!parsedBook.success) {
        throw new BadRequestError("Provide the book using its position (1-73).");
      }

      if (!parsedChapter.success) {
        throw new BadRequestError("Provide a valid chapter number (>=1).");
      }

      const { page: parsedPage, limit: parsedLimit } = validateQueryPagination({
        page,
        limit,
      });

      const chapter = await this.chaptersService.fetchChapterByBookAndNumber({
        bookOrder: parsedBook.data,
        chapterNumber: parsedChapter.data,
      });
      if (!chapter) {
        throw new NotFoundError("Chapter not found.");
      }

      const result = await this.versesService.fetchVerses({
        chapterId: chapter.id,
        page: parsedPage,
        limit: parsedLimit,
      });

      const verseViewModels = result.verses.map((verse) =>
        new BibleVerseViewModel(verse).toJSON(),
      );
      const paginationViewModel = new PaginationViewModel(result.pagination);
      const response = new ApiResponseViewModel(
        verseViewModels,
        paginationViewModel,
      );

      return res.status(200).json(response.toJSON());
    } catch (error) {
      return handleError(error, res, "controller de versículos");
    }
  }

  @Get("/:verseNumber")
  @Swagger(versesV1Swagger.getVerseByNumber)
  async getVerseByNumber(
    @Param("bookOrder") bookOrder: string,
    @Param("chapterNumber") chapterNumber: string,
    @Param("verseNumber") verseNumber: string,
    @Res() res: ResponseServer,
  ) {
    try {
      const parsedBook = v.number().min(1).max(73).safeParse(Number(bookOrder));
      const parsedChapter = v.number().min(1).safeParse(Number(chapterNumber));
      const parsedVerse = v.number().min(1).safeParse(Number(verseNumber));

      if (!parsedBook.success || !parsedChapter.success || !parsedVerse.success) {
        throw new BadRequestError("Provide valid numbers for book, chapter, and verse.");
      }

      const chapter = await this.chaptersService.fetchChapterByBookAndNumber({
        bookOrder: parsedBook.data,
        chapterNumber: parsedChapter.data,
      });

      if (!chapter) {
        throw new NotFoundError("Chapter not found.");
      }

      const verse = await this.versesService.fetchVerseByNumber({
        chapterId: chapter?.id,
        verseNumber: parsedVerse.data,
      });

      if (!verse) {
        throw new NotFoundError("Verse not found.");
      }

      const viewModel = new BibleVerseViewModel(verse).toJSON();
      const response = new ApiResponseViewModel(viewModel);
      return res.status(200).json(response.toJSON());
    } catch (error) {
      return handleError(error, res, "controller de versículos por número");
    }
  }
}
