import { logger } from "@versum/logger";
import argon2 from "argon2";
import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { ValidateSession } from "../modules/auth/helpers/validate-session.ts";
import { AuthRepository } from "../modules/auth/repositories/auth.repository.ts";
import { AuthServiceV1 } from "../modules/auth/services/auth.v1.service.ts";
import { UnauthorizedError } from "../utils/app/errors/index.ts";

const isSecure = Bun.env.COOKIE_SECURE === "true";
const cookieName = isSecure ? "__Host-session" : "session";

export class AuthMiddleware {
  private readonly service: AuthServiceV1;
  private readonly repo: AuthRepository;
  constructor({
    repository,
    service,
  }: {
    service?: AuthServiceV1;
    repository?: AuthRepository;
  } = {}) {
    this.service = service ?? new AuthServiceV1();
    this.repo = repository ?? new AuthRepository();
    this.validateSession = this.validateSession.bind(this);
  }

  async validateSession(ctx: Context, next: Next) {
    const sessionCookie = getCookie(ctx, cookieName);
    logger(
      "debug",
      "[Auth] cookieName:",
      cookieName,
      "present:",
      !!sessionCookie,
    );
    if (!sessionCookie) throw new UnauthorizedError("Session cookie not found");
    const [sessionCookiePublicId, sessionSecret] = sessionCookie.split(".");

    if (!sessionCookiePublicId || !sessionSecret)
      throw new UnauthorizedError("Invalid session cookie");

    const session = await this.repo.getSessionByPublicId({
      publicId: sessionCookiePublicId,
    });
    logger("debug", "[Auth] session from publicId:", session?.id);

    // Verify the secret half of the cookie against the stored hash. Without
    // this the publicId (a non-secret lookup id) would be the only credential.
    if (!session || !(await argon2.verify(session.tokenHash, sessionSecret)))
      throw new UnauthorizedError("Invalid session");

    const requestIp =
      ctx.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      (ctx.req.raw as { remoteAddress?: string }).remoteAddress ??
      "unknown";
    const requestUA = ctx.req.header("user-agent") ?? "unknown";

    const validatedSession = new ValidateSession({
      session,
      requestIp,
      requestUA,
    });
    logger("debug", "[Auth] session validated, calling refreshSession");

    const refreshSessionResult = await this.service.refreshSession({
      sessionId: validatedSession.session.id,
      requestIp,
      requestUA,
    });

    logger(
      "debug",
      "[Auth] refreshSession done, rotated:",
      refreshSessionResult.rotated,
    );

    if (refreshSessionResult.rotated) {
      const { session, token } = refreshSessionResult;
      setCookie(ctx, cookieName, token, {
        path: "/",
        httpOnly: true,
        secure: isSecure,
        sameSite: "Lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      ctx.set("session", session);
    } else {
      ctx.set("session", validatedSession.session);
    }

    await next();
  }
}
