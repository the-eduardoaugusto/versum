import {
  MagicLinkRepository,
  RefreshTokenRepository,
  UserRepository,
} from "@/repositories";
import { createMockMagicLinkRepository } from "@/repositories/magic-link/__mock__/magic-link.repository.mock";
import { beforeEach, describe, expect, vi, it } from "vitest";
import { MagicLinkService } from "./magic-link.service";
import { magicLinkMock } from "@/repositories/magic-link/__mock__/magic-link.mock";
import { createMockUserRepository } from "@/repositories/user/__mocks__/user.repository.mock";
import { createMockRefreshTokenRepository } from "@/repositories/refresh-token/__mocks__/refresh-token.repository.mock";

vi.mock("argon2", () => ({
  default: {
    hash: vi.fn(async (value: string) => `hashed-${value}`),
    verify: vi.fn(async (hash: string, value: string) => {
      return hash === `hashed-${value}`;
    }),
  },
}));

describe("Magic link service", () => {
  let magicLinkRepository: MagicLinkRepository;
  let magicLinkService: MagicLinkService;
  let userRepository: UserRepository;
  let refreshTokenRepository: RefreshTokenRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    magicLinkRepository = createMockMagicLinkRepository();
    userRepository = createMockUserRepository();
    refreshTokenRepository = createMockRefreshTokenRepository();
    magicLinkService = new MagicLinkService({
      magicLinkRepo: magicLinkRepository,
      userRepo: userRepository,
      refreshTokenRepo: refreshTokenRepository,
    });
  });

  describe("createToken", () => {
    it("return the uncrypted token", async () => {
      const magicLink = await magicLinkService.createToken({
        email: "test@example.com",
      });
      expect(magicLink, "Magic link should be defined").toBeDefined();
      expect(magicLink, "Magic link should be a string").toBeTypeOf("string");
    });

    it("provide invalid email", async () => {
      await expect(
        magicLinkService.createToken({
          email: "invalid-email",
        }),
        "Should throw error",
      ).rejects.toThrowError("Invalid email!");
    });

    it("provide malicious email", async () => {
      await expect(
        magicLinkService.createToken({
          // @ts-ignore Type error is expected
          email: 1,
        }),
        "Should throw error",
      ).rejects.toThrowError("Input must be a string");
    });
  });

  describe("authenticateToken", () => {
    it("returns access token and refresh token", async () => {
      const auth = await magicLinkService.authenticateToken({
        ipAddress: "127.0.0.1",
        token: magicLinkMock.publicId + "." + "token",
      });

      expect(auth.accessToken, "Access token should be defined").toBeDefined();
      expect(auth.accessToken, "Access token should be a string").toBeTypeOf(
        "string",
      );
      expect(auth.refreshToken, "Refresh token should be a string").toBeTypeOf(
        "string",
      );
      expect(
        auth.refreshToken,
        "Refresh token should be defined",
      ).toBeDefined();
    });
  });
});
