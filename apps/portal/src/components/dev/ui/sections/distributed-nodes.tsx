"use client";

import { DownloadIcon, ServerIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { Box, Stack } from "styled-system/jsx";

import {
  BulkActionBar,
  type Node,
  NodeClaimForm,
  NodeDownloadDialog,
  NodeSettingsDialog,
  NodesTable,
  NodesTableSkeleton,
  NodeStatusBadge,
  type OwnerFilter,
  OwnerFilterTabs,
} from "@/components/nodes";
import { Badge, Button, Empty } from "@/components/ui";

import {
  DemoBox,
  DemoDescription,
  DemoLabel,
  fixtures,
  Section,
  Subsection,
} from "../../shared";

// =============================================================================
// Section
// =============================================================================

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
        <NodeClaimFormDemo />
        <NodeSettingsDialogDemo />
        <NodeDownloadDialogDemo />
      </Stack>
    </Section>
  );
}

// =============================================================================
// Demos
// =============================================================================

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

function NodeClaimFormDemo() {
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <Subsection title="NodeClaimForm">
      <DemoDescription>
        Form for claiming a new node with code verification and download link.
      </DemoDescription>
      <DemoBox>
        <Box maxW="md">
          <NodeClaimForm
            onVerify={async (code) => {
              // Simulate verification
              await new Promise((r) => setTimeout(r, 500));
              if (code === "123456") {
                return {
                  platform: "windows",
                  totalCores: 12,
                  version: "1.2.0",
                };
              }
              return null;
            }}
            onClaim={async () => {
              await new Promise((r) => setTimeout(r, 500));
            }}
            onDownloadClick={() => setDownloadOpen(true)}
          />
          <NodeDownloadDialog
            open={downloadOpen}
            onOpenChange={setDownloadOpen}
          />
        </Box>
      </DemoBox>
    </Subsection>
  );
}

function NodeDownloadDialogDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Subsection title="NodeDownloadDialog">
      <DemoDescription>
        Platform download options with auto-detection.
      </DemoDescription>
      <DemoBox>
        <Button onClick={() => setOpen(true)}>
          <DownloadIcon size={16} />
          Download Node
        </Button>
        <NodeDownloadDialog open={open} onOpenChange={setOpen} />
      </DemoBox>
    </Subsection>
  );
}

function NodeSettingsDialogDemo() {
  const [open, setOpen] = useState(false);
  const node = fixtures.nodes.list[0] as Node;

  return (
    <Subsection title="NodeSettingsDialog">
      <DemoDescription>
        Dialog for editing node settings with delete confirmation.
      </DemoDescription>
      <DemoBox>
        <Button onClick={() => setOpen(true)}>
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
  const [downloadOpen, setDownloadOpen] = useState(false);

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
            <Button onClick={() => setDownloadOpen(true)}>
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
  const nodes = fixtures.nodes.list as Node[];

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
          <DemoLabel>variant="subtle"</DemoLabel>
          <OwnerFilterTabs
            value={filter}
            onValueChange={setFilter}
            variant="subtle"
          />
        </DemoBox>
        <DemoBox>
          <DemoLabel>variant="enclosed"</DemoLabel>
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
