"use client";

import { UrlTabs } from "@/components/ui/url-tabs";
import { ResultsOverview } from "./results-overview";
import { TimelineContent } from "@/components/simulate/results/timeline";
import { ChartsContent } from "@/components/simulate/results/charts";

export function SimulationResultTabs() {
  return (
    <UrlTabs
      defaultTab="overview"
      tabs={[
        {
          value: "overview",
          label: "Overview",
          content: <ResultsOverview />,
        },
        {
          value: "timeline",
          label: "Timeline",
          content: <TimelineContent />,
        },
        {
          value: "charts",
          label: "Charts",
          content: <ChartsContent />,
        },
      ]}
    />
  );
}
