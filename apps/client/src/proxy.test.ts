import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import proxy from "./proxy";

const ORIGINAL_API_URL = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = ORIGINAL_API_URL;
});

function makeReq(path: string, cookieHeader?: string) {
  const headers: HeadersInit = {};
  if (cookieHeader) headers.cookie = cookieHeader;
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

describe("proxy — guest guard (/login)", () => {
  it("redirects authenticated user from /login to /", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = makeReq("/login", "session=valid-token");
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/");
  });

  it("passes through unauthenticated user to /login (no redirect loop after clear-session)", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = makeReq("/login");
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});

describe("proxy — root route (/)", () => {
  it("passes through authenticated user to / (layout handles session validation)", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = makeReq("/", "session=some-token");
    const res = proxy(req);
    expect(res.status).toBe(200);
  });

  it("passes through unauthenticated user to / (layout handles auth redirect)", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = makeReq("/");
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});

describe("proxy — /auth/clear-session", () => {
  it("always passes through to clear-session route handler regardless of auth state", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = makeReq("/auth/clear-session", "session=stale-token");
    const res = proxy(req);
    expect(res.status).toBe(200);
  });

  it("passes through when no cookie present", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = makeReq("/auth/clear-session");
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});

describe("proxy — loop prevention", () => {
  it("does NOT redirect /login to / when cookie is absent (prevents auth loop)", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = makeReq("/login");
    const res = proxy(req);
    expect(res.status).not.toBe(307);
  });

  it("sets x-invoke-path header on pass-through responses", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = makeReq("/");
    const res = proxy(req);
    expect(res.headers.get("x-invoke-path")).toBe("/");
  });
});
