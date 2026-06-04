"use client";

import type { VersePage } from "../types";

interface VersesPageProps {
  page: VersePage;
}

export function VersesPage({ page }: VersesPageProps) {
  return (
    <div
      style={{
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        width: "100vw",
        flexShrink: 0,
        padding: "1.5rem",
        paddingTop: "1rem",
      }}
    >
      {page.verses.map((verse) => (
        <p key={verse.id} className="text-sm md:text-base leading-relaxed mb-4">
          <sup className="mr-1 text-[0.6rem] md:text-xs text-muted-foreground select-none">
            {verse.number}
          </sup>
          {verse.text}
        </p>
      ))}
    </div>
  );
}
