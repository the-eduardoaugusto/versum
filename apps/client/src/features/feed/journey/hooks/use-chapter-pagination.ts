import { useEffect, useRef, useState } from "react";

export function useChapterPagination(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const updateRef = useRef<() => void>(() => {});

  updateRef.current = () => {
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
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateRef.current();

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => updateRef.current());
    };

    const handleResize = () => {
      updateRef.current();
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
  }, [containerRef]);

  return { activePage, pageCount };
}
