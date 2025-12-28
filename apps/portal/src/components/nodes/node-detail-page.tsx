"use client";

import { redirect } from "next/navigation";
import { useGetIdentity, useIsAuthenticated } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import type { UserIdentity } from "@/lib/supabase/types";
import { useNode, useDeleteNode } from "@/hooks/nodes";
import { NodeStatusBadge } from "./node-status-badge";
import { NodeAccessSettings } from "./node-access-settings";
import { formatRelativeToNow, formatDate } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NodeDetailPageProps {
  nodeId: string;
}

export function NodeDetailPage({ nodeId }: NodeDetailPageProps) {
  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } =
    useGetIdentity<UserIdentity>();

  const { data: node, isLoading: nodeLoading } = useNode(nodeId);
  const { mutate: deleteNode, isPending: isDeleting } = useDeleteNode();

  if (authLoading || identityLoading || nodeLoading) {
    return <NodeDetailSkeleton />;
  }

  if (!auth?.authenticated || !identity) {
    redirect("/auth/sign-in");
  }

  if (!node) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account/nodes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Nodes
          </Link>
        </Button>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Node not found</CardTitle>
            <CardDescription>
              This node may have been deleted or you don&apos;t have access to
              it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleDelete = () => {
    deleteNode(nodeId);
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/account/nodes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Nodes
        </Link>
      </Button>

      {/* Node Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NodeStatusBadge status={node.status} />
              <div>
                <CardTitle>{node.name}</CardTitle>
                <CardDescription className="mt-1">
                  Last seen:{" "}
                  {node.lastSeenAt
                    ? formatRelativeToNow(node.lastSeenAt)
                    : "Never"}
                </CardDescription>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete node?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the node &quot;{node.name}
                    &quot; and all its associated data. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Status
              </dt>
              <dd className="mt-1 capitalize">{node.status}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Max Parallel
              </dt>
              <dd className="mt-1">{node.maxParallel} workers</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Version
              </dt>
              <dd className="mt-1">{node.version || "Unknown"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created
              </dt>
              <dd className="mt-1">
                {node.createdAt ? formatDate(node.createdAt, "PP") : "Unknown"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Access Settings */}
      <NodeAccessSettings nodeId={nodeId} />
    </div>
  );
}

export function NodeDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-32" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
