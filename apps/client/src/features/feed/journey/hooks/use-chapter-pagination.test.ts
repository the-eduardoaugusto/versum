import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChapterPagination } from "./use-chapter-pagination";

function createMockContainer(width: number, childrenCount: number) {
  const children = Array.from({ length: childrenCount }, () =>
    document.createElement("div"),
  );
  const el = document.createElement("div");
  Object.defineProperty(el, "clientWidth", { value: width, writable: true });
  Object.defineProperty(el, "scrollLeft", { value: 0, writable: true });
  for (const c of children) {
    el.appendChild(c);
  }
  return {
    el,
    children,
    setScrollLeft: (v: number) => {
      el.scrollLeft = v;
    },
  };
}

describe("useChapterPagination", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns activePage=0 and correct pageCount on mount", () => {
    const { el } = createMockContainer(375, 5);
    const ref = { current: el };
    const { result } = renderHook(() => useChapterPagination(ref));
    expect(result.current.activePage).toBe(0);
    expect(result.current.pageCount).toBe(5);
  });

  it("updates activePage on scroll", () => {
    const { el, setScrollLeft } = createMockContainer(375, 3);
    const ref = { current: el };
    const { result } = renderHook(() => useChapterPagination(ref));

    act(() => {
      setScrollLeft(400);
      el.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    act(() => {
      vi.advanceTimersToNextFrame();
    });

    expect(result.current.activePage).toBe(1);
  });

  it("clamps activePage to valid range", () => {
    const { el, setScrollLeft } = createMockContainer(375, 3);
    const ref = { current: el };
    const { result } = renderHook(() => useChapterPagination(ref));

    act(() => {
      setScrollLeft(1000);
      el.dispatchEvent(new Event("scroll", { bubbles: true }));
    });

    act(() => {
      vi.advanceTimersToNextFrame();
    });

    expect(result.current.activePage).toBe(2);
  });

  it("returns pageCount=0 when container has no children", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "clientWidth", { value: 375, writable: true });
    const ref = { current: el };
    const { result } = renderHook(() => useChapterPagination(ref));
    expect(result.current.pageCount).toBe(0);
    expect(result.current.activePage).toBe(0);
  });
});
