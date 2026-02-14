import { MagicLink, MagicLinkRepository } from "../magic-link.repository";
import { vi } from "vitest";
import { magicLinkMock } from "./magic-link.mock";
import { magicLinks } from "@/db/schemas";
import argon2 from "argon2";

export type MockedMagicLinkRepository = MagicLinkRepository;

export const createMockMagicLinkRepository = (): MagicLinkRepository => {
  return {
    findMagicLinkByTokenAndEmail: vi
      .fn()
      .mockImplementation(async ({ email }: { email: string }) => {
        return { ...magicLinkMock, email };
      }),
    findByPublicId: vi
      .fn()
      .mockImplementation(async ({ publicId }: { publicId: string }) => {
        return { ...magicLinkMock, publicId };
      }),
    updateMagicLink: vi
      .fn()
      .mockImplementation(
        async ({ id, data }: { id: string; data: Partial<MagicLink> }) => {
          return { ...magicLinkMock, ...data, id };
        },
      ),
    createMagicLink: vi
      .fn()
      .mockImplementation(
        async ({ email, token }: { token: string; email: string }) => {
          const hashedToken = await argon2.hash(token);
          return { ...magicLinkMock, email, token: hashedToken };
        },
      ),
    table: magicLinks,
    db: {} as MagicLinkRepository["db"],
  };
};
