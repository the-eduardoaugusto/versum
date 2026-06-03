import { headers } from "next/headers";
import { cache } from "react";
import { getApiV1UsersMe } from "@/dal/orval/fetch/users/users";
// import { getSessionCookieName } from "@/lib/auth";

export const getCachedUserAuth = cache(async () => {
  const reqHeaders = await headers();

  try {
    return await getApiV1UsersMe({
      headers: reqHeaders,
    });
  } catch (err) {
    console.error("Failed to fetch user session", err);
    return null;
  }
});
