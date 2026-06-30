"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type React from "react";
import { Suspense } from "react";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </NextThemesProvider>
  );
}
