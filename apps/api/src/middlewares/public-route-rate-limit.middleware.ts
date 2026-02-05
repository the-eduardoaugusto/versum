import { RequestHandler } from "azurajs/types";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

class PublicRoutesRateLimit {
  windowMs: number;
  maxReqPerWindow: number;

  constructor(windowMs?: number, maxReqPerWindow?: number) {
    this.windowMs = windowMs || 60 * 1000;
    this.maxReqPerWindow = maxReqPerWindow || 60;
    this.middleware = this.middleware.bind(this);
  }

  middleware: RequestHandler = (req, res, next) => {
    if (!next || !req.url) {
      throw new Error(
        "Function 'next' is not mounted or url of req is undefined/null.",
      );
    }

    const pathParts = req.url.split("/").filter((i) => i !== "");

    const isPublicRoute =
      pathParts[0] === "api" && pathParts.includes("public");

    if (!isPublicRoute) return next();

    const key = req.ip;
    const now = Date.now();

    let record = store.get(key);
    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      store.set(key, record);
      return next();
    }

    record.count++;

    res.setHeader("X-RateLimit-Limit", this.maxReqPerWindow.toString());
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, this.maxReqPerWindow - record.count).toString(),
    );
    res.setHeader("X-RateLimit-Reset", new Date(record.resetAt).toISOString());

    if (record.count > this.maxReqPerWindow) {
      return res.status(429).json({
        error: "Você fez muitas requisições para uma rota pública!",
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
    }

    next();
  };
}

export const publicRoutesRateLimit = new PublicRoutesRateLimit().middleware;
