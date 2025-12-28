"use client";

import { useList, useCreate, useInvalidate } from "@refinedev/core";
import type { UserNodePermission, AccessType } from "./types";

type UIAccessType = "owner" | "friends" | "guild" | "public";

/**
 * Hook to get node access settings
 */
export function useNodeAccess(nodeId: string) {
  const { result, query } = useList<UserNodePermission>({
    resource: "user_nodes_permissions",
    filters: [{ field: "nodeId", operator: "eq", value: nodeId }],
    queryOptions: {
      enabled: !!nodeId,
    },
  });

  // Determine the effective access type
  // Priority: public > guild > friends > owner
  const accessList = result?.data ?? [];

  // Find highest priority access type
  const hasPublic = accessList.some((a) => a.accessType === "public");
  const hasGuild = accessList.some((a) => a.accessType === "guild");
  const hasFriends = accessList.some((a) => a.accessType === "user");

  let accessType: UIAccessType = "owner";
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
  const { mutateAsync, mutation } = useCreate<UserNodePermission>();

  const updateAccess = async (params: {
    nodeId: string;
    accessType: UIAccessType;
  }) => {
    // For simplicity, we create a new access entry
    // In production, this should be an RPC function for atomicity

    const newAccessType: AccessType =
      params.accessType === "friends" ? "user" : params.accessType;

    await mutateAsync({
      resource: "user_nodes_permissions",
      values: {
        nodeId: params.nodeId,
        accessType: newAccessType,
        targetId: null,
      } as unknown as UserNodePermission,
    });

    invalidate({
      resource: "user_nodes_permissions",
      invalidates: ["list"],
    });
  };

  return {
    mutate: updateAccess,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
