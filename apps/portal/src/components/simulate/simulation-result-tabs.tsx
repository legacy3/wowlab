"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultsOverview } from "./results-overview";
import { TimelineContent } from "@/components/simulate/results/timeline";
import { ChartsContent } from "@/components/simulate/results/charts";

type Props = {
  resultId: string;
  activeTab: string;
  compareId?: string;
};

export function SimulationResultTabs({
  resultId,
  activeTab,
  compareId,
}: Props) {
  const router = useRouter();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams();
    if (value !== "overview") {
      params.set("tab", value);
    }
    if (compareId) {
      params.set("compare", compareId);
    }
    const query = params.toString();
    router.push(`/simulate/results/${resultId}${query ? `?${query}` : ""}`);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="charts">Charts</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <ResultsOverview />
      </TabsContent>
      <TabsContent value="timeline" className="space-y-4">
        <TimelineContent />
      </TabsContent>
      <TabsContent value="charts" className="space-y-4">
        <ChartsContent />
      </TabsContent>
    </Tabs>
  );
}
