"use client";

import { useAtomValue } from "jotai";
import { Activity } from "lucide-react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/simulate/results/charts/chart-card";
import { formatInt, formatCompact } from "@/lib/format";
import { performanceDataAtom } from "@/atoms/computing";

const throughputConfig = {
  itersPerSec: {
    label: "Iterations/sec",
    color: "var(--chart-1)",
  },
  memoryMB: {
    label: "Memory (MB)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function PerformanceChartCard() {
  const data = useAtomValue(performanceDataAtom);

  const iters = data.map((d) => d.itersPerSec);
  const minIters = iters.length > 0 ? Math.min(...iters) : 0;
  const maxIters = iters.length > 0 ? Math.max(...iters) : 0;
  const avgIters =
    iters.length > 0
      ? Math.round(iters.reduce((a, b) => a + b, 0) / iters.length)
      : 0;

  const mem = data.map((d) => d.memoryMB);
  const minMem = mem.length > 0 ? Math.min(...mem) : 0;
  const maxMem = mem.length > 0 ? Math.max(...mem) : 0;
  const avgMem =
    mem.length > 0
      ? Math.round(mem.reduce((a, b) => a + b, 0) / mem.length)
      : 0;

  if (data.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Activity />
          </EmptyMedia>
          <EmptyTitle>No simulation running</EmptyTitle>
          <EmptyDescription>
            Start a simulation to see live performance metrics
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ChartCard
      title="Worker Performance"
      description="Throughput and memory usage over time"
      chartConfig={throughputConfig}
      footer={
        <div className="flex gap-8 text-xs">
          <div className="space-y-0.5">
            <div className="text-muted-foreground">Iterations/sec</div>
            <div className="font-medium tabular-nums">
              {formatInt(minIters)} / {formatInt(avgIters)} /{" "}
              {formatInt(maxIters)}
              <span className="text-muted-foreground ml-1">(min/avg/max)</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-muted-foreground">Memory (MB)</div>
            <div className="font-medium tabular-nums">
              {formatInt(minMem)} / {formatInt(avgMem)} / {formatInt(maxMem)}
              <span className="text-muted-foreground ml-1">(min/avg/max)</span>
            </div>
          </div>
        </div>
      }
    >
      <ComposedChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => `${v}s`}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatCompact}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => `${formatInt(v)} MB`}
        />
        <ChartTooltip cursor={false} content={ChartTooltipContent} />
        <Area
          yAxisId="left"
          dataKey="itersPerSec"
          type="monotone"
          fill="var(--color-itersPerSec)"
          fillOpacity={0.2}
          stroke="var(--color-itersPerSec)"
          strokeWidth={2}
        />
        <Line
          yAxisId="right"
          dataKey="memoryMB"
          type="monotone"
          stroke="var(--color-memoryMB)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartCard>
  );
}
