"use client";

import { memo, useState } from "react";
import { NodeResizer } from "@xyflow/react";
import { ChevronDown, ChevronRight, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FrameNodeData } from "../types";

interface FrameNodeProps {
  data: FrameNodeData;
  selected?: boolean;
}

export const FrameNode = memo(function FrameNode({
  data,
  selected,
}: FrameNodeProps) {
  const { label, color, collapsed, width, height } = data;
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  return (
    <>
      {/* Resizer - only when selected and not collapsed */}
      {selected && !isCollapsed && (
        <NodeResizer
          minWidth={150}
          minHeight={100}
          lineClassName="!border-transparent"
          handleClassName="!w-2 !h-2 !rounded-sm !border-2"
          handleStyle={{ borderColor: color, backgroundColor: "white" }}
        />
      )}

      <div
        className={cn(
          "rounded-lg transition-all duration-150",
          selected && "ring-1 ring-offset-2 ring-offset-background",
          isCollapsed ? "cursor-pointer" : "",
        )}
        style={{
          width: isCollapsed ? "auto" : width,
          height: isCollapsed ? "auto" : height,
          minWidth: isCollapsed ? 120 : undefined,
          backgroundColor: `${color}08`,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: `${color}60`,
          ["--tw-ring-color" as string]: color,
        }}
        onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
      >
        {/* Header bar */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-t-md cursor-move",
            isCollapsed && "rounded-b-md",
          )}
          style={{ backgroundColor: `${color}20` }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-0.5 rounded hover:bg-black/10 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3" style={{ color }} />
            ) : (
              <ChevronDown className="w-3 h-3" style={{ color }} />
            )}
          </button>

          <span
            className="text-[10px] font-semibold flex-1 truncate"
            style={{ color }}
          >
            {label}
          </span>

          <GripHorizontal className="w-3 h-3 opacity-40" style={{ color }} />
        </div>

        {/* Content area - only visible when expanded */}
        {!isCollapsed && (
          <div className="flex-1 p-1">
            {/* Nodes placed inside will be children in the flow */}
          </div>
        )}
      </div>
    </>
  );
});
