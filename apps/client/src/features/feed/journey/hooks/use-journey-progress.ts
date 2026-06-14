import { useQueryClient } from "@tanstack/react-query";
import { usePostApiV1ReadingsJourneyNext } from "@/dal/orval/tanstackQuery/journey/journey";
import type { FeedProgress } from "../types";
import { useGetApiV1JourneyStatus } from "./use-get-journey-status";

function toProgress(
  data:
    | {
        chaptersRead?: number;
        chaptersRemaining?: number;
        totalChapters?: number;
        percentComplete?: number;
        isAtEnd?: boolean;
      }
    | undefined,
): FeedProgress | null {
  if (!data) return null;
  return {
    chaptersRead: data.chaptersRead ?? 0,
    chaptersRemaining: data.chaptersRemaining ?? 0,
    totalChapters: data.totalChapters ?? 0,
    percentComplete: data.percentComplete ?? 0,
    isAtEnd: data.isAtEnd ?? false,
  };
}

export function useJourneyProgress() {
  const queryClient = useQueryClient();

  const { mutateAsync: markAsRead, isPending: isMarking } =
    usePostApiV1ReadingsJourneyNext({
      mutation: {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["journey-status"] });
        },
      },
    });

  const { data: statusData } = useGetApiV1JourneyStatus();

  const status = toProgress(statusData?.data);

  return {
    markAsRead,
    isMarking,
    status,
  };
}
