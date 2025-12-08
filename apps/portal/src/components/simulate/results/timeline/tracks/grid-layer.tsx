"use client";

import { memo, useMemo } from "react";
import { Rect, Line } from "react-konva";
import { TRACK_METRICS } from "@/hooks/timeline";
import { generateTicks, filterVisibleTicks } from "../utils";

interface GridLayerProps {
  innerWidth: number;
  totalHeight: number;
  timeToX: (time: number) => number;
  bounds: { min: number; max: number };
  visibleRange: { start: number; end: number };
}

export const GridLayer = memo(function GridLayer({
  innerWidth,
  totalHeight,
  timeToX,
  bounds,
  visibleRange,
}: GridLayerProps) {
  const tickCount = TRACK_METRICS.gridTickCount;

  const ticks = useMemo(
    () => generateTicks({ bounds, tickCount }),
    [bounds, tickCount],
  );

  const visibleTicks = useMemo(
    () => filterVisibleTicks(ticks, { bounds, tickCount, visibleRange }),
    [ticks, bounds, tickCount, visibleRange],
  );

  return (
    <>
      {/* Background */}
      <Rect
        x={0}
        y={0}
        width={innerWidth}
        height={totalHeight}
        fill="#1a1a1a"
        cornerRadius={TRACK_METRICS.cornerRadius}
        listening={false}
        perfectDrawEnabled={false}
      />
      {/* Grid lines */}
      {visibleTicks.map((tick, i) => {
        const x = timeToX(tick);
        const isMajor = Math.round(tick) % 10 === 0;

        return (
          <Line
            key={`grid-${tick}-${i}`}
            points={[x, 0, x, totalHeight]}
            stroke="#333"
            strokeWidth={1}
            opacity={isMajor ? 0.4 : 0.15}
            dash={isMajor ? undefined : [2, 2]}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
      })}
    </>
  );
});
