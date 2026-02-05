import { SwaggerConfigType } from "@/swaggers/index";

class BibleBooksV1Swagger {
  constructor() {}

  getBooks: SwaggerConfigType = {
    description:
      "Returns all available biblical books. This route has a cache of 300 seconds and rate limit of 60 requests per minute.",
    tags: ["Public", "Bible", "Books"],
    summary: "Lists all biblical books.",
    parameters: [
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
        description: "Number of books per page",
        example: "10",
        schema: {
          type: "string",
        },
      },
      {
        in: "query",
        name: "testament",
        description:
          "Filter by testament (OLD for Old Testament, NEW for New Testament)",
        example: "OLD",
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
          message: "Page must be a positive number",
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
              example: "Page must be a positive number",
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
        description: "List of biblical books retrieved successfully",
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
              example: "2024-01-17T10:05:00.000Z",
            },
          },
        },
        example: {
          success: true,
          data: [
            {
              id: "0909fd62-060e-4960-a6f6-349ccd6420c1",
              name: "Gênesis",
              testament: "OLD",
              order: 1,
              totalChapters: 50,
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 66,
            itemsPerPage: 66,
            hasNextPage: false,
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
                    example: "0909fd62-060e-4960-a6f6-349ccd6420c1",
                  },
                  name: {
                    type: "string",
                    example: "Gênesis",
                  },
                  testament: {
                    type: "string",
                    enum: ["OLD", "NEW"],
                    example: "OLD",
                  },
                  order: {
                    type: "integer",
                    example: 1,
                  },
                  totalChapters: {
                    type: "integer",
                    example: 50,
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
                  example: 1,
                },
                totalItems: {
                  type: "integer",
                  example: 66,
                },
                itemsPerPage: {
                  type: "integer",
                  example: 66,
                },
                hasNextPage: {
                  type: "boolean",
                  example: false,
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

  getBookByOrder: SwaggerConfigType = {
    description:
      "Returns a specific biblical book by its order number (order). This route has a cache of 300 seconds and rate limit of 60 requests per minute.",
    tags: ["Public", "Bible", "Books"],
    summary: "Gets a biblical book by order number.",
    parameters: [
      {
        in: "path",
        name: "bookOrder",
        required: true,
        description: "Order number of the biblical book (1-73)",
        example: "0",
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
        description: "Biblical book retrieved successfully",
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
              example: "2024-01-17T10:05:00.000Z",
            },
          },
        },
        example: {
          success: true,
          data: {
            id: "0909fd62-060e-4960-a6f6-349ccd6420c1",
            name: "Gênesis",
            testament: "OLD",
            order: 1,
            totalChapters: 50,
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
                  example: "0909fd62-060e-4960-a6f6-349ccd6420c1",
                },
                name: {
                  type: "string",
                  example: "Gênesis",
                },
                testament: {
                  type: "string",
                  enum: ["OLD", "NEW"],
                  example: "OLD",
                },
                order: {
                  type: "integer",
                  example: 1,
                },
                totalChapters: {
                  type: "integer",
                  example: 50,
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

export const bibleBooksV1Swagger = new BibleBooksV1Swagger();
