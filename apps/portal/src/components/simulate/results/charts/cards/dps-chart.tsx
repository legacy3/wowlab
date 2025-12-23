"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { useAtom } from "jotai";

import {
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "../chart-card";
import { dpsDataAtom } from "@/atoms";
import { formatInt, formatDurationSeconds } from "@/lib/format";

const chartConfig = {
  dps: {
    label: "Instant DPS",
    color: "var(--chart-1)",
  },
  running_avg: {
    label: "Average DPS",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function DpsChart() {
  const [data] = useAtom(dpsDataAtom);

  const avgDps = Math.round(
    data.reduce((sum, d) => sum + d.dps, 0) / data.length,
  );
  const maxDps = Math.max(...data.map((d) => d.dps));

  return (
    <ChartCard
      title="DPS Over Time"
      description="Damage output throughout the encounter"
      chartConfig={chartConfig}
      footer={
        <>
          <div className="flex gap-2 leading-none font-medium">
            Peak DPS: {formatInt(maxDps)} <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Average: {formatInt(avgDps)} DPS over 300 seconds
          </div>
        </>
      }
    >
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
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
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatInt(value)}
        />
        <ChartTooltip
          cursor={false}
          content={ChartTooltipContent}
          labelFormatter={(value) => formatDurationSeconds(value)}
        />
        <Line
          dataKey="dps"
          type="monotone"
          stroke="var(--color-dps)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="running_avg"
          type="monotone"
          stroke="var(--color-running_avg)"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ChartCard>
  );
}
