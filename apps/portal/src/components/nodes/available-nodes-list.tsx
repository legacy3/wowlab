"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UserNodeWithAccess } from "@/hooks/nodes/types";
import { NodeStatusBadge } from "./node-status-badge";
import { Globe, User, Users } from "lucide-react";

interface AvailableNodesListProps {
  nodes: UserNodeWithAccess[];
}

export function AvailableNodesList({ nodes }: AvailableNodesListProps) {
  const getAccessIcon = (accessType?: string) => {
    switch (accessType) {
      case "public":
        return <Globe className="h-3 w-3" />;

      case "guild":
        return <Users className="h-3 w-3" />;

      case "friends":
      case "user":
        return <User className="h-3 w-3" />;

      default:
        return null;
    }
  };

  const getAccessLabel = (accessType?: string) => {
    switch (accessType) {
      case "public":
        return "Public";

      case "guild":
        return "Guild";

      case "friends":
        return "Friend";

      case "user":
        return "Shared";

      default:
        return "Shared";
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nodes.map((node) => (
        <Card key={node.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NodeStatusBadge status={node.status} />
                <CardTitle className="text-lg">{node.name}</CardTitle>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                {getAccessIcon(node.accessType)}
                {getAccessLabel(node.accessType)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <dl className="grid gap-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Max parallel:</dt>
                <dd className="font-medium">{node.maxParallel}</dd>
              </div>
              {node.ownerName && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Owner:</dt>
                  <dd className="font-medium">{node.ownerName}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
