import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookieName, isCookieSecure } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookieName = getSessionCookieName();
  const isSecure = isCookieSecure();

  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.set(cookieName, "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "strict" : "lax",
  });
  return response;
}
