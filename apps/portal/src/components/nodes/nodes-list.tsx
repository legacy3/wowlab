"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { Node } from "@/hooks/nodes/types";
import { NodeCard } from "./node-card";

interface NodesListProps {
  nodes: Node[];
}

export function NodesList({ nodes }: NodesListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => (
        <NodeCard key={node.id} node={node} />
      ))}
    </div>
  );
}

export function NodesListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
