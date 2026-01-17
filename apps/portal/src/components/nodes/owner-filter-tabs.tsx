"use client";

import { useExtracted } from "next-intl";

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
  const t = useExtracted();

  return (
    <Tabs.Root
      value={value}
      onValueChange={(e) => onValueChange(e.value as OwnerFilter)}
      variant={variant}
    >
      <Tabs.List>
        <Tabs.Trigger value="all">{t("All")}</Tabs.Trigger>
        <Tabs.Trigger value="mine">{t("Mine")}</Tabs.Trigger>
        <Tabs.Trigger value="shared">{t("Shared")}</Tabs.Trigger>
        <Tabs.Indicator />
      </Tabs.List>
    </Tabs.Root>
  );
}
