"use client";

import { useOne } from "@refinedev/core";
import type { UserNode } from "./types";

/**
 * Hook to get a single node by ID
 */
export function useNode(nodeId: string) {
  const { result, query } = useOne<UserNode>({
    resource: "user_nodes",
    id: nodeId,
    queryOptions: {
      enabled: !!nodeId,
    },
  });

  return {
    data: result ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
