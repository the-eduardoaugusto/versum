import { SwaggerConfigType } from "@/swaggers/index";

class ChaptersV1Swagger {
  constructor() {}

  getChapters: SwaggerConfigType = {
    description:
      "Returns all chapters of a specific biblical book. This route has a cache of 300 seconds and rate limit of 60 requests per minute.",
    tags: ["Public", "Bible", "Chapters"],
    summary: "Lists all chapters of a biblical book.",
    parameters: [
      {
        in: "path",
        name: "bookOrder",
        required: true,
        description: "Order number of the biblical book (1-73)",
        example: "1",
        schema: {
          type: "string",
        },
      },
      {
        in: "query",
        name: "page",
        description: "Page number for pagination (starts at 1)",
        example: "1",
        schema: {
          type: "string",
        },
      },
      {
        in: "query",
        name: "limit",
        description: "Number of chapters per page",
        example: "10",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      400: {
        description: "Invalid request with incorrect parameters",
        example: {
          success: false,
          message: "Provide the book using its position (1-73).",
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
              example: "Provide the book using its position (1-73).",
            },
          },
        },
      },
      404: {
        description: "Biblical book not found",
        example: {
          success: false,
          message: "Book not found",
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
              example: "Book not found",
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        example: {
          success: false,
          message: "Internal Server Error",
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
              example: "Internal Server Error",
            },
          },
        },
      },
      200: {
        description: "List of chapters retrieved successfully",
        headers: {
          "X-RateLimit-Limit": {
            description:
              "Maximum number of requests allowed per time window",
            schema: {
              type: "string",
              example: "60",
            },
          },
          "X-RateLimit-Remaining": {
            description:
              "Number of remaining requests before reaching the limit",
            schema: {
              type: "string",
              example: "59",
            },
          },
          "X-RateLimit-Reset": {
            description: "Date and time when the limit will be reset",
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
              bookId: "0909fd62-060e-4960-a6f6-349ccd6420c1",
              number: 1,
              totalVerses: 31,
            },
          ],
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
                  id: {
                    type: "string",
                    format: "uuid",
                    example: "1234abcd-5678-90ef-ghij-klmnopqrstu1",
                  },
                  bookId: {
                    type: "string",
                    format: "uuid",
                    example: "0909fd62-060e-4960-a6f6-349ccd6420c1",
                  },
                  number: {
                    type: "integer",
                    example: 1,
                  },
                  totalVerses: {
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
          },
        },
      },
      429: {
        description: "Request limit exceeded for public routes",
        headers: {
          "X-RateLimit-Limit": {
            description:
              "Maximum number of requests allowed per time window",
            schema: {
              type: "string",
              example: "60",
            },
          },
          "X-RateLimit-Remaining": {
            description: "Number of remaining requests (0 when exceeded)",
            schema: {
              type: "string",
              example: "0",
            },
          },
          "X-RateLimit-Reset": {
            description: "Date and time when the limit will be reset",
            schema: {
              type: "string",
              format: "date-time",
              example: "2024-01-19T10:05:00.000Z",
            },
          },
        },
        example: {
          success: false,
          message: "You have made too many requests to a public route!",
          retryAfter: 45,
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
              example: "You have made too many requests to a public route!",
            },
            retryAfter: {
              type: "integer",
              description:
                "Number of seconds to wait before making another request",
              example: 45,
            },
          },
        },
      },
    },
  };

  getChapterByNumber: SwaggerConfigType = {
    description:
      "Returns a specific Bible chapter. This route has a cache of 300 seconds and rate limit of 60 requests per minute.",
    tags: ["Public", "Bible", "Chapters"],
    summary: "Gets a biblical chapter by number.",
    parameters: [
      {
        in: "path",
        name: "bookOrder",
        required: true,
        description: "Order number of the biblical book (1-73)",
        example: "1",
        schema: {
          type: "string",
        },
      },
      {
        in: "path",
        name: "chapterNumber",
        required: true,
        description: "Chapter number (minimum 1)",
        example: "1",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      400: {
        description: "Invalid request with incorrect parameters",
        example: {
          success: false,
          message:
            "Provide the chapter number using its position (Minimum 1).",
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
              example:
                "Provide the chapter number using its position (Minimum 1).",
            },
          },
        },
      },
      404: {
        description: "Chapter not found",
        example: {
          success: false,
          message: "Chapter not found",
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
              example: "Chapter not found",
            },
          },
        },
      },
      500: {
        description: "Internal server error",
        example: {
          success: false,
          message: "Internal Server Error",
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
              example: "Internal Server Error",
            },
          },
        },
      },
      200: {
        description: "Biblical chapter retrieved successfully",
        headers: {
          "X-RateLimit-Limit": {
            description:
              "Maximum number of requests allowed per time window",
            schema: {
              type: "string",
              example: "60",
            },
          },
          "X-RateLimit-Remaining": {
            description:
              "Number of remaining requests before reaching the limit",
            schema: {
              type: "string",
              example: "59",
            },
          },
          "X-RateLimit-Reset": {
            description: "Date and time when the limit will be reset",
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
            bookId: "0909fd62-060e-4960-a6f6-349ccd6420c1",
            number: 1,
            totalVerses: 31,
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
              type: "object",
              properties: {
                id: {
                  type: "string",
                  format: "uuid",
                  example: "1234abcd-5678-90ef-ghij-klmnopqrstu1",
                },
                bookId: {
                  type: "string",
                  format: "uuid",
                  example: "0909fd62-060e-4960-a6f6-349ccd6420c1",
                },
                number: {
                  type: "integer",
                  example: 1,
                },
                totalVerses: {
                  type: "integer",
                  example: 31,
                },
              },
            },
          },
        },
      },
      429: {
        description: "Request limit exceeded for public routes",
        headers: {
          "X-RateLimit-Limit": {
            description:
              "Maximum number of requests allowed per time window",
            schema: {
              type: "string",
              example: "60",
            },
          },
          "X-RateLimit-Remaining": {
            description: "Number of remaining requests (0 when exceeded)",
            schema: {
              type: "string",
              example: "0",
            },
          },
          "X-RateLimit-Reset": {
            description: "Date and time when the limit will be reset",
            schema: {
              type: "string",
              format: "date-time",
              example: "2024-01-19T10:05:00.000Z",
            },
          },
        },
        example: {
          success: false,
          message: "You have made too many requests to a public route!",
          retryAfter: 45,
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
              example: "You have made too many requests to a public route!",
            },
            retryAfter: {
              type: "integer",
              description:
                "Number of seconds to wait before making another request",
              example: 45,
            },
          },
        },
      },
    },
  };
}

export const chaptersV1Swagger = new ChaptersV1Swagger();
