"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { ChartLine } from "lucide-react";
import { useMemo, useState } from "react";
import { Box, HStack, Stack } from "styled-system/jsx";

import type { TimeRange, TimeSeriesPoint } from "@/lib/state";

import {
  Badge,
  Button,
  Card,
  Checkbox,
  IconButton,
  Popover,
  Text,
} from "@/components/ui";
import { Chart, chartColors } from "@/components/ui/charts";
import { useCommon } from "@/providers";

type AnalysisKey = "mean" | "trend" | "ma" | "stdDev" | "quantiles";

interface AnalysisOption {
  description: string;
  key: AnalysisKey;
  label: string;
}

type DataPoint = { x: number; y: number };

interface ErrorStateProps {
  message: string;
}

interface MetricsChartProps {
  data: TimeSeriesPoint[] | TimeSeriesPoint[][];
  error?: Error | null;
  height?: number;
  isLoading: boolean;
  labels?: string[];
  title: string;
}

interface NotConfiguredProps {
  service: string;
}

interface RangeSelectorProps {
  onChange: (range: TimeRange) => void;
  value: TimeRange;
}

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

const ANALYSIS_OPTIONS: AnalysisOption[] = [
  { description: "Average value line", key: "mean", label: "Mean" },
  { description: "Linear regression", key: "trend", label: "Trendline" },
  { description: "5-point smoothing", key: "ma", label: "Moving Avg" },
  { description: "Deviation band (±σ)", key: "stdDev", label: "Std Dev" },
  { description: "P25/P50/P75/P99", key: "quantiles", label: "Percentiles" },
];

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

export function MetricsChart({
  data,
  error,
  height = 240,
  isLoading,
  labels,
  title,
}: MetricsChartProps) {
  const common = useCommon();
  const [enabled, setEnabled] = useState<Set<AnalysisKey>>(new Set());

  const toggle = (key: AnalysisKey) => {
    setEnabled((prev) => {
      const next = new Set(prev);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  };

  const series = useMemo(() => {
    if (data.length === 0) {
      return [];
    }

    return Array.isArray(data[0])
      ? (data as TimeSeriesPoint[][])
      : [data as TimeSeriesPoint[]];
  }, [data]);

  const allData = useMemo(() => series.flat(), [series]);

  const stats = useMemo(() => {
    if (allData.length < 2) {
      return null;
    }

    const values = new Float64Array(allData.map((d) => d.y));
    const wasmStats = common.computeStats(values);

    return {
      mean: wasmStats.mean,
      p25: common.computePercentile(values, 25),
      p50: common.computePercentile(values, 50),
      p75: common.computePercentile(values, 75),
      p99: common.computePercentile(values, 99),
      stdDev: wasmStats.stdDev,
    };
  }, [allData, common]);

  const trendline = useMemo(() => {
    if (!enabled.has("trend") || !series[0] || series[0].length < 2) {
      return undefined;
    }

    const d = series[0];
    const x = new Float64Array(d.map((p) => p.x));
    const y = new Float64Array(d.map((p) => p.y));
    const result = common.computeLinearRegression(x, y);

    if (!result) {
      return undefined;
    }

    return {
      points: [
        { x: d[0].x, y: result.slope * d[0].x + result.intercept },
        {
          x: d[d.length - 1].x,
          y: result.slope * d[d.length - 1].x + result.intercept,
        },
      ] as DataPoint[],
      rSquared: result.rSquared,
    };
  }, [series, enabled, common]);

  const movingAverage = useMemo(() => {
    if (!enabled.has("ma") || !series[0] || series[0].length < 5) {
      return undefined;
    }

    const d = series[0];
    const window = Math.min(5, Math.floor(d.length / 3));
    const yValues = new Float64Array(d.map((p) => p.y));
    const smaValues = common.computeSma(yValues, window);

    return d.map((point, i) => ({
      x: point.x,
      y: smaValues[i],
    }));
  }, [series, enabled, common]);

  const hasAnalysis = enabled.size > 0;

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
        <HStack justify="space-between" gap="2">
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
          <AnalysisPopover enabled={enabled} onToggle={toggle} />
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
                  showMean={
                    enabled.has("mean") && stats ? stats.mean : undefined
                  }
                  stdDev={
                    enabled.has("stdDev") && stats
                      ? { mean: stats.mean, stdDev: stats.stdDev }
                      : undefined
                  }
                  trendline={trendline?.points}
                  movingAverage={movingAverage}
                  quantiles={
                    enabled.has("quantiles") && stats
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
              {(enabled.has("mean") || enabled.has("stdDev")) && (
                <Stat label="Mean" value={formatValue(stats.mean)} />
              )}
              {enabled.has("stdDev") && (
                <Stat label="Std Dev" value={`±${formatValue(stats.stdDev)}`} />
              )}
              {enabled.has("trend") && trendline && (
                <Stat label="R²" value={trendline.rSquared.toFixed(3)} />
              )}
              {enabled.has("quantiles") && (
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

function AnalysisPopover({
  enabled,
  onToggle,
}: {
  enabled: Set<AnalysisKey>;
  onToggle: (key: AnalysisKey) => void;
}) {
  return (
    <Popover.Root positioning={{ placement: "bottom-end" }}>
      <Popover.Trigger asChild>
        <IconButton
          size="xs"
          variant={enabled.size > 0 ? "subtle" : "plain"}
          aria-label="Analysis options"
        >
          <ChartLine size={14} />
          {enabled.size > 0 && (
            <Box
              position="absolute"
              top="-1"
              right="-1"
              w="3.5"
              h="3.5"
              rounded="full"
              bg="accent.default"
              color="accent.fg"
              fontSize="2xs"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {enabled.size}
            </Box>
          )}
        </IconButton>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content w="56">
          <Popover.Arrow>
            <Popover.ArrowTip />
          </Popover.Arrow>
          <Stack gap="1" p="2">
            <Text textStyle="xs" fontWeight="medium" color="fg.muted" mb="1">
              Analysis Overlays
            </Text>
            {ANALYSIS_OPTIONS.map((opt) => (
              <Checkbox.Root
                key={opt.key}
                size="sm"
                checked={enabled.has(opt.key)}
                onCheckedChange={() => onToggle(opt.key)}
              >
                <Checkbox.Control />
                <Checkbox.Label>
                  <Stack gap="0">
                    <Text textStyle="sm">{opt.label}</Text>
                    <Text textStyle="xs" color="fg.muted">
                      {opt.description}
                    </Text>
                  </Stack>
                </Checkbox.Label>
                <Checkbox.HiddenInput />
              </Checkbox.Root>
            ))}
          </Stack>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
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
  if (allData.length === 0) {
    return null;
  }

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

          {stdDev && series[0] && series[0].length > 0 && (
            <AreaClosed
              data={series[0]}
              x={getX}
              y0={() => yScale(stdDev.mean - stdDev.stdDev)}
              y1={() => yScale(stdDev.mean + stdDev.stdDev)}
              yScale={yScale}
              fill="var(--colors-fg-muted)"
              fillOpacity={0.15}
            />
          )}

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
