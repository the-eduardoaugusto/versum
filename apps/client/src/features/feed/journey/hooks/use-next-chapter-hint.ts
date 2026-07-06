import { useCallback, useEffect, useRef, useState } from "react";

export const HINT_STORAGE_KEY = "versum:hint:next-chapter";
export const HINT_DELAY_MS = 1 * 1_000 * 60; // 1 minute
export const HINT_VISIBLE_MS = 10_000; // 10 seconds

/**
 * One-time onboarding hint that teaches the vertical "next chapter" gesture.
 * Call `trigger()` after a horizontal page change; if the user has never seen
 * the hint, it becomes visible after HINT_DELAY_MS of inactivity, marks itself
 * seen, then auto-dismisses after HINT_VISIBLE_MS. Re-triggering restarts the
 * countdown. `dismiss()` hides it right away.
 */
export function useNextChapterHint() {
  const [visible, setVisible] = useState(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDelay = useCallback(() => {
    if (delayRef.current !== null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  const clearDismiss = useCallback(() => {
    if (dismissRef.current !== null) {
      clearTimeout(dismissRef.current);
      dismissRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearDelay();
    clearDismiss();
    setVisible(false);
  }, [clearDelay, clearDismiss]);

  const trigger = useCallback(() => {
    if (sessionStorage.getItem(HINT_STORAGE_KEY) === "1") return;
    clearDelay();
    delayRef.current = setTimeout(() => {
      sessionStorage.setItem(HINT_STORAGE_KEY, "1");
      setVisible(true);
      dismissRef.current = setTimeout(() => {
        setVisible(false);
      }, HINT_VISIBLE_MS);
    }, HINT_DELAY_MS);
  }, [clearDelay]);

  useEffect(() => {
    return () => {
      clearDelay();
      clearDismiss();
    };
  }, [clearDelay, clearDismiss]);

  return { visible, trigger, dismiss };
}
