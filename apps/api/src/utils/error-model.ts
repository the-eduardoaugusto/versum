/**
 * Modelo padronizado para erros da API
 * Segue o padrão: { success: boolean, message: string }
 */

export interface ErrorModel {
  success: boolean;
  message: string;
}

/**
 * Classe base para erros personalizados da API
 * Segue o padrão: { success: false, message: "mensagem" }
 */
export class BaseError implements ErrorModel {
  public readonly success: boolean = false;
  public readonly message: string;
  public name: string = "BaseError";

  constructor(message: string) {
    this.message = message;

    // Manter o rastreamento da pilha de chamadas adequado
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Retorna o objeto de erro no formato esperado pela API
   */
  toJSON(): ErrorModel {
    return {
      success: this.success,
      message: this.message,
    };
  }
}

/**
 * Classe para erro de requisições inválidas (400)
 */
export class BadRequestError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

/**
 * Classe para erro de recursos não encontrados (404)
 */
export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Classe para erro de requisições não autorizadas (401)
 */
export class UnauthorizedError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Classe para erro de requisições proibidas (403)
 */
export class ForbiddenError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Classe para erro de limite de requisições excedido (429)
 */
export class RateLimitError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Classe para erro de problemas internos do servidor (500)
 */
export class InternalServerError extends BaseError {
  constructor(message: string) {
    super(message);
    this.name = "InternalServerError";
  }
}
