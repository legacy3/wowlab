"use client";

import { PowerIcon, XIcon } from "lucide-react";
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
  if (selectedCount === 0) {
    return null;
  }

  return (
    <HStack gap="3" flexWrap="wrap">
      <Badge variant="surface">{selectedCount} selected</Badge>
      <Group attached>
        <Button
          size="sm"
          colorPalette="green"
          variant="outline"
          onClick={onPowerOn}
          loading={isLoading}
        >
          <PowerIcon size={14} />
          Power On
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onPowerOff}
          loading={isLoading}
        >
          <PowerIcon size={14} />
          Power Off
        </Button>
      </Group>
      <IconButton size="sm" variant="plain" onClick={onClearSelection}>
        <XIcon size={14} />
      </IconButton>
    </HStack>
  );
}
