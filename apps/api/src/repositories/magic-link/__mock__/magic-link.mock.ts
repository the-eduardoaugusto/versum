import { MagicLink } from "../magic-link.repository";

export const magicLinkMock: MagicLink = {
  id: "uuid",
  publicId: "publicUuid",
  email: "test@example.com",
  token: "hashed-token",
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 1000 * 60 * 5),
  usedAt: null,
  invalidatedAt: null,
};
