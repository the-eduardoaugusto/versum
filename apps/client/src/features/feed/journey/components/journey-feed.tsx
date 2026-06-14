"use client";

import { useRef, useState } from "react";
import { useActiveChapter, useKeyboardNavigation } from "../hooks";
import { useJourneyFeed } from "../hooks/use-journey-feed";
import { ChapterSkeleton } from "./chapter-skeleton";
import { ChapterView } from "./chapter-view";
import { FeedEmpty } from "./feed-empty";

export function JourneyFeed() {
  const {
    chapters,
    progress,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useJourneyFeed();

  const containerRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useActiveChapter(containerRef, {
    chapters,
    isAtEnd: progress?.isAtEnd ?? false,
    fetchNextPage,
  });

  useKeyboardNavigation({
    containerRef,
    enabled: !isLoading && !isError,
  });

  const feedHeight = "calc(100svh - var(--navbar-height))";
  const feedStyle: React.CSSProperties = {
    height: feedHeight,
    overflowY: "scroll",
    scrollSnapType: "y mandatory",
    scrollBehavior: prefersReducedMotion ? "auto" : "smooth",
    scrollPaddingTop: "1rem",
  };

  if (isLoading) {
    return (
      <div ref={containerRef} className="hide-scrollbar" style={feedStyle}>
        <ChapterSkeleton count={3} />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 p-6 text-center"
        style={{ height: feedHeight }}
      >
        <p className="text-muted-foreground">Erro ao carregar feed</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm text-primary underline underline-offset-2 hover:no-underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="hide-scrollbar"
      style={feedStyle}
      role="feed"
      aria-roledescription="feed de leitura"
    >
      {chapters.map((chapter) => (
        <ChapterView key={chapter.id} chapter={chapter} />
      ))}
      {isFetchingNextPage && <ChapterSkeleton count={2} />}
      {!hasNextPage && progress?.isAtEnd && chapters.length > 0 && (
        <FeedEmpty />
      )}
    </div>
  );
}
