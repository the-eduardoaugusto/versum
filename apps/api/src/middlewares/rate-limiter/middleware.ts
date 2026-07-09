import { logger } from "@versum/logger";
import type { Context, Next } from "hono";
import { redis } from "../../infrastructure/redis";

interface iConfig {
  windowMs?: number;
  limit?: number;
  keyGenerator?: (c: Context) => Promise<string> | string;
}

function getClientIp(c: Context): string {
  // Prefer x-real-ip (injected by trusted reverse proxy, not forwarded from clients)
  const realIp = c.req.header("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  // Fall back to rightmost non-private IP in x-forwarded-for (added by our load balancer)
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const last = ips[ips.length - 1];
    if (last) return last;
  }

  return "unknown-ip";
}

export class RateLimiterMiddleware {
  private readonly windowMs: number;
  private readonly limit: number;
  private readonly getKey: (c: Context) => Promise<string> | string;

  constructor(config: iConfig = {}) {
    this.windowMs = config.windowMs ?? 60000;
    this.limit = config.limit ?? 100;
    this.getKey = config.keyGenerator ?? ((c) => getClientIp(c));
    this.middleware = this.middleware.bind(this);
  }

  async middleware(c: Context, next: Next) {
    let identifier: string;
    try {
      identifier = await this.getKey(c);
    } catch {
      identifier = "unknown";
    }

    const windowStart = Math.floor(Date.now() / this.windowMs);
    const redisKey = `rate_limit:${identifier}:${c.req.path}:${windowStart}`;

    let currentCount: number;
    try {
      currentCount = await redis.incr(redisKey);
      if (currentCount === 1) {
        await redis.expire(redisKey, Math.ceil(this.windowMs / 1000));
      }
    } catch (error) {
      logger("error", "[RateLimit] Redis error — failing closed:", error);
      return c.json(
        {
          success: false,
          message:
            "Serviço temporariamente indisponível. Tente novamente em breve.",
        },
        503,
      );
    }

    c.header("X-RateLimit-Limit", String(this.limit));
    c.header(
      "X-RateLimit-Remaining",
      String(Math.max(0, this.limit - currentCount)),
    );

    if (currentCount > this.limit) {
      let ttl = Math.ceil(this.windowMs / 1000);
      try {
        ttl = await redis.ttl(redisKey);
      } catch {
        // best-effort
      }
      c.header("Retry-After", String(ttl));

      return c.json(
        {
          success: false,
          message: "Muitas requisições. Tente novamente em breve.",
          retryAfter: ttl,
        },
        429,
      );
    }

    await next();
  }
}

export class GlobalRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      windowMs: 60_000,
      limit: 100,
    });
  }
}

export class MagicLinkSendRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      windowMs: 60_000,
      limit: 5,
      keyGenerator: async (c) => {
        try {
          const body = await c.req.json<{ email?: string }>();
          // Cache the parsed body in context so the route handler can read it
          // without consuming the request stream a second time.
          c.set("cachedBody", body);
          if (body?.email && typeof body.email === "string") {
            return `email:${body.email.toLowerCase().trim()}`;
          }
        } catch {
          // fall through to IP
        }
        return `ip:${getClientIp(c)}`;
      },
    });
  }
}

export class MagicLinkConsumeRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      windowMs: 10 * 60_000, // 10 minutes
      limit: 5,
      keyGenerator: (c) => {
        const token = c.req.query("token") ?? "";
        const publicId = token.split(".")[0];
        if (publicId) return `token:${publicId}`;
        return `ip:${getClientIp(c)}`;
      },
    });
  }
}

/** @deprecated Use MagicLinkSendRateLimiter / MagicLinkConsumeRateLimiter */
export class MagicLinkRateLimiter extends MagicLinkSendRateLimiter {}

export class AvatarUploadRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      windowMs: 60_000,
      limit: 10,
      keyGenerator: (c) => {
        const session = c.get("session") as { userId?: string } | undefined;
        if (session?.userId) return `user:${session.userId}`;
        return `ip:${getClientIp(c)}`;
      },
    });
  }
}
