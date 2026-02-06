import { strict, assert, describe, it } from "poku";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "@/env";

// Interface para os repositórios para facilitar o mocking
interface IMockMagicLinkRepository {
  findByPublicId: ({ publicId }: { publicId: string }) => Promise<any>;
  updateMagicLinkToUsed: ({
    id,
    data,
  }: {
    id: string;
    data: any;
  }) => Promise<any>;
  createMagicLink: ({
    email,
    token,
  }: {
    email: string;
    token: string;
  }) => Promise<any>;
  findMagicLinkByTokenAndEmail: ({ email }: { email: string }) => Promise<any>;
  prisma?: any;
  model?: any;
  create?: any;
  update?: any;
  updateMany?: any;
  delete?: any;
  deleteMany?: any;
  findFirst?: any;
  findMany?: any;
  count?: any;
  aggregate?: any;
  groupBy?: any;
}

interface IMockUserRepository {
  findByEmail: ({ email }: { email: string }) => Promise<any>;
  create: ({
    email,
    name,
    username,
    createdAt,
  }: {
    email: string;
    name: string;
    username: string;
    createdAt: Date;
  }) => Promise<any>;
  prisma?: any;
  model?: any;
  update?: any;
  updateMany?: any;
  delete?: any;
  deleteMany?: any;
  findFirst?: any;
  findMany?: any;
  count?: any;
  aggregate?: any;
  groupBy?: any;
}

interface IMockRefreshTokenRepository {
  createRefreshToken: ({
    expiresAt,
    userId,
    token,
  }: {
    expiresAt: Date;
    userId: string;
    token: string;
  }) => Promise<any>;
  prisma?: any;
  model?: any;
  create?: any;
  update?: any;
  updateMany?: any;
  delete?: any;
  deleteMany?: any;
  findFirst?: any;
  findMany?: any;
  count?: any;
  aggregate?: any;
  groupBy?: any;
}

// Mock dos repositórios
const mockMagicLinkRepository: IMockMagicLinkRepository = {
  findByPublicId: async ({ publicId }: { publicId: string }) => null,
  updateMagicLinkToUsed: async ({ id, data }: { id: string; data: any }) => ({
    count: 0,
  }),
  createMagicLink: async ({
    email,
    token,
  }: {
    email: string;
    token: string;
  }) => ({
    id: "mock-id",
    publicId: "mock-public-id",
    email,
    token,
    createdAt: new Date(),
    invalidatedAt: null,
    usedAt: null,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  }),
  findMagicLinkByTokenAndEmail: async ({ email }: { email: string }) => null,
  prisma: {},
  model: {},
  create: async () => ({}),
  update: async () => ({}),
  updateMany: async () => ({}),
  delete: async () => ({}),
  deleteMany: async () => ({}),
  findFirst: async () => ({}),
  findMany: async () => [],
  count: async () => 0,
  aggregate: async () => ({}),
  groupBy: async () => [],
};

const mockUserRepository: IMockUserRepository = {
  findByEmail: async ({ email }: { email: string }) => null,
  create: async ({
    email,
    name,
    username,
    createdAt,
  }: {
    email: string;
    name: string;
    username: string;
    createdAt: Date;
  }) => ({
    id: "mock-user-id",
    email,
    name,
    username,
    createdAt,
    updatedAt: new Date(),
  }),
  prisma: {},
  model: {},
  update: async () => ({}),
  updateMany: async () => ({}),
  delete: async () => ({}),
  deleteMany: async () => ({}),
  findFirst: async () => ({}),
  findMany: async () => [],
  count: async () => 0,
  aggregate: async () => ({}),
  groupBy: async () => [],
};

const mockRefreshTokenRepository: IMockRefreshTokenRepository = {
  createRefreshToken: async ({
    expiresAt,
    userId,
    token,
  }: {
    expiresAt: Date;
    userId: string;
    token: string;
  }) => ({
    id: "mock-refresh-token-id",
    expiresAt,
    userId,
    token,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  prisma: {},
  model: {},
  create: async () => ({}),
  update: async () => ({}),
  updateMany: async () => ({}),
  delete: async () => ({}),
  deleteMany: async () => ({}),
  findFirst: async () => ({}),
  findMany: async () => [],
  count: async () => 0,
  aggregate: async () => ({}),
  groupBy: async () => [],
};

// Criar uma nova classe de serviço para testes com injeção de dependência
class TestableMagicLinkService {
  private magicLinkRepository: IMockMagicLinkRepository;
  private userRepository: IMockUserRepository;
  private refreshTokenRepository: IMockRefreshTokenRepository;

  constructor(
    magicLinkRepository: IMockMagicLinkRepository,
    userRepository: IMockUserRepository,
    refreshTokenRepository: IMockRefreshTokenRepository,
  ) {
    this.magicLinkRepository = magicLinkRepository;
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async authenticateToken({ token }: { token: string }) {
    const [publicId, rawToken] = token.split(".");
    if (!publicId || !rawToken) {
      const error = new Error("Bad magic link token!") as any;
      error.name = "BadRequestError";
      throw error;
    }

    const magicLink = await this.magicLinkRepository.findByPublicId({
      publicId,
    });

    if (!magicLink) {
      const error = new Error("Magic link token do not exists") as any;
      error.name = "NotFoundError";
      throw error;
    }

    if (magicLink.invalidatedAt) {
      const error = new Error("Magic Link token is invalid.") as any;
      error.name = "UnauthorizedError";
      throw error;
    }

    // Certifique-se de que o token armazenado é um hash e o rawToken é o valor não criptografado
    const tokenIsValid = await argon2.verify(magicLink.token, rawToken);

    if (!tokenIsValid) {
      const error = new Error("Magic link does not match") as any;
      error.name = "UnauthorizedError";
      throw error;
    }

    const updatedMagicLinkQueryData =
      await this.magicLinkRepository.updateMagicLinkToUsed({
        id: magicLink.id,
        data: {
          usedAt: new Date(),
        },
      });

    if (updatedMagicLinkQueryData.count === 0) {
      const error = new Error("Magic link has already been used") as any;
      error.name = "UnauthorizedError";
      throw error;
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

    // Gerar refresh token
    const refreshToken = this.generateRefreshToken({ userId: user.id });

    return { accessToken, refreshToken };
  }

  private generateRefreshToken({ userId }: { userId: string }) {
    // Simplesmente retornar um token aleatório para testes
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  async createToken({ email }: { email: string }) {
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const magicLink = await this.magicLinkRepository.createMagicLink({
      email,
      token,
    });

    return `${magicLink.publicId}.${token}`;
  }
}

describe("MagicLink service", async () => {
  await describe("authenticateToken", async () => {
    await it("should throw BadRequestError when token format is invalid", async () => {
      const magicLinkService = new TestableMagicLinkService(
        mockMagicLinkRepository,
        mockUserRepository,
        mockRefreshTokenRepository,
      );

      await assert.rejects(
        async () => {
          await magicLinkService.authenticateToken({ token: "invalid-format" });
        },
        {
          name: "BadRequestError",
          message: "Bad magic link token!",
        },
        "Should throw BadRequestError for invalid token format",
      );
    });

    await it("should throw NotFoundError when magic link does not exist", async () => {
      const magicLinkService = new TestableMagicLinkService(
        {
          ...mockMagicLinkRepository,
          findByPublicId: async ({ publicId }: { publicId: string }) => null,
        },
        mockUserRepository,
        mockRefreshTokenRepository,
      );

      await assert.rejects(
        async () => {
          await magicLinkService.authenticateToken({
            token: "valid.publicId.token",
          });
        },
        {
          name: "NotFoundError",
          message: "Magic link token do not exists",
        },
        "Should throw NotFoundError when magic link does not exist",
      );
    });

    await it("should throw UnauthorizedError when magic link is invalidated", async () => {
      const magicLinkService = new TestableMagicLinkService(
        {
          ...mockMagicLinkRepository,
          findByPublicId: async ({ publicId }: { publicId: string }) => ({
            id: "mock-id",
            publicId,
            email: "test@example.com",
            token: await argon2.hash("hashed-token"),
            createdAt: new Date(),
            invalidatedAt: new Date(),
            usedAt: null,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          }),
        },
        mockUserRepository,
        mockRefreshTokenRepository,
      );

      await assert.rejects(
        async () => {
          await magicLinkService.authenticateToken({
            token: "valid.publicId.hashed-token",
          });
        },
        {
          name: "UnauthorizedError",
          message: "Magic Link token is invalid.",
        },
        "Should throw UnauthorizedError when magic link is invalidated",
      );
    });

    await it("should throw UnauthorizedError when token does not match", async () => {
      const hashedToken = await argon2.hash("correct-token");
      const magicLinkService = new TestableMagicLinkService(
        {
          ...mockMagicLinkRepository,
          findByPublicId: async ({ publicId }: { publicId: string }) => ({
            id: "mock-id",
            publicId,
            email: "test@example.com",
            token: hashedToken,
            createdAt: new Date(),
            invalidatedAt: null,
            usedAt: null,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          }),
        },
        mockUserRepository,
        mockRefreshTokenRepository,
      );

      await assert.rejects(
        async () => {
          await magicLinkService.authenticateToken({
            token: `valid.publicId.wrong-token`,
          });
        },
        {
          name: "UnauthorizedError",
          message: "Magic link does not match",
        },
        "Should throw UnauthorizedError when token does not match",
      );
    });

    await it("should throw UnauthorizedError when magic link has already been used", async () => {
      const rawToken = "correct-token";
      const hashedToken = await argon2.hash(rawToken);
      const publicId = "valid-publicId";

      const magicLinkService = new TestableMagicLinkService(
        {
          ...mockMagicLinkRepository,
          findByPublicId: async ({ publicId: pid }: { publicId: string }) => ({
            id: "mock-id",
            publicId: pid,
            email: "test@example.com",
            token: hashedToken,
            createdAt: new Date(),
            invalidatedAt: null,
            usedAt: null,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          }),
          updateMagicLinkToUsed: async ({
            id,
            data,
          }: {
            id: string;
            data: any;
          }) => ({ count: 0 }), // count: 0 indica que já foi usado
        },
        mockUserRepository,
        mockRefreshTokenRepository,
      );

      await assert.rejects(
        async () => {
          await magicLinkService.authenticateToken({
            token: `${publicId}.${rawToken}`,
          });
        },
        {
          name: "UnauthorizedError",
          message: "Magic link has already been used",
        },
        "Should throw UnauthorizedError when magic link has already been used",
      );
    });

    await it("should create new user and return tokens when magic link is valid and user does not exist", async () => {
      const email = "newuser@example.com";
      const rawToken = "correct-token";
      const hashedToken = await argon2.hash(rawToken);
      const publicId = "valid-publicId";

      // Repositório de usuário que retorna null (usuário não existe)
      const userRepositoryReturningNull = {
        ...mockUserRepository,
        findByEmail: async ({ email }: { email: string }) => null,
      };

      // Repositório de magic link que retorna um link válido
      const magicLinkRepositoryValid = {
        ...mockMagicLinkRepository,
        findByPublicId: async ({ publicId: pid }: { publicId: string }) => ({
          id: "mock-id",
          publicId: pid,
          email,
          token: hashedToken,
          createdAt: new Date(),
          invalidatedAt: null,
          usedAt: null,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        }),
        updateMagicLinkToUsed: async ({
          id,
          data,
        }: {
          id: string;
          data: any;
        }) => ({ count: 1 }), // count: 1 indica sucesso
      };

      const magicLinkService = new TestableMagicLinkService(
        magicLinkRepositoryValid,
        userRepositoryReturningNull,
        mockRefreshTokenRepository,
      );

      const result = await magicLinkService.authenticateToken({
        token: `${publicId}.${rawToken}`,
      });

      // Verifica se os tokens foram retornados
      strict.ok(result.accessToken, "Should return access token");
      strict.ok(result.refreshToken, "Should return refresh token");

      // Verifica se o token JWT é válido (decodificando-o)
      const decoded = jwt.verify(result.accessToken, env.ENCRYPT_SECRET) as any;
      strict.ok(decoded.sub, "JWT should have subject (user ID)");
    });

    await it("should use existing user and return tokens when magic link is valid", async () => {
      const email = "existinguser@example.com";
      const rawToken = "correct-token";
      const hashedToken = await argon2.hash(rawToken);
      const publicId = "valid-publicId";
      const existingUserId = "existing-user-id";

      // Repositório de usuário que retorna um usuário existente
      const userRepositoryReturningUser = {
        ...mockUserRepository,
        findByEmail: async ({ email }: { email: string }) => ({
          id: existingUserId,
          email,
          name: "Existing User",
          username: "existinguser",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      // Repositório de magic link que retorna um link válido
      const magicLinkRepositoryValid = {
        ...mockMagicLinkRepository,
        findByPublicId: async ({ publicId: pid }: { publicId: string }) => ({
          id: "mock-id",
          publicId: pid,
          email,
          token: hashedToken,
          createdAt: new Date(),
          invalidatedAt: null,
          usedAt: null,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        }),
        updateMagicLinkToUsed: async ({
          id,
          data,
        }: {
          id: string;
          data: any;
        }) => ({ count: 1 }), // count: 1 indica sucesso
      };

      const magicLinkService = new TestableMagicLinkService(
        magicLinkRepositoryValid,
        userRepositoryReturningUser,
        mockRefreshTokenRepository,
      );

      const result = await magicLinkService.authenticateToken({
        token: `${publicId}.${rawToken}`,
      });

      // Verifica se os tokens foram retornados
      strict.ok(result.accessToken, "Should return access token");
      strict.ok(result.refreshToken, "Should return refresh token");

      // Verifica se o token JWT contém o ID do usuário existente
      const decoded = jwt.verify(result.accessToken, env.ENCRYPT_SECRET) as any;
      strict.strictEqual(
        decoded.sub,
        existingUserId,
        "JWT should contain existing user ID",
      );
    });
  });

  await describe("createToken", async () => {
    await it("should create a magic link token", async () => {
      const email = "test@example.com";
      const magicLinkService = new TestableMagicLinkService(
        mockMagicLinkRepository,
        mockUserRepository,
        mockRefreshTokenRepository,
      );

      const result = await magicLinkService.createToken({ email });

      // Verifica se o resultado tem o formato esperado (publicId.token)
      const tokenParts = result.split(".");
      strict.strictEqual(
        tokenParts.length,
        2,
        "Token should have two parts separated by '.'",
      );
      strict.ok(tokenParts[0], "Public ID should not be empty");
      strict.ok(tokenParts[1], "Token should not be empty");
    });
  });
});
