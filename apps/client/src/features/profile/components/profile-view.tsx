"use client";

import { useGSAP } from "@gsap/react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import { gsap } from "gsap";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import type { JourneyStatusResponseData } from "@/dal/orval/fetch/schemas/journeyStatusResponseData";
import { useCurrentProfile } from "../hooks/use-current-profile";
import { JourneyProgressSection } from "./journey-progress-section";
import LogoutButton from "./logout-button";
import { ProfileEditForm } from "./profile-edit-form";
import { ProfileHeader } from "./profile-header";

interface ProfileViewProps {
  profile: FullProfile;
  journey: JourneyStatusResponseData | null;
}

export function ProfileView({
  profile: profileProp,
  journey,
}: ProfileViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [prefersReducedMotion] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );

  const [isEditing, setIsEditing] = useState(false);

  const { profile } = useCurrentProfile(profileProp);

  useGSAP(
    () => {
      const reveal = () => containerRef.current?.classList.remove("invisible");

      if (prefersReducedMotion) {
        if (!isEditing && journey) {
          gsap.set(".progress-fill", { width: `${journey.percentComplete}%` });
        }
        reveal();
        return;
      }

      if (isEditing) {
        gsap.from(".profile-edit", {
          y: 12,
          opacity: 0,
          duration: 0.35,
          ease: "power2.out",
          clearProps: "transform,opacity",
        });
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
      <div ref={containerRef} className="invisible flex flex-col min-h-full">
        <div className="max-w-2xl mx-auto w-full profile-edit">
          <ProfileEditForm
            profile={profile ?? profileProp}
            onDone={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="invisible relative flex flex-col min-h-full"
    >
      <section className="flex justify-between items-center max-w-2xl mx-auto w-full p-2">
        <LogoutButton />
        <Button
          variant="ghost"
          onClick={() => setIsEditing(true)}
          aria-label="Editar perfil"
          className="text-foreground/50 hover:text-foreground transition-colors"
        >
          <PencilSimpleIcon size={20} />
          <span className="hidden md:inline">Editar perfil</span>
        </Button>
      </section>

      <div className="max-w-2xl mx-auto w-full">
        <ProfileHeader profile={profile ?? profileProp} />

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
    </div>
  );
}
