import { BaseError } from "./base.error-model.ts";

export class ConflictError extends BaseError {
  readonly statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
