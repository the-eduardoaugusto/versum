import { useQuery } from "@tanstack/react-query";
import { getApiV1ReadingsJourneyStatus } from "@/dal/orval/fetch/journey/journey";

export function useGetApiV1JourneyStatus() {
  return useQuery({
    queryKey: ["journey-status"],
    queryFn: async ({ signal }) => {
      const response = await getApiV1ReadingsJourneyStatus({ signal });
      return response;
    },
    staleTime: 60_000,
    retry: 2,
  });
}
