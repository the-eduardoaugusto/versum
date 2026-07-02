import { z } from "@hono/zod-openapi";

export const paginationViewModelSchema = z
  .object({
    currentPage: z.number().int().positive().describe("Página atual"),
    totalPages: z
      .number()
      .int()
      .positive()
      .describe("Número total de páginas"),
    totalItems: z
      .number()
      .int()
      .nonnegative()
      .describe("Número total de itens"),
    itemsPerPage: z
      .number()
      .int()
      .positive()
      .describe("Número de itens por página"),
    hasNextPage: z.boolean().describe("Indica se existe próxima página"),
    hasPrevPage: z.boolean().describe("Indica se existe página anterior"),
  })
  .openapi("PaginationViewModel", {
    description: "Informações de paginação",
  });

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .openapi({
      param: {
        name: "page",
        in: "query",
        required: false,
      },
      example: 1,
      description: "Número da página (padrão: 1)",
    }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .openapi({
      param: {
        name: "limit",
        in: "query",
        required: false,
      },
      example: 10,
      description: "Limite de itens por página (padrão: 10)",
    }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type PaginationViewModel = z.infer<typeof paginationViewModelSchema>;
