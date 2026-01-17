"use client";

import { bin, deviation, mean, quantile } from "d3-array";
// @ts-expect-error - d3-regression doesn't have types
import { regressionLinear } from "d3-regression";
import { useMemo, useState } from "react";
import { HStack, Stack, VStack } from "styled-system/jsx";

import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
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
    <Section id="charts" title="Charts" lazy>
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

function AnalysisChart({
  data,
  height,
  movingAverage,
  showDots,
  stdDev,
  trendline,
  width,
}: {
  data: DataPoint[];
  trendline?: DataPoint[];
  movingAverage?: DataPoint[];
  stdDev?: { mean: number; stdDev: number };
  showDots: boolean;
  width: number;
  height: number;
}) {
  const margin = { bottom: 40, left: 60, right: 20, top: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.x))],
    range: [0, innerWidth],
  });

  const yMin = Math.min(...data.map((d) => d.y)) * 0.9;
  const yMax = Math.max(...data.map((d) => d.y)) * 1.1;

  const yScale = scaleLinear({
    domain: [yMin, yMax],
    nice: true,
    range: [innerHeight, 0],
  });

  return (
    <Chart>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke={chartColors.grid}
            strokeOpacity={0.5}
          />

          {/* Std Dev Band */}
          {stdDev && (
            <AreaClosed
              data={data}
              x={(d) => xScale(d.x)}
              y0={() => yScale(stdDev.mean - stdDev.stdDev)}
              y1={() => yScale(stdDev.mean + stdDev.stdDev)}
              yScale={yScale}
              fill={chartColors[3]}
              fillOpacity={0.15}
            />
          )}

          {/* Mean line when showing std dev */}
          {stdDev && (
            <line
              x1={0}
              x2={innerWidth}
              y1={yScale(stdDev.mean)}
              y2={yScale(stdDev.mean)}
              stroke={chartColors[3]}
              strokeWidth={1}
              strokeDasharray="4,4"
              strokeOpacity={0.6}
            />
          )}

          {/* Main data line */}
          <LinePath
            data={data}
            x={(d) => xScale(d.x)}
            y={(d) => yScale(d.y)}
            stroke={chartColors[1]}
            strokeWidth={2}
            curve={curveMonotoneX}
          />

          {/* Moving Average */}
          {movingAverage && (
            <LinePath
              data={movingAverage}
              x={(d) => xScale(d.x)}
              y={(d) => yScale(d.y)}
              stroke={chartColors[2]}
              strokeWidth={2}
              curve={curveMonotoneX}
            />
          )}

          {/* Trendline */}
          {trendline && (
            <LinePath
              data={trendline}
              x={(d) => xScale(d.x)}
              y={(d) => yScale(d.y)}
              stroke={chartColors[4]}
              strokeWidth={2}
              strokeDasharray="6,4"
            />
          )}

          {/* Data points */}
          {showDots &&
            data.map((d, i) => (
              <circle
                key={i}
                cx={xScale(d.x)}
                cy={yScale(d.y)}
                r={3}
                fill={chartColors[1]}
              />
            ))}

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke={chartColors.axis}
            tickStroke={chartColors.axis}
            tickLabelProps={{ fill: chartColors.text, fontSize: 11 }}
            label="Time (s)"
            labelProps={{
              fill: chartColors.text,
              fontSize: 11,
              textAnchor: "middle",
            }}
            labelOffset={15}
          />
          <AxisLeft
            scale={yScale}
            stroke={chartColors.axis}
            tickStroke={chartColors.axis}
            tickLabelProps={{ fill: chartColors.text, fontSize: 11 }}
            tickFormat={(v) => `${Number(v) / 1000}k`}
          />
        </Group>
      </svg>
    </Chart>
  );
}

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
      .x((d: { x: number; y: number }) => d.x)
      .y((d: { x: number; y: number }) => d.y);
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
            showDots={showDataPoints}
            width={520}
            height={280}
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

// Custom chart component with analysis overlays
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AreaClosed, Bar, LinePath } from "@visx/shape";

import { Chart, chartColors } from "@/components/ui/charts";

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

function DistributionChart({
  data,
  height,
  percentiles,
  width,
}: {
  data: { label: string; value: number; x0: number; x1: number }[];
  percentiles?: { mean: number; p50: number; p75: number; p99: number };
  width: number;
  height: number;
}) {
  const margin = { bottom: 40, left: 50, right: 20, top: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleBand({
    domain: data.map((d) => d.label),
    padding: 0.2,
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map((d) => d.value))],
    nice: true,
    range: [innerHeight, 0],
  });

  // Scale for percentile markers (based on actual DPS values)
  const xLinear = scaleLinear({
    domain: [data[0]?.x0 ?? 0, data[data.length - 1]?.x1 ?? 0],
    range: [0, innerWidth],
  });

  return (
    <Chart>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke={chartColors.grid}
            strokeOpacity={0.5}
          />

          {data.map((d) => {
            const barWidth = xScale.bandwidth();
            const barHeight = innerHeight - yScale(d.value);
            const barX = xScale(d.label) ?? 0;
            const barY = innerHeight - barHeight;

            return (
              <Bar
                key={d.label}
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={chartColors[1]}
                fillOpacity={0.8}
                rx={2}
              />
            );
          })}

          {/* Percentile markers */}
          {percentiles && (
            <>
              <PercentileLine
                x={xLinear(percentiles.p50)}
                height={innerHeight}
                color={chartColors[2]}
                label="P50"
              />
              <PercentileLine
                x={xLinear(percentiles.p75)}
                height={innerHeight}
                color={chartColors[3]}
                label="P75"
              />
              <PercentileLine
                x={xLinear(percentiles.p99)}
                height={innerHeight}
                color={chartColors[1]}
                label="P99"
              />
            </>
          )}

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke={chartColors.axis}
            tickStroke={chartColors.axis}
            tickLabelProps={{ fill: chartColors.text, fontSize: 10 }}
          />
          <AxisLeft
            scale={yScale}
            stroke={chartColors.axis}
            tickStroke={chartColors.axis}
            tickLabelProps={{ fill: chartColors.text, fontSize: 11 }}
            label="Count"
            labelProps={{
              fill: chartColors.text,
              fontSize: 11,
              textAnchor: "middle",
            }}
            labelOffset={30}
          />
        </Group>
      </svg>
    </Chart>
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

function PercentileLine({
  color,
  height,
  label,
  x,
}: {
  x: number;
  height: number;
  color: string;
  label: string;
}) {
  return (
    <g>
      <line
        x1={x}
        x2={x}
        y1={0}
        y2={height}
        stroke={color}
        strokeWidth={2}
        strokeDasharray="4,2"
      />
      <text
        x={x}
        y={-5}
        fill={color}
        fontSize={10}
        textAnchor="middle"
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
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

function StatBadge({
  color = "gray",
  label,
  value,
}: {
  label: string;
  value: string;
  color?: "gray" | "green" | "blue" | "amber";
}) {
  const colorMap = {
    amber: "amber.text",
    blue: "blue.text",
    gray: "fg.muted",
    green: "green.text",
  };
  return (
    <VStack gap="0">
      <Text textStyle="xs" color="fg.subtle">
        {label}
      </Text>
      <Text textStyle="sm" fontWeight="medium" color={colorMap[color]}>
        {value}
      </Text>
    </VStack>
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
