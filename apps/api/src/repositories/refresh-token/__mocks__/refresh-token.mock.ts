import { userMock } from "@/repositories/user/__mocks__/user.mock";
import { RefreshToken } from "../refresh-token.repository";

export const refreshTokenMock: RefreshToken = {
  id: "uuid",
  userId: userMock.id,
  token: "refresh_tokens",
  ipAddress: "127.0.0.1",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 3600000),
};
