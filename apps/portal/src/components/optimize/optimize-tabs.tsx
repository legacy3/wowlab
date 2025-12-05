"use client";

import { UrlTabs } from "@/components/ui/url-tabs";
import { TopGearDashboard } from "@/components/optimize/top-gear/top-gear-dashboard";
import { DropOptimizerContent } from "@/components/optimize/drops";

export function OptimizeTabs() {
  return (
    <UrlTabs
      defaultTab="top-gear"
      tabs={[
        {
          value: "top-gear",
          label: "Top Gear",
          content: <TopGearDashboard />,
        },
        {
          value: "drops",
          label: "Drops",
          content: <DropOptimizerContent />,
        },
      ]}
    />
  );
}
