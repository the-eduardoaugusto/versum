import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getApiV1ProfilesMe } from "@/dal/orval/fetch/profiles/profiles";
import { getApiV1ReadingsJourneyStatus } from "@/dal/orval/fetch/journey/journey";
import { ProfileSkeleton, ProfileView } from "@/features/profile";

async function ProfileContent() {
  const reqHeaders = await headers();
  const fetchOptions = { headers: new Headers(reqHeaders) };

  const [profileResult, journeyResult] = await Promise.allSettled([
    getApiV1ProfilesMe(fetchOptions),
    getApiV1ReadingsJourneyStatus(fetchOptions),
  ]);

  const profile =
    profileResult.status === "fulfilled" ? profileResult.value?.data : undefined;
  const journey =
    journeyResult.status === "fulfilled" ? journeyResult.value?.data : undefined;

  if (!profile) {
    notFound();
  }

  return <ProfileView profile={profile!} journey={journey ?? null} />;
}

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  if (username !== "@me") notFound();

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
