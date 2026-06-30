type CustomRequestInit = RequestInit & { baseURL?: string };

type ErrorResponse = {
  status: number;
  data: unknown;
};

export class ApiError extends Error {
  response: ErrorResponse;

  constructor(message: string, response: ErrorResponse) {
    super(message);
    this.response = response;
  }
}

const isAbsoluteUrl = (input: string) =>
  input.startsWith("http://") || input.startsWith("https://");

export default async function apiFetcher<T>(
  url: string,
  options?: CustomRequestInit,
): Promise<T> {
  const { baseURL, ...fetchOptions } = options ?? {};
  const resolvedBaseURL = baseURL ?? process.env.NEXT_PUBLIC_API_URL;
  const apiOrigin = resolvedBaseURL?.replace(/\/+$/, "");

  let fullUrl: string;
  if (
    typeof window !== "undefined" &&
    isAbsoluteUrl(url) &&
    apiOrigin &&
    url.startsWith(apiOrigin)
  ) {
    // Browser: strip API origin so the request goes through the Next.js proxy at /api/[...path],
    // which forwards the cookie (set on this domain) to the API server.
    fullUrl = url.slice(apiOrigin.length);
  } else if (apiOrigin && !isAbsoluteUrl(url)) {
    fullUrl = `${apiOrigin}${url}`;
  } else {
    fullUrl = url;
  }

  const response = await fetch(fullUrl, {
    credentials: "include",
    ...fetchOptions,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(errorBody.message ?? `HTTP ${response.status}`, {
      status: response.status,
      data: errorBody,
    });
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  return response.json();
}
