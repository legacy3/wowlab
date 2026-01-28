"use client";

import type { Row } from "@/lib/supabase";

import { useResource } from "../hooks/use-resource";
import { userProfiles } from "../resources";

export type Profile = Row<"user_profiles">;
export type Rotation = Row<"rotations">;

type ProfileWithRotations = {
  rotations: Rotation[];
} & Profile;

export function useUserProfile(handle: string) {
  const { data: profile, isLoading } = useResource<ProfileWithRotations>({
    ...userProfiles,
    id: handle,
    meta: {
      ...userProfiles.meta,
      select: "*, rotations(id, name, description, spec_id, updated_at)",
    },
    queryOptions: { enabled: !!handle },
  });

  const rotations = profile?.rotations ?? [];

  return {
    isLoading,
    notFound: !isLoading && !profile,
    profile: profile ?? null,
    rotations,
  };
}
