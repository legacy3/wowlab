"use client";

import { useMemo, useState } from "react";
import { HStack, Stack, VStack } from "styled-system/jsx";

import { Switch, Text } from "@/components/ui";
import {
  AnalysisChart,
  AreaChart,
  BarChart,
  DistributionChart,
  LineChart,
  PieChart,
  StatBadge,
} from "@/components/ui/charts";
import { useCommon } from "@/providers";

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

function AnalysisDemo() {
  const common = useCommon();
  const [showTrendline, setShowTrendline] = useState(true);
  const [showMovingAvg, setShowMovingAvg] = useState(false);
  const [showStdDev, setShowStdDev] = useState(false);
  const [showDataPoints, setShowDataPoints] = useState(true);
  const [showPercentiles, setShowPercentiles] = useState(true);

  const data = dpsTimelineData;
  const distribution = dpsDistributionData;

  const stats = useMemo(() => {
    const values = new Float64Array(data.map((d) => d.y));
    const wasmStats = common.computeStats(values);
    return {
      mean: wasmStats.mean,
      p25: common.computePercentile(values, 25),
      p50: common.computePercentile(values, 50),
      p75: common.computePercentile(values, 75),
      p99: common.computePercentile(values, 99),
      stdDev: wasmStats.stdDev,
    };
  }, [data, common]);

  const trendline = useMemo(() => {
    const x = new Float64Array(data.map((d) => d.x));
    const y = new Float64Array(data.map((d) => d.y));
    const result = common.computeLinearRegression(x, y);

    if (!result) {
      return { points: [], rSquared: 0 };
    }

    return {
      points: [
        { x: data[0].x, y: result.slope * data[0].x + result.intercept },
        {
          x: data[data.length - 1].x,
          y: result.slope * data[data.length - 1].x + result.intercept,
        },
      ],
      rSquared: result.rSquared,
    };
  }, [data, common]);

  const movingAverage = useMemo(() => {
    const yValues = new Float64Array(data.map((d) => d.y));
    const smaValues = common.computeSma(yValues, 5);
    return data.map((d, i) => ({ x: d.x, y: smaValues[i] }));
  }, [data, common]);

  const histogram = useMemo(() => {
    const bins = createHistogram(distribution, 10);
    return bins.map((b) => ({
      label: `${Math.round(b.x0 / 1000)}k`,
      value: b.length,
      x0: b.x0,
      x1: b.x1,
    }));
  }, [distribution]);

  const distStats = useMemo(() => {
    const values = new Float64Array(distribution);
    const wasmStats = common.computeStats(values);
    return {
      mean: wasmStats.mean,
      p50: common.computePercentile(values, 50),
      p75: common.computePercentile(values, 75),
      p99: common.computePercentile(values, 99),
    };
  }, [distribution, common]);

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

// Simple histogram binning function to replace d3-array bin
function createHistogram(data: number[], numBins: number) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / numBins;

  const bins: { x0: number; x1: number; length: number }[] = [];
  for (let i = 0; i < numBins; i++) {
    const x0 = min + i * binWidth;
    const x1 = min + (i + 1) * binWidth;
    const count = data.filter(
      (d) => d >= x0 && (i === numBins - 1 ? d <= x1 : d < x1),
    ).length;
    bins.push({ length: count, x0, x1 });
  }

  return bins;
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
