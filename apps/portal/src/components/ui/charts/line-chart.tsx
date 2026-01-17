"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { useMemo } from "react";

import { Chart, chartColors, type ChartProps } from "./chart";

type DataPoint = { x: number; y: number };

type LineChartProps = {
  data: DataPoint[] | DataPoint[][];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showGrid?: boolean;
  showDots?: boolean;
  colors?: string[];
  formatY?: (value: number) => string;
} & ChartProps;

export function LineChart({
  colors,
  data,
  formatY,
  height = 300,
  margin = { bottom: 40, left: 50, right: 20, top: 20 },
  showDots = true,
  showGrid = true,
  width = 500,
  ...props
}: LineChartProps) {
  const series = useMemo(
    () =>
      Array.isArray(data[0]) ? (data as DataPoint[][]) : [data as DataPoint[]],
    [data],
  );

  const lineColors = colors ?? [
    chartColors[1],
    chartColors[2],
    chartColors[3],
    chartColors[4],
    chartColors[5],
  ];

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const allPoints = series.flat();
  const xMax = Math.max(...allPoints.map((d) => d.x));
  const yMax = Math.max(...allPoints.map((d) => d.y));

  const xScale = scaleLinear({
    domain: [0, xMax],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [0, yMax],
    nice: true,
    range: [innerHeight, 0],
  });

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
          {series.map((line, i) => (
            <g key={i}>
              <LinePath
                data={line}
                x={(d) => xScale(d.x)}
                y={(d) => yScale(d.y)}
                stroke={lineColors[i % lineColors.length]}
                strokeWidth={2}
                curve={curveMonotoneX}
              />
              {showDots &&
                line.map((d, j) => (
                  <circle
                    key={j}
                    cx={xScale(d.x)}
                    cy={yScale(d.y)}
                    r={4}
                    fill={lineColors[i % lineColors.length]}
                  />
                ))}
            </g>
          ))}
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
            tickFormat={formatY ? (v) => formatY(Number(v)) : undefined}
          />
        </Group>
      </svg>
    </Chart>
  );
}
