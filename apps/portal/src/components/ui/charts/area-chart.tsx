"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";
import { useId, useMemo } from "react";

import { Chart, chartColors, type ChartProps } from "./chart";

type AreaChartProps = {
  data: DataPoint[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  showGrid?: boolean;
  showLine?: boolean;
  color?: string;
  formatY?: (value: number) => string;
} & ChartProps;

type DataPoint = { x: number; y: number };

export function AreaChart({
  color,
  data,
  formatY,
  height = 300,
  margin = { bottom: 40, left: 50, right: 20, top: 20 },
  showGrid = true,
  showLine = true,
  width = 500,
  ...props
}: AreaChartProps) {
  const areaColor = color ?? chartColors[1];
  const reactId = useId();
  const gradientId = useMemo(() => `area-gradient-${reactId}`, [reactId]);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xMax = Math.max(...data.map((d) => d.x));
  const yMax = Math.max(...data.map((d) => d.y));

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
        <LinearGradient
          id={gradientId}
          from={areaColor}
          to={areaColor}
          fromOpacity={0.4}
          toOpacity={0}
          vertical
        />
        <Group left={margin.left} top={margin.top}>
          {showGrid && (
            <GridRows
              scale={yScale}
              width={innerWidth}
              stroke={chartColors.grid}
              strokeOpacity={0.5}
            />
          )}
          <AreaClosed
            data={data}
            x={(d) => xScale(d.x)}
            y={(d) => yScale(d.y)}
            yScale={yScale}
            fill={`url(#${gradientId})`}
            curve={curveMonotoneX}
          />
          {showLine && (
            <LinePath
              data={data}
              x={(d) => xScale(d.x)}
              y={(d) => yScale(d.y)}
              stroke={areaColor}
              strokeWidth={2}
              curve={curveMonotoneX}
            />
          )}
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
