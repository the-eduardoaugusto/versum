import { SwaggerConfigType } from "@/swaggers/index";

class ChaptersV1Swagger {
  constructor() {}

  getChapters: SwaggerConfigType = {
    description:
      "Retorna todos os capítulos de um livro bíblico específico. Esta rota possui cache de 300 segundos e rate limit de 60 requisições por minuto.",
    tags: ["Public", "Bible", "Chapters"],
    summary: "Lista todos os capítulos de um livro bíblico.",
    parameters: [
      {
        in: "path",
        name: "bookOrder",
        required: true,
        description: "Número de ordem do livro bíblico (1-73)",
        example: "1",
        schema: {
          type: "string",
        },
      },
      {
        in: "query",
        name: "page",
        description: "Número da página para paginação (começa em 1)",
        example: "1",
        schema: {
          type: "string",
        },
      },
      {
        in: "query",
        name: "limit",
        description: "Quantidade de capítulos por página",
        example: "10",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      400: {
        description: "Requisição inválida com parâmetros incorretos",
        example: {
          success: false,
          error: "Informe o livro utilizando sua posição (1-73).",
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Informe o livro utilizando sua posição (1-73).",
            },
          },
        },
      },
      404: {
        description: "Livro bíblico não encontrado",
        example: {
          success: false,
          message: "Livro não encontrado",
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Livro não encontrado",
            },
          },
        },
      },
      500: {
        description: "Erro interno do servidor",
        example: {
          success: false,
          message: "Erro ao buscar capítulos",
          error: "Erro desconhecido",
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Erro ao buscar capítulos",
            },
            error: {
              type: "string",
              example: "Erro desconhecido",
            },
          },
        },
      },
      200: {
        description: "Lista de capítulos buscada com sucesso",
        headers: {
          "X-RateLimit-Limit": {
            description:
              "Número máximo de requisições permitidas por janela de tempo",
            schema: {
              type: "string",
              example: "60",
            },
          },
          "X-RateLimit-Remaining": {
            description:
              "Número de requisições restantes antes de atingir o limite",
            schema: {
              type: "string",
              example: "59",
            },
          },
          "X-RateLimit-Reset": {
            description: "Data e hora em que o limite será resetado",
            schema: {
              type: "string",
              format: "date-time",
              example: "2024-01-19T10:05:00.000Z",
            },
          },
        },
        example: {
          success: true,
          data: [
            {
              book_id: "0909fd62-060e-4960-a6f6-349ccd6420c1",
              id: "1234abcd-5678-90ef-ghij-klmnopqrstu1",
              number: 1,
              total_verses: 31,
            },
          ],
          cache: false,
          pagination: {
            currentPage: 1,
            totalPages: 50,
            totalItems: 50,
            itemsPerPage: 1,
            hasNextPage: true,
            hasPrevPage: false,
          },
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  book_id: {
                    type: "string",
                    format: "uuid",
                    example: "0909fd62-060e-4960-a6f6-349ccd6420c1",
                  },
                  id: {
                    type: "string",
                    format: "uuid",
                    example: "1234abcd-5678-90ef-ghij-klmnopqrstu1",
                  },
                  number: {
                    type: "integer",
                    example: 1,
                  },
                  total_verses: {
                    type: "integer",
                    example: 31,
                  },
                },
              },
            },
            pagination: {
              type: "object",
              properties: {
                currentPage: {
                  type: "integer",
                  example: 1,
                },
                totalPages: {
                  type: "integer",
                  example: 50,
                },
                totalItems: {
                  type: "integer",
                  example: 50,
                },
                itemsPerPage: {
                  type: "integer",
                  example: 1,
                },
                hasNextPage: {
                  type: "boolean",
                  example: true,
                },
                hasPrevPage: {
                  type: "boolean",
                  example: false,
                },
              },
            },
            cache: {
              type: "boolean",
              description: "Indica se a resposta foi retornada do cache",
              example: false,
            },
            cacheExpireAt: {
              type: "string",
              format: "date-time",
              description:
                "Data e hora em que o cache expirará (apenas quando cache é true)",
              example: "2024-01-19T10:06:00.000Z",
            },
          },
        },
      },
      429: {
        description: "Limite de requisições excedido para rotas públicas",
        headers: {
          "X-RateLimit-Limit": {
            description:
              "Número máximo de requisições permitidas por janela de tempo",
            schema: {
              type: "string",
              example: "60",
            },
          },
          "X-RateLimit-Remaining": {
            description: "Número de requisições restantes (0 quando excedido)",
            schema: {
              type: "string",
              example: "0",
            },
          },
          "X-RateLimit-Reset": {
            description: "Data e hora em que o limite será resetado",
            schema: {
              type: "string",
              format: "date-time",
              example: "2024-01-19T10:05:00.000Z",
            },
          },
        },
        example: {
          error: "Você fez muitas requisições para uma rota pública!",
          retryAfter: 45,
        },
        schema: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Você fez muitas requisições para uma rota pública!",
            },
            retryAfter: {
              type: "integer",
              description:
                "Número de segundos a aguardar antes de fazer outra requisição",
              example: 45,
            },
          },
        },
      },
    },
  };

  getChapterByNumber: SwaggerConfigType = {
    description:
      "Retorna um capítulo específico da Bíblia. Esta rota possui cache de 300 segundos e rate limit de 60 requisições por minuto.",
    tags: ["Public", "Bible", "Chapters"],
    summary: "Obtém um capítulo bíblico pelo número.",
    parameters: [
      {
        in: "path",
        name: "bookOrder",
        required: true,
        description: "Número de ordem do livro bíblico (1-73)",
        example: "1",
        schema: {
          type: "string",
        },
      },
      {
        in: "path",
        name: "chapterNumber",
        required: true,
        description: "Número do capítulo (mínimo 1)",
        example: "1",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      400: {
        description: "Requisição inválida com parâmetros incorretos",
        example: {
          success: false,
          error:
            "Informe o número do capítulo utilizando sua posição (Mínimo 1).",
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example:
                "Informe o número do capítulo utilizando sua posição (Mínimo 1).",
            },
          },
        },
      },
      404: {
        description: "Capítulo não encontrado",
        example: {
          success: false,
          message: "Capítulo não encontrado",
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Capítulo não encontrado",
            },
          },
        },
      },
      500: {
        description: "Erro interno do servidor",
        example: {
          success: false,
          message: "Erro ao buscar capítulo",
          error: "Erro desconhecido",
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Erro ao buscar capítulo",
            },
            error: {
              type: "string",
              example: "Erro desconhecido",
            },
          },
        },
      },
      200: {
        description: "Capítulo bíblico buscado com sucesso",
        headers: {
          "X-RateLimit-Limit": {
            description:
              "Número máximo de requisições permitidas por janela de tempo",
            schema: {
              type: "string",
              example: "60",
            },
          },
          "X-RateLimit-Remaining": {
            description:
              "Número de requisições restantes antes de atingir o limite",
            schema: {
              type: "string",
              example: "59",
            },
          },
          "X-RateLimit-Reset": {
            description: "Data e hora em que o limite será resetado",
            schema: {
              type: "string",
              format: "date-time",
              example: "2024-01-19T10:05:00.000Z",
            },
          },
        },
        example: {
          success: true,
          data: {
            id: "1234abcd-5678-90ef-ghij-klmnopqrstu1",
            book_id: "0909fd62-060e-4960-a6f6-349ccd6420c1",
            number: 1,
            total_verses: 31,
          },
          cache: false,
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                  example: "1234abcd-5678-90ef-ghij-klmnopqrstu1",
                },
                book_id: {
                  type: "string",
                  format: "uuid",
                  example: "0909fd62-060e-4960-a6f6-349ccd6420c1",
                },
                number: {
                  type: "integer",
                  example: 1,
                },
                total_verses: {
                  type: "integer",
                  example: 31,
                },
              },
            },
            cache: {
              type: "boolean",
              description: "Indica se a resposta foi retornada do cache",
              example: false,
            },
          },
        },
      },
      429: {
        description: "Limite de requisições excedido para rotas públicas",
        headers: {
          "X-RateLimit-Limit": {
            description:
              "Número máximo de requisições permitidas por janela de tempo",
            schema: {
              type: "string",
              example: "60",
            },
          },
          "X-RateLimit-Remaining": {
            description: "Número de requisições restantes (0 quando excedido)",
            schema: {
              type: "string",
              example: "0",
            },
          },
          "X-RateLimit-Reset": {
            description: "Data e hora em que o limite será resetado",
            schema: {
              type: "string",
              format: "date-time",
              example: "2024-01-19T10:05:00.000Z",
            },
          },
        },
        example: {
          error: "Você fez muitas requisições para uma rota pública!",
          retryAfter: 45,
        },
        schema: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Você fez muitas requisições para uma rota pública!",
            },
            retryAfter: {
              type: "integer",
              description:
                "Número de segundos a aguardar antes de fazer outra requisição",
              example: 45,
            },
          },
        },
      },
    },
  };
}

export const chaptersV1Swagger = new ChaptersV1Swagger();
