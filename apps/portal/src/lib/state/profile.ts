"use client";

import { useQuery } from "@tanstack/react-query";

import type { Row } from "@/lib/supabase";

import { createClient } from "@/lib/supabase";

export type Profile = Row<"user_profiles">;
export type Rotation = Row<"rotations">;

type ProfileWithRotations = {
  rotations: Rotation[];
} & Profile;

export function useUserProfile(handle: string) {
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    enabled: !!handle,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*, rotations(id, name, description, spec_id, updated_at)")
        .eq("handle", handle)
        .single();
      if (error) throw error;
      return data as ProfileWithRotations;
    },
    queryKey: ["user-profile", handle],
  });

  const profile = data ?? null;
  const rotations = profile?.rotations ?? [];

  return {
    isLoading,
    notFound: !isLoading && !profile,
    profile,
    rotations,
  };
}
