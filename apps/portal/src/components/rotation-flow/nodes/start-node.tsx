"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_COLORS } from "../constants";
import type { StartNodeData } from "../types";

interface StartNodeProps {
  data: StartNodeData;
  selected?: boolean;
}

export const StartNode = memo(function StartNode({
  data,
  selected,
}: StartNodeProps) {
  return (
    <div
      className={cn(
        "relative rounded-full border-2 bg-card shadow-lg transition-all duration-150",
        "px-3 py-1.5",
        selected
          ? "ring-2 ring-offset-2 ring-offset-background scale-105"
          : "hover:scale-[1.02] hover:shadow-xl",
      )}
      style={{
        borderColor: NODE_COLORS.start,
        ["--tw-ring-color" as string]: `${NODE_COLORS.start}50`,
      }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-sm"
        style={{ backgroundColor: NODE_COLORS.start }}
      />

      <div className="relative flex items-center gap-1.5">
        <div
          className="flex items-center justify-center w-5 h-5 rounded-full text-white shadow-md"
          style={{ backgroundColor: NODE_COLORS.start }}
        >
          <Play className="w-2.5 h-2.5 ml-0.5" />
        </div>
        <span className="text-[10px] font-bold tracking-wide text-emerald-600 dark:text-emerald-400">
          {data.label}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          "!w-2.5 !h-2.5 !border-[2.5px] !border-card !-bottom-[6px] !rounded-full transition-all",
          "hover:!scale-125",
        )}
        style={{ backgroundColor: NODE_COLORS.start }}
      />
    </div>
  );
});
