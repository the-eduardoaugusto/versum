import { z } from "@hono/zod-openapi";
import { createErrorResponses } from "../../../utils/app/errors/openapi.ts";
import { createSuccessResponseSchema } from "../../../utils/app/schemas/success-response.ts";
import { BibleCommonSchemasV1 } from "./bible.v1.common.schema.ts";

export class ChaptersSchemasV1 {
  static readonly getChaptersResponseSchema = createSuccessResponseSchema(
    "GetChaptersResponse",
    z.array(BibleCommonSchemasV1.chapterSchema),
    true,
  );

  static readonly getChaptersResponses = {
    200: {
      content: {
        "application/json": {
          schema: ChaptersSchemasV1.getChaptersResponseSchema,
        },
      },
      description: "Lista de capítulos do livro retornada com sucesso",
    },
    ...createErrorResponses([400, 404, 429, 500]),
  };

  static readonly getChapterResponseSchema = createSuccessResponseSchema(
    "GetChapterResponse",
    BibleCommonSchemasV1.chapterSchema,
  );

  static readonly getChapterResponses = {
    200: {
      content: {
        "application/json": {
          schema: ChaptersSchemasV1.getChapterResponseSchema,
        },
      },
      description: "Capítulo encontrado e retornado com sucesso",
    },
    ...createErrorResponses([400, 404, 429, 500]),
  };
}

export const getChaptersResponseSchema =
  ChaptersSchemasV1.getChaptersResponseSchema;
export const getChaptersResponses = ChaptersSchemasV1.getChaptersResponses;
export const getChapterResponseSchema =
  ChaptersSchemasV1.getChapterResponseSchema;
export const getChapterResponses = ChaptersSchemasV1.getChapterResponses;
