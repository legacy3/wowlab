"use client";

import {
  useDelete,
  useGetIdentity,
  useInvalidate,
  useList,
} from "@refinedev/core";
import { useCallback, useState } from "react";

import type { TablesUpdate } from "@/lib/supabase/database.types";

import { createClient } from "@/lib/supabase/client";

import {
  mapAccessTypeToDb,
  type NodeAccessType,
  type NodePermissionRow,
  type NodeRow,
  type NodeWithMeta,
  transformNode,
} from "../../state/nodes/types";
import { useResource } from "../hooks/use-resource";
import { nodes, nodesPermissions } from "../resources";

export interface SaveNodeData {
  accessType: NodeAccessType;
  maxParallel: number;
  name: string;
}

type NodeWithPermissions = {
  nodes_permissions: NodePermissionRow[];
} & NodeRow;

interface User {
  id: string;
}

export function selectOnlineCount(nodesData: NodeWithMeta[]) {
  return selectOnlineNodes(nodesData).length;
}

export function selectOnlineNodes(nodesData: NodeWithMeta[]) {
  return nodesData.filter((n) => n.status === "online");
}

export function selectTotalWorkers(nodesData: NodeWithMeta[]) {
  return selectOnlineNodes(nodesData).reduce(
    (sum, n) => sum + n.max_parallel,
    0,
  );
}

export function useNode(nodeId: string | undefined) {
  const { data, error, isError, isLoading } = useResource<NodeWithPermissions>({
    ...nodes,
    id: nodeId ?? "",
    liveMode: "auto",
    meta: { select: "*, nodes_permissions(*)" },
    queryOptions: { enabled: !!nodeId },
  });

  return {
    data,
    error,
    isError,
    isLoading,
  };
}

export function useNodeMutations() {
  const invalidate = useInvalidate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteMutation = useDelete();
  const isDeleting = deleteMutation.mutation.isPending;

  const updateNode = useCallback(
    async (input: { nodeId: string; data: SaveNodeData }) => {
      setIsUpdating(true);
      setError(null);

      try {
        const supabase = createClient();

        const nodeUpdate: TablesUpdate<"nodes"> = {
          max_parallel: input.data.maxParallel,
          name: input.data.name,
        };

        const { error: nodeError } = await supabase
          .from("nodes")
          .update(nodeUpdate)
          .eq("id", input.nodeId);

        if (nodeError) {
          throw nodeError;
        }

        const { error: deleteError } = await supabase
          .from("nodes_permissions")
          .delete()
          .eq("node_id", input.nodeId);

        if (deleteError) {
          throw deleteError;
        }

        if (input.data.accessType !== "private") {
          const { error: insertError } = await supabase
            .from("nodes_permissions")
            .insert({
              access_type: mapAccessTypeToDb(input.data.accessType),
              node_id: input.nodeId,
              target_id: null,
            });

          if (insertError) {
            throw insertError;
          }
        }

        invalidate({ invalidates: ["all"], resource: "nodes" });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [invalidate],
  );

  const deleteNode = useCallback(
    async (nodeId: string) => {
      const supabase = createClient();
      await supabase.from("nodes_permissions").delete().eq("node_id", nodeId);
      deleteMutation.mutate({ id: nodeId, resource: "nodes" });
    },
    [deleteMutation],
  );

  return {
    deleteNode: { mutateAsync: deleteNode },
    error,
    isDeleting,
    isUpdating,
    updateNode: { mutateAsync: updateNode },
  };
}

export function useNodes() {
  const { data: user } = useGetIdentity<User>();
  const userId = user?.id;

  const myNodesResult = useList<NodeRow>({
    ...nodes,
    filters: userId
      ? [{ field: "user_id", operator: "eq", value: userId }]
      : [],
    liveMode: "auto",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!userId,
      staleTime: 1000 * 5,
    },
    sorters: [{ field: "created_at", order: "desc" }],
  });
  const myNodesData = myNodesResult.query.data;
  const myNodesLoading = myNodesResult.query.isLoading;

  const nodeIds = (myNodesData?.data ?? []).map((n) => n.id);
  const myPermsResult = useList<NodePermissionRow>({
    ...nodesPermissions,
    filters:
      nodeIds.length > 0
        ? [{ field: "node_id", operator: "in", value: nodeIds }]
        : [],
    pagination: { mode: "off" },
    queryOptions: { enabled: nodeIds.length > 0 },
  });
  const myPermsData = myPermsResult.query.data;
  const permsLoading = myPermsResult.query.isLoading;

  const sharedNodesResult = useList<NodeWithPermissions>({
    ...nodes,
    filters: userId
      ? [{ field: "user_id", operator: "ne", value: userId }]
      : [],
    liveMode: "auto",
    meta: {
      select:
        "*, nodes_permissions!inner(access_type, target_id, node_id, id, created_at)",
    },
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!userId,
      staleTime: 1000 * 5,
    },
  });
  const sharedNodesData = sharedNodesResult.query.data;
  const sharedLoading = sharedNodesResult.query.isLoading;

  const isLoading = myNodesLoading || permsLoading || sharedLoading;

  const myPermissions = (myPermsData?.data ?? []) as NodePermissionRow[];
  const myNodes = (myNodesData?.data ?? []).map((row) =>
    transformNode(row as NodeRow, userId ?? "", myPermissions),
  );

  const sharedNodes = (sharedNodesData?.data ?? [])
    .filter((row) => {
      const perms = row.nodes_permissions ?? [];
      return perms.some(
        (p) =>
          p.access_type === "public" ||
          (p.access_type === "user" && p.target_id === userId),
      );
    })
    .map((row) => {
      const { nodes_permissions, ...nodeRow } = row;
      return transformNode(
        nodeRow as NodeRow,
        userId ?? "",
        nodes_permissions as NodePermissionRow[],
      );
    });

  return {
    data: { myNodes, sharedNodes },
    error: null,
    isError: false,
    isLoading,
  };
}
