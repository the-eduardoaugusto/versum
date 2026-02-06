import { NextFunction, RequestServer, ResponseServer } from "azurajs/types";
import { redis } from "@/libs/redis";

export async function cachePublicRoutes(
  req: RequestServer,
  res: ResponseServer,
  next?: NextFunction,
) {
  if (!next || !req.url) return;
  const ignoreCache =
    req.hostname == "localhost" && req.query["ignoreCache"] === "true";
  if (req.method !== "GET" || ignoreCache) {
    return next();
  }

  if (!req.url.split("/").includes("public")) return next();
  const key = `cache:${req.url}`;

  try {
    const cached = await redis.get(key);

    if (cached) {
      const ttl = await redis.ttl(key);
      const cacheExpireAt = new Date(Date.now() + ttl * 1000).toISOString();
      return res.json({ ...JSON.parse(cached), cache: true, cacheExpireAt });
    }
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      redis.setex(key, 300, JSON.stringify(data));
      return originalJson({ ...data, cache: false });
    };
    next();
  } catch (error) {
    next();
  }
}
