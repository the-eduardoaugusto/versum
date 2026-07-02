"use client";

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { MouseEvent } from "react";

interface PageArrowsProps {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

// Spring easing: the press-scale bounces back with a subtle overshoot on
// release, giving the click a tactile feel.
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// The button carries ONLY a scale transform (for the press animation).
// Vertical centering lives on the wrapper below, so the animation can never
// fight the positioning transform (which previously made the button jump down
// on click).
const buttonClass =
  "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full " +
  "bg-background/70 text-muted-foreground ring-1 ring-border/40 shadow-sm " +
  "backdrop-blur-sm cursor-pointer " +
  "transition-[transform,background-color,color,opacity] duration-200 " +
  "hover:bg-background/90 hover:text-foreground hover:scale-105 " +
  "active:scale-[0.82] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
  "disabled:pointer-events-none disabled:opacity-0";

export function PageArrows({
  canPrev,
  canNext,
  onPrev,
  onNext,
}: PageArrowsProps) {
  // Prevent the button from taking focus on mouse press. Focus would make the
  // browser scroll the vertical snap-feed to reveal the button, nudging the
  // page. Click still fires; keyboard focus (Tab) is unaffected.
  const noFocus = (e: MouseEvent) => e.preventDefault();

  return (
    <>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={!canPrev}
          onMouseDown={noFocus}
          onClick={onPrev}
          className={buttonClass}
          style={{ transitionTimingFunction: SPRING }}
        >
          <CaretLeftIcon weight="bold" className="size-5" />
        </button>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
        <button
          type="button"
          aria-label="Próxima página"
          disabled={!canNext}
          onMouseDown={noFocus}
          onClick={onNext}
          className={buttonClass}
          style={{ transitionTimingFunction: SPRING }}
        >
          <CaretRightIcon weight="bold" className="size-5" />
        </button>
      </div>
    </>
  );
}
