import { db } from "@/db/client";
import { refreshTokens } from "@/db/schema";
import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";

export type RefreshToken = InferSelectModel<typeof refreshTokens>;
export type NewRefreshToken = InferInsertModel<typeof refreshTokens>;

export class RefreshTokenRepository {
  table = refreshTokens;
  db = db;

  async createRefreshToken({
    token,
    userId,
    expiresAt,
    ipAddress,
  }: {
    token: string;
    userId: string;
    expiresAt: Date;
    ipAddress: string;
  }) {
    const [refreshToken] = await this.db
      .insert(this.table)
      .values({
        expiresAt,
        token,
        userId,
        ipAddress,
      })
      .returning();

    return refreshToken || null;
  }

  async findByToken({ token }: { token: string }) {
    const [refreshToken] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.token, token));

    return refreshToken || null;
  }

  async findByUserId({ userId }: { userId: string }) {
    const [refreshToken] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.userId, userId));
    return refreshToken || null;
  }

  async deleteByUserId({ userId }: { userId: string }) {
    return await this.db
      .delete(this.table)
      .where(eq(this.table.userId, userId));
  }
}
