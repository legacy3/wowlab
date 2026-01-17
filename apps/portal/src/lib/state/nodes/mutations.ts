"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { TablesUpdate } from "@/lib/supabase/database.types";

import { createClient } from "@/lib/supabase/client";

import { mapAccessTypeToDb, type NodeAccessType, type NodeRow } from "./types";

export interface SaveNodeData {
  accessType: NodeAccessType;
  maxParallel: number;
  name: string;
}

export interface VerifyResult {
  id: string;
  name: string;
  platform: string;
  total_cores: number;
}

export function useClaimNode() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const verifyCode = useMutation({
    mutationFn: async (code: string): Promise<VerifyResult> => {
      const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");

      const { data, error } = await supabase
        .from("nodes")
        .select("id, name, platform, total_cores")
        .eq("claim_code", normalizedCode)
        .is("user_id", null)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Invalid or expired claim code");
        }
        throw error;
      }

      return data as VerifyResult;
    },
  });

  const claimNode = useMutation({
    mutationFn: async ({
      maxParallel,
      name,
      nodeId,
      userId,
    }: {
      nodeId: string;
      userId: string;
      name: string;
      maxParallel: number;
    }): Promise<NodeRow> => {
      const { data, error } = await supabase
        .from("nodes")
        .update({
          claim_code: null,
          max_parallel: maxParallel,
          name,
          user_id: userId,
        })
        .eq("id", nodeId)
        .select()
        .single();

      if (error) throw error;
      return data as NodeRow;
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
