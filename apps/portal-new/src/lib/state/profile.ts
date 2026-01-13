"use client";

import { useList } from "@refinedev/core";

import type { Row } from "@/lib/supabase";

export type Profile = Row<"user_profiles">;
export type Rotation = Row<"rotations">;

type ProfileWithRotations = {
  rotations: Rotation[];
} & Profile;

export function useUserProfile(handle: string) {
  const {
    query: { isLoading },
    result,
  } = useList<ProfileWithRotations>({
    filters: [{ field: "handle", operator: "eq", value: handle }],
    meta: {
      select: "*, rotations(id, name, description, specId, updatedAt)",
    },
    pagination: { pageSize: 1 },
    resource: "user_profiles",
  });

  const profile = result?.data?.[0] ?? null;
  const rotations = profile?.rotations ?? [];

  return {
    isLoading,
    notFound: !isLoading && !profile,
    profile,
    rotations,
  };
}
