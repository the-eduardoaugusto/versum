"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import type { ReactNode } from "react";
import { forwardRef, useImperativeHandle, useRef } from "react";

export interface StepTransitionHandle {
  triggerExit: (direction: number, onDone: () => void) => void;
}

interface StepTransitionProps {
  children: ReactNode;
}

const EXIT_DURATION = 0.18;
const ENTER_DURATION = 0.26;

export const StepTransition = forwardRef<
  StepTransitionHandle,
  StepTransitionProps
>(function StepTransition({ children }, ref) {
  const elRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = elRef.current;
    if (!el) return;

    gsap.set(el, { opacity: 0 });
    // Reveal only after the hidden state is applied, so the SSR-rendered
    // content does not flash before the enter animation runs.
    el.classList.remove("invisible");
    gsap.to(el, {
      opacity: 1,
      duration: ENTER_DURATION,
      clearProps: "opacity",
    });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      triggerExit: (_direction: number, onDone: () => void) => {
        const el = elRef.current;
        if (!el) {
          onDone();
          return;
        }

        gsap.to(el, {
          opacity: 0,
          duration: EXIT_DURATION,
          onComplete: onDone,
        });
      },
    }),
    [],
  );

  return (
    <div ref={elRef} className="invisible" style={{ willChange: "opacity" }}>
      {children}
    </div>
  );
});
