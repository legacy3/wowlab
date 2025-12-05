"use client";

import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TopGearDashboard } from "@/components/optimize/top-gear/top-gear-dashboard";
import { DropOptimizerContent } from "@/components/optimize/drops";

type Props = {
  activeTab: string;
};

export function OptimizeTabs({ activeTab }: Props) {
  const router = useRouter();

  const handleTabChange = (value: string) => {
    if (value === "top-gear") {
      router.push("/optimize");
    } else {
      router.push(`/optimize?tab=${value}`);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="top-gear">Top Gear</TabsTrigger>
        <TabsTrigger value="drops">Drops</TabsTrigger>
      </TabsList>
      <TabsContent value="top-gear" className="space-y-4">
        <TopGearDashboard />
      </TabsContent>
      <TabsContent value="drops" className="space-y-4">
        <DropOptimizerContent />
      </TabsContent>
    </Tabs>
  );
}
