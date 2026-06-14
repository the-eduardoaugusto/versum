"use client";

interface PageDotsProps {
  activePage: number;
  pageCount: number;
}

export function PageDots({ activePage, pageCount }: PageDotsProps) {
  const dots = Array.from({ length: pageCount }, (_, i) => ({
    id: `dot-${i}`,
    index: i,
  }));

  return (
    <div className="flex items-center gap-1.5">
      {dots.map((dot) => (
        <span
          key={dot.id}
          data-active={dot.index === activePage}
          className={`block h-1.5 w-1.5 rounded-full transition-all duration-300 ${
            dot.index === activePage
              ? "bg-foreground scale-110"
              : "bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}
