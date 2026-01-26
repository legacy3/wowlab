"use client";

import { bin, deviation, mean, quantile } from "d3-array";
// @ts-expect-error - d3-regression doesn't have types
import { regressionLinear } from "d3-regression";
import { useMemo, useState } from "react";
import { HStack, Stack, VStack } from "styled-system/jsx";

import {
  AnalysisChart,
  AreaChart,
  BarChart,
  DistributionChart,
  LineChart,
  PieChart,
  StatBadge,
} from "@/components/ui/charts";
import * as Switch from "@/components/ui/switch";
import { Text } from "@/components/ui/text";

import {
  DemoBox,
  DemoDescription,
  DemoLabel,
  fixtures,
  Section,
  Subsection,
} from "../../shared";

export function ChartsSection() {
  return (
    <Section id="charts" title="Charts" lazy minHeight={5012}>
      <Stack gap="10">
        <AnalysisDemo />
        <LineChartDemo />
        <BarChartDemo />
        <AreaChartDemo />
        <PieChartDemo />
      </Stack>
    </Section>
  );
}

// Generate stable data on module load to avoid hydration mismatch
const dpsTimelineData = Array.from({ length: 30 }, (_, i) => ({
  x: i,
  y: 45000 + Math.sin(i * 0.5) * 8000 + Math.sin(i * 1.3) * 4000 + i * 500,
}));

const dpsDistributionData = [
  52000, 54500, 48000, 56000, 51000, 49500, 55000, 53000, 50000, 57000, 52500,
  54000, 49000, 55500, 51500, 53500, 50500, 56500, 52000, 48500, 54500, 51000,
  55000, 49500, 53000, 50000, 56000, 52500, 54000, 51500,
];

type DataPoint = { x: number; y: number };

function AnalysisDemo() {
  const [showTrendline, setShowTrendline] = useState(true);
  const [showMovingAvg, setShowMovingAvg] = useState(false);
  const [showStdDev, setShowStdDev] = useState(false);
  const [showDataPoints, setShowDataPoints] = useState(true);
  const [showPercentiles, setShowPercentiles] = useState(true);

  const data = dpsTimelineData;
  const distribution = dpsDistributionData;

  const stats = useMemo(() => {
    const values = data.map((d) => d.y);
    const sorted = [...values].sort((a, b) => a - b);
    return {
      mean: mean(values) ?? 0,
      p25: quantile(sorted, 0.25) ?? 0,
      p50: quantile(sorted, 0.5) ?? 0,
      p75: quantile(sorted, 0.75) ?? 0,
      p99: quantile(sorted, 0.99) ?? 0,
      stdDev: deviation(values) ?? 0,
    };
  }, [data]);

  const trendline = useMemo(() => {
    const regression = regressionLinear()
      .x((d: DataPoint) => d.x)
      .y((d: DataPoint) => d.y);
    const result = regression(data);
    return {
      points: [
        { x: data[0].x, y: result.predict(data[0].x) },
        {
          x: data[data.length - 1].x,
          y: result.predict(data[data.length - 1].x),
        },
      ],
      rSquared: result.rSquared,
    };
  }, [data]);

  const movingAverage = useMemo(() => {
    const window = 5;
    return data.map((d, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = data.slice(start, i + 1);
      const avg = mean(slice, (s) => s.y) ?? d.y;
      return { x: d.x, y: avg };
    });
  }, [data]);

  const histogram = useMemo(() => {
    const bins = bin().thresholds(10)(distribution);
    return bins.map((b) => ({
      label: `${Math.round((b.x0 ?? 0) / 1000)}k`,
      value: b.length,
      x0: b.x0 ?? 0,
      x1: b.x1 ?? 0,
    }));
  }, [distribution]);

  const distStats = useMemo(() => {
    const sorted = [...distribution].sort((a, b) => a - b);
    return {
      mean: mean(distribution) ?? 0,
      p50: quantile(sorted, 0.5) ?? 0,
      p75: quantile(sorted, 0.75) ?? 0,
      p99: quantile(sorted, 0.99) ?? 0,
    };
  }, [distribution]);

  return (
    <Subsection title="Data Analysis">
      <DemoDescription>
        Interactive chart with statistical overlays. Toggle features on/off.
      </DemoDescription>
      <Stack gap="6">
        <DemoBox>
          <DemoLabel>DPS Timeline with Analysis</DemoLabel>
          <HStack gap="4" mb="4" flexWrap="wrap">
            <ToggleSwitch
              checked={showDataPoints}
              onCheckedChange={(e) => setShowDataPoints(e.checked)}
              label="Data Points"
            />
            <ToggleSwitch
              checked={showTrendline}
              onCheckedChange={(e) => setShowTrendline(e.checked)}
              label="Trendline"
            />
            <ToggleSwitch
              checked={showMovingAvg}
              onCheckedChange={(e) => setShowMovingAvg(e.checked)}
              label="Moving Avg"
            />
            <ToggleSwitch
              checked={showStdDev}
              onCheckedChange={(e) => setShowStdDev(e.checked)}
              label="Std Dev Band"
            />
          </HStack>
          <AnalysisChart
            data={data}
            trendline={showTrendline ? trendline.points : undefined}
            movingAverage={showMovingAvg ? movingAverage : undefined}
            stdDev={
              showStdDev
                ? { mean: stats.mean, stdDev: stats.stdDev }
                : undefined
            }
            showMean={showStdDev ? stats.mean : undefined}
            showDots={showDataPoints}
            width={520}
            height={280}
            xAxisLabel="Time (s)"
            formatY={(v) => `${v / 1000}k`}
          />
          <HStack gap="6" mt="3" flexWrap="wrap" justify="center">
            <StatBadge
              label="Mean"
              value={`${(stats.mean / 1000).toFixed(1)}k`}
            />
            <StatBadge
              label="Std Dev"
              value={`±${(stats.stdDev / 1000).toFixed(1)}k`}
            />
            {showTrendline && (
              <StatBadge label="R²" value={trendline.rSquared.toFixed(3)} />
            )}
          </HStack>
        </DemoBox>

        <DemoBox>
          <DemoLabel>DPS Distribution (30 pulls)</DemoLabel>
          <HStack gap="4" mb="4">
            <ToggleSwitch
              checked={showPercentiles}
              onCheckedChange={(e) => setShowPercentiles(e.checked)}
              label="Percentile Markers"
            />
          </HStack>
          <DistributionChart
            data={histogram}
            percentiles={showPercentiles ? distStats : undefined}
            width={520}
            height={240}
            yAxisLabel="Count"
          />
          {showPercentiles && (
            <HStack gap="6" mt="3" flexWrap="wrap" justify="center">
              <StatBadge
                label="P50"
                value={`${(distStats.p50 / 1000).toFixed(1)}k`}
                color="green"
              />
              <StatBadge
                label="P75"
                value={`${(distStats.p75 / 1000).toFixed(1)}k`}
                color="blue"
              />
              <StatBadge
                label="P99"
                value={`${(distStats.p99 / 1000).toFixed(1)}k`}
                color="amber"
              />
            </HStack>
          )}
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function AreaChartDemo() {
  return (
    <Subsection title="Area Chart">
      <DemoDescription>
        Area charts for volume and cumulative data.
      </DemoDescription>
      <Stack gap="6">
        <DemoBox>
          <DemoLabel>Default</DemoLabel>
          <AreaChart data={fixtures.charts.line} width={480} height={240} />
        </DemoBox>
        <DemoBox>
          <DemoLabel>Without line</DemoLabel>
          <AreaChart
            data={fixtures.charts.line}
            width={480}
            height={240}
            showLine={false}
          />
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function BarChartDemo() {
  return (
    <Subsection title="Bar Chart">
      <DemoDescription>Bar charts for categorical comparisons.</DemoDescription>
      <Stack gap="6">
        <DemoBox>
          <DemoLabel>Vertical</DemoLabel>
          <BarChart data={fixtures.charts.bar} width={480} height={240} />
        </DemoBox>
        <DemoBox>
          <DemoLabel>Gradient</DemoLabel>
          <BarChart
            data={fixtures.charts.bar}
            width={480}
            height={240}
            gradient
          />
        </DemoBox>
        <DemoBox>
          <DemoLabel>Horizontal</DemoLabel>
          <BarChart
            data={fixtures.charts.bar}
            width={480}
            height={280}
            horizontal
          />
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function LineChartDemo() {
  return (
    <Subsection title="Line Chart">
      <DemoDescription>
        Line charts for trends and time series data.
      </DemoDescription>
      <Stack gap="6">
        <DemoBox>
          <DemoLabel>Basic</DemoLabel>
          <LineChart data={fixtures.charts.line} width={480} height={240} />
        </DemoBox>
        <DemoBox>
          <DemoLabel>Multi-line</DemoLabel>
          <LineChart
            data={fixtures.charts.multiLine}
            width={480}
            height={240}
          />
        </DemoBox>
        <DemoBox>
          <DemoLabel>Without dots</DemoLabel>
          <LineChart
            data={fixtures.charts.line}
            width={480}
            height={240}
            showDots={false}
          />
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function PieChartDemo() {
  return (
    <Subsection title="Pie Chart">
      <DemoDescription>Pie and donut charts for proportions.</DemoDescription>
      <Stack gap="6">
        <DemoBox>
          <HStack gap="8" justify="center" flexWrap="wrap">
            <VStack gap="2">
              <Text textStyle="xs" color="fg.muted">
                Pie
              </Text>
              <PieChart data={fixtures.charts.pie} width={200} height={200} />
            </VStack>
            <VStack gap="2">
              <Text textStyle="xs" color="fg.muted">
                Donut
              </Text>
              <PieChart
                data={fixtures.charts.pie}
                width={200}
                height={200}
                donut
                centerLabel="100%"
              />
            </VStack>
          </HStack>
        </DemoBox>
      </Stack>
    </Subsection>
  );
}

function ToggleSwitch({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (details: { checked: boolean }) => void;
  label: string;
}) {
  return (
    <Switch.Root size="sm" checked={checked} onCheckedChange={onCheckedChange}>
      <Switch.Control />
      <Switch.Label>
        <Text textStyle="xs">{label}</Text>
      </Switch.Label>
      <Switch.HiddenInput />
    </Switch.Root>
  );
}
