import { z } from "@hono/zod-openapi";

export class BibleCommonSchemasV1 {
  static readonly testamentEnum = z
    .enum(["OLD", "NEW"])
    .describe("Testamento bíblico");

  static readonly bookSchema = z
    .object({
      id: z.uuid().describe("ID único do livro"),
      order: z
        .number()
        .int()
        .positive()
        .describe("Ordem canônica do livro (1-73)"),
      name: z.string().max(100).describe("Nome do livro"),
      slug: z.string().max(10).describe("Slug do livro"),
      niceName: z.string().max(100).describe("Nome amigável do livro"),
      testament: BibleCommonSchemasV1.testamentEnum.describe(
        "Testamento ao qual o livro pertence",
      ),
      totalChapters: z
        .number()
        .int()
        .positive()
        .describe("Número total de capítulos"),
    })
    .openapi("Book", {
      description: "Livro da Bíblia",
    });

  static readonly chapterSchema = z
    .object({
      id: z.uuid().describe("ID único do capítulo"),
      bookId: z.uuid().describe("ID do livro ao qual o capítulo pertence"),
      number: z.number().int().positive().describe("Número do capítulo"),
      totalVerses: z
        .number()
        .int()
        .positive()
        .describe("Número total de versículos"),
    })
    .openapi("Chapter", {
      description: "Capítulo de um livro da Bíblia",
    });

  static readonly verseSchema = z
    .object({
      id: z.uuid().describe("ID único do versículo"),
      chapterId: z
        .uuid()
        .describe("ID do capítulo ao qual o versículo pertence"),
      number: z.number().int().positive().describe("Número do versículo"),
      text: z.string().describe("Texto do versículo"),
    })
    .openapi("Verse", {
      description: "Versículo de um capítulo da Bíblia",
    });

  static readonly dynamicIdParamSchema = z.object({
    dynamicId: z
      .string()
      .min(1)
      .openapi({
        param: {
          name: "dynamicId",
          in: "path",
          required: true,
        },
        example: "genesis",
        description: "Slug ou nome do livro (ex: 'genesis' ou 'Gênesis')",
      }),
  });

  static readonly chapterNumberParamSchema = z.object({
    number: z
      .string()
      .regex(/^\d+$/, "Número do capítulo deve ser um inteiro positivo válido")
      .openapi({
        param: {
          name: "number",
          in: "path",
          required: true,
        },
        example: "1",
        description: "Número do capítulo",
      }),
  });

  static readonly verseNumberParamSchema = z.object({
    verse: z
      .string()
      .regex(/^\d+$/, "Número do versículo deve ser um inteiro positivo válido")
      .openapi({
        param: {
          name: "verse",
          in: "path",
          required: true,
        },
        example: "1",
        description: "Número do versículo",
      }),
  });
}

export const testamentEnum = BibleCommonSchemasV1.testamentEnum;
export const bookSchema = BibleCommonSchemasV1.bookSchema;
export const chapterSchema = BibleCommonSchemasV1.chapterSchema;
export const verseSchema = BibleCommonSchemasV1.verseSchema;
export const dynamicIdParamSchema = BibleCommonSchemasV1.dynamicIdParamSchema;
export const chapterNumberParamSchema =
  BibleCommonSchemasV1.chapterNumberParamSchema;
export const verseNumberParamSchema =
  BibleCommonSchemasV1.verseNumberParamSchema;

export type Book = z.infer<typeof BibleCommonSchemasV1.bookSchema>;
export type Chapter = z.infer<typeof BibleCommonSchemasV1.chapterSchema>;
export type Verse = z.infer<typeof BibleCommonSchemasV1.verseSchema>;
export type Testament = z.infer<typeof BibleCommonSchemasV1.testamentEnum>;
