import { MagicLinkRepository } from "@/repositories/magic-link.repository";
import { randomBytes } from "crypto";
import { prisma } from "@/libs/prisma";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "@/env";
import { UserRepository } from "@/repositories";
import { RefreshTokenRepository } from "@/repositories/refresh-token.repository";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/utils/error-model";

export class MagicLinkService {
  private magicLinkRepository: MagicLinkRepository;
  private userRepository: UserRepository;
  private refreshTokenRepository: RefreshTokenRepository;

  constructor() {
    this.magicLinkRepository = new MagicLinkRepository(prisma);
    this.userRepository = new UserRepository(prisma);
    this.refreshTokenRepository = new RefreshTokenRepository(prisma);
  }

  private async generateRefreshToken({ userId }: { userId: string }) {
    const token = randomBytes(32).toString("hex");
    const hashedToken = await argon2.hash(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.createRefreshToken({
      expiresAt,
      userId,
      token: hashedToken,
    });

    return token;
  }

  async authenticateToken({ token }: { token: string }) {
    const [publicId, rawToken] = token.split(".");
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
    const updatedMagicLinkQueryData =
      await this.magicLinkRepository.updateMagicLinkToUsed({
        id: magicLink.id,
        data: {
          usedAt: new Date(),
        },
      });

    if (updatedMagicLinkQueryData.count === 0) {
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

    const refreshToken = await this.generateRefreshToken({ userId: user.id });

    return { accessToken, refreshToken };
  }

  async createToken({ email }: { email: string }) {
    const token = randomBytes(32).toString("hex");
    const magicLink = await this.magicLinkRepository.createMagicLink({
      email,
      token,
    });

    return `${magicLink.publicId}.${token}`;
  }
}
