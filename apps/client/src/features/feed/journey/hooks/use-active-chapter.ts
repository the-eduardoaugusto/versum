import { useCallback, useEffect, useRef, useState } from "react";
import { getPostApiV1ReadingsJourneyNextUrl } from "@/dal/orval/tanstackQuery/journey/journey";
import type { FeedChapter } from "../types";

interface UseActiveChapterOptions {
  chapters: FeedChapter[];
  isAtEnd: boolean;
  fetchNextPage: () => Promise<void>;
}

async function markChapterAsRead() {
  const url = getPostApiV1ReadingsJourneyNextUrl();
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export function useActiveChapter(
  containerRef: React.RefObject<HTMLDivElement | null>,
  { chapters, isAtEnd, fetchNextPage }: UseActiveChapterOptions,
) {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasBeenActiveRef = useRef<Set<string>>(new Set());

  const markPreviousAsRead = useCallback(
    async (chapterId: string) => {
      if (isAtEnd) return;
      if (!hasBeenActiveRef.current.has(chapterId)) return;

      try {
        await markChapterAsRead();
      } catch {
        console.error("Failed to mark chapter as read");
      }
    },
    [isAtEnd],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chapterElements =
      container.querySelectorAll<HTMLElement>("[data-chapter-id]");

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
              markPreviousAsRead(chapterId);
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
  }, [containerRef, markPreviousAsRead]);

  useEffect(() => {
    if (!activeChapterId) return;
    hasBeenActiveRef.current.add(activeChapterId);

    const activeIndex = chapters.findIndex((c) => c.id === activeChapterId);
    if (activeIndex >= 0 && activeIndex >= chapters.length - 2) {
      fetchNextPage();
    }
  }, [activeChapterId, chapters, fetchNextPage]);

  return { activeChapterId, markPreviousAsRead };
}
