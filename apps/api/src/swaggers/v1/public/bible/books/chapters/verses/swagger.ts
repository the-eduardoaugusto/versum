import { SwaggerConfigType } from "@/swaggers/index";
class VersesV1Swagger {
  constructor() {}

  getVerses: SwaggerConfigType = {
    description:
      "Returns all verses of a specific biblical chapter. This route has a cache of 300 seconds and rate limit of 60 requests per minute.",
    tags: ["Public", "Bible", "Verses"],
    summary: "Lists all verses of a biblical chapter.",
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
        description: "Number of verses per page",
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
          message: "Provide valid numbers for book, chapter and verse.",
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
              example: "Provide valid numbers for book, chapter and verse.",
            },
          },
        },
      },
      404: {
        description: "Chapter not found",
        example: {
          success: false,
          message: "Chapter not found in this book.",
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
              example: "Chapter not found in this book.",
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
        description: "List of verses retrieved successfully",
        headers: {
          "X-RateLimit-Limit": {
            description: "Maximum number of requests allowed per time window",
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
              chapterId: "9876dcba-5432-10ef-ghij-klmnopqrstu9",
              number: 1,
              text: "In the beginning, God created the heavens and the earth.",
            },
            {
              id: "2345bcde-6789-01fg-hijk-lmnopqrstuv2",
              chapterId: "9876dcba-5432-10ef-ghij-klmnopqrstu9",
              number: 2,
              text: "The earth was without form and void; and darkness was upon the face of the deep...",
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
                  chapterId: {
                    type: "string",
                    format: "uuid",
                    example: "9876dcba-5432-10ef-ghij-klmnopqrstu9",
                  },
                  number: {
                    type: "integer",
                    example: 1,
                  },
                  text: {
                    type: "string",
                    example:
                      "In the beginning, God created the heavens and the earth.",
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
          },
        },
      },
      429: {
        description: "Request limit exceeded for public routes",
        headers: {
          "X-RateLimit-Limit": {
            description: "Maximum number of requests allowed per time window",
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
              example: "2024-01-17T10:05:00.000Z",
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

  getVerseByNumber: SwaggerConfigType = {
    description:
      "Returns a specific Bible verse. This route has a cache of 300 seconds and rate limit of 60 requests per minute.",
    tags: ["Public", "Bible", "Verses"],
    summary: "Gets a biblical verse by number.",
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
      {
        in: "path",
        name: "verseNumber",
        required: true,
        description: "Verse number (minimum 1)",
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
          message: "Provide valid numbers for book, chapter and verse.",
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
              example: "Provide valid numbers for book, chapter and verse.",
            },
          },
        },
      },
      404: {
        description: "Verse not found",
        example: {
          success: false,
          message: "Verse not found.",
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
              example: "Verse not found.",
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
        description: "Biblical verse retrieved successfully",
        headers: {
          "X-RateLimit-Limit": {
            description: "Maximum number of requests allowed per time window",
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
            chapterId: "9876dcba-5432-10ef-ghij-klmnopqrstu9",
            number: 1,
            text: "In the beginning, God created the heavens and the earth.",
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
                chapterId: {
                  type: "string",
                  format: "uuid",
                  example: "9876dcba-5432-10ef-ghij-klmnopqrstu9",
                },
                number: {
                  type: "integer",
                  example: 1,
                },
                text: {
                  type: "string",
                  example:
                    "In the beginning, God created the heavens and the earth.",
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
            description: "Maximum number of requests allowed per time window",
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
              example: "2024-01-17T10:05:00.000Z",
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

export const versesV1Swagger = new VersesV1Swagger();
