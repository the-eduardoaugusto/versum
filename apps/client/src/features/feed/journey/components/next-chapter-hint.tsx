"use client";

import { CaretDownIcon } from "@phosphor-icons/react";

interface NextChapterHintProps {
  visible: boolean;
  reducedMotion?: boolean;
  isTouch?: boolean;
}

/**
 * One-time overlay nudging the reader to move to the next chapter. Purely
 * presentational: visibility is driven by the parent. Fades in/out and bounces
 * a down-chevron to mimic the gesture (skipped under reduced motion). Never
 * intercepts input (`pointer-events-none`). The verb matches the input: touch
 * readers drag, desktop readers scroll.
 */
export function NextChapterHint({
  visible,
  reducedMotion = false,
  isTouch = false,
}: NextChapterHintProps) {
  const label = isTouch
    ? "Arraste para ir para o próximo capítulo"
    : "Role para baixo para ir para o próximo capítulo";

  return (
    <div
      role="status"
      aria-hidden={!visible}
      className={`pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1.5 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-sm">
        {label}
      </span>
      <CaretDownIcon
        weight="bold"
        className={`size-6 text-muted-foreground ${
          reducedMotion ? "" : "hint-bounce"
        }`}
      />
    </div>
  );
}
