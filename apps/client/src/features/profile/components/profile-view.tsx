"use client";

import { useGSAP } from "@gsap/react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { gsap } from "gsap";
import { useRef, useState } from "react";
import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import type { JourneyStatusResponseData } from "@/dal/orval/fetch/schemas/journeyStatusResponseData";
import { JourneyProgressSection } from "./journey-progress-section";
import { ProfileEditForm } from "./profile-edit-form";
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

  const [isEditing, setIsEditing] = useState(false);

  useGSAP(
    () => {
      // Reveal only after GSAP has applied the initial hidden state, so the
      // SSR-rendered content never flashes before the animation runs.
      const reveal = () => containerRef.current?.classList.remove("invisible");

      if (prefersReducedMotion) {
        if (journey) {
          gsap.set(".progress-fill", { width: `${journey.percentComplete}%` });
        }
        reveal();
        return;
      }

      gsap.from(".profile-header", {
        y: 16,
        scale: 0.96,
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

      reveal();
    },
    {
      scope: containerRef,
      dependencies: [
        prefersReducedMotion,
        journey?.percentComplete,
        journey?.isAtEnd,
        isEditing,
      ],
    },
  );

  if (isEditing) {
    return (
      <div ref={containerRef} className="flex flex-col min-h-full">
        <ProfileEditForm profile={profile} onDone={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="invisible relative flex flex-col min-h-full max-w-screen"
    >
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label="Editar perfil"
        className="absolute top-4 right-4 p-2 rounded-full text-foreground/50 hover:text-foreground transition-colors"
      >
        <PencilSimpleIcon size={20} />
      </button>

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
