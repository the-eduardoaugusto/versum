import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import type { GetAuthenticatedProfileResponse } from "@/dal/orval/fetch/schemas/getAuthenticatedProfileResponse";
import {
  getGetApiV1ProfilesMeQueryKey,
  useGetApiV1ProfilesMe,
} from "@/dal/orval/tanstackQuery/profiles/profiles";

export function useCurrentProfile(fallback?: FullProfile) {
  const query = useGetApiV1ProfilesMe({
    query: { staleTime: 5 * 60 * 1000 },
  });

  const queryProfile =
    query.data?.status === 200
      ? (query.data.data as GetAuthenticatedProfileResponse).data
      : undefined;

  return {
    ...query,
    profile: queryProfile ?? fallback,
  };
}

export { getGetApiV1ProfilesMeQueryKey };
