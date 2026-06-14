import type { Context, Next } from "hono";
import type { Session } from "@/modules/auth/repositories/auth.types.repository";
import { ConsentLogsRepository } from "@/modules/consent-logs/repositories/consent-logs.repository";
import { ForbiddenError } from "@/utils/app/errors";

const consentLogsRepository = new ConsentLogsRepository();

export const requireConsent = (...purposes: string[]) => {
  return async (c: Context, next: Next) => {
    const session = c.get("session") as Session;

    for (const purpose of purposes) {
      const hasConsent = await consentLogsRepository.hasConsent({
        userId: session.userId,
        purpose,
      });

      if (!hasConsent) {
        throw new ForbiddenError(
          `Consentimento não concedido para: ${purpose}`,
        );
      }
    }

    await next();
  };
};
