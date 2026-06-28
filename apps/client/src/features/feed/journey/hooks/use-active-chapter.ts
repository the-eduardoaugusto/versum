import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { postApiV1ReadingsJourneyNext } from "@/dal/orval/fetch/journey/journey";
import { ApiError } from "@/lib/api-fetcher";
import { exponentialDelay, retryOn5xx } from "@/lib/retry-utils";
import type { FeedChapter } from "../types";

async function saveChapterRead(
  chapterId: string,
  queryClient: QueryClient,
  attempt = 0,
): Promise<boolean> {
  try {
    await postApiV1ReadingsJourneyNext({ chapterId });
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.response.status === 409) {
      // Server pointer is out of sync — resync feed, don't retry or toast
      queryClient.invalidateQueries({ queryKey: ["journey-feed"] });
      return false;
    }
    if (retryOn5xx(attempt, error)) {
      await new Promise((res) => setTimeout(res, exponentialDelay(attempt)));
      return saveChapterRead(chapterId, queryClient, attempt + 1);
    }
    toast.error("Progresso pode não ter sido salvo");
    console.error("Failed to mark chapter as read", error);
    return false;
  }
}

interface UseActiveChapterOptions {
  chapters: FeedChapter[];
  isAtEnd: boolean;
  fetchNextPage: () => Promise<void>;
}

export function useActiveChapter(
  containerRef: React.RefObject<HTMLDivElement | null>,
  { chapters, isAtEnd, fetchNextPage }: UseActiveChapterOptions,
) {
  const queryClient = useQueryClient();
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasBeenActiveRef = useRef<Set<string>>(new Set());
  const hasBeenReadRef = useRef<Set<string>>(new Set());
  const isAtEndRef = useRef(isAtEnd);
  const chaptersRef = useRef(chapters);
  const fetchNextPageRef = useRef(fetchNextPage);
  const saveQueueRef = useRef<string[]>([]);
  const isSavingRef = useRef(false);

  isAtEndRef.current = isAtEnd;
  chaptersRef.current = chapters;
  fetchNextPageRef.current = fetchNextPage;

  async function processQueue() {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    while (saveQueueRef.current.length > 0) {
      const chapterId = saveQueueRef.current.shift();
      if (!chapterId) break;
      const saved = await saveChapterRead(chapterId, queryClient);
      if (saved) {
        // Buffer fetch must happen AFTER the POST so the server pointer
        // has advanced and GET /feed returns the next set of chapters.
        const exitedIndex = chaptersRef.current.findIndex(
          (c) => c.id === chapterId,
        );
        const nearEnd =
          exitedIndex >= 0 && exitedIndex >= chaptersRef.current.length - 2;
        if (nearEnd) {
          fetchNextPageRef.current();
        }
      }
    }
    isSavingRef.current = false;
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: chapters is a trigger dep — not read directly inside but causes re-run when chapters mount or paginate
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chapterElements =
      container.querySelectorAll<HTMLElement>("[data-chapter-id]");

    if (chapterElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const chapterId = entry.target.getAttribute("data-chapter-id");
          if (!chapterId) continue;

          if (entry.isIntersecting) {
            setActiveChapterId(chapterId);
          } else {
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
              if (isAtEndRef.current) return;
              if (!hasBeenActiveRef.current.has(chapterId)) return;
              if (hasBeenReadRef.current.has(chapterId)) return;
              hasBeenReadRef.current.add(chapterId);
              saveQueueRef.current.push(chapterId);
              processQueue();
            }, 500);
          }
        }
      },
      {
        threshold: 0.5,
        rootMargin: "-100px 0px",
      },
    );

    for (const el of chapterElements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [containerRef, chapters]);

  useEffect(() => {
    if (!activeChapterId) return;
    hasBeenActiveRef.current.add(activeChapterId);
  }, [activeChapterId]);

  return { activeChapterId };
}
