"use client";

import { useUpdate, useGetIdentity, useInvalidate } from "@refinedev/core";
import type { UserNode } from "./types";
import type { UserIdentity } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

interface ClaimNodeParams {
  code: string;
  name?: string;
}

/**
 * Hook to claim a node with a claim code
 */
export function useClaimNode() {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const invalidate = useInvalidate();
  const { mutateAsync, mutation } = useUpdate<UserNode>();

  const claimNode = async (
    params: ClaimNodeParams,
    options?: {
      onSuccess?: (node: UserNode) => void;
      onError?: (error: unknown) => void;
    },
  ) => {
    if (!identity?.id) {
      options?.onError?.(new Error("Not authenticated"));
      return;
    }

    try {
      const supabase = createClient();

      // Find the pending node by claim code
      const { data: pendingNode, error: findError } = await supabase
        .from("user_nodes")
        .select("id")
        .eq("claimCode", params.code.toUpperCase())
        .eq("status", "pending")
        .is("userId", null)
        .single();

      if (findError || !pendingNode) {
        throw new Error("Invalid or expired claim code");
      }

      // Claim the node by setting userId and clearing claimCode
      const result = await mutateAsync({
        resource: "user_nodes",
        id: pendingNode.id,
        values: {
          userId: identity.id,
          name: params.name || `Node-${params.code}`,
          claimCode: null,
          status: "online",
        },
      });

      invalidate({
        resource: "user_nodes",
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
