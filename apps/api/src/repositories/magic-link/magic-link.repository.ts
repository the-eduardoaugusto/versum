import {
  MagicLink,
  MagicLinkUncheckedCreateInput,
  MagicLinkUncheckedUpdateInput,
  PrismaClient,
} from "@/libs/prisma";
import * as argon2 from "argon2";
import { BaseRepository } from "../base.repository";

export class MagicLinkRepository extends BaseRepository<
  MagicLink,
  MagicLinkUncheckedCreateInput,
  MagicLinkUncheckedUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.magicLink);
  }

  async findMagicLinkByTokenAndEmail({ email }: { email: string }) {
    const magicLink = await this.prisma.magicLink.findFirst({
      where: {
        email,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    return magicLink;
  }

  async findByPublicId({ publicId }: { publicId: string }) {
    return await this.prisma.magicLink.findFirst({
      where: {
        publicId,
      },
    });
  }

  async updateMagicLinkToUsed({
    id,
    data,
  }: {
    id: string;
    data: MagicLinkUncheckedUpdateInput;
  }) {
    return await this.prisma.magicLink.updateMany({
      where: {
        usedAt: null,
        invalidatedAt: null,
        id,
        expiresAt: {
          gt: new Date(),
        },
      },
      data,
    });
  }

  async createMagicLink({ email, token }: { token: string; email: string }) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const encryptedToken = await argon2.hash(token);
    const magicLink = await this.prisma.magicLink.create({
      data: {
        token: encryptedToken,
        email,
        expiresAt,
      },
    });
    return magicLink;
  }
}
