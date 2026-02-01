"use client";

import { useBoolean } from "ahooks";
import { CpuIcon, PlusIcon, ServerIcon, WifiIcon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { useMemo, useState } from "react";
import { Grid, HStack, Stack } from "styled-system/jsx";

import { DiscordLinkBanner } from "@/components/account/settings";
import { Button, Card, Empty, Skeleton, StatCard } from "@/components/ui";
import {
  type NodeWithMeta,
  type SaveNodeData,
  selectOnlineCount,
  selectTotalWorkers,
  useNodeMutations,
  useNodes,
  useNodesSelectionArray,
} from "@/lib/state";

import { BulkActionBar } from "./bulk-action-bar";
import { NodeSettingsDialog } from "./node-settings-dialog";
import { NodeSetupDialog } from "./node-setup-dialog";
import { NodesTable, NodesTableSkeleton } from "./nodes-table";
import { type OwnerFilter, OwnerFilterTabs } from "./owner-filter-tabs";

export function NodesPage() {
  const content = useIntlayer("account").nodesPage;
  const { data, isLoading } = useNodes();

  const { clearSelection, selectAll, selectedIds } = useNodesSelectionArray();
  const { deleteNode, isDeleting, isUpdating, updateNode } = useNodeMutations();

  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [settingsNode, setSettingsNode] = useState<NodeWithMeta | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useBoolean(false);

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

  const totalCount = allNodes.length;
  const onlineCount = selectOnlineCount(allNodes);
  const totalWorkers = selectTotalWorkers(allNodes);

  const handleSave = async (data: SaveNodeData) => {
    if (!settingsNode) {
      return;
    }

    await updateNode.mutateAsync({ data, nodeId: settingsNode.id });
    setSettingsNode(null);
  };

  const handleDelete = async () => {
    if (!settingsNode) {
      return;
    }

    await deleteNode.mutateAsync(settingsNode.id);
    setSettingsNode(null);
    clearSelection();
  };

  const handleBulkPowerOn = async () => {
    // TODO: Implement bulk power on
  };

  const handleBulkPowerOff = async () => {
    // TODO: Implement bulk power off
  };

  if (isLoading) {
    return <NodesPageSkeleton />;
  }

  return (
    <Stack gap="6">
      <DiscordLinkBanner />

      <Grid columns={{ base: 3, sm: 3 }} gap="4">
        <StatCard icon={ServerIcon} label={content.nodes} value={totalCount} />
        <StatCard icon={WifiIcon} label={content.online} value={onlineCount} />
        <StatCard icon={CpuIcon} label={content.workers} value={totalWorkers} />
      </Grid>

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
          <Button onClick={setShowSetupDialog.setTrue}>
            <PlusIcon size={16} />
            {content.addNode}
          </Button>
        </HStack>
      </HStack>

      {filteredNodes.length === 0 ? (
        <Card.Root>
          <Card.Body py="12">
            <Empty.Root>
              <Empty.Icon>
                <ServerIcon />
              </Empty.Icon>
              <Empty.Title>{content.noNodesYet}</Empty.Title>
              <Empty.Description>
                {content.claimNodeDescription}
              </Empty.Description>
              <Button onClick={setShowSetupDialog.setTrue}>
                <PlusIcon size={16} />
                {content.addYourFirstNode}
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

      <NodeSetupDialog
        open={showSetupDialog}
        onOpenChange={(open) =>
          setShowSetupDialog[open ? "setTrue" : "setFalse"]()
        }
      />
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
