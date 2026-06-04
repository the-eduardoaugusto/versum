import { useCallback, useEffect, useRef, useState } from "react";

export function useChapterPagination(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  const update = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const count = el.children.length;
    setPageCount(count);

    if (count === 0) {
      setActivePage(0);
      return;
    }

    const page = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.max(0, Math.min(page, count - 1));
    setActivePage(clamped);
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    update();

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(update);
    };

    const handleResize = () => {
      update();
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [containerRef, update]);

  return { activePage, pageCount };
}
