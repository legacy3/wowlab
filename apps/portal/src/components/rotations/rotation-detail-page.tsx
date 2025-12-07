"use client";

import { useList, useOne } from "@refinedev/core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/account/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  Clock,
  Code,
  Copy,
  Download,
  Edit,
  GitFork,
  Share2,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Rotation, Profile, SimResult } from "@/lib/supabase/types";

interface RotationDetailProps {
  namespace: string;
  slug: string;
}

function RotationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RotationDetail({ namespace, slug }: RotationDetailProps) {
  const {
    result: rotationResult,
    query: { isLoading: rotationLoading, isError: rotationError },
  } = useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "namespace", operator: "eq", value: namespace },
      { field: "slug", operator: "eq", value: slug },
      { field: "deletedAt", operator: "null", value: true },
    ],
    pagination: { pageSize: 1 },
  });

  const rotation = rotationResult?.data?.[0];

  const {
    result: profileResult,
    query: { isLoading: profileLoading },
  } = useOne<Profile>({
    resource: "user_profiles",
    id: rotation?.userId ?? "",
    queryOptions: {
      enabled: !!rotation?.userId,
    },
  });

  const author = profileResult;

  const { result: simResultsResult } = useList<SimResult>({
    resource: "rotation_sim_results",
    filters: [{ field: "rotationId", operator: "eq", value: rotation?.id }],
    sorters: [{ field: "createdAt", order: "desc" }],
    queryOptions: {
      enabled: !!rotation?.id,
    },
  });

  const simResults = simResultsResult?.data ?? [];

  const { result: parent } = useOne<Rotation>({
    resource: "rotations",
    id: rotation?.parentId ?? "",
    queryOptions: {
      enabled: !!rotation?.parentId,
    },
  });

  const { result: forksResult } = useList<Rotation>({
    resource: "rotations",
    filters: [
      { field: "parentId", operator: "eq", value: rotation?.id },
      { field: "deletedAt", operator: "null", value: true },
    ],
    sorters: [{ field: "createdAt", order: "desc" }],
    queryOptions: {
      enabled: !!rotation?.id,
    },
  });

  const forks = forksResult?.data ?? [];

  if (rotationLoading || profileLoading) {
    return <RotationDetailSkeleton />;
  }

  if (rotationError || !rotation) {
    return <div>Rotation not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {author && <UserAvatar user={author} className="h-14 w-14" />}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">{rotation.name}</h2>
              {rotation.status === "approved" && (
                <Badge variant="outline" className="border-green-500/50">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Approved
                </Badge>
              )}
              {rotation.status === "pending" && (
                <Badge variant="outline" className="border-yellow-500/50">
                  Pending
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              by @{namespace} • {rotation.spec} • {rotation.patchRange}
            </p>
            {rotation.description && (
              <p className="text-sm text-foreground mt-2">
                {rotation.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button variant="default" size="sm">
            <GitFork className="mr-2 h-4 w-4" />
            Fork
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Copy Script
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Rotation Script */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rotation Script</CardTitle>
              <CardDescription>
                Priority list and rotation logic
              </CardDescription>
            </div>
            <Badge variant="secondary">
              <Code className="mr-1 h-3 w-3" />v{rotation.version ?? 1}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-foreground whitespace-pre-wrap break-words">
              {rotation.script}
            </pre>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Last updated{" "}
              {rotation.updatedAt
                ? formatDistanceToNow(new Date(rotation.updatedAt), {
                    addSuffix: true,
                  })
                : "unknown"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Simulation Results */}
        {simResults && simResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Data</CardTitle>
              <CardDescription>
                Simulation results across scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {simResults.slice(0, 5).map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">
                      {result.scenario.replace("-", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {result.gearSet.replace("-", " ")} • {result.patch}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {result.meanDps.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">DPS</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Rotation information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Class / Spec</p>
              <p className="text-sm text-muted-foreground">
                {rotation.class} - {rotation.spec}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">Patch Range</p>
              <p className="text-sm text-muted-foreground">
                {rotation.patchRange}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium">Visibility</p>
              <p className="text-sm text-muted-foreground capitalize">
                {rotation.visibility}
              </p>
            </div>
            {rotation.publishedAt && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(rotation.publishedAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Version History */}
      {(parent || (forks && forks.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>Forks and parent rotations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {parent && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Forked from
                </p>
                <a
                  href={`/rotations/${parent.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{parent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{parent.namespace} • v{parent.version ?? 1}
                    </p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            )}

            {forks && forks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Forks ({forks.length})
                </p>
                <div className="space-y-2">
                  {forks.slice(0, 5).map((fork) => (
                    <a
                      key={fork.id}
                      href={`/rotations/${fork.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium">{fork.name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{fork.namespace} • v{fork.version ?? 1}
                        </p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
