import type { PaginationViewModel } from "./pagination.view-model.ts";

interface SuccessViewModelInput<T> {
  data?: T;
  pagination?: PaginationViewModel;
  message: string;
  code: string;
}

export class SuccessViewModel<T> {
  success: boolean;
  message: string;
  code: string;
  data?: T;
  pagination?: PaginationViewModel;

  constructor({ data, pagination, message, code }: SuccessViewModelInput<T>) {
    this.success = true;
    this.message = message;
    this.code = code;
    this.data = data;
    this.pagination = pagination;
  }

  static create<T>(input: SuccessViewModelInput<T>) {
    return new SuccessViewModel(input);
  }

  toJSON() {
    const response: {
      success: boolean;
      message: string;
      code: string;
      data?: T;
      pagination?: ReturnType<PaginationViewModel["toJSON"]>;
    } = {
      success: this.success,
      message: this.message,
      code: this.code,
    };

    if (this.data !== undefined) response.data = this.data;
    if (this.pagination) response.pagination = this.pagination.toJSON();

    return response;
  }
}
