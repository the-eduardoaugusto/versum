import { PaginationViewModel } from "./pagination.viewmodel";

export abstract class BaseViewModel<T> {
  constructor(data: T) {
    Object.assign(this, data);
  }

  toJSON(): T {
    return JSON.parse(JSON.stringify(this));
  }
}

export class ApiResponseViewModel<T> {
  success: boolean;
  data?: T;
  pagination?: PaginationViewModel;
  message?: string;

  constructor(data?: T, pagination?: PaginationViewModel, message?: string) {
    this.success = true;
    this.data = data;
    this.pagination = pagination;
    this.message = message;
  }

  toJSON() {
    const response: any = {
      success: this.success,
    };

    if (this.message) response.message = this.message;
    if (this.data) response.data = this.data;
    if (this.pagination) response.pagination = this.pagination.toJSON();

    return response;
  }
}

export class ApiErrorViewModel {
  success: boolean;
  error: string;
  code?: string;

  constructor(error: string, code?: string) {
    this.success = false;
    this.error = error;
    this.code = code;
  }

  toJSON() {
    const response: any = {
      success: this.success,
      error: this.error,
    };

    if (this.code) response.code = this.code;

    return response;
  }
}
