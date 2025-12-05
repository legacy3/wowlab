"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Group, Rect } from "react-konva";
import type { CastEvent } from "@/atoms/timeline";
import { TRACK_METRICS } from "./hooks";

const { margin: MARGIN, minimapHeight: MINIMAP_HEIGHT } = TRACK_METRICS;

interface Phase {
  id: string;
  start: number;
  end: number;
  color: string;
}

interface MinimapProps {
  phases: Phase[];
  casts: CastEvent[];
  bounds: { min: number; max: number };
  viewRange: { start: number; end: number };
  innerWidth: number;
  onRangeSelect: (start: number, end: number) => void;
}

export const Minimap = memo(function Minimap({
  phases,
  casts,
  bounds,
  viewRange,
  innerWidth,
  onRangeSelect,
}: MinimapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { minimapDensityBuckets, minimapDensityMaxHeight } = TRACK_METRICS;

  // Scale for minimap (always shows full range)
  const timeToX = useCallback(
    (time: number) => {
      const ratio = (time - bounds.min) / (bounds.max - bounds.min);
      return ratio * innerWidth;
    },
    [bounds, innerWidth],
  );

  // Convert mouse X position to time range
  const updateRangeFromX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left - MARGIN.left;
      const clickTime =
        bounds.min + (x / innerWidth) * (bounds.max - bounds.min);
      const currentRangeSize = viewRange.end - viewRange.start;
      const newStart = Math.max(
        bounds.min,
        Math.min(
          bounds.max - currentRangeSize,
          clickTime - currentRangeSize / 2,
        ),
      );
      onRangeSelect(newStart, newStart + currentRangeSize);
    },
    [bounds, innerWidth, viewRange, onRangeSelect],
  );

  // Use window-level listeners for reliable drag handling
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateRangeFromX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateRangeFromX]);

  // Cast density buckets - memoized based only on casts and bounds
  const densityBars = useMemo(() => {
    const bucketSize = (bounds.max - bounds.min) / minimapDensityBuckets;
    const buckets = new Array(minimapDensityBuckets).fill(0);
    casts.forEach((c) => {
      const bucket = Math.floor((c.timestamp - bounds.min) / bucketSize);
      if (bucket >= 0 && bucket < minimapDensityBuckets) buckets[bucket]++;
    });
    const maxDensity = Math.max(...buckets, 1);
    return buckets.map((count, i) => ({
      x: (i / minimapDensityBuckets) * innerWidth,
      width: innerWidth / minimapDensityBuckets,
      height: (count / maxDensity) * minimapDensityMaxHeight,
    }));
  }, [
    casts,
    bounds,
    innerWidth,
    minimapDensityBuckets,
    minimapDensityMaxHeight,
  ]);

  // Brush position
  const brushX = timeToX(viewRange.start);
  const brushWidth = timeToX(viewRange.end) - brushX;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateRangeFromX(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? "grabbing" : "pointer" }}
    >
      <Stage
        width={innerWidth + MARGIN.left + MARGIN.right}
        height={MINIMAP_HEIGHT}
      >
        <Layer>
          <Group x={MARGIN.left} y={5}>
            {/* Background */}
            <Rect
              width={innerWidth}
              height={MINIMAP_HEIGHT - 10}
              fill="#222"
              cornerRadius={2}
              listening={false}
            />
            {/* Phases */}
            {phases.map((phase) => (
              <Rect
                key={phase.id}
                x={timeToX(phase.start)}
                width={timeToX(phase.end) - timeToX(phase.start)}
                height={MINIMAP_HEIGHT - 10}
                fill={phase.color}
                opacity={0.15}
                listening={false}
              />
            ))}
            {/* Cast density */}
            {densityBars.map((bar, i) =>
              bar.height > 0 ? (
                <Rect
                  key={i}
                  x={bar.x}
                  y={MINIMAP_HEIGHT - 10 - bar.height}
                  width={Math.max(1, bar.width)}
                  height={bar.height}
                  fill="#3B82F6"
                  opacity={0.4}
                  listening={false}
                />
              ) : null,
            )}
            {/* Brush/selection */}
            <Rect
              x={brushX}
              width={Math.max(4, brushWidth)}
              height={MINIMAP_HEIGHT - 10}
              fill="#3B82F6"
              opacity={0.25}
              stroke="#3B82F6"
              strokeWidth={1}
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
});
