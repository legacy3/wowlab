"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Server,
  Settings,
  Monitor,
  Globe,
  Power,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Cpu,
  Wifi,
  AlertTriangle,
} from "lucide-react";
import NextLink from "next/link";
import { Link } from "@/components/ui/link";
import { useNodeManager, type NodeListItem } from "@/providers";
import { useFuzzySearch } from "@/hooks/use-fuzzy-search";
import { SecretText } from "@/components/ui/secret-field";
import { NodeStatusBadge } from "./node-status-badge";
import { NodeSettingsModal } from "./node-settings-modal";
import { formatRelativeToNow, formatInt } from "@/lib/format";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useUpdate, useInvalidate } from "@refinedev/core";
import type { UserNode } from "@/lib/supabase/types";

// Latest version - could be fetched from API/env later
const LATEST_VERSION = "0.1.0";

type SortKey = "status" | "workers" | "lastSeen" | null;
type SortDir = "asc" | "desc";

function SortableHeader({
  children,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  className,
}: {
  children: React.ReactNode;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = currentSort === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 hover:text-foreground transition-colors -ml-2 px-2 py-1 rounded"
      >
        {children}
        {isActive ? (
          currentDir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}

function NodesTable({
  nodes,
  onSettings,
  getNodeAccess,
  selectedIds,
  onSelectChange,
  onSelectAll,
  onTogglePower,
  sortKey,
  sortDir,
  onSort,
}: {
  nodes: NodeListItem[];
  onSettings: (node: NodeListItem) => void;
  getNodeAccess: (nodeId: string) => string;
  selectedIds: Set<string>;
  onSelectChange: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onTogglePower: (node: NodeListItem) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const allSelected =
    nodes.length > 0 && nodes.every((n) => selectedIds.has(n.id));
  const someSelected = nodes.some((n) => selectedIds.has(n.id)) && !allSelected;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px]">
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <SortableHeader
              sortKey="status"
              currentSort={sortKey}
              currentDir={sortDir}
              onSort={onSort}
              className="w-[100px]"
            >
              Status
            </SortableHeader>
            <TableHead>Name</TableHead>
            <TableHead className="w-[120px]">Platform</TableHead>
            <SortableHeader
              sortKey="workers"
              currentSort={sortKey}
              currentDir={sortDir}
              onSort={onSort}
              className="w-[100px]"
            >
              Workers
            </SortableHeader>
            <SortableHeader
              sortKey="lastSeen"
              currentSort={sortKey}
              currentDir={sortDir}
              onSort={onSort}
              className="w-[140px]"
            >
              Last Seen
            </SortableHeader>
            <TableHead className="w-[90px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => {
            const isPublic =
              node.isOwner &&
              !node.isLocal &&
              getNodeAccess(node.id) === "public";
            const isOutdated = node.version !== LATEST_VERSION && !node.isLocal;
            const isSelected = selectedIds.has(node.id);
            const isEnabled = node.status === "online";

            return (
              <TableRow
                key={node.id}
                className={cn(isSelected && "bg-muted/50")}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      onSelectChange(node.id, !!checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <NodeStatusBadge status={node.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {node.isLocal ? (
                          <span className="font-medium">{node.name}</span>
                        ) : (
                          <SecretText
                            value={node.name}
                            hiddenLength={15}
                            className="font-medium"
                          />
                        )}
                        {node.isLocal && (
                          <Badge variant="secondary" className="text-xs">
                            <Monitor className="mr-1 h-3 w-3" />
                            Local
                          </Badge>
                        )}
                        {isPublic && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20"
                          >
                            <Globe className="mr-1 h-3 w-3" />
                            Public
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`${env.GITHUB_URL}/releases/tag/v${node.version}`}
                          external
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          v{node.version}
                        </Link>
                        {isOutdated && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-1 py-0"
                          >
                            <AlertTriangle className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {node.platform}
                </TableCell>
                <TableCell className="tabular-nums text-sm">
                  {node.maxParallel}/{node.totalCores}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {node.lastSeenAt
                    ? formatRelativeToNow(node.lastSeenAt)
                    : "Never"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {node.isOwner && (
                      <Toggle
                        pressed={isEnabled}
                        onPressedChange={() => onTogglePower(node)}
                        size="sm"
                        variant="outline"
                        className={cn(
                          "h-8 w-8",
                          isEnabled
                            ? "data-[state=on]:bg-green-500/10 data-[state=on]:text-green-500 data-[state=on]:border-green-500/30"
                            : "text-muted-foreground",
                        )}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Toggle>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onSettings(node)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function NodesStats({ nodes }: { nodes: NodeListItem[] }) {
  const stats = useMemo(() => {
    const online = nodes.filter((n) => n.status === "online");
    return {
      total: nodes.length,
      online: online.length,
      totalWorkers: online.reduce((sum, n) => sum + n.maxParallel, 0),
    };
  }, [nodes]);

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5">
        <Server className="h-4 w-4 text-muted-foreground" />
        <span className="tabular-nums font-medium">{stats.total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="tabular-nums font-medium">{stats.online}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Cpu className="h-4 w-4 text-muted-foreground" />
        <span className="tabular-nums font-medium">{stats.totalWorkers}</span>
      </div>
    </div>
  );
}

type OwnerFilter = "all" | "mine" | "shared";

function NodesContent() {
  const {
    localNode,
    myNodes,
    availableNodes,
    isLoading,
    getNodeAccess,
    setLocalEnabled,
  } = useNodeManager();
  const { mutateAsync: updateNode } = useUpdate<UserNode>();
  const invalidate = useInvalidate();

  const [selectedNode, setSelectedNode] = useState<NodeListItem | null>(null);
  const [filter, setFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("lastSeen");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  const { results: searchFiltered } = useFuzzySearch({
    items: ownerFiltered,
    query: filter,
    keys: ["name"],
  });

  const filteredNodes = useMemo(() => {
    if (!sortKey) return searchFiltered;

    return [...searchFiltered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "status": {
          const order = { online: 0, pending: 1, offline: 2 };
          cmp = order[a.status] - order[b.status];
          break;
        }
        case "workers":
          cmp = a.maxParallel - b.maxParallel;
          break;
        case "lastSeen": {
          const aTime = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
          const bTime = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
          cmp = aTime - bTime;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [searchFiltered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleSelectChange = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(new Set(filteredNodes.map((n) => n.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleTogglePower = async (node: NodeListItem) => {
    if (node.isLocal) {
      setLocalEnabled(!localNode.enabled);
      return;
    }

    const newStatus = node.status === "online" ? "offline" : "online";
    await updateNode({
      resource: "user_nodes",
      id: node.id,
      values: { status: newStatus },
    });
    invalidate({ resource: "user_nodes", invalidates: ["list"] });
  };

  const handleBulkPower = async (enable: boolean) => {
    const nodesToUpdate = filteredNodes.filter(
      (n) => selectedIds.has(n.id) && n.isOwner && !n.isLocal,
    );

    for (const node of nodesToUpdate) {
      await updateNode({
        resource: "user_nodes",
        id: node.id,
        values: { status: enable ? "online" : "offline" },
      });
    }

    // Handle local node if selected
    if (selectedIds.has("local")) {
      setLocalEnabled(enable);
    }

    invalidate({ resource: "user_nodes", invalidates: ["list"] });
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return <NodesPageSkeleton />;
  }

  const filters: { value: OwnerFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "mine", label: "Mine" },
    { value: "shared", label: "Shared" },
  ];

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="space-y-4">
      {/* Stats + filters + actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <NodesStats nodes={allNodes} />
          <div className="h-4 w-px bg-border" />
          <div className="flex gap-1">
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
        </div>
        <Button asChild size="sm">
          <NextLink href="/account/nodes/claim">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Claim
          </NextLink>
        </Button>
      </div>

      {/* Search and bulk actions */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter nodes ..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        {hasSelection && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-sm text-muted-foreground tabular-nums">
              {selectedIds.size} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-green-600 hover:text-green-600 hover:bg-green-500/10"
              onClick={() => handleBulkPower(true)}
            >
              <Power className="h-3.5 w-3.5" />
              On
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => handleBulkPower(false)}
            >
              <Power className="h-3.5 w-3.5" />
              Off
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {filteredNodes.length > 0 ? (
        <NodesTable
          nodes={filteredNodes}
          onSettings={setSelectedNode}
          getNodeAccess={getNodeAccess}
          selectedIds={selectedIds}
          onSelectChange={handleSelectChange}
          onSelectAll={handleSelectAll}
          onTogglePower={handleTogglePower}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      ) : allNodes.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-muted p-3">
              <Server className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>No nodes yet</CardTitle>
            <CardDescription>
              Download the WoW Lab Node app and claim it to contribute compute
              power.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <NextLink href="/account/nodes/claim">
                <Plus className="mr-2 h-4 w-4" />
                Claim Your First Node
              </NextLink>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[40px]" />
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[120px]">Platform</TableHead>
                <TableHead className="w-[100px]">Workers</TableHead>
                <TableHead className="w-[140px]">Last Seen</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No nodes match the current filter
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      <NodeSettingsModal
        node={selectedNode}
        open={!!selectedNode}
        onOpenChange={(open) => !open && setSelectedNode(null)}
      />
    </div>
  );
}

export function NodesPage() {
  return <NodesContent />;
}

export function NodesPageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-48" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[120px]">Platform</TableHead>
              <TableHead className="w-[100px]">Workers</TableHead>
              <TableHead className="w-[140px]">Last Seen</TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
