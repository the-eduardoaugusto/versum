"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef, useState } from "react";
import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import type { JourneyStatusResponseData } from "@/dal/orval/fetch/schemas/journeyStatusResponseData";
import { JourneyProgressSection } from "./journey-progress-section";
import { ProfileHeader } from "./profile-header";

interface ProfileViewProps {
  profile: FullProfile;
  journey: JourneyStatusResponseData | null;
}

export function ProfileView({ profile, journey }: ProfileViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [prefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  useGSAP(
    () => {
      if (prefersReducedMotion) {
        if (journey) {
          gsap.set(".progress-fill", { width: `${journey.percentComplete}%` });
        }
        return;
      }

      gsap.from(".profile-header", {
        y: 16,
        opacity: 0,
        duration: 0.4,
        ease: "power2.out",
        clearProps: "transform,opacity",
      });

      gsap.from(".journey-stat", {
        y: 12,
        opacity: 0,
        duration: 0.35,
        stagger: 0.06,
        ease: "power2.out",
        delay: 0.1,
        clearProps: "transform,opacity",
      });

      if (journey && !journey.isAtEnd) {
        gsap.fromTo(
          ".progress-fill",
          { width: "0%" },
          {
            width: `${journey.percentComplete}%`,
            duration: 0.6,
            ease: "power2.out",
            delay: 0.3,
          },
        );
      }
    },
    {
      scope: containerRef,
      dependencies: [prefersReducedMotion, journey?.percentComplete, journey?.isAtEnd],
    },
  );

  return (
    <div ref={containerRef} className="flex flex-col min-h-full">
      <ProfileHeader profile={profile} />

      {journey ? (
        <JourneyProgressSection journey={journey} />
      ) : (
        <div className="px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            Inicie sua jornada de leitura para ver seu progresso aqui.
          </p>
        </div>
      )}
    </div>
  );
}
