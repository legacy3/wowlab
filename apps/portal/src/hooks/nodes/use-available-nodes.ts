"use client";

import { useList, useGetIdentity } from "@refinedev/core";
import type { UserNode } from "./types";
import type { UserIdentity } from "@/lib/supabase/types";

/**
 * Hook to get nodes available to the current user (shared by others)
 *
 * This queries nodes with public access or shared with the user.
 * In production, this would use an RPC function for proper access resolution.
 */
export function useAvailableNodes() {
  const { data: identity } = useGetIdentity<UserIdentity>();

  // For now, we query public nodes only
  // A full implementation would use an RPC function to resolve all access types
  const { result, query } = useList<UserNode>({
    resource: "user_nodes",
    // This is a simplified query - production would use a view or function
    queryOptions: {
      enabled: !!identity?.id,
    },
  });

  // Filter to only include nodes the user doesn't own
  const availableNodes = (result?.data ?? []).filter(
    (node) => node.userId !== identity?.id,
  );

  return {
    data: availableNodes,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
