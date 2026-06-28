"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="max-w-sm mx-auto w-full">
      <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4">
        <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full shrink-0" />
        <div className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-48 rounded mt-1" />
        </div>
      </div>

      <section className="px-6 pb-6">
        <Skeleton className="h-2.5 w-14 rounded mb-3" />
        <div className="bg-muted/50 rounded-2xl px-5 py-4">
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-7 w-10 rounded" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
            ))}
          </div>
          <Skeleton className="h-1 w-full rounded-full" />
        </div>
      </section>
    </div>
  );
}
