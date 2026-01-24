"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { TablesUpdate } from "@/lib/supabase/database.types";

import { createClient } from "@/lib/supabase/client";

import { mapAccessTypeToDb, type NodeAccessType } from "./types";

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

export function useClaimNode() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const verifyCode = useMutation({
    mutationFn: async (code: string): Promise<VerifyResult> => {
      const { data, error } = await supabase.rpc("verify_claim_code", {
        p_code: code,
      });

      if (error || !data) {
        throw new Error("Invalid or expired claim code");
      }

      // TODO Proper return types in supabase client
      const node = data as {
        id: string;
        maxParallel: number;
        name: string;
        platform: string;
        totalCores: number;
      };

      return {
        id: node.id,
        max_parallel: node.maxParallel,
        name: node.name,
        platform: node.platform,
        total_cores: node.totalCores,
      };
    },
  });

  const claimNode = useMutation({
    mutationFn: async ({
      maxParallel,
      name,
      nodeId,
    }: {
      nodeId: string;
      name: string;
      maxParallel: number;
    }) => {
      const { data, error } = await supabase.rpc("claim_node", {
        p_max_parallel: maxParallel,
        p_name: name,
        p_node_id: nodeId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });

  return {
    claimNode,
    error: verifyCode.error || claimNode.error,
    isClaiming: claimNode.isPending,
    isVerifying: verifyCode.isPending,
    pendingNode: verifyCode.data,
    reset: () => {
      verifyCode.reset();
      claimNode.reset();
    },
    verifyCode,
  };
}

export function useNodeMutations() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const updateNode = useMutation({
    mutationFn: async ({
      data,
      nodeId,
    }: {
      nodeId: string;
      data: SaveNodeData;
    }) => {
      // Update node
      const nodeUpdate: TablesUpdate<"nodes"> = {
        max_parallel: data.maxParallel,
        name: data.name,
      };

      const { error: nodeError } = await supabase
        .from("nodes")
        .update(nodeUpdate)
        .eq("id", nodeId);

      if (nodeError) throw nodeError;

      // Update permissions - delete existing and insert new
      const { error: deleteError } = await supabase
        .from("nodes_permissions")
        .delete()
        .eq("node_id", nodeId);

      if (deleteError) throw deleteError;

      // Only create permission if not private
      if (data.accessType !== "private") {
        const { error: insertError } = await supabase
          .from("nodes_permissions")
          .insert({
            access_type: mapAccessTypeToDb(data.accessType),
            node_id: nodeId,
            target_id: null,
          });

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });

  const deleteNode = useMutation({
    mutationFn: async (nodeId: string) => {
      // Delete permissions first (foreign key constraint)
      await supabase.from("nodes_permissions").delete().eq("node_id", nodeId);

      // Delete node
      const { error } = await supabase.from("nodes").delete().eq("id", nodeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
  });

  return {
    deleteNode,
    error: updateNode.error || deleteNode.error,
    isDeleting: deleteNode.isPending,
    isUpdating: updateNode.isPending,
    updateNode,
  };
}
