"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Zap, Crosshair, User, Focus, Dog } from "lucide-react";
import { NodeShell, NodeHeader, NodeFooter } from "./node-shell";
import { NODE_COLORS } from "../constants";
import { cn } from "@/lib/utils";
import type { SpellNodeData } from "../types";

const TARGET_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  current_target: { label: "Target", icon: Crosshair, color: "#ef4444" },
  self: { label: "Self", icon: User, color: "#22c55e" },
  focus: { label: "Focus", icon: Focus, color: "#f59e0b" },
  pet: { label: "Pet", icon: Dog, color: "#8b5cf6" },
};

interface SpellNodeProps {
  data: SpellNodeData;
  selected?: boolean;
}

export const SpellNode = memo(function SpellNode({
  data,
  selected,
}: SpellNodeProps) {
  const {
    spellName,
    color = NODE_COLORS.spell,
    target,
    enabled,
    label,
    minimized,
  } = data;

  const targetConfig = TARGET_CONFIG[target] || TARGET_CONFIG.current_target;
  const TargetIcon = targetConfig.icon;

  // Minimized view - compact icon-only
  if (minimized) {
    return (
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg border-2 bg-card shadow-md transition-all",
          "hover:scale-105",
          selected && "ring-2 ring-offset-2 ring-offset-background scale-105",
          !enabled && "opacity-40 grayscale"
        )}
        style={{
          borderColor: color,
          ["--tw-ring-color" as string]: `${color}60`,
        }}
        title={spellName}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2 !h-2 !border-2 !border-card !-top-[5px] !rounded-full !bg-muted-foreground/60"
        />
        <Zap className="w-4 h-4" style={{ color }} />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-2 !h-2 !border-2 !border-card !-bottom-[5px] !rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    );
  }

  return (
    <NodeShell
      selected={selected}
      color={color}
      minWidth={110}
      maxWidth={160}
      className={!enabled ? "opacity-40 grayscale" : undefined}
    >
      <NodeHeader
        icon={<Zap className="w-2.5 h-2.5" />}
        title={spellName}
        subtitle={label !== spellName ? label : undefined}
        color={color}
        trailing={
          !enabled && (
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
          )
        }
      />
      <NodeFooter>
        <div
          className="flex items-center gap-1 text-[8px]"
          style={{ color: targetConfig.color }}
        >
          <TargetIcon className="w-2.5 h-2.5" />
          <span className="font-medium">{targetConfig.label}</span>
        </div>
      </NodeFooter>
    </NodeShell>
  );
});
