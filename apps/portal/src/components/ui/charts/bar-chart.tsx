"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { LinearGradient } from "@visx/gradient";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";
import { Text } from "@visx/text";
import { useId } from "react";

import { Chart, chartColors, type ChartProps } from "./chart";

type BarChartProps = {
  data: BarDataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showGrid?: boolean;
  horizontal?: boolean;
  gradient?: boolean;
  color?: string;
} & ChartProps;

type BarDataPoint = { label: string; value: number };

export function BarChart({
  color,
  data,
  gradient = false,
  height = 300,
  horizontal = false,
  margin = { bottom: 40, left: 50, right: 20, top: 20 },
  showGrid = true,
  width = 500,
  ...props
}: BarChartProps) {
  const barColor = color ?? chartColors[1];
  const reactId = useId();
  const gradientId = `bar-gradient-${reactId}`;

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxValue = Math.max(...data.map((d) => d.value));

  if (horizontal) {
    const yScale = scaleBand({
      domain: data.map((d) => d.label),
      padding: 0.3,
      range: [0, innerHeight],
    });

    const xScale = scaleLinear({
      domain: [0, maxValue],
      nice: true,
      range: [0, innerWidth],
    });

    return (
      <Chart {...props}>
        <svg width={width} height={height}>
          {gradient && (
            <LinearGradient
              id={gradientId}
              from={chartColors[1]}
              to={chartColors[2]}
            />
          )}
          <Group left={margin.left} top={margin.top}>
            {data.map((d) => {
              const barWidth = xScale(d.value);
              const barHeight = yScale.bandwidth();
              const barY = yScale(d.label) ?? 0;

              return (
                <g key={d.label}>
                  <Bar
                    x={0}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={gradient ? `url(#${gradientId})` : barColor}
                    rx={4}
                  />
                  <Text
                    x={-8}
                    y={barY + barHeight / 2}
                    fill={chartColors.text}
                    fontSize={11}
                    textAnchor="end"
                    verticalAnchor="middle"
                  >
                    {d.label}
                  </Text>
                  <Text
                    x={barWidth + 8}
                    y={barY + barHeight / 2}
                    fill={chartColors.text}
                    fontSize={11}
                    verticalAnchor="middle"
                  >
                    {d.value}
                  </Text>
                </g>
              );
            })}
          </Group>
        </svg>
      </Chart>
    );
  }

  const xScale = scaleBand({
    domain: data.map((d) => d.label),
    padding: 0.3,
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [0, maxValue],
    nice: true,
    range: [innerHeight, 0],
  });

  return (
    <Chart {...props}>
      <svg width={width} height={height}>
        {gradient && (
          <LinearGradient
            id={gradientId}
            from={chartColors[1]}
            to={chartColors[2]}
            vertical
          />
        )}
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
                fill={gradient ? `url(#${gradientId})` : barColor}
                rx={4}
              />
            );
          })}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke={chartColors.axis}
            tickStroke={chartColors.axis}
            tickLabelProps={{ fill: chartColors.text, fontSize: 11 }}
          />
          <AxisLeft
            scale={yScale}
            stroke={chartColors.axis}
            tickStroke={chartColors.axis}
            tickLabelProps={{ fill: chartColors.text, fontSize: 11 }}
          />
        </Group>
      </svg>
    </Chart>
  );
}
