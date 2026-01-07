"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { NODE_COLORS } from "../constants";
import type { RerouteNodeData } from "../types";

interface RerouteNodeProps {
  data?: RerouteNodeData;
  selected?: boolean;
}

export const RerouteNode = memo(function RerouteNode({
  selected,
}: RerouteNodeProps) {
  return (
    <div
      className={cn(
        "w-3 h-3 rounded-full border-2 bg-card transition-all duration-150",
        "hover:scale-125 hover:shadow-lg",
        selected && "ring-2 ring-offset-1 ring-offset-background scale-125"
      )}
      style={{
        borderColor: NODE_COLORS.reroute,
        ["--tw-ring-color" as string]: NODE_COLORS.reroute,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-full !h-full !rounded-full !border-0 !bg-transparent !top-0 !left-0 !transform-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-full !h-full !rounded-full !border-0 !bg-transparent !top-0 !left-0 !transform-none"
      />
    </div>
  );
});
