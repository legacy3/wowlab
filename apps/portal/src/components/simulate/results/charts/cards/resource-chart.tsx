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
          <div className="flex items-center gap-2 font-medium">
            <TrendingDown className="h-4 w-4 text-primary" />
            <span className="tabular-nums">
              Total spent: {formatInt(totalSpent)}
            </span>
          </div>
          <div className="text-muted-foreground text-xs">
            Average: <span className="tabular-nums">{formatInt(avgMana)}</span>{" "}
            / 10,000
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
