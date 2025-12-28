"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Activity } from "lucide-react";
import { useAtom } from "jotai";

import {
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "../chart-card";
import { abilityDataAtom } from "@/atoms";
import { formatInt } from "@/lib/format";

const chartConfig = {
  casts: {
    label: "Casts",
    color: "var(--chart-1)",
  },
  damage: {
    label: "Damage",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function AbilityChart() {
  const [data] = useAtom(abilityDataAtom);

  const totalCasts = data.reduce((sum, d) => sum + d.casts, 0);
  const totalDamage = data.reduce((sum, d) => sum + d.damage, 0);

  return (
    <ChartCard
      title="Ability Usage"
      description="Cast frequency and damage contribution"
      chartConfig={chartConfig}
      footer={
        <>
          <div className="flex items-center gap-2 font-medium">
            <Activity className="h-4 w-4 text-primary" />
            <span className="tabular-nums">
              Total: {formatInt(totalCasts)} casts
            </span>
          </div>
          <div className="text-muted-foreground text-xs">
            Damage:{" "}
            <span className="tabular-nums">{formatInt(totalDamage)}</span>
          </div>
        </>
      }
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="ability"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 8)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => formatInt(value)}
        />
        <ChartTooltip content={ChartTooltipContent} />
        <Bar dataKey="casts" fill="var(--color-casts)" radius={4} />
      </BarChart>
    </ChartCard>
  );
}
