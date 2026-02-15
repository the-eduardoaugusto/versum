import { BadRequestError } from "./error-model";

export interface Pagination {
  page?: string | number;
  limit?: string | number;
}

export function validateQueryPaginationAndParse({ page, limit }: Pagination) {
  let parsedPage: number = 1;
  let parsedLimit: number = 73;

  if (page !== undefined) {
    const pageNum = Math.floor(Number(page));
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestError("Page must be a positive number!");
    }
    parsedPage = pageNum;
  }

  if (limit !== undefined) {
    const limitNum = Math.floor(Number(limit));
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new BadRequestError("Limit must be a number between 1 and 100!");
    }
    parsedLimit = limitNum;
  }

  return { page: parsedPage, limit: parsedLimit };
}
