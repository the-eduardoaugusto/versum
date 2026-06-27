import { type NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/get-client-ip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002";

const FORWARD_HEADERS = new Set([
  "accept",
  "accept-encoding",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "user-agent",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "referer",
  "origin",
]);

async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const search = req.nextUrl.search;
  const targetUrl = `${API_URL}${path}${search}`;

  const clientIp = getClientIp(req);

  const headers: Record<string, string> = { "x-forwarded-for": clientIp };
  const userAgent = req.headers.get("user-agent");
  for (const [key, value] of req.headers.entries()) {
    if (FORWARD_HEADERS.has(key)) {
      headers[key] = value;
    }
  }
  console.log("[PROXY:api] user-agent:", userAgent);

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.blob()
      : undefined;

  const res = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  const responseHeaders = new Headers();
  res.headers.forEach((value, key) => {
    // set-cookie is handled separately below: Headers.forEach collapses
    // multiple Set-Cookie values into one comma-joined string, which corrupts
    // cookie flags/values. Skip it here.
    if (
      key !== "content-encoding" &&
      key !== "transfer-encoding" &&
      key !== "set-cookie"
    ) {
      responseHeaders.set(key, value);
    }
  });

  // Read each Set-Cookie individually to preserve per-cookie attributes
  // (HttpOnly; Secure; SameSite) and values containing commas (e.g. Expires).
  for (const cookie of res.headers.getSetCookie()) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest) {
  return proxy(req);
}

export async function POST(req: NextRequest) {
  return proxy(req);
}

export async function PUT(req: NextRequest) {
  return proxy(req);
}

export async function PATCH(req: NextRequest) {
  return proxy(req);
}

export async function DELETE(req: NextRequest) {
  return proxy(req);
}

export async function HEAD(req: NextRequest) {
  return proxy(req);
}

export async function OPTIONS(req: NextRequest) {
  return proxy(req);
}
