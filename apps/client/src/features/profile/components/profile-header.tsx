import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="profile-header flex flex-col items-center gap-3 px-6 pt-8 pb-4">
      <div
        className={cn(
          "relative shrink-0 rounded-full overflow-hidden",
          "w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28",
          "bg-muted",
        )}
      >
        {profile.pictureUrl ? (
          <Avatar className="w-full h-full">
            <AvatarImage
              src={profile.pictureUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
            <AvatarFallback className="w-full h-full rounded-full">
              <Skeleton className="w-full h-full" />
            </AvatarFallback>
          </Avatar>
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

      <div className="flex flex-col items-center gap-0.5 w-full min-w-0 text-center">
        <h1 className="text-xl lg:text-2xl font-normal leading-tight w-full wrap-break-word">
          {profile.name}
        </h1>
        <p className="text-sm text-muted-foreground wrap-break-word">
          @{profile.username}
        </p>
        {profile.bio && (
          <p className="text-sm text-muted-foreground mt-1 w-full whitespace-pre-wrap wrap-break-word">
            {profile.bio}
          </p>
        )}
      </div>
    </div>
  );
}
