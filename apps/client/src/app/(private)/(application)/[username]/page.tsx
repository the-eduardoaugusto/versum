import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getCachedJourneyStatus,
  getCachedProfileMe,
} from "@/dal/profiles/get-cached-profile";
import { ProfileSkeleton, ProfileView } from "@/features/profile";

async function ProfileContent() {
  const [profile, journey] = await Promise.all([
    getCachedProfileMe(),
    getCachedJourneyStatus(),
  ]);

  if (!profile) {
    return "Profile not found!";
  }

  return <ProfileView profile={profile} journey={journey} />;
}

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username: encodedUsername } = await params;
  const username = decodeURIComponent(encodedUsername);

  if (username !== "@me") notFound();

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
