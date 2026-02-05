import { SwaggerConfigType } from "@/swaggers/index";

class SeedDatabaseSwagger {
  constructor() {}

  seedDatabase: SwaggerConfigType = {
    description: "Seeds the database with Bible data from a remote source.",
    tags: ["Seed", "Database"],
    summary: "Seeds the database with Bible data.",
    responses: {
      200: {
        description: "Database seeded successfully",
        example: {
          ok: true,
          createdBooks: 66,
          createdChapters: 1189,
          createdVerses: 31102
        },
        schema: {
          type: "object",
          properties: {
            ok: {
              type: "boolean",
              example: true
            },
            createdBooks: {
              type: "number",
              example: 66,
              description: "Number of books created"
            },
            createdChapters: {
              type: "number",
              example: 1189,
              description: "Number of chapters created"
            },
            createdVerses: {
              type: "number",
              example: 31102,
              description: "Number of verses created"
            }
          }
        }
      },
      400: {
        description: "Invalid request parameters",
        example: {
          success: false,
          message: "Page must be a positive number"
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false
            },
            message: {
              type: "string",
              example: "Page must be a positive number"
            }
          }
        }
      },
      500: {
        description: "Internal server error during seeding",
        example: {
          success: false,
          message: "Internal Server Error"
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false
            },
            message: {
              type: "string",
              example: "Internal Server Error"
            }
          }
        }
      }
    }
  };
}

export const seedDatabaseSwagger = new SeedDatabaseSwagger();