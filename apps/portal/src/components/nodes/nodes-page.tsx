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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Server } from "lucide-react";
import Link from "next/link";
import type { UserIdentity } from "@/lib/supabase/types";
import { NodesList, NodesListSkeleton } from "./nodes-list";
import { AvailableNodesList } from "./available-nodes-list";
import { useMyNodes, useAvailableNodes } from "@/hooks/nodes";

function NodesContent({ identity }: { identity: { id: string } }) {
  const { data: myNodes, isLoading: nodesLoading } = useMyNodes();
  const { data: availableNodes, isLoading: availableLoading } =
    useAvailableNodes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Compute Nodes</h2>
          <p className="text-muted-foreground">
            Manage your simulation nodes and access shared nodes
          </p>
        </div>
        <Button asChild>
          <Link href="/account/nodes/claim">
            <Plus className="mr-2 h-4 w-4" />
            Claim Node
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="my-nodes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-nodes">My Nodes</TabsTrigger>
          <TabsTrigger value="available">Available Nodes</TabsTrigger>
        </TabsList>

        <TabsContent value="my-nodes" className="space-y-4">
          {nodesLoading ? (
            <NodesListSkeleton />
          ) : myNodes && myNodes.length > 0 ? (
            <NodesList nodes={myNodes} />
          ) : (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 rounded-full bg-muted p-3">
                  <Server className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle>No nodes yet</CardTitle>
                <CardDescription>
                  Download the WowLab Node application and claim it to start
                  contributing compute power.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild>
                  <Link href="/account/nodes/claim">
                    <Plus className="mr-2 h-4 w-4" />
                    Claim Your First Node
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {availableLoading ? (
            <NodesListSkeleton />
          ) : availableNodes && availableNodes.length > 0 ? (
            <AvailableNodesList nodes={availableNodes} />
          ) : (
            <Card>
              <CardHeader className="text-center">
                <CardTitle>No shared nodes available</CardTitle>
                <CardDescription>
                  Nodes shared by friends, guilds, or marked as public will
                  appear here.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function NodesPage() {
  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } =
    useGetIdentity<UserIdentity>();

  if (authLoading || identityLoading) {
    return <NodesPageSkeleton />;
  }

  if (!auth?.authenticated || !identity) {
    redirect("/auth/sign-in");
  }

  return <NodesContent identity={identity} />;
}

export function NodesPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <NodesListSkeleton />
      </div>
    </div>
  );
}
