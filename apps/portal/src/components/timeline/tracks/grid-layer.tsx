"use client";

import { memo, useMemo } from "react";
import { Rect, Line } from "react-konva";
import { TRACK_METRICS } from "../hooks";

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
  // Calculate tick positions based on bounds
  const ticks = useMemo(() => {
    const tickCount = TRACK_METRICS.gridTickCount;
    const range = bounds.max - bounds.min;
    const step = range / tickCount;
    return Array.from(
      { length: tickCount + 1 },
      (_, i) => bounds.min + i * step,
    );
  }, [bounds]);

  // Filter ticks to visible range
  const visibleTicks = useMemo(() => {
    const padding = (bounds.max - bounds.min) / TRACK_METRICS.gridTickCount;
    return ticks.filter(
      (tick) =>
        tick >= visibleRange.start - padding &&
        tick <= visibleRange.end + padding,
    );
  }, [ticks, visibleRange.start, visibleRange.end, bounds]);

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
