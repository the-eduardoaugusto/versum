import { vi } from "vitest";
import { RefreshTokenRepository } from "../refresh-token.repository";
import { refreshTokens } from "@/db/schemas";
import { refreshTokenMock } from "./refresh-token.mock";

export const createMockRefreshTokenRepository = (): RefreshTokenRepository => {
  return {
    db: {} as RefreshTokenRepository["db"],
    table: refreshTokens,
    createRefreshToken: vi
      .fn()
      .mockImplementation(
        async (refreshToken: {
          token: string;
          userId: string;
          expiresAt: Date;
          ipAddress: string;
        }) => refreshToken,
      ),
    findByToken: vi
      .fn()
      .mockImplementation(async ({ token }: { token: string }) => {
        if (token === refreshTokenMock.token) return refreshTokenMock;
        return null;
      }),
    deleteByUserId: vi
      .fn()
      .mockImplementation(async ({ userId }: { userId: string }) => {
        if (userId === refreshTokenMock.userId) return true;
        return {} as ReturnType<RefreshTokenRepository["deleteByUserId"]>;
      }),
    findByUserId: vi
      .fn()
      .mockImplementation(async ({ userId }: { userId: string }) => {
        if (userId === refreshTokenMock.userId) return refreshTokenMock;
        return null;
      }),
  };
};
