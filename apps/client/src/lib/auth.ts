// Cookie security must mirror the backend, which derives the session cookie
// name/flags from COOKIE_SECURE (see apps/api auth.middleware.ts), NOT from the
// API URL scheme. Keying off NEXT_PUBLIC_API_URL would drop Secure/__Host- when
// the client is HTTPS but fronts a plaintext internal API.
// Falls back to true in production so the env var is optional on Vercel when
// the API deployment already uses __Host-session.
export function isCookieSecure() {
  return (
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production"
  );
}

export function getSessionCookieName() {
  return isCookieSecure() ? "__Host-session" : "session";
}
