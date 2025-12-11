"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface TreeNode {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
  children?: TreeNode[];
}

interface TreeProps {
  nodes: TreeNode[];
  renderLeaf?: (node: TreeNode, depth: number) => ReactNode;
  defaultOpen?: boolean;
  showChevron?: boolean;
  className?: string;
}

interface TreeBranchProps {
  node: TreeNode;
  depth: number;
  renderLeaf?: (node: TreeNode, depth: number) => ReactNode;
  defaultOpen: boolean;
  showChevron: boolean;
}

function TreeBranch({
  node,
  depth,
  renderLeaf,
  defaultOpen,
  showChevron,
}: TreeBranchProps) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = node.children && node.children.length > 0;

  if (!hasChildren) {
    if (renderLeaf) {
      return <li>{renderLeaf(node, depth)}</li>;
    }

    return (
      <li className="flex w-full items-center justify-between gap-2 py-1.5 px-2 rounded-md">
        {node.label}
        {node.badge}
      </li>
    );
  }

  return (
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
          {showChevron && (
            <ChevronRight
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                open && "rotate-90",
              )}
            />
          )}
          <span className="flex-1 flex items-center gap-2">{node.label}</span>
          {node.badge}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <ul className="space-y-0.5 mt-0.5 ml-6">
            {node.children!.map((child) => (
              <TreeBranch
                key={child.id}
                node={child}
                depth={depth + 1}
                renderLeaf={renderLeaf}
                defaultOpen={defaultOpen}
                showChevron={showChevron}
              />
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

export function Tree({
  nodes,
  renderLeaf,
  defaultOpen = false,
  showChevron = true,
  className,
}: TreeProps) {
  return (
    <ul className={cn("space-y-0.5", className)}>
      {nodes.map((node) => (
        <TreeBranch
          key={node.id}
          node={node}
          depth={0}
          renderLeaf={renderLeaf}
          defaultOpen={defaultOpen}
          showChevron={showChevron}
        />
      ))}
    </ul>
  );
}
