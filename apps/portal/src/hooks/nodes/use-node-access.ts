"use client";

import { useList, useCreate, useInvalidate } from "@refinedev/core";
import type { NodeAccess } from "./types";

type AccessType = "owner" | "friends" | "guild" | "public";

/**
 * Hook to get node access settings
 */
export function useNodeAccess(nodeId: string) {
  const { result, query } = useList<NodeAccess>({
    resource: "node_access",
    filters: [{ field: "node_id", operator: "eq", value: nodeId }],
    queryOptions: {
      enabled: !!nodeId,
    },
  });

  // Determine the effective access type
  // Priority: public > guild > friends > owner
  const accessList = result?.data ?? [];

  // Find highest priority access type
  const hasPublic = accessList.some((a) => a.access_type === "public");
  const hasGuild = accessList.some((a) => a.access_type === "guild");
  const hasFriends = accessList.some((a) => a.access_type === "user");

  let accessType: AccessType = "owner";
  if (hasPublic) {
    accessType = "public";
  } else if (hasGuild) {
    accessType = "guild";
  } else if (hasFriends) {
    accessType = "friends";
  }

  return {
    data: accessType,
    accessList,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to update node access settings
 */
export function useUpdateNodeAccess() {
  const invalidate = useInvalidate();
  const { mutateAsync, mutation } = useCreate<NodeAccess>();

  const updateAccess = async (params: {
    nodeId: string;
    accessType: AccessType;
  }) => {
    // For simplicity, we create a new access entry
    // In production, this should be an RPC function for atomicity

    const newAccessType =
      params.accessType === "friends" ? "user" : params.accessType;

    await mutateAsync({
      resource: "node_access",
      values: {
        node_id: params.nodeId,
        access_type: newAccessType,
        target_id: null,
      } as unknown as NodeAccess,
    });

    invalidate({
      resource: "node_access",
      invalidates: ["list"],
    });
  };

  return {
    mutate: updateAccess,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
