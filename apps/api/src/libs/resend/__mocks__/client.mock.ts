import { vi } from "vitest";

export const createMockedResendClient = () => {
  return {
    emails: {
      send: vi.fn(),
    },
  };
};
