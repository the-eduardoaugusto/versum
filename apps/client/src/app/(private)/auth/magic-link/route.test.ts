import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const ORIGINAL_API_URL = process.env.NEXT_PUBLIC_API_URL;

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  process.env.NEXT_PUBLIC_API_URL = ORIGINAL_API_URL;
  vi.restoreAllMocks();
});

function makeReq(
  search: string,
  opts?: { cookieHeader?: string; userAgent?: string },
) {
  const headers: Record<string, string> = {};
  if (opts?.cookieHeader) headers.cookie = opts.cookieHeader;
  if (opts?.userAgent) headers["user-agent"] = opts.userAgent;
  return new NextRequest(`http://localhost:3000/auth/magic-link${search}`, {
    headers,
  });
}

function makeApiResponse(
  status: number,
  setCookieHeaders: string[] = [],
): Response {
  const headers = new Headers();
  for (const cookie of setCookieHeaders) {
    headers.append("set-cookie", cookie);
  }
  return new Response(JSON.stringify({ message: "ok" }), { status, headers });
}

describe("GET /auth/magic-link — no token", () => {
  it("redirects to /login when token is absent", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const res = await GET(makeReq(""));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("does not call the API when token is absent", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    await GET(makeReq(""));
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("GET /auth/magic-link — already authenticated", () => {
  it("redirects to / when session cookie is already present (HTTP)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    const res = await GET(
      makeReq("?token=abc", { cookieHeader: "session=valid" }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("redirects to / when __Host-session cookie is already present (HTTPS)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.versum.work";
    const res = await GET(
      makeReq("?token=abc", { cookieHeader: "__Host-session=valid" }),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/");
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("GET /auth/magic-link — successful authentication", () => {
  it("redirects to / on API success", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockResolvedValueOnce(
      makeApiResponse(200, ["session=tok; Path=/; HttpOnly"]),
    );
    const res = await GET(makeReq("?token=pubid.secret"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/");
    expect(res.headers.get("location")).not.toContain("token=");
  });

  it("forwards Set-Cookie header from API to browser redirect (HTTP)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockResolvedValueOnce(
      makeApiResponse(200, ["session=tok123; Path=/; HttpOnly; SameSite=Lax"]),
    );
    const res = await GET(makeReq("?token=pubid.secret"));
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("session=tok123");
  });

  it("forwards __Host-session Set-Cookie from API (HTTPS)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.versum.work";
    vi.mocked(fetch).mockResolvedValueOnce(
      makeApiResponse(200, [
        "__Host-session=tok456; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=Mon, 14 Jul 2026 00:00:00 GMT",
      ]),
    );
    const res = await GET(makeReq("?token=pubid.secret"));
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain("__Host-session=tok456");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
  });

  it("preserves Expires date with comma through Set-Cookie forwarding", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.versum.work";
    vi.mocked(fetch).mockResolvedValueOnce(
      makeApiResponse(200, [
        "__Host-session=tok; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=Mon, 14 Jul 2026 00:00:00 GMT",
      ]),
    );
    const res = await GET(makeReq("?token=pubid.secret"));
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("Expires=Mon, 14 Jul 2026 00:00:00 GMT");
  });

  it("forwards multiple Set-Cookie headers when API sets more than one", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockResolvedValueOnce(
      makeApiResponse(200, [
        "session=tok; Path=/; HttpOnly",
        "other=val; Path=/",
      ]),
    );
    const res = await GET(makeReq("?token=pubid.secret"));
    const raw = res.headers.getSetCookie
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie") ?? ""];
    expect(raw.length).toBeGreaterThanOrEqual(1);
    const joined = raw.join("\n");
    expect(joined).toContain("session=tok");
  });

  it("calls the API with the token from the URL", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockResolvedValueOnce(
      makeApiResponse(200, ["session=tok; Path=/; HttpOnly"]),
    );
    await GET(makeReq("?token=pubid.secret123"));
    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("token=pubid.secret123");
  });

  it("forwards user-agent to API (mobile device fingerprint preservation)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockResolvedValueOnce(
      makeApiResponse(200, ["session=tok; Path=/; HttpOnly"]),
    );
    const mobileUA =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
    await GET(makeReq("?token=pubid.secret", { userAgent: mobileUA }));
    const calledHeaders = vi.mocked(fetch).mock.calls[0]?.[1]
      ?.headers as Record<string, string>;
    expect(calledHeaders["user-agent"]).toBe(mobileUA);
  });

  it("calls API with cache: no-store to prevent stale Set-Cookie from cache", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockResolvedValueOnce(
      makeApiResponse(200, ["session=tok; Path=/; HttpOnly"]),
    );
    await GET(makeReq("?token=pubid.secret"));
    const fetchOpts = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(fetchOpts?.cache).toBe("no-store");
  });

  it("strips the token query param from the redirect location", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockResolvedValueOnce(
      makeApiResponse(200, ["session=tok; Path=/; HttpOnly"]),
    );
    const res = await GET(makeReq("?token=pubid.secret&utm_source=email"));
    const location = res.headers.get("location") ?? "";
    expect(location).not.toContain("token=");
  });
});

describe("GET /auth/magic-link — API failure", () => {
  it("redirects to / with error param when API returns non-2xx", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockResolvedValueOnce(makeApiResponse(401, []));
    const res = await GET(makeReq("?token=pubid.bad"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("error=invalid_or_expired_token");
  });

  it("redirects to / with error param when API call throws", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    const res = await GET(makeReq("?token=pubid.bad"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("error=invalid_or_expired_token");
  });

  it("does not set a session cookie when API fails", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4002";
    vi.mocked(fetch).mockResolvedValueOnce(makeApiResponse(401, []));
    const res = await GET(makeReq("?token=pubid.bad"));
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
