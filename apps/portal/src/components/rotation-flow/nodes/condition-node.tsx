"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { NodeShell, NodeHeader, NodeBody } from "./node-shell";
import { NODE_COLORS, OPERATOR_LABELS } from "../constants";
import { cn } from "@/lib/utils";
import type { ConditionNodeData } from "../types";

interface ConditionNodeProps {
  data: ConditionNodeData;
  selected?: boolean;
}

export const ConditionNode = memo(function ConditionNode({
  data,
  selected,
}: ConditionNodeProps) {
  const { conditionType, subject, operator, value, label, minimized } = data;
  const isLogical = conditionType !== "if";

  // Format the condition expression
  const formatSubject = (s: string) => {
    const parts = s.split(".");
    return parts.length > 1 ? parts.slice(-2).join(".") : s;
  };

  // Minimized view - diamond shape for conditions
  if (minimized) {
    return (
      <div
        className={cn(
          "relative w-8 h-8 transition-all",
          "hover:scale-105",
          selected && "scale-105",
        )}
        title={label || "Condition"}
      >
        {/* Diamond shape */}
        <div
          className={cn(
            "absolute inset-0 rotate-45 rounded-sm border-2 bg-card shadow-md",
            selected && "ring-2 ring-offset-2 ring-offset-background",
          )}
          style={{
            borderColor: NODE_COLORS.condition,
            ["--tw-ring-color" as string]: `${NODE_COLORS.condition}60`,
          }}
        />
        {/* Icon centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <GitBranch
            className="w-3.5 h-3.5"
            style={{ color: NODE_COLORS.condition }}
          />
        </div>
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2 !h-2 !border-2 !border-card !-top-[5px] !rounded-full !bg-muted-foreground/60"
        />
        {/* Output handles - left and right for diamond */}
        <Handle
          type="source"
          id="true"
          position={Position.Left}
          className="!w-2 !h-2 !border-2 !border-card !-left-[5px] !top-1/2 !-translate-y-1/2 !rounded-full"
          style={{ backgroundColor: "#22c55e" }}
        />
        <Handle
          type="source"
          id="false"
          position={Position.Right}
          className="!w-2 !h-2 !border-2 !border-card !-right-[5px] !top-1/2 !-translate-y-1/2 !rounded-full"
          style={{ backgroundColor: "#ef4444" }}
        />
      </div>
    );
  }

  return (
    <NodeShell
      selected={selected}
      color={NODE_COLORS.condition}
      minWidth={100}
      maxWidth={180}
      outputHandles={[
        { id: "true", color: "#22c55e", label: "Yes" },
        { id: "false", color: "#ef4444", label: "No" },
      ]}
    >
      <NodeHeader
        icon={<GitBranch className="w-2.5 h-2.5" />}
        title={isLogical ? conditionType.toUpperCase() : "IF"}
        subtitle={label && label !== "If" ? label : undefined}
        color={NODE_COLORS.condition}
        compact
      />

      {!isLogical && subject && (
        <NodeBody padding="sm">
          <div className="flex flex-col gap-0.5">
            {/* Subject */}
            <div className="font-mono text-[8px] text-blue-500 dark:text-blue-400 truncate">
              {formatSubject(subject)}
            </div>

            {/* Operator and Value */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] font-bold text-muted-foreground">
                {operator && OPERATOR_LABELS[operator]}
              </span>
              <span className="font-mono text-[9px] text-amber-500 dark:text-amber-400 font-semibold">
                {String(value)}
              </span>
            </div>
          </div>
        </NodeBody>
      )}

      {isLogical && (
        <NodeBody padding="sm">
          <div className="text-[8px] text-muted-foreground text-center">
            {conditionType === "and" && "All conditions must be true"}
            {conditionType === "or" && "Any condition can be true"}
            {conditionType === "not" && "Inverts the result"}
          </div>
        </NodeBody>
      )}
    </NodeShell>
  );
});
