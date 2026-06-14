"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useActiveChapter } from "../hooks/use-active-chapter";
import { useJourneyFeed } from "../hooks/use-journey-feed";
import { useJourneyProgress } from "../hooks/use-journey-progress";
import type { FeedChapter, FeedProgress } from "../types";

interface FeedContextValue {
  chapters: FeedChapter[];
  progress: FeedProgress | null;
  activeChapterId: string | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  isMarking: boolean;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const feed = useJourneyFeed();
  const progress = useJourneyProgress();
  const containerRef = useRef<HTMLDivElement>(null);

  const { activeChapterId } = useActiveChapter(containerRef, {
    chapters: feed.chapters,
    isAtEnd: feed.progress?.isAtEnd ?? false,
    fetchNextPage: feed.fetchNextPage,
  });

  const value: FeedContextValue = {
    chapters: feed.chapters,
    progress: feed.progress,
    activeChapterId,
    isLoading: feed.isLoading,
    isError: feed.isError,
    error: feed.error,
    hasNextPage: feed.hasNextPage,
    isFetchingNextPage: feed.isFetchingNextPage,
    fetchNextPage: feed.fetchNextPage,
    isMarking: progress.isMarking,
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed(): FeedContextValue {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error("useFeed must be used within FeedProvider");
  }
  return context;
}
