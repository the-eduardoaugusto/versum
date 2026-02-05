import { SwaggerConfigType } from "@/swaggers/index";

class MagicLinkV1Swagger {
  constructor() {}

  sendMagicLink: SwaggerConfigType = {
    description: "Sends a magic link to the user's email for authentication.",
    tags: ["Auth", "Magic Link"],
    summary: "Sends a magic link for authentication.",
    requestBody: {
      example: {
        email: "your@email.com",
        redirectUrl: "https://website.com",
      },

      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["email", "redirectUrl"],
            properties: {
              email: {
                type: "string",
                format: "email",
                example: "user@example.com",
                description: "User's email address to send the magic link",
              },
              redirectUrl: {
                type: "string",
                format: "uri",
                example: "https://example.com/dashboard",
                description: "URL to redirect the user after authentication",
              },
            },
          },
          example: {
            email: "user@example.com",
            redirectUrl: "https://example.com/dashboard",
          },
        },
      },
    },
    responses: {
      200: {
        description: "Magic link sent successfully",
        example: {
          success: true,
          data: {
            message: "Email sent!",
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
                message: {
                  type: "string",
                  example: "Email sent!",
                },
              },
            },
          },
        },
      },
      400: {
        description: "Invalid request with missing parameters",
        example: {
          success: false,
          message: "Provide email and redirectUrl in request body!",
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
              example: "Provide email and redirectUrl in request body!",
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
    },
  };

  generateJwt: SwaggerConfigType = {
    description: "Generates JWT token after magic link authentication.",
    tags: ["Auth", "Magic Link", "Callback"],
    summary: "Generates JWT token after magic link authentication.",
    parameters: [
      {
        in: "query",
        name: "token",
        required: true,
        description: "The magic link token received via email",
        example: "abc123.def456.ghi789",
        schema: {
          type: "string",
        },
      },
    ],
    responses: {
      200: {
        description: "JWT token generated successfully",
        example: {
          success: true,
          data: {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            refreshToken: "def456.ghi789.jkl012...",
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
                accessToken: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                refreshToken: {
                  type: "string",
                  example: "def456.ghi789.jkl012...",
                },
              },
            },
          },
        },
      },
      400: {
        description: "Missing magic link token",
        example: {
          error: "Magic link token is required!",
          code: "TOKEN_REQUIRED",
        },
        schema: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Magic link token is required!",
            },
            code: {
              type: "string",
              example: "TOKEN_REQUIRED",
            },
          },
        },
      },
      404: {
        description: "Magic link token not found",
        example: {
          success: false,
          message: "Magic link token do not exists",
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
              example: "Magic link token do not exists",
            },
          },
        },
      },
      401: {
        description: "Magic link token is invalid or expired",
        example: {
          success: false,
          message: "Magic Link token is invalid.",
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
              example: "Magic Link token is invalid.",
            },
          },
        },
      },
    },
  };
}

export const magicLinkV1Swagger = new MagicLinkV1Swagger();
