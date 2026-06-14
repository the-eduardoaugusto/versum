import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const cookieName = getSessionCookieName();
  const isSecure =
    process.env.NEXT_PUBLIC_API_URL?.startsWith("https") ?? false;

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
