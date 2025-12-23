"use client";

import {
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
} from "recharts";
import { Clock } from "lucide-react";
import { useAtom } from "jotai";

import { type ChartConfig, ChartTooltip } from "@/components/ui/chart";
import { ChartCard } from "../chart-card";
import { cooldownDataAtom } from "@/atoms";

const chartConfig = {
  Combustion: {
    label: "Combustion",
    color: "var(--chart-1)",
  },
  "Icy Veins": {
    label: "Icy Veins",
    color: "var(--chart-3)",
  },
  "Presence of Mind": {
    label: "Presence of Mind",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function CooldownChart() {
  const [data] = useAtom(cooldownDataAtom);

  const scatterData = data.map((event) => ({
    time: event.time,
    ability: event.ability,
    duration: event.duration,
    y:
      event.ability === "Combustion"
        ? 3
        : event.ability === "Icy Veins"
          ? 2
          : 1,
    fill:
      chartConfig[event.ability as keyof typeof chartConfig]?.color ||
      "var(--chart-1)",
  }));

  const totalCooldowns = data.length;

  return (
    <ChartCard
      title="Cooldown Timeline"
      description="Major cooldown usage throughout fight"
      chartConfig={chartConfig}
      footer={
        <>
          <div className="flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-primary" />
            <span className="tabular-nums">
              {totalCooldowns} cooldowns used
            </span>
          </div>
          <div className="text-muted-foreground text-xs">
            Strategic timing for maximum DPS
          </div>
        </>
      }
    >
      <ScatterChart
        accessibilityLayer
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          domain={[0, 300]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${value}s`}
        />
        <YAxis
          dataKey="y"
          type="number"
          domain={[0, 4]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          ticks={[1, 2, 3]}
          tickFormatter={(value) => {
            if (value === 3) {
              return "Combust";
            }
            if (value === 2) {
              return "Icy Veins";
            }
            if (value === 1) {
              return "PoM";
            }
            return "";
          }}
        />
        <ZAxis dataKey="duration" range={[100, 400]} />
        <ChartTooltip
          cursor={false}
          content={({ payload }) => {
            if (!payload || payload.length === 0) {
              return null;
            }
            const data = payload[0].payload;
            return (
              <div className="border-border/50 bg-background/95 backdrop-blur-sm rounded-lg border px-3 py-2.5 text-xs shadow-xl space-y-1.5">
                <div className="font-medium">{data.ability}</div>
                <div className="flex items-center justify-between gap-4 text-muted-foreground">
                  <span>Time</span>
                  <span className="font-mono tabular-nums">{data.time}s</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-muted-foreground">
                  <span>Duration</span>
                  <span className="font-mono tabular-nums">
                    {data.duration}s
                  </span>
                </div>
              </div>
            );
          }}
        />
        <Scatter data={scatterData} fill="var(--chart-1)" />
      </ScatterChart>
    </ChartCard>
  );
}
