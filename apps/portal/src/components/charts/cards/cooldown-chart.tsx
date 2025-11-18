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
          <div className="flex gap-2 leading-none font-medium">
            {totalCooldowns} cooldowns used <Clock className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
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
              <div className="border-border/50 bg-background rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                <div className="font-medium">{data.ability}</div>
                <div className="text-muted-foreground">Time: {data.time}s</div>
                <div className="text-muted-foreground">
                  Duration: {data.duration}s
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
