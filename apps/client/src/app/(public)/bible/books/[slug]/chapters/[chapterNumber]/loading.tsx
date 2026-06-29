const VERSE_SKELETON_KEYS = Array.from(
  { length: 8 },
  (_, i) => `verse-skeleton-${i}`,
);

export default function VersesLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
      {/* Skeleton headings */}
      <div className="space-y-1 mb-8">
        <div className="h-12 md:h-14 w-48 bg-accent/10 rounded-lg animate-pulse" />
        <div className="h-7 w-32 bg-accent/10 rounded-lg animate-pulse" />
      </div>

      {/* Skeleton verse list */}
      <div className="space-y-1">
        {VERSE_SKELETON_KEYS.map((key) => (
          <div
            key={key}
            className="h-16 bg-accent/10 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
