"use client";

import { useBoolean } from "ahooks";
import { DownloadIcon, ServerIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Stack } from "styled-system/jsx";

import {
  BulkActionBar,
  NodeDownloadDialog,
  NodeSettingsDialog,
  NodesTable,
  NodesTableSkeleton,
  NodeStatusBadge,
  type OwnerFilter,
  OwnerFilterTabs,
} from "@/components/account/nodes";
import { Button, Empty } from "@/components/ui";

import {
  DemoBox,
  DemoDescription,
  DemoLabel,
  fixtures,
  Section,
  Subsection,
} from "../../shared";

export function DistributedNodesSection() {
  return (
    <Section
      id="distributed-nodes"
      title="Distributed Nodes"
      lazy
      minHeight={4000}
    >
      <Stack gap="10">
        <NodeStatusBadgeDemo />
        <OwnerFilterTabsDemo />
        <BulkActionBarDemo />
        <NodesTableDemo />
        <NodesSkeletonDemo />
        <NodeSettingsDialogDemo />
        <NodeDownloadDialogDemo />
      </Stack>
    </Section>
  );
}

function BulkActionBarDemo() {
  const [selected, setSelected] = useState<string[]>(["node-1", "node-2"]);

  return (
    <Subsection title="BulkActionBar">
      <DemoDescription>Bulk operations for selected nodes.</DemoDescription>
      <DemoBox>
        <BulkActionBar
          selectedCount={selected.length}
          onPowerOn={() => {}}
          onPowerOff={() => {}}
          onClearSelection={() => setSelected([])}
        />
      </DemoBox>
    </Subsection>
  );
}

function NodeDownloadDialogDemo() {
  const [open, { set: setOpen, setTrue: openDialog }] = useBoolean(false);

  return (
    <Subsection title="NodeDownloadDialog">
      <DemoDescription>
        Platform download options with auto-detection.
      </DemoDescription>
      <DemoBox>
        <Button onClick={openDialog}>
          <DownloadIcon size={16} />
          Download Node
        </Button>
        <NodeDownloadDialog open={open} onOpenChange={setOpen} />
      </DemoBox>
    </Subsection>
  );
}

function NodeSettingsDialogDemo() {
  const [open, { set: setOpen, setTrue: openDialog }] = useBoolean(false);
  const node = fixtures.nodes.list[0];

  return (
    <Subsection title="NodeSettingsDialog">
      <DemoDescription>
        Dialog for editing node settings with delete confirmation.
      </DemoDescription>
      <DemoBox>
        <Button onClick={openDialog}>
          <SettingsIcon size={16} />
          Open Settings
        </Button>
        <NodeSettingsDialog
          node={node}
          open={open}
          onOpenChange={setOpen}
          onSave={async () => {}}
          onDelete={async () => {}}
        />
      </DemoBox>
    </Subsection>
  );
}

function NodesSkeletonDemo() {
  const [downloadOpen, { set: setDownloadOpen, setTrue: openDownload }] =
    useBoolean(false);

  return (
    <Subsection title="NodesSkeletons">
      <DemoDescription>
        Loading states for nodes page components.
      </DemoDescription>
      <Stack gap="6">
        <DemoBox>
          <DemoLabel>Table Skeleton</DemoLabel>
          <NodesTableSkeleton rows={3} />
        </DemoBox>
        <DemoBox>
          <DemoLabel>Empty State</DemoLabel>
          <Empty.Root>
            <Empty.Icon>
              <ServerIcon />
            </Empty.Icon>
            <Empty.Title>No nodes yet</Empty.Title>
            <Empty.Description>
              Download the node application to get started with distributed
              simulations.
            </Empty.Description>
            <Button onClick={openDownload}>
              <DownloadIcon size={16} />
              Download Node
            </Button>
          </Empty.Root>
          <NodeDownloadDialog
            open={downloadOpen}
            onOpenChange={setDownloadOpen}
          />
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function NodesTableDemo() {
  const [selected, setSelected] = useState<string[]>([]);
  const nodes = fixtures.nodes.list;

  return (
    <Subsection title="NodesTable">
      <DemoDescription>
        Table with selection, sortable columns, and row actions.
      </DemoDescription>
      <DemoBox>
        <NodesTable
          nodes={nodes}
          selectedIds={selected}
          onSelectionChange={setSelected}
          onSettingsClick={() => {}}
        />
      </DemoBox>
    </Subsection>
  );
}

function NodeStatusBadgeDemo() {
  return (
    <Subsection title="NodeStatusBadge">
      <DemoDescription>
        Status indicator for node connection state.
      </DemoDescription>
      <DemoBox>
        <Stack gap="3" direction="row">
          <NodeStatusBadge status="online" />
          <NodeStatusBadge status="offline" />
          <NodeStatusBadge status="pending" />
        </Stack>
      </DemoBox>
    </Subsection>
  );
}

function OwnerFilterTabsDemo() {
  const [filter, setFilter] = useState<OwnerFilter>("all");

  return (
    <Subsection title="OwnerFilterTabs">
      <DemoDescription>Filter nodes by ownership.</DemoDescription>
      <Stack gap="4">
        <DemoBox>
          <DemoLabel>variant=&quot;subtle&quot;</DemoLabel>
          <OwnerFilterTabs
            value={filter}
            onValueChange={setFilter}
            variant="subtle"
          />
        </DemoBox>
        <DemoBox>
          <DemoLabel>variant=&quot;enclosed&quot;</DemoLabel>
          <OwnerFilterTabs
            value={filter}
            onValueChange={setFilter}
            variant="enclosed"
          />
        </DemoBox>
      </Stack>
    </Subsection>
  );
}
