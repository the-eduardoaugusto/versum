"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, Suspense, useState } from "react";
import { exponentialDelay, retryOn5xx } from "@/lib/retry-utils";

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: retryOn5xx,
            retryDelay: exponentialDelay,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </QueryClientProvider>
  );
}
