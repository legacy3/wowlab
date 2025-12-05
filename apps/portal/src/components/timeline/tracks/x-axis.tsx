"use client";

import { memo, useMemo } from "react";
import { Group, Line, Text } from "react-konva";
import { formatTime } from "@/atoms/timeline";
import { TRACK_METRICS } from "../hooks";

interface XAxisProps {
  innerWidth: number;
  totalHeight: number;
  timeToX: (time: number) => number;
  bounds: { min: number; max: number };
  visibleRange: { start: number; end: number };
}

export const XAxis = memo(function XAxis({
  innerWidth,
  totalHeight,
  timeToX,
  bounds,
  visibleRange,
}: XAxisProps) {
  const ticks = useMemo(() => {
    const tickCount = TRACK_METRICS.axisTickCount;
    const range = bounds.max - bounds.min;
    const step = range / tickCount;
    return Array.from(
      { length: tickCount + 1 },
      (_, i) => bounds.min + i * step,
    );
  }, [bounds]);

  // Filter ticks to visible range
  const visibleTicks = useMemo(() => {
    const padding = (bounds.max - bounds.min) / TRACK_METRICS.axisTickCount;
    return ticks.filter(
      (tick) =>
        tick >= visibleRange.start - padding &&
        tick <= visibleRange.end + padding,
    );
  }, [ticks, visibleRange.start, visibleRange.end, bounds]);

  return (
    <Group y={totalHeight}>
      <Line
        points={[0, 0, innerWidth, 0]}
        stroke="#444"
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
      />
      {visibleTicks.map((tick, i) => {
        const x = timeToX(tick);
        return (
          <Group key={`tick-${tick}-${i}`} x={x}>
            <Line
              points={[0, 0, 0, 6]}
              stroke="#444"
              strokeWidth={1}
              listening={false}
              perfectDrawEnabled={false}
            />
            <Text
              text={formatTime(tick)}
              x={-20}
              y={10}
              width={40}
              align="center"
              fontSize={11}
              fill="#888"
              listening={false}
              perfectDrawEnabled={false}
            />
          </Group>
        );
      })}
    </Group>
  );
});
