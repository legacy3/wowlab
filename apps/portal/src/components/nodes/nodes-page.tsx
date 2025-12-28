"use client";

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Server, Settings, Monitor } from "lucide-react";
import Link from "next/link";
import type { UserIdentity } from "@/lib/supabase/types";
import { useNodeManager, type NodeListItem } from "@/providers";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { NodeStatusBadge } from "./node-status-badge";
import { NodeSettingsSheet } from "./node-settings-sheet";
import { formatRelativeToNow, formatInt } from "@/lib/format";

function NodesTable({
  nodes,
  onSettings,
}: {
  nodes: NodeListItem[];
  onSettings: (node: NodeListItem) => void;
}) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[100px]">Workers</TableHead>
            <TableHead className="w-[140px]">Last Seen</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => (
            <TableRow key={node.id}>
              <TableCell>
                <NodeStatusBadge status={node.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{node.name}</span>
                  {node.isLocal && (
                    <Badge variant="secondary" className="text-xs">
                      <Monitor className="mr-1 h-3 w-3" />
                      Local
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="tabular-nums">{node.maxParallel}</TableCell>
              <TableCell className="text-muted-foreground">
                {node.isLocal
                  ? "—"
                  : node.lastSeenAt
                    ? formatRelativeToNow(node.lastSeenAt)
                    : "Never"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onSettings(node)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

type OwnerFilter = "all" | "mine" | "shared";

function NodesContent() {
  const { myNodes, availableNodes, isLoading } = useNodeManager();
  const [selectedNode, setSelectedNode] = useState<NodeListItem | null>(null);
  const [filter, setFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");

  const allNodes = useMemo(() => {
    return [...myNodes, ...availableNodes];
  }, [myNodes, availableNodes]);

  const ownerFiltered = useMemo(() => {
    return allNodes.filter((node) => {
      if (ownerFilter === "mine" && !node.isOwner && !node.isLocal) {
        return false;
      }
      if (ownerFilter === "shared" && (node.isOwner || node.isLocal)) {
        return false;
      }
      return true;
    });
  }, [allNodes, ownerFilter]);

  const { results: filteredNodes } = useFuzzySearch({
    items: ownerFiltered,
    query: filter,
    keys: ["name"],
  });

  if (isLoading) {
    return <NodesPageSkeleton />;
  }

  const filters: { value: OwnerFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "mine", label: "Mine" },
    { value: "shared", label: "Shared" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Compute Nodes</h2>
          <p className="text-muted-foreground">
            Manage your simulation compute nodes
          </p>
        </div>
        <Button asChild>
          <Link href="/account/nodes/claim">
            <Plus className="mr-2 h-4 w-4" />
            Claim Node
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <Badge
              key={f.value}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                ownerFilter === f.value
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "hover:bg-muted/60"
              }`}
              onClick={() => setOwnerFilter(f.value)}
            >
              {f.label}
            </Badge>
          ))}
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatInt(filteredNodes.length)} nodes
        </span>
      </div>

      <Input
        placeholder="Filter nodes..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      {filteredNodes.length > 0 ? (
        <NodesTable nodes={filteredNodes} onSettings={setSelectedNode} />
      ) : allNodes.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-muted p-3">
              <Server className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No nodes yet</CardTitle>
            <CardDescription>
              Download the WowLab Node app and claim it to contribute compute
              power.
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
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Workers</TableHead>
                <TableHead className="w-[140px]">Last Seen</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  No nodes match the current filter
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <NodeSettingsSheet
        node={selectedNode}
        open={!!selectedNode}
        onOpenChange={(open) => !open && setSelectedNode(null)}
      />
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

  return <NodesContent />;
}

export function NodesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px]">Workers</TableHead>
              <TableHead className="w-[140px]">Last Seen</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
