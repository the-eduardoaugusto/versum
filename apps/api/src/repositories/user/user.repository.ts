import { PrismaClient, User, Prisma } from "@/libs/prisma";
import { BaseRepository } from "../base.repository";

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserUncheckedCreateInput,
  Prisma.UserUncheckedUpdateInput,
  Prisma.UserFindManyArgs,
  Prisma.UserCountArgs
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
