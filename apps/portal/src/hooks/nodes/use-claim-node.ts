"use client";

import { useCreate, useGetIdentity, useInvalidate } from "@refinedev/core";
import type { Node } from "./types";
import type { UserIdentity } from "@/lib/supabase/types";

interface ClaimNodeParams {
  code: string;
  name?: string;
}

/**
 * Hook to claim a node with a claim code
 *
 * Note: This is a simplified implementation. In production, this would
 * call an RPC function that atomically finds and claims the node.
 */
export function useClaimNode() {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const invalidate = useInvalidate();

  const { mutateAsync, mutation } = useCreate<Node>();

  const claimNode = async (
    params: ClaimNodeParams,
    options?: {
      onSuccess?: (node: Node) => void;
      onError?: (error: unknown) => void;
    },
  ) => {
    if (!identity?.id) {
      options?.onError?.(new Error("Not authenticated"));
      return;
    }

    try {
      // In production, this would be an RPC call like:
      // supabase.rpc('claim_node', { code: params.code, name: params.name })
      //
      // For now, we simulate by creating a placeholder - the actual claim
      // logic would be handled server-side
      const result = await mutateAsync({
        resource: "nodes",
        values: {
          user_id: identity.id,
          name: params.name || `Node-${params.code}`,
          status: "pending",
          max_parallel: 4,
        },
      });

      invalidate({
        resource: "nodes",
        invalidates: ["list"],
      });

      options?.onSuccess?.(result.data);
    } catch (error) {
      options?.onError?.(error);
    }
  };

  return {
    mutate: claimNode,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
