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
  const containerRef = useRef<HTMLDivElement>(null);
  const currentArrowRef = useRef<HTMLDivElement>(null);
  const newArrowRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;

    // Set initial state: new arrow hidden to the left
    gsap.set(newArrowRef.current, { x: -16, opacity: 0 });

    const handleMouseEnter = () => {
      tlRef.current?.kill();

      tlRef.current = gsap
        .timeline()
        .to(
          containerRef.current,
          { x: 8, duration: 0.3, ease: "power3.out" },
          0,
        )
        .to(
          newArrowRef.current,
          { x: 0, opacity: 1, duration: 0.3, ease: "power3.out" },
          0,
        )
        .to(
          currentArrowRef.current,
          { x: 16, opacity: 0, duration: 0.3, ease: "power3.out" },
          0,
        );
    };

    const handleMouseLeave = () => {
      tlRef.current?.kill();

      tlRef.current = gsap
        .timeline()
        .to(
          containerRef.current,
          { x: 0, duration: 0.3, ease: "power3.out" },
          0,
        )
        .to(
          newArrowRef.current,
          { x: -16, opacity: 0, duration: 0.3, ease: "power3.out" },
          0,
        )
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
      className="text-md hover:text-accent-foreground transition-colors inline-flex items-center relative"
    >
      {/* Container: arrows + text animate together as one unit */}
      <div ref={containerRef} className="flex items-center gap-1">
        {/* New arrow — absolute within container, slides in from left on hover */}
        <div ref={newArrowRef} className="absolute left-0 inline-flex">
          <ArrowRightIcon className="size-4 flex-shrink-0" />
        </div>

        {/* Current arrow — visible at rest, exits right on hover */}
        <div ref={currentArrowRef} className="inline-flex">
          <ArrowRightIcon className="size-4 flex-shrink-0" />
        </div>

        <span className="break-inside-avoid">{item.niceName}</span>
      </div>
    </Link>
  );
}
