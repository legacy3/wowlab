"use client";

import type { ReactNode } from "react";

import * as Tabs from "@/components/ui/tabs";

type MdTabContentProps = {
  children: ReactNode;
  value: string;
};

type MdTabListProps = {
  children: ReactNode;
};

type MdTabsProps = {
  children: ReactNode;
  defaultValue?: string;
};

type MdTabTriggerProps = {
  children: ReactNode;
  value: string;
};

export function MdTabContent({ children, value }: MdTabContentProps) {
  return <Tabs.Content value={value}>{children}</Tabs.Content>;
}

export function MdTabList({ children }: MdTabListProps) {
  return (
    <Tabs.List>
      {children}
      <Tabs.Indicator />
    </Tabs.List>
  );
}

export function MdTabs({ children, defaultValue }: MdTabsProps) {
  return (
    <Tabs.Root defaultValue={defaultValue} my="6">
      {children}
    </Tabs.Root>
  );
}

export function MdTabTrigger({ children, value }: MdTabTriggerProps) {
  return <Tabs.Trigger value={value}>{children}</Tabs.Trigger>;
}
