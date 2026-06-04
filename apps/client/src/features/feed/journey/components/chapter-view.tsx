"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useChapterPagination } from "../hooks/use-chapter-pagination";
import type { FeedChapter, VerseData, VersePage } from "../types";
import { ChapterHeader } from "./chapter-header";
import { VersesPage } from "./verses-page";

interface ChapterViewProps {
  chapter: FeedChapter;
}

const PAGE_VERTICAL_PADDING = 40;

function packPages(
  verses: VerseData[],
  heights: number[],
  availableHeight: number,
): VersePage[] {
  const pages: VersePage[] = [];
  let currentPage: VerseData[] = [];
  let usedHeight = 0;

  for (let i = 0; i < verses.length; i++) {
    const totalH = heights[i];
    if (usedHeight + totalH > availableHeight && currentPage.length > 0) {
      pages.push({
        startVerse: currentPage[0].number,
        endVerse: currentPage[currentPage.length - 1].number,
        verses: currentPage,
      });
      currentPage = [];
      usedHeight = 0;
    }
    currentPage.push(verses[i]);
    usedHeight += totalH;
  }

  if (currentPage.length > 0) {
    pages.push({
      startVerse: currentPage[0].number,
      endVerse: currentPage.at(-1)!.number,
      verses: currentPage,
    });
  }

  return pages.length > 0
    ? pages
    : [
        {
          startVerse: verses[0]?.number ?? 1,
          endVerse: verses.at(-1)?.number ?? 1,
          verses,
        },
      ];
}

export function ChapterView({ chapter }: ChapterViewProps) {
  const pagesContainerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<VersePage[]>([]);

  const measure = useCallback(() => {
    const c = pagesContainerRef.current;
    const m = measureRef.current;
    if (!c || !m) return;

    const verseEls = m.querySelectorAll<HTMLElement>("[data-verse-id]");
    if (verseEls.length === 0) return;

    const verseHeights: number[] = [];
    verseEls.forEach((el) => {
      verseHeights.push(el.offsetHeight + 16);
    });

    const availableHeight = c.clientHeight - PAGE_VERTICAL_PADDING;
    setPages(packPages(chapter.verses, verseHeights, availableHeight));
  }, [chapter.verses]);

  useLayoutEffect(() => {
    const container = pagesContainerRef.current;
    if (!container) return;

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [measure]);

  const { activePage } = useChapterPagination(pagesContainerRef);
  const pageCount = pages.length;
  const currentPage = pages[activePage];

  const cardStyle: React.CSSProperties = {
    height: "calc(100svh - var(--navbar-height))",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    paddingTop: "1rem",
    paddingBottom: "1rem",
  };

  return (
    <div style={cardStyle} data-chapter-id={chapter.id}>
      <ChapterHeader
        bookName={chapter.bookName}
        chapterNumber={chapter.chapterNumber}
        startVerse={currentPage?.startVerse ?? 1}
        endVerse={currentPage?.endVerse ?? chapter.totalVerses}
        activePage={activePage}
        pageCount={pageCount}
      />
      <div
        ref={pagesContainerRef}
        className="flex-1 flex min-h-0"
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          position: "relative",
        }}
      >
        <div
          ref={measureRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            visibility: "hidden",
            pointerEvents: "none",
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            boxSizing: "border-box",
          }}
        >
          {chapter.verses.map((v) => (
            <p
              key={v.id}
              data-verse-id={v.id}
              className="mb-4 text-sm md:text-base leading-relaxed"
            >
              <sup className="mr-1 text-[0.6rem] md:text-xs text-muted-foreground select-none">
                {v.number}
              </sup>
              {v.text}
            </p>
          ))}
        </div>
        {pages.map((page) => (
          <VersesPage key={`${page.startVerse}-${page.endVerse}`} page={page} />
        ))}
      </div>
    </div>
  );
}
