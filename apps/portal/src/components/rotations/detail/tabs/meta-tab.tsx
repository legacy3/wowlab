"use client";

import { memo } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { GitFork, Calendar, BarChart3, Users, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Rotation } from "@/lib/supabase/types";

interface MetaTabProps {
  rotation: Rotation;
  parent?: Rotation;
  forks: Rotation[];
}

export const MetaTab = memo(function MetaTab({
  rotation,
  parent,
  forks,
}: MetaTabProps) {
  return (
    <div className="space-y-6">
      {/* Timestamps */}
      <div className="flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Created{" "}
            {formatDistanceToNow(new Date(rotation.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Updated{" "}
            {formatDistanceToNow(new Date(rotation.updatedAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      {/* Mock stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <BarChart3 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-2xl font-bold">—</p>
          <p className="text-xs text-muted-foreground">Simulations</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-2xl font-bold">{forks.length}</p>
          <p className="text-xs text-muted-foreground">Forks</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <Star className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-2xl font-bold">—</p>
          <p className="text-xs text-muted-foreground">Stars</p>
        </div>
      </div>

      {/* Forked from */}
      {parent && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <GitFork className="h-4 w-4" />
            Forked from
          </h3>
          <Link
            href={`/rotations/${parent.id}`}
            className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="font-medium">{parent.name}</p>
              <p className="text-sm text-muted-foreground">
                {parent.class} • {parent.spec}
              </p>
            </div>
            <Badge variant="outline">View</Badge>
          </Link>
        </div>
      )}

      {/* Forks */}
      {forks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <GitFork className="h-4 w-4" />
            Forks ({forks.length})
          </h3>
          <div className="space-y-2">
            {forks.map((fork) => (
              <Link
                key={fork.id}
                href={`/rotations/${fork.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{fork.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {fork.class} • {fork.spec}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(fork.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
