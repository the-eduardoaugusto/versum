const CHAPTER_SKELETON_KEYS = Array.from(
  { length: 12 },
  (_, i) => `chapter-skeleton-${i}`,
);

export default function ChaptersLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
      {/* Skeleton heading */}
      <div className="space-y-2 mb-8">
        <div className="h-12 md:h-14 w-48 bg-accent/10 rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-accent/10 rounded animate-pulse" />
      </div>

      {/* Skeleton grid matching chapters layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {CHAPTER_SKELETON_KEYS.map((key) => (
          <div
            key={key}
            className="h-10 bg-accent/10 rounded-lg animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
