export function validateQueryPagination({
  page,
  limit,
}: {
  page?: string;
  limit?: string;
}) {
  let parsedPage: number = 1;
  let parsedLimit: number = 73;

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      throw new Error("Página deve ser um número positivo");
    }
    parsedPage = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new Error("Limite deve ser um número entre 1 e 100");
    }
    parsedLimit = limitNum;
  }

  return { page: parsedPage, limit: parsedLimit };
}
