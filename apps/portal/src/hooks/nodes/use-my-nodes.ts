"use client";

import { useList, useGetIdentity } from "@refinedev/core";
import type { Node } from "./types";
import type { UserIdentity } from "@/lib/supabase/types";

/**
 * Hook to get the current user's nodes
 */
export function useMyNodes() {
  const { data: identity } = useGetIdentity<UserIdentity>();

  const { result, query } = useList<Node>({
    resource: "nodes",
    filters: [{ field: "user_id", operator: "eq", value: identity?.id }],
    sorters: [{ field: "created_at", order: "desc" }],
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  return {
    data: result?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
