"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getGetApiV1ReadingsJourneyFeedUrl } from "@/dal/orval/tanstackQuery/journey/journey";
import type { FeedChapter, FeedProgress } from "../types";

function toProgress(
  apiProgress:
    | {
        chaptersRead?: number;
        chaptersRemaining?: number;
        totalChapters?: number;
        percentComplete?: number;
        isAtEnd?: boolean;
      }
    | undefined,
): FeedProgress | null {
  if (!apiProgress) return null;
  return {
    chaptersRead: apiProgress.chaptersRead ?? 0,
    chaptersRemaining: apiProgress.chaptersRemaining ?? 0,
    totalChapters: apiProgress.totalChapters ?? 0,
    percentComplete: apiProgress.percentComplete ?? 0,
    isAtEnd: apiProgress.isAtEnd ?? false,
  };
}

interface ApiChapter {
  id: string;
  number: number;
  totalVerses: number;
}

interface ApiBook {
  name: string;
  slug: string;
}

interface ApiVerse {
  id: string;
  number: number;
  text: string;
}

interface FeedResponse {
  success?: boolean;
  message?: string;
  data?: {
    current?: {
      chapter: ApiChapter;
      book: ApiBook;
      verses: ApiVerse[];
    } | null;
    nextItems?: {
      chapter: ApiChapter;
      book: ApiBook;
      verses: ApiVerse[];
    }[];
    progress?: {
      chaptersRead: number;
      chaptersRemaining: number;
      totalChapters: number;
      percentComplete: number;
      isAtEnd: boolean;
    };
  };
}

function extractChapters(response: FeedResponse): FeedChapter[] {
  const data = response?.data;
  if (!data) return [];

  const items: FeedChapter[] = [];

  const addItem = (chapter: ApiChapter, book: ApiBook, verses: ApiVerse[]) => {
    const verseData = verses.map((v) => ({
      id: v.id,
      number: v.number,
      text: v.text,
    }));
    items.push({
      id: chapter.id,
      bookName: book.name,
      bookSlug: book.slug,
      chapterNumber: chapter.number,
      totalVerses: chapter.totalVerses,
      verses: verseData,
    });
  };

  if (data.current) {
    addItem(data.current.chapter, data.current.book, data.current.verses);
  }

  if (data.nextItems) {
    for (const next of data.nextItems) {
      addItem(next.chapter, next.book, next.verses);
    }
  }

  return items;
}

async function fetchFeed(
  params?: { "buffer-size"?: number | null },
  options?: { signal?: AbortSignal },
): Promise<FeedResponse> {
  const url = getGetApiV1ReadingsJourneyFeedUrl(params);
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    signal: options?.signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export function useJourneyFeed() {
  const query = useInfiniteQuery({
    queryKey: ["journey-feed"],
    queryFn: async ({ signal }) => {
      const response = await fetchFeed({ "buffer-size": 4 }, { signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage?.data?.progress?.isAtEnd) return undefined;
      return lastPage?.data?.progress?.chaptersRead ?? 1;
    },
    maxPages: 3,
    staleTime: 60_000,
    retry: 2,
  });

  const progress = toProgress(query.data?.pages?.[0]?.data?.progress);

  const chapters = useMemo(() => {
    const allPages = query.data?.pages ?? [];
    const seenIds = new Set<string>();
    const result: FeedChapter[] = [];

    for (const page of allPages) {
      const extracted = extractChapters(page);
      for (const chapter of extracted) {
        if (!seenIds.has(chapter.id)) {
          seenIds.add(chapter.id);
          result.push(chapter);
        }
      }
    }

    return result;
  }, [query.data?.pages]);

  const fetchNextPage = async () => {
    if (!query.hasNextPage || query.isFetchingNextPage) return;
    await query.fetchNextPage();
  };

  return {
    chapters,
    progress,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
