import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const ORIGINAL_API_URL = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = ORIGINAL_API_URL;
});

describe("GET /auth/clear-session", () => {
  it("redirects to /login", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = new NextRequest("http://localhost:3000/auth/clear-session");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("includes Set-Cookie header that expires the session cookie (HTTP)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = new NextRequest("http://localhost:3000/auth/clear-session", {
      headers: { cookie: "session=some-stale-token" },
    });
    const res = await GET(req);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toMatch(/session=/i);
    expect(setCookie).toMatch(/max-age=0/i);
  });

  it("includes Set-Cookie header that expires the __Host-session cookie (HTTPS)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.versum.work";
    const req = new NextRequest("http://localhost:3000/auth/clear-session", {
      headers: { cookie: "__Host-session=some-stale-token" },
    });
    const res = await GET(req);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toMatch(/__Host-session=/i);
    expect(setCookie).toMatch(/max-age=0/i);
    expect(setCookie).toMatch(/secure/i);
  });

  it("deletes cookie even when no session cookie is present", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const req = new NextRequest("http://localhost:3000/auth/clear-session");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("set-cookie")).toMatch(/max-age=0/i);
  });
});
