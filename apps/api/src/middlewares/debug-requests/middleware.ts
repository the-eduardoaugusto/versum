import { logger } from "azurajs/logger";
import { NextFunction, RequestServer, ResponseServer } from "azurajs/types";

export async function debugRequests(
  req: RequestServer,
  _res: ResponseServer,
  next?: NextFunction,
) {
  logger("debug", `${req.method}  ${req.url}`);
  if (next) next();
}
