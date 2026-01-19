import { Controller, Get, Param, Query, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { validateQueryPagination } from "@/utils";
import { v } from "azurajs/validators";
import { prisma } from "@/libs/prisma";

@Controller("/api/v1/public/bible/books/:bookOrder/chapters")
export class ChaptersController {
  @Get()
  async getChapters(
    @Param("bookOrder") bookOrder: string,
    @Res() res: ResponseServer,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
  ) {
    const parseBookOrder = v
      .number()
      .max(73)
      .min(1)
      .safeParse(Number(bookOrder));
    if (!parseBookOrder.success) {
      return res.status(400).json({
        success: false,
        error: "Informe o livro utilizando sua posição (1-73).",
      });
    }
    try {
      const { page: parsedPage, limit: parsedLimit } = validateQueryPagination({
        page,
        limit,
      });

      const skip = (parsedPage - 1) * parsedLimit;

      const bookWithChapters = await prisma.bible_book.findFirst({
        where: {
          order: parseBookOrder.data,
        },
        select: {
          total_chapters: true,
          chapters: {
            skip,
            take: parsedLimit,
            select: {
              book_id: true,
              id: true,
              number: true,
              total_verses: true,
            },
            orderBy: {
              number: "asc",
            },
          },
        },
      });

      if (!bookWithChapters) {
        return res.status(404).json({
          success: false,
          message: "Livro não encontrado",
        });
      }

      const totalChapters = bookWithChapters.total_chapters;
      const chapters = bookWithChapters.chapters;
      const totalPages = Math.ceil(totalChapters / parsedLimit);

      return res.status(200).json({
        success: true,
        data: chapters,
        pagination: {
          currentPage: parsedPage,
          totalPages: totalPages,
          totalItems: totalChapters,
          itemsPerPage: parsedLimit,
          hasNextPage: parsedPage < totalPages,
          hasPrevPage: parsedPage > 1,
        },
      });
    } catch (error) {
      console.error("Erro ao listar capítulos:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar capítulos",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  @Get("/:chapterNumber")
  async getChapterByNumber(
    @Param("chapterNumber") chapterNumber: string,
    @Res() res: ResponseServer,
  ) {
    const parseChapterNumber = v
      .number()
      .min(1)
      .safeParse(Number(chapterNumber));
    if (!parseChapterNumber.success) {
      return res.status(400).json({
        success: false,
        error:
          "Informe o número do capítulo utilizando sua posição (Mínimo 1).",
      });
    }

    try {
      const chapter = await prisma.bible_chapter.findFirst({
        where: {
          number: parseChapterNumber.data,
        },
      });

      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: "Capítulo não encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        data: chapter,
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar capítulo",
        error: e instanceof Error ? e.message : "Erro desconhecido",
      });
    }
  }
}
