import {
  PrismaClient,
  RefreshToken,
  RefreshTokenUncheckedCreateInput,
  RefreshTokenUncheckedUpdateInput,
} from "@/libs/prisma";
import { BaseRepository } from "../base.repository";

export class RefreshTokenRepository extends BaseRepository<
  RefreshToken,
  RefreshTokenUncheckedCreateInput,
  RefreshTokenUncheckedUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.refreshToken);
  }

  async createRefreshToken({
    token,
    userId,
    expiresAt,
  }: {
    token: string;
    userId: string;
    expiresAt: Date;
  }) {
    return await this.prisma.refreshToken.create({
      data: {
        expiresAt,
        token,
        userId,
      },
    });
  }

  async findByToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: {
        token,
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
      },
    });
  }

  async deleteByUserId(userId: string) {
    return this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });
  }
}
