"use client";

import { Tabs } from "@/components/ui";

export type OwnerFilter = "all" | "mine" | "shared";

interface OwnerFilterTabsProps {
  onValueChange: (value: OwnerFilter) => void;
  value: OwnerFilter;
  variant?: "subtle" | "enclosed" | "line";
}

export function OwnerFilterTabs({
  onValueChange,
  value,
  variant = "subtle",
}: OwnerFilterTabsProps) {
  return (
    <Tabs.Root
      value={value}
      onValueChange={(e) => onValueChange(e.value as OwnerFilter)}
      variant={variant}
    >
      <Tabs.List>
        <Tabs.Trigger value="all">All</Tabs.Trigger>
        <Tabs.Trigger value="mine">Mine</Tabs.Trigger>
        <Tabs.Trigger value="shared">Shared</Tabs.Trigger>
        <Tabs.Indicator />
      </Tabs.List>
    </Tabs.Root>
  );
}
