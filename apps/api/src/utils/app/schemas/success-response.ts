import { z } from "@hono/zod-openapi";
import { paginationViewModelSchema } from "./pagination.ts";

export function createSuccessResponseSchema<T extends z.ZodType>(
  name: string,
  dataSchema?: T,
  includePagination = false,
) {
  const schema: Record<string, z.ZodType> = {
    success: z
      .boolean()
      .default(true)
      .describe("Indica se a requisição foi bem-sucedida"),
    message: z.string().describe("Mensagem de contexto da resposta"),
    code: z.string().describe("Código da resposta"),
  };

  if (dataSchema && !(dataSchema instanceof z.ZodUndefined)) {
    schema.data = dataSchema.optional().describe("Dados da resposta");
  }

  if (includePagination) {
    schema.pagination = paginationViewModelSchema
      .optional()
      .describe("Informações de paginação");
  }

  return z.object(schema).openapi(name, {
    description: `Resposta de sucesso para ${name}`,
  });
}
