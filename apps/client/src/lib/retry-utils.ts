import { ApiError } from "./api-fetcher";

export function retryOn5xx(retryCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.response.status >= 500) {
    return retryCount < 3;
  }
  return false;
}

export function exponentialDelay(retryCount: number): number {
  return Math.min(1000 * 2 ** retryCount, 30_000);
}
