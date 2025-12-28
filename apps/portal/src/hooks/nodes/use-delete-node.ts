"use client";

import { useDelete, useInvalidate } from "@refinedev/core";
import { useRouter } from "next/navigation";

/**
 * Hook to delete a node
 */
export function useDeleteNode() {
  const router = useRouter();
  const invalidate = useInvalidate();

  const { mutateAsync, mutation } = useDelete();

  const deleteNode = async (nodeId: string) => {
    try {
      await mutateAsync({ resource: "user_nodes", id: nodeId });
      invalidate({
        resource: "user_nodes",
        invalidates: ["list"],
      });
      router.push("/account/nodes");
    } catch (error) {
      console.error("Failed to delete node:", error);
    }
  };

  return {
    mutate: deleteNode,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
