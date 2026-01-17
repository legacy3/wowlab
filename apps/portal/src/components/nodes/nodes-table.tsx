"use client";

import { CpuIcon, SettingsIcon } from "lucide-react";
import { Box, HStack } from "styled-system/jsx";

import {
  Checkbox,
  IconButton,
  Skeleton,
  Table,
  Text,
  Tooltip,
} from "@/components/ui";

import type { Node } from "./types";

import { NodeStatusBadge } from "./node-status-badge";
import { PlatformIcon } from "./platform-icon";

interface NodesTableProps {
  nodes: Node[];
  onSelectionChange: (ids: string[]) => void;
  onSettingsClick?: (node: Node) => void;
  selectedIds: string[];
}

interface WorkersDisplayProps {
  totalCores: number;
  workers: number;
}

export function NodesTable({
  nodes,
  onSelectionChange,
  onSettingsClick,
  selectedIds,
}: NodesTableProps) {
  const allSelected = selectedIds.length === nodes.length && nodes.length > 0;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(nodes.map((n) => n.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((s) => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <Box overflowX="auto">
      <Table.Root variant="surface">
        <Table.Head>
          <Table.Row>
            <Table.Header w="10">
              <Checkbox.Root
                checked={
                  allSelected ? true : someSelected ? "indeterminate" : false
                }
                onCheckedChange={toggleAll}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
              </Checkbox.Root>
            </Table.Header>
            <Table.Header>Name</Table.Header>
            <Table.Header>Platform</Table.Header>
            <Table.Header>Status</Table.Header>
            <Table.Header>Workers</Table.Header>
            <Table.Header>Last Seen</Table.Header>
            <Table.Header w="10" />
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {nodes.map((node) => (
            <Table.Row key={node.id}>
              <Table.Cell>
                <Checkbox.Root
                  checked={selectedIds.includes(node.id)}
                  onCheckedChange={() => toggleOne(node.id)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Root>
              </Table.Cell>
              <Table.Cell fontWeight="medium">{node.name}</Table.Cell>
              <Table.Cell>
                <HStack gap="2">
                  <PlatformIcon platform={node.platform} size={14} />
                  <Text textStyle="sm" textTransform="capitalize">
                    {node.platform}
                  </Text>
                </HStack>
              </Table.Cell>
              <Table.Cell>
                <NodeStatusBadge status={node.status} size="sm" />
              </Table.Cell>
              <Table.Cell>
                <WorkersDisplay
                  workers={node.workers}
                  totalCores={node.totalCores}
                />
              </Table.Cell>
              <Table.Cell>
                <Text textStyle="sm" color="fg.muted">
                  {formatLastSeen(node.lastSeen)}
                </Text>
              </Table.Cell>
              <Table.Cell>
                {onSettingsClick && (
                  <IconButton
                    size="xs"
                    variant="plain"
                    onClick={() => onSettingsClick(node)}
                  >
                    <SettingsIcon size={14} />
                  </IconButton>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

export function NodesTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Table.Root variant="surface">
      <Table.Head>
        <Table.Row>
          <Table.Header w="10">
            <Skeleton w="4" h="4" />
          </Table.Header>
          <Table.Header>Name</Table.Header>
          <Table.Header>Platform</Table.Header>
          <Table.Header>Status</Table.Header>
          <Table.Header>Workers</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {Array.from({ length: rows }).map((_, i) => (
          <Table.Row key={i}>
            <Table.Cell>
              <Skeleton w="4" h="4" />
            </Table.Cell>
            <Table.Cell>
              <Skeleton h="4" w="24" />
            </Table.Cell>
            <Table.Cell>
              <Skeleton h="4" w="16" />
            </Table.Cell>
            <Table.Cell>
              <Skeleton h="5" w="14" borderRadius="full" />
            </Table.Cell>
            <Table.Cell>
              <Skeleton h="4" w="12" />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

function formatLastSeen(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function WorkersDisplay({ totalCores, workers }: WorkersDisplayProps) {
  return (
    <Tooltip content={`${workers} active of ${totalCores} cores`}>
      <HStack gap="1.5">
        <CpuIcon size={14} />
        <Text textStyle="sm">
          {workers} / {totalCores}
        </Text>
      </HStack>
    </Tooltip>
  );
}
