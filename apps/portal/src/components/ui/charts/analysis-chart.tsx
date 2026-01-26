"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleLinear, scaleTime } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { useMemo } from "react";

import { Chart, chartColors, type ChartProps } from "./chart";

export type AnalysisChartDataPoint = { x: number; y: number };

export type AnalysisChartProps = {
  /** Data points to render (x = unix timestamp in seconds, y = value) */
  data: AnalysisChartDataPoint[];
  /** Chart dimensions */
  width?: number;
  height?: number;
  /** Margin around the chart */
  margin?: { top: number; right: number; bottom: number; left: number };
  /** Show grid lines */
  showGrid?: boolean;
  /** Show data point dots */
  showDots?: boolean;
  /** Format Y axis values */
  formatY?: (value: number) => string;
  /** X axis label */
  xAxisLabel?: string;
  /** Y axis label */
  yAxisLabel?: string;
  /** Use time scale for x-axis (treats x values as unix timestamps) */
  timeScale?: boolean;
  /** Trendline points (2 points for start/end) */
  trendline?: AnalysisChartDataPoint[];
  /** Moving average line */
  movingAverage?: AnalysisChartDataPoint[];
  /** Standard deviation band */
  stdDev?: { mean: number; stdDev: number };
  /** Show mean line */
  showMean?: number;
  /** Quantile lines to display */
  quantiles?: {
    p25?: number;
    p50?: number;
    p75?: number;
    p99?: number;
  };
  /** Data line color (defaults to chartColors[1]) */
  color?: string;
} & ChartProps;

/**
 * Analysis chart with optional statistical overlays.
 * Supports trendline, moving average, std dev band, mean line, and quantile lines.
 */
export function AnalysisChart({
  color,
  data,
  formatY,
  height = 280,
  margin = { bottom: 40, left: 60, right: 20, top: 20 },
  movingAverage,
  quantiles,
  showDots = true,
  showGrid = true,
  showMean,
  stdDev,
  timeScale = false,
  trendline,
  width = 520,
  xAxisLabel,
  yAxisLabel,
  ...props
}: AnalysisChartProps) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const lineColor = color ?? chartColors[1];

  const scales = useMemo(() => {
    if (data.length === 0) return null;

    const xValues = data.map((d) => d.x);
    const yValues = data.map((d) => d.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues) * 0.95;
    const yMax = Math.max(...yValues) * 1.05;

    const xScale = timeScale
      ? scaleTime({
          domain: [new Date(xMin * 1000), new Date(xMax * 1000)],
          range: [0, innerWidth],
        })
      : scaleLinear({ domain: [xMin, xMax], range: [0, innerWidth] });

    return {
      x: xScale,
      y: scaleLinear({
        domain: [yMin, yMax],
        nice: true,
        range: [innerHeight, 0],
      }),
    };
  }, [data, innerWidth, innerHeight, timeScale]);

  if (!scales || data.length === 0) {
    return null;
  }

  const { x: xScale, y: yScale } = scales;

  // Helper to get x position - handles both time and linear scales
  const getX = (d: AnalysisChartDataPoint): number => {
    if (timeScale) {
      return (xScale as ReturnType<typeof scaleTime>)(
        new Date(d.x * 1000),
      ) as number;
    }

    return (xScale as ReturnType<typeof scaleLinear>)(d.x) as number;
  };

  // Format time ticks based on range
  const formatTimeTick = (date: Date) => {
    const range = data[data.length - 1].x - data[0].x;
    if (range > 86400 * 2) {
      // > 2 days: show date
      return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      });
    } else if (range > 3600 * 6) {
      // > 6 hours: show date + hour
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      // < 6 hours: show time
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <Chart {...props}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {showGrid && (
            <GridRows
              scale={yScale}
              width={innerWidth}
              stroke={chartColors.grid}
              strokeOpacity={0.5}
            />
          )}

          {/* Std Dev Band */}
          {stdDev && (
            <AreaClosed
              data={data}
              x={getX}
              y0={() => yScale(stdDev.mean - stdDev.stdDev)}
              y1={() => yScale(stdDev.mean + stdDev.stdDev)}
              yScale={yScale}
              fill="var(--colors-fg-muted)"
              fillOpacity={0.15}
            />
          )}

          {/* Quantile lines */}
          {quantiles?.p25 !== undefined && (
            <QuantileLine
              y={yScale(quantiles.p25)}
              width={innerWidth}
              color={chartColors[2]}
              label="P25"
              opacity={0.5}
            />
          )}
          {quantiles?.p50 !== undefined && (
            <QuantileLine
              y={yScale(quantiles.p50)}
              width={innerWidth}
              color={chartColors[2]}
              label="P50"
            />
          )}
          {quantiles?.p75 !== undefined && (
            <QuantileLine
              y={yScale(quantiles.p75)}
              width={innerWidth}
              color={chartColors[3]}
              label="P75"
            />
          )}
          {quantiles?.p99 !== undefined && (
            <QuantileLine
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

          {/* Main data line */}
          <LinePath
            data={data}
            x={getX}
            y={(d) => yScale(d.y)}
            stroke={lineColor}
            strokeWidth={2}
            curve={curveMonotoneX}
          />

          {/* Data points */}
          {showDots &&
            data.map((d, i) => (
              <circle
                key={i}
                cx={getX(d)}
                cy={yScale(d.y)}
                r={3}
                fill={lineColor}
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
            tickFormat={
              timeScale ? (v) => formatTimeTick(v as Date) : undefined
            }
            label={xAxisLabel}
            labelProps={{
              fill: chartColors.text,
              fontSize: 11,
              textAnchor: "middle",
            }}
            labelOffset={15}
            numTicks={5}
          />
          <AxisLeft
            scale={yScale}
            stroke={chartColors.axis}
            tickStroke={chartColors.axis}
            tickLabelProps={{ fill: chartColors.text, fontSize: 10 }}
            tickFormat={formatY ? (v) => formatY(Number(v)) : undefined}
            label={yAxisLabel}
            labelProps={{
              fill: chartColors.text,
              fontSize: 11,
              textAnchor: "middle",
            }}
            labelOffset={40}
            numTicks={5}
          />
        </Group>
      </svg>
    </Chart>
  );
}

function QuantileLine({
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
