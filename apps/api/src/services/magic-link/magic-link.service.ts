import { MagicLinkRepository } from "@/repositories";
import { randomBytes } from "crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "@/env";
import { UserRepository } from "@/repositories";
import { RefreshTokenRepository } from "@/repositories";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/error-model";
import { sanitizeString } from "@/utils/sanitize-input";
import { v } from "azurajs/validators";

export class MagicLinkService {
  private magicLinkRepository: MagicLinkRepository;
  private userRepository: UserRepository;
  private refreshTokenRepository: RefreshTokenRepository;

  constructor({
    magicLinkRepo,
    userRepo,
    refreshTokenRepo,
  }: {
    magicLinkRepo?: MagicLinkRepository;
    userRepo?: UserRepository;
    refreshTokenRepo?: RefreshTokenRepository;
  }) {
    this.magicLinkRepository = magicLinkRepo || new MagicLinkRepository();
    this.userRepository = userRepo || new UserRepository();
    this.refreshTokenRepository =
      refreshTokenRepo || new RefreshTokenRepository();
  }

  private async generateRefreshToken({
    userId,
    ipAddress,
  }: {
    userId: string;
    ipAddress: string;
  }) {
    const token = randomBytes(32).toString("hex");
    const hashedToken = await argon2.hash(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.createRefreshToken({
      expiresAt,
      userId,
      token: hashedToken,
      ipAddress,
    });

    return token;
  }

  async authenticateToken({
    token,
    ipAddress,
  }: {
    token: string;
    ipAddress: string;
  }) {
    const sanitizedToken = sanitizeString(token);
    const [publicId, rawToken] = sanitizedToken.split(".");
    if (!publicId || !rawToken) {
      throw new BadRequestError("Bad magic link token!");
    }
    const magicLink = await this.magicLinkRepository.findByPublicId({
      publicId,
    });

    if (!magicLink) throw new NotFoundError("Magic link token do not exists");

    if (magicLink.invalidatedAt) {
      throw new UnauthorizedError("Magic Link token is invalid.");
    }

    const tokenIsValid = await argon2.verify(magicLink.token, rawToken);

    if (!tokenIsValid) throw new UnauthorizedError("Magic link does not match");

    const updateResult = await this.magicLinkRepository.updateMagicLink({
      id: magicLink.id,
      data: {
        usedAt: new Date(),
      },
    });

    // Verificar se alguma linha foi realmente atualizada
    // O tipo de retorno pode variar dependendo do driver do banco de dados
    // No PostgreSQL com Drizzle, o retorno costuma ser um array com os IDs das linhas modificadas
    const rowsAffected = Array.isArray(updateResult)
      ? updateResult.length
      : updateResult;
    if (rowsAffected === 0) {
      throw new UnauthorizedError("Magic link has already been used");
    }

    let user = await this.userRepository.findByEmail({
      email: magicLink.email,
    });
    if (!user) {
      const tempUserName = magicLink.email.split("@")[0];
      user = await this.userRepository.create({
        email: magicLink.email,
        name: tempUserName,
        username: tempUserName,
        createdAt: new Date(),
      });
    }
    const accessToken = jwt.sign(
      {
        sub: user.id,
      },
      env.ENCRYPT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const refreshToken = await this.generateRefreshToken({
      userId: user.id,
      ipAddress,
    });

    return { accessToken, refreshToken };
  }

  async createToken({ email }: { email: string }) {
    const sanitizedEmail = sanitizeString(email);
    console.log(sanitizedEmail);
    const parsedEmail = v.string().email().safeParse(sanitizedEmail);
    if (!parsedEmail.success) {
      throw new BadRequestError("Invalid email!");
    }
    const token = randomBytes(32).toString("hex");
    const magicLink = await this.magicLinkRepository.createMagicLink({
      email: sanitizedEmail,
      token,
    });

    return `${magicLink.publicId}.${token}`;
  }
}
