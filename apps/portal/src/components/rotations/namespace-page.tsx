"use client";

import { useList } from "@refinedev/core";
import { UserAvatar } from "@/components/account/user-avatar";
import { UserHandle } from "@/components/ui/user-handle";
import { RotationsList } from "@/components/rotations/rotations-list";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Code2, Server, FileCode } from "lucide-react";
import type { Rotation, Profile, UserNode } from "@/lib/supabase/types";

interface NamespacePageProps {
  namespace: string;
}

export function NamespacePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NamespacePage({ namespace }: NamespacePageProps) {
  const {
    result: profileResult,
    query: { isLoading: profileLoading },
  } = useList<Profile>({
    resource: "user_profiles",
    filters: [{ field: "handle", operator: "eq", value: namespace }],
    pagination: { pageSize: 1 },
  });

  const user = profileResult?.data?.[0];

  const {
    result: rotationsResult,
    query: { isLoading: rotationsLoading },
  } = useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "namespace", operator: "eq", value: namespace },
      { field: "deletedAt", operator: "null", value: true },
      { field: "isPublic", operator: "eq", value: true },
    ],
    sorters: [{ field: "updatedAt", order: "desc" }],
    queryOptions: {
      enabled: !!namespace,
    },
  });

  const {
    result: nodesResult,
    query: { isLoading: nodesLoading },
  } = useList<UserNode>({
    resource: "user_nodes",
    filters: [
      { field: "userId", operator: "eq", value: user?.id },
      { field: "status", operator: "eq", value: "online" },
    ],
    queryOptions: {
      enabled: !!user?.id,
    },
  });

  const rotations = rotationsResult?.data ?? [];
  const publicNodes = nodesResult?.data ?? [];

  if (profileLoading || rotationsLoading || nodesLoading) {
    return <NamespacePageSkeleton />;
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="font-medium">User not found</p>
          <p className="text-sm text-muted-foreground">
            @{namespace} doesn't exist
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar
            user={user}
            className="h-14 w-14"
            fallbackClassName="text-lg"
          />
          <UserHandle
            handle={user.handle ?? "user"}
            linkTo={false}
            size="xl"
            className="font-semibold"
          />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <span className="tabular-nums font-medium">{rotations.length}</span>
            <span className="text-muted-foreground">
              {rotations.length === 1 ? "rotation" : "rotations"}
            </span>
          </div>
          {publicNodes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="tabular-nums font-medium">
                {publicNodes.length}
              </span>
              <span className="text-muted-foreground">
                {publicNodes.length === 1 ? "node" : "nodes"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Rotations */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Public Rotations</h2>

        {rotations.length > 0 ? (
          <RotationsList rotations={rotations} groupByClass={false} />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <FileCode className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No public rotations</p>
              <p className="text-sm text-muted-foreground">
                @{namespace} hasn't published any rotations yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
