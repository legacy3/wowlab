"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useAtom } from "jotai";

import {
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { ChartCard } from "../chart-card";
import { detailedDataAtom } from "@/atoms";

const chartConfig = {
  damage: {
    label: "Cumulative Damage",
    color: "var(--chart-1)",
  },
  mana: {
    label: "Mana",
    color: "var(--chart-3)",
  },
  dps: {
    label: "DPS",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function DetailedChart() {
  const [data] = useAtom(detailedDataAtom);

  const finalDamage = data[data.length - 1]?.damage || 0;
  const avgDps = data[data.length - 1]?.dps || 0;

  return (
    <ChartCard
      title="Detailed Breakdown"
      description="Complete simulation data visualization"
      chartConfig={chartConfig}
      footer={
        <>
          <div className="flex gap-2 leading-none font-medium">
            Total damage: {finalDamage.toLocaleString()}{" "}
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Average DPS: {avgDps.toLocaleString()} over entire encounter
          </div>
        </>
      }
      className="h-[350px]"
    >
      <ComposedChart
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
          tickFormatter={(value) => `${value}s`}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            }
            if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}k`;
            }
            return value;
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${value}`}
        />
        <ChartTooltip
          content={ChartTooltipContent}
          labelFormatter={(value) => `${value}s`}
        />
        <ChartLegend content={ChartLegendContent} />
        <Area
          yAxisId="left"
          dataKey="damage"
          type="monotone"
          fill="var(--color-damage)"
          fillOpacity={0.2}
          stroke="var(--color-damage)"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          dataKey="dps"
          type="monotone"
          stroke="var(--color-dps)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          dataKey="mana"
          type="monotone"
          stroke="var(--color-mana)"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 5"
        />
      </ComposedChart>
    </ChartCard>
  );
}
