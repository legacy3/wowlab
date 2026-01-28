"use client";

import { useIntlayer } from "next-intlayer";

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
  const content = useIntlayer("account").ownerFilterTabs;

  return (
    <Tabs.Root
      value={value}
      onValueChange={(e) => onValueChange(e.value as OwnerFilter)}
      variant={variant}
    >
      <Tabs.List>
        <Tabs.Trigger value="all">{content.all}</Tabs.Trigger>
        <Tabs.Trigger value="mine">{content.mine}</Tabs.Trigger>
        <Tabs.Trigger value="shared">{content.shared}</Tabs.Trigger>
        <Tabs.Indicator />
      </Tabs.List>
    </Tabs.Root>
  );
}
