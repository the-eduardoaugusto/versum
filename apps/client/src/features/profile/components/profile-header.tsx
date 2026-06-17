import type { FullProfile } from "@/dal/orval/fetch/schemas/fullProfile";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface ProfileHeaderProps {
  profile: FullProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const initials = getInitials(profile.name);

  return (
    <div className="profile-header flex items-center gap-4 px-6 py-8">
      <div
        className={cn(
          "relative shrink-0 rounded-full overflow-hidden",
          "w-16 h-16 md:w-20 md:h-20",
          "bg-muted ring-1 ring-foreground/10",
        )}
      >
        {profile.pictureUrl ? (
          // biome-ignore lint/performance/noImgElement: avatar images use external domains not configured in next.config
          <img
            src={profile.pictureUrl}
            alt={profile.name}
            className="w-full h-full object-cover"
            loading="eager"
          />
        ) : (
          <div
            role="img"
            className="w-full h-full flex items-center justify-center"
            aria-label={profile.name}
          >
            <span className="text-lg font-semibold text-muted-foreground select-none">
              {initials}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        <h1 className="text-xl font-semibold leading-tight truncate">
          {profile.name}
        </h1>
        <p className="text-sm text-muted-foreground truncate">
          @{profile.username}
        </p>
      </div>
    </div>
  );
}
