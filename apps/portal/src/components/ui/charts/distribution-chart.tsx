"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { useMemo } from "react";

import { Chart, chartColors, type ChartProps } from "./chart";

export type DistributionChartBinData = {
  label: string;
  value: number;
  /** Start of bin range (for percentile markers) */
  x0: number;
  /** End of bin range (for percentile markers) */
  x1: number;
};

export type DistributionChartPercentiles = {
  p50?: number;
  p75?: number;
  p99?: number;
  mean?: number;
};

export type DistributionChartProps = {
  /** Histogram bin data */
  data: DistributionChartBinData[];
  /** Chart dimensions */
  width?: number;
  height?: number;
  /** Margin around the chart */
  margin?: { top: number; right: number; bottom: number; left: number };
  /** Show grid lines */
  showGrid?: boolean;
  /** Percentile markers to display */
  percentiles?: DistributionChartPercentiles;
  /** Y axis label */
  yAxisLabel?: string;
  /** Bar color (defaults to chartColors[1]) */
  color?: string;
} & ChartProps;

/**
 * Distribution/histogram chart with optional percentile markers.
 */
export function DistributionChart({
  color,
  data,
  height = 240,
  margin = { bottom: 40, left: 50, right: 20, top: 20 },
  percentiles,
  showGrid = true,
  width = 520,
  yAxisLabel,
  ...props
}: DistributionChartProps) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const barColor = color ?? chartColors[1];

  const scales = useMemo(() => {
    if (data.length === 0) return null;

    return {
      x: scaleBand({
        domain: data.map((d) => d.label),
        padding: 0.2,
        range: [0, innerWidth],
      }),
      xLinear: scaleLinear({
        domain: [data[0]?.x0 ?? 0, data[data.length - 1]?.x1 ?? 0],
        range: [0, innerWidth],
      }),
      y: scaleLinear({
        domain: [0, Math.max(...data.map((d) => d.value))],
        nice: true,
        range: [innerHeight, 0],
      }),
    };
  }, [data, innerWidth, innerHeight]);

  if (!scales || data.length === 0) {
    return null;
  }

  const { x: xScale, xLinear, y: yScale } = scales;

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
                fill={barColor}
                fillOpacity={0.8}
                rx={2}
              />
            );
          })}

          {/* Percentile markers */}
          {percentiles?.p50 !== undefined && (
            <PercentileLine
              x={xLinear(percentiles.p50)}
              height={innerHeight}
              color={chartColors[2]}
              label="P50"
            />
          )}
          {percentiles?.p75 !== undefined && (
            <PercentileLine
              x={xLinear(percentiles.p75)}
              height={innerHeight}
              color={chartColors[3]}
              label="P75"
            />
          )}
          {percentiles?.p99 !== undefined && (
            <PercentileLine
              x={xLinear(percentiles.p99)}
              height={innerHeight}
              color={chartColors[1]}
              label="P99"
            />
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
            label={yAxisLabel}
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
