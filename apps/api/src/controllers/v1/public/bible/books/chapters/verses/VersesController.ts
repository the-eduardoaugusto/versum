import { Controller, Get, Param, Query, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { v } from "azurajs/validators";
import { prisma } from "@/libs/prisma";
import { validateQueryPagination } from "@/utils";

@Controller(
  "/api/v1/public/bible/books/:bookOrder/chapters/:chapterNumber/verses",
)
export class VersesController {
  @Get()
  async getVerses(
    @Param("bookOrder") bookOrder: string,
    @Param("chapterNumber") chapterNumber: string,
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Res() res: ResponseServer,
  ) {
    const parsedBook = v.number().min(1).max(73).safeParse(Number(bookOrder));
    const parsedChapter = v.number().min(1).safeParse(Number(chapterNumber));

    if (!parsedBook.success) {
      return res.status(400).json({
        success: false,
        error: "Informe o livro utilizando sua posição (1-73).",
      });
    }
    if (!parsedChapter.success) {
      return res.status(400).json({
        success: false,
        error: "Informe o capítulo utilizando um número válido (>=1).",
      });
    }

    try {
      const { page: parsedPage, limit: parsedLimit } = validateQueryPagination({
        page,
        limit,
      });

      const skip = (parsedPage - 1) * parsedLimit;

      const chapter = await prisma.bible_chapter.findFirst({
        where: {
          book: { order: parsedBook.data },
          number: parsedChapter.data,
        },
        select: {
          id: true,
          total_verses: true,
          verses: {
            skip,
            take: parsedLimit,
            select: {
              id: true,
              number: true,
              text: true,
            },
            orderBy: {
              number: "asc",
            },
          },
        },
      });

      if (!chapter) {
        return res.status(404).json({
          success: false,
          error: "Capítulo não encontrado nesse livro.",
        });
      }

      const totalVerses = chapter.total_verses;
      const totalPages = Math.ceil(totalVerses / parsedLimit);

      return res.status(200).json({
        success: true,
        data: chapter.verses,
        pagination: {
          currentPage: parsedPage,
          totalPages,
          totalItems: totalVerses,
          itemsPerPage: parsedLimit,
          hasNextPage: parsedPage < totalPages,
          hasPrevPage: parsedPage > 1,
        },
      });
    } catch (err) {
      console.error("Erro ao buscar versículos:", err);

      return res.status(500).json({
        success: false,
        error: "Erro ao buscar versículos!",
      });
    }
  }

  @Get("/:verseNumber")
  async getVerseByNumber(
    @Param("bookOrder") bookOrder: string,
    @Param("chapterNumber") chapterNumber: string,
    @Param("verseNumber") verseNumber: string,
    @Res() res: ResponseServer,
  ) {
    const parsedBook = v.number().min(1).max(73).safeParse(Number(bookOrder));
    const parsedChapter = v.number().min(1).safeParse(Number(chapterNumber));
    const parsedVerse = v.number().min(1).safeParse(Number(verseNumber));

    if (!parsedBook.success || !parsedChapter.success || !parsedVerse.success) {
      return res.status(400).json({
        success: false,
        error: "Informe números válidos para livro, capítulo e versículo.",
      });
    }

    try {
      const verse = await prisma.bible_verse.findFirst({
        where: {
          number: parsedVerse.data,
          chapter: {
            number: parsedChapter.data,
            book: { order: parsedBook.data },
          },
        },
        select: {
          id: true,
          number: true,
          text: true,
        },
      });

      if (!verse) {
        return res.status(404).json({
          success: false,
          error: "Versículo não encontrado.",
        });
      }

      return res.status(200).json({
        success: true,
        data: verse,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Erro ao buscar o versículo!",
      });
    }
  }
}
