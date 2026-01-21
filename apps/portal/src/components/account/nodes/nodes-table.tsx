"use client";

import { CpuIcon, SettingsIcon } from "lucide-react";
import { useIntlayer, useLocale } from "next-intlayer";
import { Box, HStack } from "styled-system/jsx";

import type { NodeWithMeta } from "@/lib/state";

import {
  Checkbox,
  IconButton,
  Skeleton,
  Table,
  Text,
  Tooltip,
} from "@/components/ui";

import { NodeStatusBadge } from "./node-status-badge";
import { PlatformIcon } from "./platform-icon";

interface NodesTableProps {
  nodes: NodeWithMeta[];
  onSelectionChange: (ids: string[]) => void;
  onSettingsClick?: (node: NodeWithMeta) => void;
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
  const content = useIntlayer("account").nodesTable;
  const { locale } = useLocale();
  const localeStr = String(locale);
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
            <Table.Header>{content.name}</Table.Header>
            <Table.Header>{content.platform}</Table.Header>
            <Table.Header>{content.status}</Table.Header>
            <Table.Header>{content.workers}</Table.Header>
            <Table.Header>{content.lastSeen}</Table.Header>
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
                  workers={node.max_parallel}
                  totalCores={node.total_cores}
                />
              </Table.Cell>
              <Table.Cell>
                <Text textStyle="sm" color="fg.muted">
                  {node.last_seen_at
                    ? formatRelativeTime(new Date(node.last_seen_at), localeStr)
                    : "-"}
                </Text>
              </Table.Cell>
              <Table.Cell>
                {onSettingsClick && (
                  <IconButton
                    size="xs"
                    variant="plain"
                    onClick={() => onSettingsClick(node)}
                    aria-label={content.settings}
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
  const content = useIntlayer("account").nodesTable;

  return (
    <Table.Root variant="surface">
      <Table.Head>
        <Table.Row>
          <Table.Header w="10">
            <Skeleton w="4" h="4" />
          </Table.Header>
          <Table.Header>{content.name}</Table.Header>
          <Table.Header>{content.platform}</Table.Header>
          <Table.Header>{content.status}</Table.Header>
          <Table.Header>{content.workers}</Table.Header>
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

function formatRelativeTime(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffDays > 0) {
    return rtf.format(-diffDays, "day");
  }
  if (diffHours > 0) {
    return rtf.format(-diffHours, "hour");
  }
  if (diffMinutes > 0) {
    return rtf.format(-diffMinutes, "minute");
  }
  return rtf.format(-diffSeconds, "second");
}

function WorkersDisplay({ totalCores, workers }: WorkersDisplayProps) {
  const content = useIntlayer("account").nodesTable;

  return (
    <Tooltip content={content.workersActiveOfCores({ totalCores, workers })}>
      <HStack gap="1.5">
        <CpuIcon size={14} />
        <Text textStyle="sm">
          {workers} / {totalCores}
        </Text>
      </HStack>
    </Tooltip>
  );
}
