import { afterEach, describe, expect, it } from "vitest";
import { getSessionCookieName } from "./auth";

describe("getSessionCookieName", () => {
  const ORIGINAL = process.env.COOKIE_SECURE;

  afterEach(() => {
    process.env.COOKIE_SECURE = ORIGINAL;
  });

  it("retorna __Host-session quando COOKIE_SECURE=true", () => {
    process.env.COOKIE_SECURE = "true";
    expect(getSessionCookieName()).toBe("__Host-session");
  });

  it("retorna session quando COOKIE_SECURE!=true", () => {
    process.env.COOKIE_SECURE = "false";
    expect(getSessionCookieName()).toBe("session");
  });

  it("retorna session se COOKIE_SECURE for undefined", () => {
    delete process.env.COOKIE_SECURE;
    expect(getSessionCookieName()).toBe("session");
  });
});
