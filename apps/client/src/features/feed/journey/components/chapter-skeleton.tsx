"use client";

export function ChapterSkeleton({ count = 1 }: { count?: number }) {
  const items = Array.from({ length: count }, (_, i) => ({
    id: `skeleton-${i}`,
  }));

  const cardStyle: React.CSSProperties = {
    height: "calc(100svh - var(--navbar-height))",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    paddingTop: "1rem",
    paddingBottom: "1rem",
  };

  return items.map((item) => (
    <div
      key={item.id}
      className="p-6 space-y-4 animate-pulse"
      style={cardStyle}
    >
      <div className="h-4 w-1/3 bg-muted rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-5/6 bg-muted rounded" />
        <div className="h-3 w-4/6 bg-muted rounded" />
      </div>
    </div>
  ));
}
