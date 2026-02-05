import { ResponseServer } from "azurajs/types";
import { BaseError, BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError, InternalServerError } from "./error-model";

/**
 * Função centralizada para tratamento de erros nos controllers
 * @param error - O erro a ser tratado
 * @param res - O objeto de resposta do servidor
 * @param context - Contexto opcional para logging
 */
export const handleError = (error: unknown, res: ResponseServer, context?: string) => {
  // Verifica se é um erro conhecido do sistema
  if (error instanceof BaseError) {
    const statusCode = getStatusCodeForError(error);
    return res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }

  // Para outros tipos de erro
  console.error(context ? `Erro no ${context}:` : "Erro não tratado:", error);
  
  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};

/**
 * Determina o código de status HTTP apropriado com base no tipo de erro
 * @param error - O erro para determinar o código de status
 * @returns Código de status HTTP apropriado
 */
const getStatusCodeForError = (error: BaseError): number => {
  if (error instanceof BadRequestError) return 400;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof ForbiddenError) return 403;
  if (error instanceof InternalServerError) return 500;
  
  // Para outros tipos de erros personalizados
  return 400;
};