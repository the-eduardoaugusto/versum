import { vi } from "vitest";
import { UserRepository } from "../user.repository";
import { users } from "@/db/schemas";
import { userMock } from "./user.mock";

export const createMockUserRepository = (): UserRepository => {
  return {
    db: {} as UserRepository["db"],
    table: users,
    create: vi.fn().mockImplementation(async ({ email }: { email: string }) => {
      return { ...userMock, email };
    }),
    findByEmail: vi
      .fn()
      .mockImplementation(async ({ email }: { email: string }) => {
        return { ...userMock, email };
      }),
    findByUsername: vi
      .fn()
      .mockImplementation(async ({ username }: { username: string }) => {
        return { ...userMock, username };
      }),
  };
};
