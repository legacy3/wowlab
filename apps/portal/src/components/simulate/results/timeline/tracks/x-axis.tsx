"use client";

import { memo, useMemo } from "react";
import { KonvaGroup, KonvaLine, KonvaText } from "@/components/konva";
import { TRACK_METRICS } from "@/hooks/timeline";
import { formatTime, generateTicks, filterVisibleTicks } from "../utils";

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
  const tickCount = TRACK_METRICS.axisTickCount;

  const ticks = useMemo(
    () => generateTicks({ bounds, tickCount }),
    [bounds, tickCount],
  );

  const visibleTicks = useMemo(
    () => filterVisibleTicks(ticks, { bounds, tickCount, visibleRange }),
    [ticks, bounds, tickCount, visibleRange],
  );

  return (
    <KonvaGroup y={totalHeight}>
      <KonvaLine
        points={[0, 0, innerWidth, 0]}
        stroke="#444"
        strokeWidth={1}
        listening={false}
      />
      {visibleTicks.map((tick, i) => {
        const x = timeToX(tick);
        return (
          <KonvaGroup key={`tick-${tick}-${i}`} x={x}>
            <KonvaLine
              points={[0, 0, 0, 6]}
              stroke="#444"
              strokeWidth={1}
              listening={false}
            />
            <KonvaText
              text={formatTime(tick)}
              x={-20}
              y={10}
              width={40}
              align="center"
              fontSize={11}
              fill="#888"
              listening={false}
            />
          </KonvaGroup>
        );
      })}
    </KonvaGroup>
  );
});
