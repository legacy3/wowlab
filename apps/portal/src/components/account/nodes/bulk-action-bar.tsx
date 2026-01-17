"use client";

import { PowerIcon, XIcon } from "lucide-react";
import { useExtracted } from "next-intl";
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
  const t = useExtracted();

  if (selectedCount === 0) {
    return null;
  }

  return (
    <HStack gap="3" flexWrap="wrap">
      <Badge variant="surface">
        {t("{count, plural, =1 {# selected} other {# selected}}", {
          count: selectedCount,
        })}
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
          {t("Power On")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onPowerOff}
          loading={isLoading}
        >
          <PowerIcon size={14} />
          {t("Power Off")}
        </Button>
      </Group>
      <IconButton
        size="sm"
        variant="plain"
        onClick={onClearSelection}
        aria-label={t("Clear selection")}
      >
        <XIcon size={14} />
      </IconButton>
    </HStack>
  );
}
