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

export interface VerifyResult {
  id: string;
  max_parallel: number;
  name: string;
  platform: string;
  total_cores: number;
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

export function useClaimNode() {
  const invalidate = useInvalidate();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pendingNode, setPendingNode] = useState<VerifyResult | null>(null);

  const verifyCode = useCallback(
    async (code: string): Promise<VerifyResult> => {
      setIsVerifying(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc(
          "verify_claim_code",
          {
            p_code: code,
          },
        );

        if (rpcError || !data) {
          throw new Error("Invalid or expired claim code");
        }

        const node = data as {
          id: string;
          maxParallel: number;
          name: string;
          platform: string;
          totalCores: number;
        };

        const result: VerifyResult = {
          id: node.id,
          max_parallel: node.maxParallel,
          name: node.name,
          platform: node.platform,
          total_cores: node.totalCores,
        };

        setPendingNode(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsVerifying(false);
      }
    },
    [],
  );

  const claimNode = useCallback(
    async (input: { nodeId: string; name: string; maxParallel: number }) => {
      setIsClaiming(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc("claim_node", {
          p_max_parallel: input.maxParallel,
          p_name: input.name,
          p_node_id: input.nodeId,
        });

        if (rpcError) {
          throw rpcError;
        }

        invalidate({ invalidates: ["all"], resource: "nodes" });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsClaiming(false);
      }
    },
    [invalidate],
  );

  const reset = useCallback(() => {
    setError(null);
    setPendingNode(null);
  }, []);

  return {
    claimNode: { mutateAsync: claimNode },
    error,
    isClaiming,
    isVerifying,
    pendingNode,
    reset,
    verifyCode: { mutateAsync: verifyCode },
  };
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

export function useNodes(userId: string | undefined) {
  const { data: identity } = useGetIdentity<User>();
  const effectiveUserId = userId ?? identity?.id;

  const myNodesResult = useList<NodeRow>({
    ...nodes,
    filters: effectiveUserId
      ? [{ field: "user_id", operator: "eq", value: effectiveUserId }]
      : [],
    liveMode: "auto",
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!effectiveUserId,
      staleTime: 1000 * 60,
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
    liveMode: "auto",
    pagination: { mode: "off" },
    queryOptions: { enabled: nodeIds.length > 0 },
  });
  const myPermsData = myPermsResult.query.data;
  const permsLoading = myPermsResult.query.isLoading;

  const sharedNodesResult = useList<NodeWithPermissions>({
    ...nodes,
    filters: effectiveUserId
      ? [{ field: "user_id", operator: "ne", value: effectiveUserId }]
      : [],
    liveMode: "auto",
    meta: {
      select:
        "*, nodes_permissions!inner(access_type, target_id, node_id, id, created_at)",
    },
    pagination: { mode: "off" },
    queryOptions: {
      enabled: !!effectiveUserId,
      staleTime: 1000 * 60,
    },
  });
  const sharedNodesData = sharedNodesResult.query.data;
  const sharedLoading = sharedNodesResult.query.isLoading;

  const isLoading = myNodesLoading || permsLoading || sharedLoading;

  const myPermissions = (myPermsData?.data ?? []) as NodePermissionRow[];
  const myNodes = (myNodesData?.data ?? []).map((row) =>
    transformNode(row as NodeRow, effectiveUserId ?? "", myPermissions),
  );

  const sharedNodes = (sharedNodesData?.data ?? [])
    .filter((row) => {
      const perms = row.nodes_permissions ?? [];
      return perms.some(
        (p) =>
          p.access_type === "public" ||
          (p.access_type === "user" && p.target_id === effectiveUserId),
      );
    })
    .map((row) => {
      const { nodes_permissions, ...nodeRow } = row;
      return transformNode(
        nodeRow as NodeRow,
        effectiveUserId ?? "",
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
