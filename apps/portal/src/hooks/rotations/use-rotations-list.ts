"use client";

import { useList, useGetIdentity } from "@refinedev/core";
import type { Rotation } from "@/lib/supabase/types";

interface UseRotationsListOptions {
  specId?: number;
}

interface UserIdentity {
  id: string;
  email?: string;
  handle?: string;
  avatarUrl?: string;
}

export function useMyRotations(options: UseRotationsListOptions = {}) {
  const { data: user } = useGetIdentity<UserIdentity>();

  return useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "userId", operator: "eq", value: user?.id },
      ...(options.specId
        ? [{ field: "specId", operator: "eq" as const, value: options.specId }]
        : []),
    ],
    sorters: [{ field: "updatedAt", order: "desc" }],
    queryOptions: {
      enabled: !!user?.id,
    },
  });
}

export function useCommunityRotations(options: UseRotationsListOptions = {}) {
  const { data: user } = useGetIdentity<UserIdentity>();

  return useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "isPublic", operator: "eq", value: true },
      // Exclude own rotations from community list
      ...(user?.id
        ? [{ field: "userId", operator: "ne" as const, value: user.id }]
        : []),
      ...(options.specId
        ? [{ field: "specId", operator: "eq" as const, value: options.specId }]
        : []),
    ],
    sorters: [{ field: "updatedAt", order: "desc" }],
    pagination: { pageSize: 20 },
  });
}
