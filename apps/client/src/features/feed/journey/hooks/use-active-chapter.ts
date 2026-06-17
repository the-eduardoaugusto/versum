import { useEffect, useRef, useState } from "react";
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
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
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
  const hasBeenReadRef = useRef<Set<string>>(new Set());
  const isAtEndRef = useRef(isAtEnd);
  const chaptersRef = useRef(chapters);
  const fetchNextPageRef = useRef(fetchNextPage);

  isAtEndRef.current = isAtEnd;
  chaptersRef.current = chapters;
  fetchNextPageRef.current = fetchNextPage;

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
              markChapterAsRead()
                .then(() => {
                  // Buffer fetch must happen AFTER the POST so the server pointer
                  // has advanced and GET /feed returns the next set of chapters.
                  const exitedIndex = chaptersRef.current.findIndex(
                    (c) => c.id === chapterId,
                  );
                  const nearEnd =
                    exitedIndex >= 0 &&
                    exitedIndex >= chaptersRef.current.length - 2;
                  if (nearEnd) {
                    fetchNextPageRef.current();
                  }
                })
                .catch(() => console.error("Failed to mark chapter as read"));
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
