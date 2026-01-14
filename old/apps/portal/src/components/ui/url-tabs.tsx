"use client";

import { Suspense } from "react";
import { useQueryState, parseAsStringLiteral } from "nuqs";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Tab<T extends string> = {
  value: T;
  label: string;
  content: React.ReactNode;
};

type UrlTabsProps<T extends string> = {
  tabs: Tab<T>[];
  defaultTab: T;
  paramName?: string;
  className?: string;
  listClassName?: string;
  listDataTour?: string;
  contentClassName?: string;
};

function UrlTabsInner<T extends string>({
  tabs,
  defaultTab,
  paramName = "tab",
  className,
  listClassName,
  listDataTour,
  contentClassName,
}: UrlTabsProps<T>) {
  const tabValues = tabs.map((t) => t.value) as [T, ...T[]];

  const [activeTab, setActiveTab] = useQueryState(
    paramName,
    parseAsStringLiteral(tabValues)
      .withDefault(defaultTab)
      .withOptions({ shallow: true, history: "replace" }),
  );

  return (
    <TabsPrimitive.Root
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as T)}
      className={cn("flex flex-col gap-4", className)}
    >
      <TabsPrimitive.List
        data-tour={listDataTour}
        className={cn(
          "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
          listClassName,
        )}
      >
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm",
            )}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {tabs.map((tab) => (
        <TabsPrimitive.Content
          key={tab.value}
          value={tab.value}
          className={cn("flex-1 outline-none", contentClassName)}
        >
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

function UrlTabsSkeleton<T extends string>({ tabs }: { tabs: Tab<T>[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px]">
        {tabs.map((tab) => (
          <Skeleton key={tab.value} className="h-7 w-20 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function UrlTabs<T extends string>(props: UrlTabsProps<T>) {
  return (
    <Suspense fallback={<UrlTabsSkeleton tabs={props.tabs} />}>
      <UrlTabsInner {...props} />
    </Suspense>
  );
}
