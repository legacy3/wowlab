"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { deviation, mean } from "d3-array";
// @ts-expect-error - d3-regression doesn't have types
import { regressionLinear } from "d3-regression";
import { useMemo, useState } from "react";
import { Box, HStack, Stack, VStack } from "styled-system/jsx";

import type { TimeSeriesPoint } from "@/lib/state";
import type { TimeRange } from "@/lib/state";

import { Badge, Button, Card, LineChart, Text } from "@/components/ui";
import { Chart, chartColors } from "@/components/ui/charts";
import * as Switch from "@/components/ui/switch";

// =============================================================================
// Range Selector
// =============================================================================

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
];

interface AnalyticsChartProps {
  data: TimeSeriesPoint[];
  error?: Error | null;
  height?: number;
  isLoading: boolean;
  title: string;
}

interface ChartCardProps {
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
}

// =============================================================================
// Time Series Chart
// =============================================================================

type DataPoint = { x: number; y: number };

interface ErrorStateProps {
  message: string;
}

interface NotConfiguredProps {
  service: string;
}

// =============================================================================
// Service Status Badge
// =============================================================================

interface RangeSelectorProps {
  onChange: (range: TimeRange) => void;
  value: TimeRange;
}

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[] | TimeSeriesPoint[][];
  error?: Error | null;
  height?: number;
  isLoading: boolean;
}

// =============================================================================
// Error State
// =============================================================================

/**
 * Chart with toggleable statistical analysis overlays.
 * Includes: trendline, moving average, std dev band, mean line.
 */
export function AnalyticsChart({
  data,
  error,
  height = 240,
  isLoading,
  title,
}: AnalyticsChartProps) {
  const [showTrendline, setShowTrendline] = useState(false);
  const [showMovingAvg, setShowMovingAvg] = useState(false);
  const [showStdDev, setShowStdDev] = useState(false);
  const [showMean, setShowMean] = useState(false);

  const hasAnalysis = showTrendline || showMovingAvg || showStdDev || showMean;

  // Normalize data
  const normalized = useMemo(
    () => data.map((p, i) => ({ x: i, y: p.y })),
    [data],
  );

  // Compute stats
  const stats = useMemo(() => {
    if (normalized.length < 2) return null;
    const values = normalized.map((d) => d.y);
    return {
      mean: mean(values) ?? 0,
      stdDev: deviation(values) ?? 0,
    };
  }, [normalized]);

  // Compute trendline
  const trendline = useMemo(() => {
    if (!showTrendline || normalized.length < 2) return null;
    const regression = regressionLinear()
      .x((d: DataPoint) => d.x)
      .y((d: DataPoint) => d.y);
    const result = regression(normalized);
    return {
      points: [
        { x: normalized[0].x, y: result.predict(normalized[0].x) },
        {
          x: normalized[normalized.length - 1].x,
          y: result.predict(normalized[normalized.length - 1].x),
        },
      ] as DataPoint[],
      rSquared: result.rSquared as number,
    };
  }, [normalized, showTrendline]);

  // Compute moving average
  const movingAverage = useMemo(() => {
    if (!showMovingAvg || normalized.length < 5) return null;
    const window = Math.min(5, Math.floor(normalized.length / 3));
    return normalized.map((d, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = normalized.slice(start, i + 1);
      const avg = mean(slice, (s) => s.y) ?? d.y;
      return { x: d.x, y: avg };
    });
  }, [normalized, showMovingAvg]);

  if (isLoading) {
    return (
      <Card.Root h="full">
        <Card.Header py="3">
          <Card.Title textStyle="sm">{title}</Card.Title>
        </Card.Header>
        <Card.Body pt="0">
          <Box
            h={height}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="fg.muted" textStyle="sm">
              Loading...
            </Text>
          </Box>
        </Card.Body>
      </Card.Root>
    );
  }

  if (error) {
    return (
      <Card.Root h="full">
        <Card.Header py="3">
          <Card.Title textStyle="sm">{title}</Card.Title>
        </Card.Header>
        <Card.Body pt="0">
          <Box
            h={height}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="fg.error" textStyle="sm">
              {error.message}
            </Text>
          </Box>
        </Card.Body>
      </Card.Root>
    );
  }

  if (normalized.length < 2) {
    return (
      <Card.Root h="full">
        <Card.Header py="3">
          <Card.Title textStyle="sm">{title}</Card.Title>
        </Card.Header>
        <Card.Body pt="0">
          <Box
            h={height}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="fg.muted" textStyle="sm">
              Not enough data points
            </Text>
          </Box>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root h="full">
      <Card.Header py="3">
        <HStack justify="space-between" flexWrap="wrap" gap="2">
          <Card.Title textStyle="sm">{title}</Card.Title>
          <HStack gap="3" flexWrap="wrap">
            <AnalysisToggle
              checked={showMean}
              onChange={setShowMean}
              label="Mean"
            />
            <AnalysisToggle
              checked={showTrendline}
              onChange={setShowTrendline}
              label="Trend"
            />
            <AnalysisToggle
              checked={showMovingAvg}
              onChange={setShowMovingAvg}
              label="MA"
            />
            <AnalysisToggle
              checked={showStdDev}
              onChange={setShowStdDev}
              label="±σ"
            />
          </HStack>
        </HStack>
      </Card.Header>
      <Card.Body pt="0">
        <Box h={height}>
          <ParentSize debounceTime={50}>
            {({ width }) =>
              width > 0 ? (
                <AnalysisChartInner
                  data={normalized}
                  width={width}
                  height={height}
                  trendline={trendline?.points}
                  movingAverage={movingAverage ?? undefined}
                  stdDev={showStdDev && stats ? stats : undefined}
                  showMean={showMean && stats ? stats.mean : undefined}
                />
              ) : null
            }
          </ParentSize>
        </Box>
        {hasAnalysis && stats && (
          <HStack gap="4" mt="2" justify="center" flexWrap="wrap">
            {(showMean || showStdDev) && (
              <StatBadge label="Mean" value={formatValue(stats.mean)} />
            )}
            {showStdDev && (
              <StatBadge
                label="Std Dev"
                value={`±${formatValue(stats.stdDev)}`}
              />
            )}
            {showTrendline && trendline && (
              <StatBadge label="R²" value={trendline.rSquared.toFixed(3)} />
            )}
          </HStack>
        )}
      </Card.Body>
    </Card.Root>
  );
}

export function ChartCard({ action, children, title }: ChartCardProps) {
  return (
    <Card.Root h="full">
      <Card.Header py="3">
        <HStack justify="space-between">
          <Card.Title textStyle="sm">{title}</Card.Title>
          {action}
        </HStack>
      </Card.Header>
      <Card.Body pt="0">{children}</Card.Body>
    </Card.Root>
  );
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <Card.Root>
      <Card.Body>
        <HStack gap="3">
          <Badge colorPalette="red">Error</Badge>
          <Text color="fg.error" textStyle="sm">
            {message}
          </Text>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

// =============================================================================
// Analytics Chart - Chart with toggleable analysis features
// =============================================================================

export function NotConfigured({ service }: NotConfiguredProps) {
  return (
    <Card.Root>
      <Card.Body>
        <Stack gap="2">
          <Text color="fg.muted" textStyle="sm">
            {service} historical data not available.
          </Text>
          <Text color="fg.subtle" textStyle="xs">
            Set GRAFANA_PROMETHEUS_URL and GRAFANA_PROMETHEUS_TOKEN to enable
            charts.
          </Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}

export function RangeSelector({ onChange, value }: RangeSelectorProps) {
  return (
    <HStack gap="1">
      {RANGES.map((r) => (
        <Button
          key={r.value}
          size="xs"
          variant={value === r.value ? "solid" : "plain"}
          onClick={() => onChange(r.value)}
        >
          {r.label}
        </Button>
      ))}
    </HStack>
  );
}

export function TimeSeriesChart({
  data,
  error,
  height = 200,
  isLoading,
}: TimeSeriesChartProps) {
  if (isLoading) {
    return (
      <Box
        h={height}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="fg.muted" textStyle="sm">
          Loading...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        h={height}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="fg.error" textStyle="sm">
          {error.message}
        </Text>
      </Box>
    );
  }

  const series = Array.isArray(data[0])
    ? (data as TimeSeriesPoint[][])
    : [data as TimeSeriesPoint[]];
  const hasData = series.some((s) => s.length >= 2);

  if (!hasData) {
    return (
      <Box
        h={height}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="fg.muted" textStyle="sm">
          Not enough data points
        </Text>
      </Box>
    );
  }

  // Normalize timestamps to indices for display
  const normalized = series.map((s) => s.map((p, i) => ({ x: i, y: p.y })));
  const chartData = normalized.length === 1 ? normalized[0] : normalized;

  return (
    <Box h={height}>
      <ParentSize debounceTime={50}>
        {({ width }) =>
          width > 0 ? (
            <LineChart
              data={chartData}
              width={width}
              height={height}
              showDots={series[0].length <= 30}
            />
          ) : null
        }
      </ParentSize>
    </Box>
  );
}

function AnalysisChartInner({
  data,
  height,
  movingAverage,
  showMean,
  stdDev,
  trendline,
  width,
}: {
  data: DataPoint[];
  height: number;
  movingAverage?: DataPoint[];
  showMean?: number;
  stdDev?: { mean: number; stdDev: number };
  trendline?: DataPoint[];
  width: number;
}) {
  const margin = { bottom: 30, left: 50, right: 10, top: 10 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xMax = Math.max(...data.map((d) => d.x));
  const yValues = data.map((d) => d.y);
  const yMin = Math.min(...yValues) * 0.95;
  const yMax = Math.max(...yValues) * 1.05;

  const xScale = scaleLinear({ domain: [0, xMax], range: [0, innerWidth] });
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

          {/* Mean line */}
          {showMean !== undefined && (
            <line
              x1={0}
              x2={innerWidth}
              y1={yScale(showMean)}
              y2={yScale(showMean)}
              stroke={chartColors[3]}
              strokeWidth={1}
              strokeDasharray="4,4"
              strokeOpacity={0.8}
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

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke={chartColors.axis}
            tickStroke={chartColors.axis}
            tickLabelProps={{ fill: chartColors.text, fontSize: 10 }}
            numTicks={5}
          />
          <AxisLeft
            scale={yScale}
            stroke={chartColors.axis}
            tickStroke={chartColors.axis}
            tickLabelProps={{ fill: chartColors.text, fontSize: 10 }}
            tickFormat={(v) => formatValue(Number(v))}
            numTicks={5}
          />
        </Group>
      </svg>
    </Chart>
  );
}

function AnalysisToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Switch.Root
      size="sm"
      checked={checked}
      onCheckedChange={(e) => onChange(e.checked)}
    >
      <Switch.Control />
      <Switch.Label>
        <Text textStyle="xs">{label}</Text>
      </Switch.Label>
      <Switch.HiddenInput />
    </Switch.Root>
  );
}

function formatValue(v: number): string {
  return v.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    notation: "compact",
  });
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <VStack gap="0">
      <Text textStyle="xs" color="fg.subtle">
        {label}
      </Text>
      <Text textStyle="sm" fontWeight="medium" color="fg.muted">
        {value}
      </Text>
    </VStack>
  );
}
