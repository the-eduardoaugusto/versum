import { Controller, Get, Param, Query, Req, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { prisma } from "@/libs/prisma";
import { Bible_bookWhereInput } from "../../../../../../generated/prisma/models";
import { Testament } from "@/libs/prisma";
import { Swagger } from "azurajs/swagger";
import { bibleBooksV1Swagger } from "@/swaggers";
import { v } from "azurajs/validators";
import { validateQueryPagination } from "@/utils";

@Controller("/api/v1/public/bible/books")
export class BibleBooksV1Controller {
  @Get()
  @Swagger(bibleBooksV1Swagger.getBooks)
  async getBooks(
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Query("testament") testament: string | undefined,
    @Res() res: ResponseServer,
  ) {
    try {
      const { page: parsedPage, limit: parsedLimit } = validateQueryPagination({
        page,
        limit,
      });

      // Valida testamento se fornecido
      if (
        testament !== undefined &&
        testament !== Testament.OLD &&
        testament !== Testament.NEW
      ) {
        return res.status(400).json({
          success: false,
          error: "Testamento deve ser 'OLD' ou 'NEW'",
        });
      }

      const skip = (parsedPage - 1) * parsedLimit;

      const where: Bible_bookWhereInput = {};

      if (testament === Testament.OLD || testament === Testament.NEW) {
        where.testament = testament;
      }

      const [books, totalBooks] = await Promise.all([
        prisma.bible_book.findMany({
          where,
          skip,
          take: parsedLimit,
          orderBy: { order: "asc" },
        }),
        prisma.bible_book.count({ where }),
      ]);

      const totalPages = Math.ceil(totalBooks / parsedLimit);

      return res.status(200).json({
        success: true,
        data: books,
        pagination: {
          currentPage: parsedPage,
          totalPages: totalPages,
          totalItems: totalBooks,
          itemsPerPage: parsedLimit,
          hasNextPage: parsedPage < totalPages,
          hasPrevPage: parsedPage > 1,
        },
      });
    } catch (error) {
      console.error("Erro ao listar livros:", error);
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar livros",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  @Get("/:bookOrder")
  @Swagger(bibleBooksV1Swagger.getBookByOrder)
  async getBook(
    @Param("bookOrder") bookOrder: string,
    @Res() res: ResponseServer,
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
      const book = await prisma.bible_book.findFirst({
        where: {
          order: parseBookOrder.data,
        },
      });

      if (!book) {
        return res.status(404).json({
          success: false,
          message: "Livro não encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        data: book,
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar livro",
        error: e instanceof Error ? e.message : "Erro desconhecido",
      });
    }
  }
}
