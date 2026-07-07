import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HINT_DELAY_MS,
  HINT_STORAGE_KEY,
  HINT_VISIBLE_MS,
  useNextChapterHint,
} from "./use-next-chapter-hint";

describe("useNextChapterHint", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts hidden", () => {
    const { result } = renderHook(() => useNextChapterHint());
    expect(result.current.visible).toBe(false);
  });

  it("shows after the delay once triggered and marks it seen", () => {
    const { result } = renderHook(() => useNextChapterHint());

    act(() => {
      result.current.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(HINT_DELAY_MS);
    });

    expect(result.current.visible).toBe(true);
    expect(sessionStorage.getItem(HINT_STORAGE_KEY)).toBe("1");
  });

  it("does not show before the delay elapses", () => {
    const { result } = renderHook(() => useNextChapterHint());

    act(() => {
      result.current.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(HINT_DELAY_MS - 1);
    });

    expect(result.current.visible).toBe(false);
  });

  it("never shows again once seen", () => {
    sessionStorage.setItem(HINT_STORAGE_KEY, "1");
    const { result } = renderHook(() => useNextChapterHint());

    act(() => {
      result.current.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(HINT_DELAY_MS);
    });

    expect(result.current.visible).toBe(false);
  });

  it("auto-dismisses after being visible", () => {
    const { result } = renderHook(() => useNextChapterHint());

    act(() => {
      result.current.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(HINT_DELAY_MS);
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(HINT_VISIBLE_MS);
    });
    expect(result.current.visible).toBe(false);
  });

  it("dismiss hides it immediately", () => {
    const { result } = renderHook(() => useNextChapterHint());

    act(() => {
      result.current.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(HINT_DELAY_MS);
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.visible).toBe(false);
  });

  it("restarts the countdown when triggered again", () => {
    const { result } = renderHook(() => useNextChapterHint());

    act(() => {
      result.current.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(HINT_DELAY_MS - 2000);
    });
    // Re-trigger before the first countdown fires.
    act(() => {
      result.current.trigger();
    });
    act(() => {
      vi.advanceTimersByTime(HINT_DELAY_MS - 2000);
    });
    // Original countdown would have fired by now; restarted one has not.
    expect(result.current.visible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.visible).toBe(true);
  });

  it("cancels a pending countdown on unmount", () => {
    const { result, unmount } = renderHook(() => useNextChapterHint());

    act(() => {
      result.current.trigger();
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(HINT_DELAY_MS);
    });

    expect(sessionStorage.getItem(HINT_STORAGE_KEY)).toBeNull();
  });
});
