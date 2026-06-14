"use client";

import { PageDots } from "./page-dots";

interface ChapterHeaderProps {
  bookName: string;
  chapterNumber: number;
  startVerse: number;
  endVerse: number;
  activePage: number;
  pageCount: number;
}

export function ChapterHeader({
  bookName,
  chapterNumber,
  startVerse,
  endVerse,
  activePage,
  pageCount,
}: ChapterHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 shrink-0">
      <span className="text-sm text-muted-foreground font-sans">
        {bookName} {chapterNumber} &bull; {startVerse}-{endVerse}
      </span>
      {pageCount > 1 && (
        <PageDots activePage={activePage} pageCount={pageCount} />
      )}
    </header>
  );
}
