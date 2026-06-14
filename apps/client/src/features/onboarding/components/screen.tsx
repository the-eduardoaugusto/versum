"use client";

import { Toaster } from "@/components/ui/sonner";
import { OnboardingFlow } from "./onboarding-flow";

export function OnboardingScreen() {
  return (
    <main className="flex h-svh items-center justify-center p-4 bg-background">
      <OnboardingFlow onComplete={() => {}} />
      <Toaster />
    </main>
  );
}
