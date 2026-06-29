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
  const currentArrowRef = useRef<SVGSVGElement>(null);
  const newArrowRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;

    const handleMouseEnter = () => {
      const currentArrow = currentArrowRef.current;
      const newArrow = newArrowRef.current;

      if (!currentArrow || !newArrow) return;

      gsap.to(currentArrow, {
        x: 20,
        opacity: 0,
        duration: 0.3,
        ease: "power3.easeOut",
      });

      gsap.to(newArrow, {
        x: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power3.easeOut",
      });
    };

    const handleMouseLeave = () => {
      const currentArrow = currentArrowRef.current;
      const newArrow = newArrowRef.current;

      if (!currentArrow || !newArrow) return;

      gsap.to(currentArrow, {
        x: 0,
        opacity: 1,
        duration: 0.3,
        ease: "power3.easeOut",
      });

      gsap.to(newArrow, {
        x: -20,
        opacity: 0,
        duration: 0.3,
        ease: "power3.easeOut",
      });
    };

    link.addEventListener("mouseenter", handleMouseEnter);
    link.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      link.removeEventListener("mouseenter", handleMouseEnter);
      link.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <Link
      ref={linkRef}
      href={href}
      className="text-md hover:text-accent-foreground transition-colors inline-flex items-center gap-1"
    >
      <span className="break-inside-avoid overflow-hidden">
        {item.niceName}
      </span>

      {/* Current arrow (visible at rest) */}
      <ArrowRightIcon
        ref={currentArrowRef}
        className="inline size-4 flex-shrink-0"
      />

      {/* New arrow (off-screen, appears on hover) */}
      <ArrowRightIcon
        ref={newArrowRef}
        className="absolute inline size-4 flex-shrink-0"
        style={{ x: -20, opacity: 0 }}
      />
    </Link>
  );
}
