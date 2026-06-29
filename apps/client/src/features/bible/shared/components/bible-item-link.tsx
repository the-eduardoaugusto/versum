// apps/client/src/features/bible/shared/components/bible-item-link.tsx

"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import gsap from "gsap";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { BibleHierarchyItem } from "../types";

interface BibleItemLinkProps {
  item: BibleHierarchyItem;
  href: string;
}

export function BibleItemLink({ item, href }: BibleItemLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const currentArrowRef = useRef<SVGSVGElement>(null);
  const newArrowRef = useRef<SVGSVGElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;

    // Set initial state
    gsap.set(newArrowRef.current, { x: -16, opacity: 0 });

    const handleMouseEnter = () => {
      // Kill any in-progress animation before starting new one
      tlRef.current?.kill();

      tlRef.current = gsap
        .timeline()
        .to(
          newArrowRef.current,
          { x: 0, opacity: 1, duration: 0.3, ease: "power3.out" },
          0,
        )
        .to(textRef.current, { x: 6, duration: 0.3, ease: "power3.out" }, 0)
        .to(
          currentArrowRef.current,
          { x: 20, opacity: 0, duration: 0.3, ease: "power3.out" },
          0,
        );
    };

    const handleMouseLeave = () => {
      tlRef.current?.kill();

      tlRef.current = gsap
        .timeline()
        .to(
          newArrowRef.current,
          { x: -16, opacity: 0, duration: 0.3, ease: "power3.out" },
          0,
        )
        .to(textRef.current, { x: 0, duration: 0.3, ease: "power3.out" }, 0)
        .to(
          currentArrowRef.current,
          { x: 0, opacity: 1, duration: 0.3, ease: "power3.out" },
          0,
        );
    };

    link.addEventListener("mouseenter", handleMouseEnter);
    link.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      link.removeEventListener("mouseenter", handleMouseEnter);
      link.removeEventListener("mouseleave", handleMouseLeave);
      tlRef.current?.kill();
    };
  }, []);

  return (
    <Link
      ref={linkRef}
      href={href}
      className="text-md hover:text-accent-foreground transition-colors inline-flex items-center gap-1 relative"
    >
      {/* New arrow — absolute, slides in from left on hover */}
      <ArrowRightIcon
        ref={newArrowRef}
        className="absolute inline size-4 flex-shrink-0"
      />

      {/* Text — shifts right when new arrow pushes in */}
      <span ref={textRef} className="break-inside-avoid">
        {item.niceName}
      </span>

      {/* Current arrow — visible at rest, exits right on hover */}
      <ArrowRightIcon
        ref={currentArrowRef}
        className="inline size-4 flex-shrink-0"
      />
    </Link>
  );
}
