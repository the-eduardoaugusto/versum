"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useChapterPagination } from "../hooks/use-chapter-pagination";
import { useNextChapterHint } from "../hooks/use-next-chapter-hint";
import type { FeedChapter, VerseData, VersePage } from "../types";
import { ChapterHeader } from "./chapter-header";
import { NextChapterHint } from "./next-chapter-hint";
import { PageArrows } from "./page-arrows";
import { VersesPage } from "./verses-page";

interface ChapterViewProps {
  chapter: FeedChapter;
}

const PAGE_VERTICAL_PADDING = 40;
// Matches the button footprint in PageArrows (h-10/w-10 + pl-2/pr-2 offset)
// plus breathing room, so verse text never renders under the buttons.
const PAGE_SIDE_INSET_WITH_ARROWS = "3.5rem";
const PAGE_SIDE_INSET_DEFAULT = "1.5rem";

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
      endVerse: currentPage[currentPage.length - 1].number,
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
  const [prefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  const [isTouch] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(pointer: coarse)").matches
      : false,
  );

  const measureRefCallback = useRef<() => void>(() => {});

  measureRefCallback.current = () => {
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
  };

  useLayoutEffect(() => {
    const container = pagesContainerRef.current;
    if (!container) return;

    const fn = () => measureRefCallback.current();
    fn();

    const ro = new ResizeObserver(fn);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const { activePage } = useChapterPagination(pagesContainerRef);
  const { visible: hintVisible, trigger: triggerHint } = useNextChapterHint();
  const pageCount = pages.length;
  const currentPage = pages[activePage];
  // Arrows only make sense for pointer devices; touch readers already swipe.
  const showArrows = pageCount > 1 && !isTouch;
  const sideInset = isTouch
    ? PAGE_SIDE_INSET_DEFAULT
    : PAGE_SIDE_INSET_WITH_ARROWS;

  const scrollByPage = (dir: -1 | 1) => {
    const el = pagesContainerRef.current;
    if (!el) return;
    // Derive the current page from live scrollLeft (not React state, which
    // lags behind fast clicks via the rAF-throttled scroll listener).
    const current = Math.round(el.scrollLeft / el.clientWidth);
    const target = Math.max(0, Math.min(current + dir, pageCount - 1));
    el.scrollTo({
      left: target * el.clientWidth,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    // After a sideways page change, nudge the reader toward the vertical
    // "next chapter" gesture (one-time; the hook no-ops once seen).
    if (activePage !== pageCount - 1) {
      triggerHint();
    }
  };

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
      <div className="relative flex-1 min-h-0">
        <div
          ref={pagesContainerRef}
          className="hide-scrollbar flex h-full w-full min-h-0"
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
              paddingLeft: sideInset,
              paddingRight: sideInset,
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
            <VersesPage
              key={`${page.startVerse}-${page.endVerse}`}
              page={page}
              sideInset={sideInset}
            />
          ))}
        </div>
        {!isTouch && (
          <PageArrows
            visible={showArrows}
            canPrev={activePage > 0}
            canNext={activePage < pageCount - 1}
            onPrev={() => scrollByPage(-1)}
            onNext={() => scrollByPage(1)}
            reducedMotion={prefersReducedMotion}
          />
        )}
        <NextChapterHint
          visible={hintVisible}
          reducedMotion={prefersReducedMotion}
          isTouch={isTouch}
        />
      </div>
    </div>
  );
}
