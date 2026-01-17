"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import {
  type NodePermissionRow,
  type NodeRow,
  type NodeWithMeta,
  transformNode,
} from "./types";

interface NodesQueryResult {
  myNodes: NodeWithMeta[];
  sharedNodes: NodeWithMeta[];
}

export function selectOnlineCount(nodes: NodeWithMeta[]) {
  return selectOnlineNodes(nodes).length;
}

// Selectors for computing stats from nodes
export function selectOnlineNodes(nodes: NodeWithMeta[]) {
  return nodes.filter((n) => n.status === "online");
}

export function selectTotalWorkers(nodes: NodeWithMeta[]) {
  return selectOnlineNodes(nodes).reduce((sum, n) => sum + n.max_parallel, 0);
}

export function useNode(nodeId: string | undefined) {
  return useQuery({
    enabled: !!nodeId,
    queryFn: async () => {
      if (!nodeId) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("nodes")
        .select("*, nodes_permissions(*)")
        .eq("id", nodeId)
        .single();

      if (error) throw error;
      return data;
    },
    queryKey: ["nodes", nodeId],
  });
}

export function useNodes(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryFn: async (): Promise<NodesQueryResult> => {
      if (!userId) return { myNodes: [], sharedNodes: [] };

      const supabase = createClient();

      // Fetch own nodes
      const { data: myNodesData, error: myError } = await supabase
        .from("nodes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (myError) {
        console.error("Error fetching my nodes:", myError);
      }

      // Fetch permissions for my nodes
      let myPermissions: NodePermissionRow[] = [];
      if (myNodesData && myNodesData.length > 0) {
        const nodeIds = myNodesData.map((n) => n.id);
        const { data: permsData } = await supabase
          .from("nodes_permissions")
          .select("*")
          .in("node_id", nodeIds);
        myPermissions = (permsData ?? []) as NodePermissionRow[];
      }

      // Transform my nodes
      const myNodes = (myNodesData ?? []).map((row) =>
        transformNode(row as NodeRow, userId, myPermissions),
      );

      // Fetch nodes shared with me (public or explicitly shared)
      const { data: sharedNodesData, error: sharedError } = await supabase
        .from("nodes")
        .select(
          "*, nodes_permissions!inner(access_type, target_id, node_id, id, created_at)",
        )
        .neq("user_id", userId)
        .not("user_id", "is", null)
        .or(
          `access_type.eq.public,and(access_type.eq.user,target_id.eq.${userId})`,
          { referencedTable: "nodes_permissions" },
        );

      if (sharedError) {
        console.error("Error fetching shared nodes:", sharedError);
      }

      // Transform shared nodes
      const sharedNodes = (sharedNodesData ?? []).map((row) => {
        const { nodes_permissions, ...nodeRow } = row;
        const perms = Array.isArray(nodes_permissions)
          ? (nodes_permissions as NodePermissionRow[])
          : [];
        return transformNode(nodeRow as NodeRow, userId, perms);
      });

      return { myNodes, sharedNodes };
    },
    queryKey: ["nodes", { userId }],
    staleTime: 1000 * 60, // 1 minute
  });
}
