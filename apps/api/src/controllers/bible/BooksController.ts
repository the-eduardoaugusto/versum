import { Controller, Get, Query, Res } from "azurajs/decorators";
import { ResponseServer } from "azurajs/types";
import { v } from "azurajs/validators";
import { prisma } from "../../libs/prisma";
import { Bible_bookWhereInput } from "../../generated/prisma/models";
import { Testament } from "../../generated/prisma/enums";

@Controller("/api/public/livros")
export class BibleBooksController {
  @Get()
  async getBook(
    @Query("page") page: string | undefined,
    @Query("limit") limit: string | undefined,
    @Query("testament") testament: string | undefined,
    @Res() res: ResponseServer
  ) {
    // Parse e validação manual simples
    let parsedPage = 1;
    let parsedLimit = 66;

    // Valida página se fornecida
    if (page !== undefined) {
      const pageNum = parseInt(page);
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          error: "Página deve ser um número positivo",
        });
      }
      parsedPage = pageNum;
    }

    // Valida limite se fornecido
    if (limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: "Limite deve ser um número entre 1 e 100",
        });
      }
      parsedLimit = limitNum;
    }

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

    try {
      const [livros, livrosTotal] = await Promise.all([
        prisma.bible_book.findMany({
          where,
          skip,
          take: parsedLimit,
          orderBy: { order: "asc" },
          include: {
            _count: { select: { chapters: true } },
          },
        }),
        prisma.bible_book.count({ where }),
      ]);

      const livrosFormatados = livros.map((l) => ({
        id: l.id,
        nome: l.name,
        ordem: l.order,
        testamento: l.testament,
        totalCapitulos: l.total_chapters,
      }));

      const paginasTotal = Math.ceil(livrosTotal / parsedLimit);

      return res.status(200).json({
        success: true,
        data: livrosFormatados,
        pagination: {
          currentPage: parsedPage,
          totalPages: paginasTotal,
          totalItems: livrosTotal,
          itemsPerPage: parsedLimit,
          hasNextPage: parsedPage < paginasTotal,
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
}
