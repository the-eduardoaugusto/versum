"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4 px-6 py-8">
        <Skeleton className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-3 w-14 rounded shrink-0" />
          <Separator />
        </div>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-7 w-10 rounded" />
                  <Skeleton className="h-3 w-12 rounded" />
                </div>
              ))}
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
