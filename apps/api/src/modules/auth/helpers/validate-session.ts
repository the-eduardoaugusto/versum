import { UnauthorizedError } from "../../../utils/app/errors/index.ts";
import { hashMetadata } from "../../../utils/crypto/metadata-hash.ts";
import type { Session } from "../repositories/auth.types.repository.ts";

export class ValidateSession {
  session: Session;

  constructor({
    session,
    requestIp,
    requestUA,
  }: {
    session?: Session | null;
    requestIp?: string;
    requestUA?: string;
    }) {
    if (!session) throw new UnauthorizedError("Session not found");
    if (session.expiresAt.getTime() < Date.now())
      throw new UnauthorizedError("Session expired");
    if (session.revokedAt)
      throw new UnauthorizedError("Session revoked");

    if (session.userAgent && requestUA && session.userAgent !== hashMetadata(requestUA)) {
      throw new UnauthorizedError("Session user-agent does not match");
    }

    this.session = session;
  }
}
