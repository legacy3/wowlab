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
import type { UserNode } from "@/hooks/nodes/types";
import { NodeStatusBadge } from "./node-status-badge";
import { formatRelativeToNow } from "@/lib/format";

interface NodeCardProps {
  node: UserNode;
}

export function NodeCard({ node }: NodeCardProps) {
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
            <dd className="font-medium">{node.maxParallel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Last seen:</dt>
            <dd className="font-medium">
              {node.lastSeenAt ? formatRelativeToNow(node.lastSeenAt) : "Never"}
            </dd>
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
