import { RequestServer, ResponseServer, NextFunction } from "azurajs/types";
import { BaseError, InternalServerError } from "@/utils/error-model";

export const errorHandlerMiddleware = (
  err: Error, // ← Recebe o erro
  req: RequestServer,
  res: ResponseServer,
  next: NextFunction,
) => {
  // Trata o erro usando o modelo padronizado
  if (err instanceof BaseError) {
    return res.status(400).json(err.toJSON());
  }

  // Erro não identificado (genérico)
  console.error("Erro não tratado:", err);

  return res.status(500).json(new InternalServerError("Erro interno do servidor").toJSON());
};
