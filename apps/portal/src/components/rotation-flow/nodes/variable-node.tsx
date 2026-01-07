"use client";

import { memo } from "react";
import { Variable, Hash, ToggleLeft, Type } from "lucide-react";
import { NodeShell, NodeHeader, NodeBody, NodeBadge } from "./node-shell";
import { NODE_COLORS } from "../constants";
import type { VariableNodeData } from "../types";

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  number: { icon: Hash, color: "#3b82f6", label: "num" },
  boolean: { icon: ToggleLeft, color: "#22c55e", label: "bool" },
  string: { icon: Type, color: "#f59e0b", label: "str" },
};

interface VariableNodeProps {
  data: VariableNodeData;
  selected?: boolean;
}

export const VariableNode = memo(function VariableNode({
  data,
  selected,
}: VariableNodeProps) {
  const { variableName, variableType, expression } = data;

  const typeConfig = TYPE_CONFIG[variableType] || TYPE_CONFIG.number;
  const TypeIcon = typeConfig.icon;

  return (
    <NodeShell
      selected={selected}
      color={NODE_COLORS.variable}
      minWidth={120}
      maxWidth={180}
    >
      <NodeHeader
        icon={<Variable className="w-2.5 h-2.5" />}
        title={variableName}
        color={NODE_COLORS.variable}
        trailing={
          <NodeBadge color={typeConfig.color} variant="outline">
            <TypeIcon className="w-2 h-2 mr-0.5" />
            {typeConfig.label}
          </NodeBadge>
        }
      />
      {expression && (
        <NodeBody padding="sm">
          <div className="font-mono text-[8px] text-muted-foreground bg-muted/50 rounded px-1.5 py-1 truncate">
            <span className="text-purple-500 dark:text-purple-400">=</span>{" "}
            <span className="text-foreground/80">{expression}</span>
          </div>
        </NodeBody>
      )}
    </NodeShell>
  );
});
