"use client";

import type { VersePage } from "../types";

interface VersesPageProps {
  page: VersePage;
  // Extra left/right padding reserving room for the prev/next arrow
  // buttons so they never sit on top of verse text. Only needed where the
  // arrows render (non-touch pointers); touch devices swipe instead.
  sideInset: string;
}

export function VersesPage({ page, sideInset }: VersesPageProps) {
  return (
    <div
      style={{
        scrollSnapAlign: "start",
        scrollSnapStop: "always",
        width: "100%",
        flexShrink: 0,
        paddingTop: "1rem",
        paddingBottom: "1.5rem",
        paddingLeft: sideInset,
        paddingRight: sideInset,
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
