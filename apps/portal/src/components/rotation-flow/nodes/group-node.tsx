"use client";

import { memo } from "react";
import { FolderOpen, Layers } from "lucide-react";
import { NodeShell, NodeHeader, NodeBody, NodeBadge } from "./node-shell";
import { NODE_COLORS } from "../constants";
import type { GroupNodeData } from "../types";

interface GroupNodeProps {
  data: GroupNodeData;
  selected?: boolean;
}

export const GroupNode = memo(function GroupNode({
  data,
  selected,
}: GroupNodeProps) {
  const { groupName, description, collapsed } = data;

  return (
    <NodeShell
      selected={selected}
      color={NODE_COLORS.group}
      minWidth={110}
      maxWidth={180}
      variant="wide"
    >
      <NodeHeader
        icon={<FolderOpen className="w-2.5 h-2.5" />}
        title={groupName}
        color={NODE_COLORS.group}
        trailing={
          <NodeBadge color={NODE_COLORS.group} variant="outline">
            <Layers className="w-2 h-2 mr-0.5" />
            sub
          </NodeBadge>
        }
      />
      {description && (
        <NodeBody padding="sm">
          <div className="text-[8px] text-muted-foreground leading-relaxed">
            {description}
          </div>
        </NodeBody>
      )}
    </NodeShell>
  );
});
