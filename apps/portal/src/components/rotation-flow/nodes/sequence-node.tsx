"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ListOrdered, GripVertical, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_COLORS } from "../constants";
import type { SequenceNodeData } from "../types";

interface SequenceNodeProps {
  data: SequenceNodeData;
  selected?: boolean;
}

export const SequenceNode = memo(function SequenceNode({
  data,
  selected,
}: SequenceNodeProps) {
  const { label, items, minimized } = data;

  // Minimized view - just icon
  if (minimized) {
    return (
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg border-2 bg-card shadow-md transition-all",
          selected && "ring-2 ring-offset-2 ring-offset-background"
        )}
        style={{
          borderColor: NODE_COLORS.sequence,
          ["--tw-ring-color" as string]: `${NODE_COLORS.sequence}60`,
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2 !h-2 !border-2 !border-card !-top-[5px] !rounded-full !bg-muted-foreground/60"
        />
        <ListOrdered className="w-4 h-4" style={{ color: NODE_COLORS.sequence }} />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-2 !h-2 !border-2 !border-card !-bottom-[5px] !rounded-full"
          style={{ backgroundColor: NODE_COLORS.sequence }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-card shadow-md transition-all duration-150 min-w-[140px] max-w-[200px]",
        selected && "shadow-xl ring-2 ring-offset-2 ring-offset-background"
      )}
      style={{
        borderColor: selected ? NODE_COLORS.sequence : `${NODE_COLORS.sequence}40`,
        ["--tw-ring-color" as string]: `${NODE_COLORS.sequence}60`,
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-2 right-2 h-0.5 rounded-full"
        style={{ backgroundColor: NODE_COLORS.sequence }}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !border-[2.5px] !border-card !-top-[6px] !rounded-full !bg-muted-foreground/60"
      />

      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border/20"
        style={{ backgroundColor: `${NODE_COLORS.sequence}10` }}
      >
        <div
          className="flex items-center justify-center w-5 h-5 rounded shrink-0 text-white shadow-sm"
          style={{ backgroundColor: NODE_COLORS.sequence }}
        >
          <ListOrdered className="w-2.5 h-2.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold leading-tight truncate">
            {label}
          </div>
          <div className="text-[7px] text-muted-foreground">
            {items.length} {items.length === 1 ? "spell" : "spells"}
          </div>
        </div>
      </div>

      {/* Priority list */}
      <div className="px-1 py-1 space-y-0.5 max-h-[200px] overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-[9px] text-muted-foreground text-center py-2 px-1">
            Drag spells here to build priority list
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.spellId}-${index}`}
              className={cn(
                "flex items-center gap-1 px-1 py-0.5 rounded text-[9px]",
                item.enabled ? "bg-muted/30" : "bg-muted/10 opacity-50"
              )}
            >
              <GripVertical className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0 cursor-grab" />
              <span className="text-muted-foreground font-mono w-3 shrink-0">
                {index + 1}.
              </span>
              <div
                className="w-3 h-3 rounded-sm flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.color || NODE_COLORS.spell }}
              >
                {item.icon ? (
                  <span className="text-[6px] font-bold text-white">{item.icon}</span>
                ) : (
                  <Zap className="w-2 h-2 text-white" />
                )}
              </div>
              <span className="flex-1 truncate">{item.spellName}</span>
            </div>
          ))
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !border-[2.5px] !border-card !-bottom-[6px] !rounded-full"
        style={{ backgroundColor: NODE_COLORS.sequence }}
      />
    </div>
  );
});
