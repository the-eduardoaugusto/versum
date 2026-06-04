"use client";

import type { FeedProgress } from "../types";

interface FeedProgressProps {
  progress: FeedProgress | null;
}

export function FeedProgressBar({ progress }: FeedProgressProps) {
  if (!progress) return null;

  return (
    <div className="sticky top-0 z-10 px-6 py-1.5 bg-background/80 backdrop-blur-sm">
      <div className="h-0.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground transition-all duration-500"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>
    </div>
  );
}
