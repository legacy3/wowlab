"use client";

import { Group } from "@visx/group";
import { scaleOrdinal } from "@visx/scale";
import { Pie } from "@visx/shape";
import { Text } from "@visx/text";

import { Chart, chartColors, type ChartProps } from "./chart";

type PieChartProps = {
  data: PieDataPoint[];
  width?: number;
  height?: number;
  donut?: boolean;
  showLabels?: boolean;
  centerLabel?: string;
  colors?: string[];
} & ChartProps;

type PieDataPoint = { label: string; value: number };

export function PieChart({
  centerLabel,
  colors,
  data,
  donut = false,
  height = 300,
  showLabels = true,
  width = 300,
  ...props
}: PieChartProps) {
  const pieColors = colors ?? [
    chartColors[1],
    chartColors[2],
    chartColors[3],
    chartColors[4],
    chartColors[5],
  ];

  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = donut ? radius - 50 : 0;

  const colorScale = scaleOrdinal({
    domain: data.map((d) => d.label),
    range: pieColors,
  });

  return (
    <Chart {...props}>
      <svg width={width} height={height}>
        <Group top={height / 2} left={width / 2}>
          <Pie
            data={data}
            pieValue={(d) => d.value}
            outerRadius={radius}
            innerRadius={innerRadius}
            padAngle={0.02}
          >
            {(pie) =>
              pie.arcs.map((arc, i) => {
                const [centroidX, centroidY] = pie.path.centroid(arc);
                const pathData = pie.path(arc);
                return (
                  <g key={`arc-${i}`}>
                    <path
                      d={pathData ?? undefined}
                      fill={colorScale(arc.data.label)}
                    />
                    {showLabels && !donut && (
                      <Text
                        x={centroidX}
                        y={centroidY}
                        fill="#fff"
                        fontSize={11}
                        fontWeight="bold"
                        textAnchor="middle"
                        verticalAnchor="middle"
                      >
                        {arc.data.label}
                      </Text>
                    )}
                  </g>
                );
              })
            }
          </Pie>
          {donut && centerLabel && (
            <Text
              textAnchor="middle"
              verticalAnchor="middle"
              fill={chartColors.text}
              fontSize={20}
              fontWeight="bold"
            >
              {centerLabel}
            </Text>
          )}
        </Group>
      </svg>
      {donut && showLabels && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "center",
          }}
        >
          {data.map((d) => (
            <div
              key={d.label}
              style={{ alignItems: "center", display: "flex", gap: 6 }}
            >
              <div
                style={{
                  backgroundColor: colorScale(d.label),
                  borderRadius: 2,
                  height: 12,
                  width: 12,
                }}
              />
              <span style={{ color: chartColors.text, fontSize: 12 }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </Chart>
  );
}
