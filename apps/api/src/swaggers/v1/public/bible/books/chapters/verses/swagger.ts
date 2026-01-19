import { SwaggerConfigType } from "@/swaggers/index";
class VersesV1Swagger {
  constructor() {}

  getVerses: SwaggerConfigType = {
    description:
      "Retorna todos os versículos de um capítulo bíblico específico. Esta rota possui cache de 300 segundos e rate limit de 60 requisições por minuto.",
    tags: ["Public", "Bible", "Verses"],
    summary: "Lista todos os versículos de um capítulo bíblico.",
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
        description: "Quantidade de versículos por página",
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
          error: "Informe números válidos para livro, capítulo e versículo.",
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
                "Informe números válidos para livro, capítulo e versículo.",
            },
          },
        },
      },
      404: {
        description: "Capítulo não encontrado",
        example: {
          success: false,
          error: "Capítulo não encontrado nesse livro.",
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
              example: "Capítulo não encontrado nesse livro.",
            },
          },
        },
      },
      500: {
        description: "Erro interno do servidor",
        example: {
          success: false,
          error: "Erro ao buscar versículos!",
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
              example: "Erro ao buscar versículos!",
            },
          },
        },
      },
      200: {
        description: "Lista de versículos buscada com sucesso",
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
              id: "1234abcd-5678-90ef-ghij-klmnopqrstu1",
              number: 1,
              text: "No princípio, criou Deus os céus e a terra.",
            },
            {
              id: "2345bcde-6789-01fg-hijk-lmnopqrstuv2",
              number: 2,
              text: "A terra era sem forma e vazia; havia trevas sobre a face do abismo...",
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 10,
            totalItems: 31,
            itemsPerPage: 10,
            hasNextPage: true,
            hasPrevPage: false,
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
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    format: "uuid",
                    example: "1234abcd-5678-90ef-ghij-klmnopqrstu1",
                  },
                  number: {
                    type: "integer",
                    example: 1,
                  },
                  text: {
                    type: "string",
                    example: "No princípio, criou Deus os céus e a terra.",
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
                  example: 10,
                },
                totalItems: {
                  type: "integer",
                  example: 31,
                },
                itemsPerPage: {
                  type: "integer",
                  example: 10,
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

  getVerseByNumber: SwaggerConfigType = {
    description:
      "Retorna um versículo específico da Bíblia. Esta rota possui cache de 300 segundos e rate limit de 60 requisições por minuto.",
    tags: ["Public", "Bible", "Verses"],
    summary: "Obtém um versículo bíblico pelo número.",
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
      {
        in: "path",
        name: "verseNumber",
        required: true,
        description: "Número do versículo (mínimo 1)",
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
          error: "Informe números válidos para livro, capítulo e versículo.",
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
                "Informe números válidos para livro, capítulo e versículo.",
            },
          },
        },
      },
      404: {
        description: "Versículo não encontrado",
        example: {
          success: false,
          error: "Versículo não encontrado.",
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
              example: "Versículo não encontrado.",
            },
          },
        },
      },
      500: {
        description: "Erro interno do servidor",
        example: {
          success: false,
          error: "Erro ao buscar o versículo!",
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
              example: "Erro ao buscar o versículo!",
            },
          },
        },
      },
      200: {
        description: "Versículo bíblico buscado com sucesso",
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
            number: 1,
            text: "No princípio, criou Deus os céus e a terra.",
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
                number: {
                  type: "integer",
                  example: 1,
                },
                text: {
                  type: "string",
                  example: "No princípio, criou Deus os céus e a terra.",
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

export const versesV1Swagger = new VersesV1Swagger();
