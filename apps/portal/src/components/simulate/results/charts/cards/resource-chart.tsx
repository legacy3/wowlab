"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingDown } from "lucide-react";
import { useAtom } from "jotai";

import {
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "../chart-card";
import { resourceDataAtom } from "@/atoms";
import { formatInt, formatDurationSeconds } from "@/lib/format";

const chartConfig = {
  mana: {
    label: "Current Mana",
    color: "var(--chart-3)",
  },
  mana_spent: {
    label: "Total Spent",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function ResourceChart() {
  const [data] = useAtom(resourceDataAtom);

  const avgMana = Math.round(
    data.reduce((sum, d) => sum + d.mana, 0) / data.length,
  );
  const totalSpent = data[data.length - 1]?.mana_spent || 0;

  return (
    <ChartCard
      title="Resource Usage"
      description="Mana efficiency analysis"
      chartConfig={chartConfig}
      footer={
        <>
          <div className="flex gap-2 leading-none font-medium">
            Total mana spent: {formatInt(totalSpent)}{" "}
            <TrendingDown className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Average mana: {formatInt(avgMana)} / 10,000
          </div>
        </>
      }
    >
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{
          left: -20,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatDurationSeconds(value)}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={3} />
        <ChartTooltip
          cursor={false}
          content={ChartTooltipContent}
          labelFormatter={(value) => formatDurationSeconds(value)}
        />
        <Area
          dataKey="mana"
          type="monotone"
          fill="var(--color-mana)"
          fillOpacity={0.4}
          stroke="var(--color-mana)"
          stackId="a"
        />
      </AreaChart>
    </ChartCard>
  );
}
