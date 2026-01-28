"use client";

import { PowerIcon, XIcon } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { HStack } from "styled-system/jsx";

import { Badge, Button, Group, IconButton } from "@/components/ui";

interface BulkActionBarProps {
  isLoading?: boolean;
  onClearSelection: () => void;
  onPowerOff?: () => void;
  onPowerOn?: () => void;
  selectedCount: number;
}

export function BulkActionBar({
  isLoading = false,
  onClearSelection,
  onPowerOff,
  onPowerOn,
  selectedCount,
}: BulkActionBarProps) {
  const content = useIntlayer("account").bulkActionBar;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <HStack gap="3" flexWrap="wrap">
      <Badge variant="surface">
        {content.selected({ count: selectedCount })}
      </Badge>
      <Group attached>
        <Button
          size="sm"
          colorPalette="green"
          variant="outline"
          onClick={onPowerOn}
          loading={isLoading}
        >
          <PowerIcon size={14} />
          {content.powerOn}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onPowerOff}
          loading={isLoading}
        >
          <PowerIcon size={14} />
          {content.powerOff}
        </Button>
      </Group>
      <IconButton
        size="sm"
        variant="plain"
        onClick={onClearSelection}
        aria-label={content.clearSelection.value}
      >
        <XIcon size={14} />
      </IconButton>
    </HStack>
  );
}
