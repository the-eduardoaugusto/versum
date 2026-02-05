import {
  PrismaClient,
  User,
  UserUncheckedCreateInput,
  UserUncheckedUpdateInput,
} from "@/libs/prisma";
import { BaseRepository } from "../base.repository";

export class UserRepository extends BaseRepository<
  User,
  UserUncheckedCreateInput,
  UserUncheckedUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, prisma.user);
  }

  async findByEmail({ email }: { email: string }) {
    const user = this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }

  async findByUsername({ username }: { username: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        username,
      },
    });
  }
}
