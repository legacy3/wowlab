"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings } from "lucide-react";
import Link from "next/link";
import type { Node } from "@/hooks/nodes/types";
import { NodeStatusBadge } from "./node-status-badge";

interface NodeCardProps {
  node: Node;
}

export function NodeCard({ node }: NodeCardProps) {
  const formatLastSeen = (dateString: string | null) => {
    if (!dateString) return "Never";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <NodeStatusBadge status={node.status} />
          <CardTitle className="text-lg">{node.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <dl className="grid gap-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Max parallel:</dt>
            <dd className="font-medium">{node.max_parallel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Last seen:</dt>
            <dd className="font-medium">{formatLastSeen(node.last_seen_at)}</dd>
          </div>
          {node.version && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Version:</dt>
              <dd className="font-mono text-xs">{node.version}</dd>
            </div>
          )}
        </dl>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/account/nodes/${node.id}`}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
