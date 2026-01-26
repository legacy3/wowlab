"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { deviation, mean, quantile } from "d3-array";
// @ts-expect-error - d3-regression doesn't have types
import { regressionLinear } from "d3-regression";
import { useMemo, useState } from "react";
import { Box, HStack, Stack } from "styled-system/jsx";

import type { TimeRange, TimeSeriesPoint } from "@/lib/state";

import { Badge, Button, Card, Text } from "@/components/ui";
import { Chart, chartColors } from "@/components/ui/charts";
import * as Switch from "@/components/ui/switch";

// =============================================================================
// Types
// =============================================================================

type DataPoint = { x: number; y: number };

interface ErrorStateProps {
  message: string;
}

interface MetricsChartProps {
  /** Single series or array of series */
  data: TimeSeriesPoint[] | TimeSeriesPoint[][];
  /** Error state */
  error?: Error | null;
  /** Chart height */
  height?: number;
  /** Loading state */
  isLoading: boolean;
  /** Series labels for legend (only for multi-series) */
  labels?: string[];
  /** Chart title */
  title: string;
}

interface NotConfiguredProps {
  service: string;
}

interface RangeSelectorProps {
  onChange: (range: TimeRange) => void;
  value: TimeRange;
}

// =============================================================================
// Constants
// =============================================================================

const RANGES: { label: string; value: TimeRange }[] = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
];

const COLORS = [
  chartColors[1],
  chartColors[2],
  chartColors[3],
  chartColors[4],
  chartColors[5],
];

// =============================================================================
// MetricsChart - One chart for all metrics
// =============================================================================

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
// ChartSvg - Internal SVG renderer
// =============================================================================

/**
 * Single reusable chart component for all metrics.
 * Supports single or multi-series data with optional analysis overlays.
 */
export function MetricsChart({
  data,
  error,
  height = 240,
  isLoading,
  labels,
  title,
}: MetricsChartProps) {
  const [showTrendline, setShowTrendline] = useState(false);
  const [showMovingAvg, setShowMovingAvg] = useState(false);
  const [showStdDev, setShowStdDev] = useState(false);
  const [showMean, setShowMean] = useState(false);
  const [showQuantiles, setShowQuantiles] = useState(false);

  // Normalize to array of series
  const series = useMemo(() => {
    if (data.length === 0) return [];
    return Array.isArray(data[0])
      ? (data as TimeSeriesPoint[][])
      : [data as TimeSeriesPoint[]];
  }, [data]);

  // Flatten all data for stats
  const allData = useMemo(() => series.flat(), [series]);

  // Stats computed from all data
  const stats = useMemo(() => {
    if (allData.length < 2) return null;
    const values = allData.map((d) => d.y);
    const sorted = [...values].sort((a, b) => a - b);
    return {
      mean: mean(values) ?? 0,
      p25: quantile(sorted, 0.25) ?? 0,
      p50: quantile(sorted, 0.5) ?? 0,
      p75: quantile(sorted, 0.75) ?? 0,
      p99: quantile(sorted, 0.99) ?? 0,
      stdDev: deviation(values) ?? 0,
    };
  }, [allData]);

  // Trendline from first series
  const trendline = useMemo(() => {
    if (!showTrendline || !series[0] || series[0].length < 2) return undefined;
    const d = series[0];
    const regression = regressionLinear()
      .x((p: DataPoint) => p.x)
      .y((p: DataPoint) => p.y);
    const result = regression(d);
    return {
      points: [
        { x: d[0].x, y: result.predict(d[0].x) },
        { x: d[d.length - 1].x, y: result.predict(d[d.length - 1].x) },
      ] as DataPoint[],
      rSquared: result.rSquared as number,
    };
  }, [series, showTrendline]);

  // Moving average from first series
  const movingAverage = useMemo(() => {
    if (!showMovingAvg || !series[0] || series[0].length < 5) return undefined;
    const d = series[0];
    const window = Math.min(5, Math.floor(d.length / 3));
    return d.map((point, i) => {
      const start = Math.max(0, i - window + 1);
      const slice = d.slice(start, i + 1);
      const avg = mean(slice, (s) => s.y) ?? point.y;
      return { x: point.x, y: avg };
    });
  }, [series, showMovingAvg]);

  const hasAnalysis =
    showTrendline || showMovingAvg || showStdDev || showMean || showQuantiles;

  // Loading state
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

  // Error state
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

  // No data state
  if (allData.length < 2) {
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
          <HStack gap="2">
            <Card.Title textStyle="sm">{title}</Card.Title>
            {labels && series.length > 1 && (
              <HStack gap="1">
                {labels.map((label, i) => (
                  <Box
                    key={i}
                    px="1.5"
                    py="0.5"
                    rounded="sm"
                    bg="bg.subtle"
                    display="flex"
                    alignItems="center"
                    gap="1"
                  >
                    <Box
                      w="2"
                      h="2"
                      rounded="full"
                      bg={COLORS[i % COLORS.length]}
                    />
                    <Text textStyle="xs" color="fg.muted">
                      {label}
                    </Text>
                  </Box>
                ))}
              </HStack>
            )}
          </HStack>
          <HStack gap="3" flexWrap="wrap">
            <Toggle checked={showMean} onChange={setShowMean} label="Mean" />
            <Toggle
              checked={showTrendline}
              onChange={setShowTrendline}
              label="Trend"
            />
            <Toggle
              checked={showMovingAvg}
              onChange={setShowMovingAvg}
              label="MA"
            />
            <Toggle checked={showStdDev} onChange={setShowStdDev} label="±σ" />
            <Toggle
              checked={showQuantiles}
              onChange={setShowQuantiles}
              label="Pct"
            />
          </HStack>
        </HStack>
      </Card.Header>
      <Card.Body pt="0">
        <Box h={height}>
          <ParentSize debounceTime={50}>
            {({ width }) =>
              width > 0 ? (
                <ChartSvg
                  series={series}
                  width={width}
                  height={height}
                  showMean={showMean && stats ? stats.mean : undefined}
                  stdDev={
                    showStdDev && stats
                      ? { mean: stats.mean, stdDev: stats.stdDev }
                      : undefined
                  }
                  trendline={trendline?.points}
                  movingAverage={movingAverage}
                  quantiles={
                    showQuantiles && stats
                      ? {
                          p25: stats.p25,
                          p50: stats.p50,
                          p75: stats.p75,
                          p99: stats.p99,
                        }
                      : undefined
                  }
                />
              ) : null
            }
          </ParentSize>
        </Box>
        <Box h="10" mt="2">
          {hasAnalysis && stats && (
            <HStack gap="4" justify="center" flexWrap="wrap">
              {(showMean || showStdDev) && (
                <Stat label="Mean" value={formatValue(stats.mean)} />
              )}
              {showStdDev && (
                <Stat label="Std Dev" value={`±${formatValue(stats.stdDev)}`} />
              )}
              {showTrendline && trendline && (
                <Stat label="R²" value={trendline.rSquared.toFixed(3)} />
              )}
              {showQuantiles && (
                <>
                  <Stat
                    label="P50"
                    value={formatValue(stats.p50)}
                    color="green.text"
                  />
                  <Stat
                    label="P75"
                    value={formatValue(stats.p75)}
                    color="blue.text"
                  />
                  <Stat
                    label="P99"
                    value={formatValue(stats.p99)}
                    color="amber.text"
                  />
                </>
              )}
            </HStack>
          )}
        </Box>
      </Card.Body>
    </Card.Root>
  );
}

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

// =============================================================================
// Shared Components
// =============================================================================

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

function ChartSvg({
  height,
  movingAverage,
  quantiles,
  series,
  showMean,
  stdDev,
  trendline,
  width,
}: {
  series: TimeSeriesPoint[][];
  width: number;
  height: number;
  showMean?: number;
  stdDev?: { mean: number; stdDev: number };
  trendline?: DataPoint[];
  movingAverage?: DataPoint[];
  quantiles?: { p25?: number; p50?: number; p75?: number; p99?: number };
}) {
  const margin = { bottom: 30, left: 50, right: 40, top: 10 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const allData = series.flat();
  if (allData.length === 0) return null;

  const xMin = Math.min(...allData.map((d) => d.x));
  const xMax = Math.max(...allData.map((d) => d.x));
  const yMin = Math.min(...allData.map((d) => d.y)) * 0.95;
  const yMax = Math.max(...allData.map((d) => d.y)) * 1.05;

  const xScale = scaleTime({
    domain: [new Date(xMin * 1000), new Date(xMax * 1000)],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [yMin, yMax],
    nice: true,
    range: [innerHeight, 0],
  });

  const getX = (d: DataPoint) => xScale(new Date(d.x * 1000));

  const formatTimeTick = (date: Date) => {
    const range = xMax - xMin;
    if (range > 86400 * 2) {
      return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      });
    }
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          {stdDev && series[0] && series[0].length > 0 && (
            <AreaClosed
              data={series[0]}
              x={getX}
              y0={() => yScale(stdDev.mean - stdDev.stdDev)}
              y1={() => yScale(stdDev.mean + stdDev.stdDev)}
              yScale={yScale}
              fill={chartColors[3]}
              fillOpacity={0.15}
            />
          )}

          {/* Quantile lines */}
          {quantiles?.p25 !== undefined && (
            <HorizontalLine
              y={yScale(quantiles.p25)}
              width={innerWidth}
              color={chartColors[2]}
              label="P25"
              opacity={0.5}
            />
          )}
          {quantiles?.p50 !== undefined && (
            <HorizontalLine
              y={yScale(quantiles.p50)}
              width={innerWidth}
              color={chartColors[2]}
              label="P50"
            />
          )}
          {quantiles?.p75 !== undefined && (
            <HorizontalLine
              y={yScale(quantiles.p75)}
              width={innerWidth}
              color={chartColors[3]}
              label="P75"
            />
          )}
          {quantiles?.p99 !== undefined && (
            <HorizontalLine
              y={yScale(quantiles.p99)}
              width={innerWidth}
              color={chartColors[1]}
              label="P99"
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

          {/* Data lines */}
          {series.map((line, i) => (
            <LinePath
              key={i}
              data={line}
              x={getX}
              y={(d) => yScale(d.y)}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              curve={curveMonotoneX}
            />
          ))}

          {/* Moving Average */}
          {movingAverage && (
            <LinePath
              data={movingAverage}
              x={getX}
              y={(d) => yScale(d.y)}
              stroke={chartColors[2]}
              strokeWidth={2}
              strokeOpacity={0.7}
              curve={curveMonotoneX}
            />
          )}

          {/* Trendline */}
          {trendline && (
            <LinePath
              data={trendline}
              x={getX}
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
            tickFormat={(v) => formatTimeTick(v as Date)}
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

function formatValue(v: number): string {
  return v.toLocaleString(undefined, {
    maximumFractionDigits: 1,
    notation: "compact",
  });
}

// =============================================================================
// Helpers
// =============================================================================

function HorizontalLine({
  color,
  label,
  opacity = 0.8,
  width,
  y,
}: {
  y: number;
  width: number;
  color: string;
  label: string;
  opacity?: number;
}) {
  return (
    <g>
      <line
        x1={0}
        x2={width}
        y1={y}
        y2={y}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="6,3"
        strokeOpacity={opacity}
      />
      <text
        x={width + 4}
        y={y + 3}
        fill={color}
        fontSize={9}
        fontWeight="500"
        opacity={opacity}
      >
        {label}
      </text>
    </g>
  );
}

function Stat({
  color,
  label,
  value,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Stack gap="0" alignItems="center">
      <Text textStyle="xs" color="fg.subtle">
        {label}
      </Text>
      <Text textStyle="sm" fontWeight="medium" color={color ?? "fg.muted"}>
        {value}
      </Text>
    </Stack>
  );
}

function Toggle({
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
