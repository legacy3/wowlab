"use client";

import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartCard } from "@/components/simulate/results/charts/chart-card";
import { formatInt, formatCompact } from "@/lib/format";

const mockThroughputData = Array.from({ length: 30 }, (_, i) => ({
  time: i,
  itersPerSec: Math.floor(800 + Math.random() * 400 + Math.sin(i / 3) * 200),
  memoryMB: Math.floor(120 + Math.random() * 80 + i * 2 + Math.sin(i / 3) * 20),
}));

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
  const data = mockThroughputData;

  const iters = data.map((d) => d.itersPerSec);
  const minIters = Math.min(...iters);
  const maxIters = Math.max(...iters);
  const avgIters = Math.round(iters.reduce((a, b) => a + b, 0) / iters.length);

  const mem = data.map((d) => d.memoryMB);
  const minMem = Math.min(...mem);
  const maxMem = Math.max(...mem);
  const avgMem = Math.round(mem.reduce((a, b) => a + b, 0) / mem.length);

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
