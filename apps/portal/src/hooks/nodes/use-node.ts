"use client";

import { useOne } from "@refinedev/core";
import type { Node } from "./types";

/**
 * Hook to get a single node by ID
 */
export function useNode(nodeId: string) {
  const { result, query } = useOne<Node>({
    resource: "nodes",
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
