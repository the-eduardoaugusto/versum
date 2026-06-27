export const isValidationError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const withIssues = error as Error & { issues?: unknown };
  return error.name === "ZodError" || Array.isArray(withIssues.issues);
};

// A malformed/empty JSON request body is a client fault (400), not an internal
// error (500). It surfaces in two shapes before the controller runs:
//   - Hono's body validator wraps it as Error("Malformed JSON in request body")
//   - a raw SyntaxError from the parser ("JSON Parse error: Unexpected EOF",
//     "Unexpected end of JSON input")
// Both must be normalized to 400 at the global error handler level.
export const isJsonParseError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return /malformed json|json parse error|unexpected (end|eof|token).*json|json.*unexpected/i.test(
    error.message,
  );
};

const parseSerializedZodMessage = (message: string): string => {
  try {
    const parsed = JSON.parse(message) as Array<{ message?: unknown }>;
    if (
      Array.isArray(parsed) &&
      typeof parsed[0]?.message === "string" &&
      parsed[0].message.length > 0
    ) {
      return parsed[0].message;
    }
  } catch {
    // Not a serialized JSON array from ZodError.
  }

  return message;
};

export const extractErrorMessage = (
  error: unknown,
  fallback = "Internal Server Error",
): string => {
  if (typeof error === "string" && error.length > 0) return error;

  if (error instanceof Error) {
    const withIssues = error as Error & {
      issues?: Array<{ message?: unknown }>;
    };

    if (
      Array.isArray(withIssues.issues) &&
      typeof withIssues.issues[0]?.message === "string" &&
      withIssues.issues[0].message.length > 0
    ) {
      return withIssues.issues[0].message;
    }

    if (typeof error.message === "string" && error.message.length > 0) {
      if (isValidationError(error)) {
        return parseSerializedZodMessage(error.message);
      }

      return error.message;
    }
  }

  return fallback;
};
