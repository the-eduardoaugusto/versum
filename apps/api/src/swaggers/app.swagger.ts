import { SwaggerConfigType } from "@/swaggers/index";

class AppSwagger {
  constructor() {}

  getRoot: SwaggerConfigType = {
    description: "Returns the root information of the API.",
    tags: ["App"],
    summary: "Gets root information.",
    responses: {
      200: {
        description: "Root information retrieved successfully",
        example: {
          success: true,
          data: {
            latin: "Ego sum via et veritas et vita!",
            ptBR: "Eu sou o caminho, a verdade e a vida!",
            enUS: "I am the way, the truth, and the life!"
          }
        },
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true
            },
            data: {
              type: "object",
              properties: {
                latin: {
                  type: "string",
                  example: "Ego sum via et veritas et vita!"
                },
                ptBR: {
                  type: "string",
                  example: "Eu sou o caminho, a verdade e a vida!"
                },
                enUS: {
                  type: "string",
                  example: "I am the way, the truth, and the life!"
                }
              }
            }
          }
        }
      }
    }
  };
}

export const appSwagger = new AppSwagger();