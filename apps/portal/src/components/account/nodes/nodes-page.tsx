"use client";

import { CpuIcon, PlusIcon, ServerIcon, WifiIcon } from "lucide-react";
import { useExtracted } from "next-intl";
import { useMemo, useState } from "react";
import { Grid, HStack, Stack } from "styled-system/jsx";

import { Button, Card, Empty, Skeleton, StatCard } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { routes } from "@/lib/routing";
import {
  type NodeWithMeta,
  type SaveNodeData,
  selectOnlineCount,
  selectTotalWorkers,
  useNodeMutations,
  useNodes,
  useNodesSelectionArray,
  useUser,
} from "@/lib/state";

import { BulkActionBar } from "./bulk-action-bar";
import { NodeSettingsDialog } from "./node-settings-dialog";
import { NodesTable, NodesTableSkeleton } from "./nodes-table";
import { type OwnerFilter, OwnerFilterTabs } from "./owner-filter-tabs";

export function NodesPage() {
  const t = useExtracted();
  const { data: user } = useUser();
  const userId = user?.id;

  const { data, isLoading } = useNodes(userId);

  const { clearSelection, selectAll, selectedIds } = useNodesSelectionArray();
  const { deleteNode, isDeleting, isUpdating, updateNode } = useNodeMutations();

  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [settingsNode, setSettingsNode] = useState<NodeWithMeta | null>(null);

  const myNodes = useMemo(() => data?.myNodes ?? [], [data?.myNodes]);
  const sharedNodes = useMemo(
    () => data?.sharedNodes ?? [],
    [data?.sharedNodes],
  );
  const allNodes = useMemo(
    () => [...myNodes, ...sharedNodes],
    [myNodes, sharedNodes],
  );

  const filteredNodes = useMemo(() => {
    switch (ownerFilter) {
      case "mine":
        return myNodes;
      case "shared":
        return sharedNodes;
      default:
        return allNodes;
    }
  }, [ownerFilter, myNodes, sharedNodes, allNodes]);

  // Stats
  const totalCount = allNodes.length;
  const onlineCount = selectOnlineCount(allNodes);
  const totalWorkers = selectTotalWorkers(allNodes);

  const handleSave = async (data: SaveNodeData) => {
    if (!settingsNode) return;
    try {
      await updateNode.mutateAsync({ data, nodeId: settingsNode.id });
      setSettingsNode(null);
    } catch (err) {
      console.error("Failed to save node:", err);
    }
  };

  const handleDelete = async () => {
    if (!settingsNode) return;
    try {
      await deleteNode.mutateAsync(settingsNode.id);
      setSettingsNode(null);
      clearSelection();
    } catch (err) {
      console.error("Failed to delete node:", err);
    }
  };

  const handleBulkPowerOn = async () => {
    // TODO: Implement bulk power on
    console.log("Power on:", selectedIds);
  };

  const handleBulkPowerOff = async () => {
    // TODO: Implement bulk power off
    console.log("Power off:", selectedIds);
  };

  if (isLoading) {
    return <NodesPageSkeleton />;
  }

  return (
    <Stack gap="6">
      {/* Stats */}
      <Grid columns={{ base: 3, sm: 3 }} gap="4">
        <StatCard icon={ServerIcon} label={t("Nodes")} value={totalCount} />
        <StatCard icon={WifiIcon} label={t("Online")} value={onlineCount} />
        <StatCard icon={CpuIcon} label={t("Workers")} value={totalWorkers} />
      </Grid>

      {/* Actions Bar */}
      <HStack justify="space-between" flexWrap="wrap" gap="4">
        <OwnerFilterTabs value={ownerFilter} onValueChange={setOwnerFilter} />

        <HStack gap="2">
          {selectedIds.length > 0 && (
            <BulkActionBar
              selectedCount={selectedIds.length}
              onClearSelection={clearSelection}
              onPowerOff={handleBulkPowerOff}
              onPowerOn={handleBulkPowerOn}
            />
          )}
          <Button asChild>
            <Link href={routes.account.nodes.claim.path}>
              <PlusIcon size={16} />
              {t("Claim Node")}
            </Link>
          </Button>
        </HStack>
      </HStack>

      {/* Nodes Table or Empty State */}
      {filteredNodes.length === 0 ? (
        <Card.Root>
          <Card.Body py="12">
            <Empty.Root>
              <Empty.Icon>
                <ServerIcon />
              </Empty.Icon>
              <Empty.Title>{t("No nodes yet")}</Empty.Title>
              <Empty.Description>
                {t(
                  "Claim a node to contribute compute resources for simulations",
                )}
              </Empty.Description>
              <Button asChild>
                <Link href={routes.account.nodes.claim.path}>
                  <PlusIcon size={16} />
                  {t("Claim Your First Node")}
                </Link>
              </Button>
            </Empty.Root>
          </Card.Body>
        </Card.Root>
      ) : (
        <NodesTable
          nodes={filteredNodes}
          selectedIds={selectedIds}
          onSelectionChange={selectAll}
          onSettingsClick={setSettingsNode}
        />
      )}

      {/* Settings Dialog */}
      {settingsNode && (
        <NodeSettingsDialog
          node={settingsNode}
          open={!!settingsNode}
          onOpenChange={(open) => !open && setSettingsNode(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          isSaving={isUpdating}
          isDeleting={isDeleting}
        />
      )}
    </Stack>
  );
}

export function NodesPageSkeleton() {
  return (
    <Stack gap="6">
      <Grid columns={{ base: 3, sm: 3 }} gap="4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} h="20" rounded="xl" />
        ))}
      </Grid>
      <HStack justify="space-between">
        <Skeleton h="10" w="48" />
        <Skeleton h="10" w="32" />
      </HStack>
      <NodesTableSkeleton rows={3} />
    </Stack>
  );
}
