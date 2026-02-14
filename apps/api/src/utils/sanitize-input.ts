import { BadRequestError } from "./error-model";

/**
 * Sanitiza uma string removendo caracteres potencialmente perigosos
 * @param input - A string a ser sanitizada
 * @returns A string sanitizada
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    throw new BadRequestError("Input must be a string");
  }

  return input
    .replace(/[<>;"']/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Sanitiza um ID, removendo caracteres não alfanuméricos
 * @param id - O ID a ser sanitizado
 * @returns O ID sanitizado
 */
export function sanitizeId(id: string): string {
  if (typeof id !== "string") {
    throw new BadRequestError("ID must be a string");
  }

  // Permitir apenas caracteres alfanuméricos e hífens/sublinhados
  return id.replace(/[^a-zA-Z0-9\-_]/g, "");
}

/**
 * Sanitiza um número inteiro representando uma página
 * @param num - O número a ser sanitizado
 * @returns O número sanitizado
 */
export function sanitizePageNumber(num: number | string): number {
  const parsedNum = typeof num === "string" ? parseInt(num, 10) : num;

  if (isNaN(parsedNum)) {
    throw new BadRequestError("Page must be a positive number!");
  }

  return parsedNum;
}

/**
 * Sanitiza um número inteiro representando um limite
 * @param num - O número a ser sanitizado
 * @returns O número sanitizado
 */
export function sanitizeLimitNumber(num: number | string): number {
  const parsedNum = typeof num === "string" ? parseInt(num, 10) : num;

  if (isNaN(parsedNum)) {
    throw new BadRequestError("Limit must be a number between 1 and 100!");
  }

  return parsedNum;
}

/**
 * Sanitiza um objeto, aplicando funções de sanitização apropriadas aos seus valores
 * @param obj - O objeto a ser sanitizado
 * @returns O objeto sanitizado
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitizedObj = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitizedObj[key as keyof T] = sanitizeString(value) as T[keyof T];
    } else if (typeof value === "number") {
      // Para números genéricos, usamos sanitizePageNumber como padrão
      // Se for necessário um tratamento específico para diferentes tipos de números,
      // pode-se implementar uma lógica mais específica aqui
      sanitizedObj[key as keyof T] = sanitizePageNumber(value) as T[keyof T];
    } else if (typeof value === "object" && value !== null) {
      sanitizedObj[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else {
      sanitizedObj[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitizedObj;
}

/**
 * Sanitiza parâmetros de paginação
 * @param params - Os parâmetros de paginação
 * @returns Os parâmetros sanitizados
 */
export function sanitizePaginationParams(params: {
  page?: number | string;
  limit?: number | string;
}) {
  const sanitizedParams = { ...params };

  if (params.page !== undefined) {
    const pageNum = sanitizePageNumber(params.page);
    if (pageNum < 1) {
      throw new BadRequestError("Page must be a positive number!");
    }
    sanitizedParams.page = pageNum;
  }

  if (params.limit !== undefined) {
    const limitNum = sanitizeLimitNumber(params.limit);
    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestError("Limit must be a number between 1 and 100!");
    }
    sanitizedParams.limit = limitNum;
  }

  return sanitizedParams;
}
