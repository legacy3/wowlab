"use client";

import { memo, useMemo } from "react";
import { Rect, Line } from "react-konva";
import { TRACK_METRICS } from "../hooks";
import { isPointVisible } from "../timeline-context";

interface GridLayerProps {
  innerWidth: number;
  totalHeight: number;
  timeToX: (time: number) => number;
  bounds: { min: number; max: number };
}

export const GridLayer = memo(function GridLayer({
  innerWidth,
  totalHeight,
  timeToX,
  bounds,
}: GridLayerProps) {
  const ticks = useMemo(() => {
    const tickCount = TRACK_METRICS.gridTickCount;
    const range = bounds.max - bounds.min;
    const step = range / tickCount;
    return Array.from(
      { length: tickCount + 1 },
      (_, i) => bounds.min + i * step,
    );
  }, [bounds]);

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
      />
      {/* Grid lines */}
      {ticks.map((tick, i) => {
        const x = timeToX(tick);
        if (!isPointVisible(x, innerWidth)) return null;
        const isMajor = Math.round(tick) % 10 === 0;
        return (
          <Line
            key={`grid-${i}`}
            points={[x, 0, x, totalHeight]}
            stroke="#333"
            strokeWidth={1}
            opacity={isMajor ? 0.4 : 0.15}
            dash={isMajor ? undefined : [2, 2]}
            listening={false}
          />
        );
      })}
    </>
  );
});
