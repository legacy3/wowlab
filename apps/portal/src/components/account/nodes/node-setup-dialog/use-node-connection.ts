"use client";

import { useBoolean, usePrevious, useUpdateEffect } from "ahooks";

import { useNodes } from "@/lib/refine/services/nodes";

export function useNodeConnection(open: boolean) {
  const { data: nodesData } = useNodes();
  const [connected, { setFalse: reset, setTrue }] = useBoolean(false);

  const currentCount = nodesData.myNodes.length;
  const prevCount = usePrevious(currentCount);

  // Reset when modal opens/closes
  useUpdateEffect(reset, [open]);

  // Detect new node connection while modal is open
  useUpdateEffect(() => {
    if (open && prevCount !== undefined && currentCount > prevCount) {
      setTrue();
    }
  }, [open, currentCount, prevCount, setTrue]);

  return connected;
}
