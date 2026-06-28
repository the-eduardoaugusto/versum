import { headers } from "next/headers";
import { cache } from "react";
import { getApiV1ReadingsJourneyStatus } from "@/dal/orval/fetch/journey/journey";
import { getApiV1ProfilesMe } from "@/dal/orval/fetch/profiles/profiles";

export const getCachedProfileMe = cache(async () => {
  const reqHeaders = await headers();
  const options = { headers: new Headers(reqHeaders) };
  try {
    const res = await getApiV1ProfilesMe(options);
    return res.data ?? null;
  } catch {
    return null;
  }
});

export const getCachedJourneyStatus = cache(async () => {
  const reqHeaders = await headers();
  const options = { headers: new Headers(reqHeaders) };
  try {
    const res = await getApiV1ReadingsJourneyStatus(options);
    return res.data ?? null;
  } catch {
    return null;
  }
});
