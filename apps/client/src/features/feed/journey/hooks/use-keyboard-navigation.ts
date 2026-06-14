import { useCallback, useEffect } from "react";

interface UseKeyboardNavigationOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  enabled?: boolean;
}

function findChapterElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-chapter-id]"),
  );
}

function getVisibleChapterIndex(
  chapters: HTMLElement[],
  container: HTMLElement,
): number {
  const containerRect = container.getBoundingClientRect();
  const center = containerRect.top + containerRect.height / 2;

  let closestIndex = 0;
  let closestDistance = Infinity;

  for (let i = 0; i < chapters.length; i++) {
    const rect = chapters[i].getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - center);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

function scrollToElement(
  container: HTMLElement,
  element: HTMLElement,
  smooth: boolean,
) {
  const top = element.offsetTop - container.offsetTop;
  container.scrollTo({
    top,
    behavior: smooth ? "smooth" : "instant",
  });
}

export function useKeyboardNavigation({
  containerRef,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  const smooth = !prefersReducedMotion;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const container = containerRef.current;
      if (!container) return;

      const chapters = findChapterElements(container);
      if (chapters.length === 0) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const currentIndex = getVisibleChapterIndex(chapters, container);
          const nextIndex = Math.min(currentIndex + 1, chapters.length - 1);
          if (nextIndex !== currentIndex) {
            scrollToElement(container, chapters[nextIndex], smooth);
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const currentIndex = getVisibleChapterIndex(chapters, container);
          const prevIndex = Math.max(currentIndex - 1, 0);
          if (prevIndex !== currentIndex) {
            scrollToElement(container, chapters[prevIndex], smooth);
          }
          break;
        }
      }
    },
    [containerRef, enabled, smooth],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}
