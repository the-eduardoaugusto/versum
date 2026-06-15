export class ApiErrorViewModel {
  success: boolean;
  message: string;
  code: string;

  constructor(message: string, code: string) {
    this.success = false;
    this.message = message;
    this.code = code;
  }

  toJSON() {
    return {
      success: this.success,
      message: this.message,
      code: this.code,
    };
  }
}
