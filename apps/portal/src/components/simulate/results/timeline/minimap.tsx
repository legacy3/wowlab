"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KonvaStage,
  KonvaLayer,
  KonvaGroup,
  KonvaRect,
} from "@/components/konva";
import type { CastEvent } from "@/atoms/timeline";
import { TRACK_METRICS } from "@/hooks/timeline";

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

  const updateRangeFromX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

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

  // Use window-level listeners for reliable drag handling (mouse + touch)
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      updateRangeFromX(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent scrolling while dragging
      e.preventDefault();

      if (e.touches.length === 1) {
        updateRangeFromX(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [isDragging, updateRangeFromX]);

  // Cast density buckets - memoized based only on casts and bounds
  const densityBars = useMemo(() => {
    const bucketSize = (bounds.max - bounds.min) / minimapDensityBuckets;
    const buckets = new Array(minimapDensityBuckets).fill(0);

    casts.forEach((c) => {
      const bucket = Math.floor((c.timestamp - bounds.min) / bucketSize);

      if (bucket >= 0 && bucket < minimapDensityBuckets) {
        buckets[bucket]++;
      }
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      updateRangeFromX(e.touches[0].clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        cursor: isDragging ? "grabbing" : "pointer",
        touchAction: "none",
      }}
    >
      <KonvaStage
        width={innerWidth + MARGIN.left + MARGIN.right}
        height={MINIMAP_HEIGHT}
      >
        <KonvaLayer>
          <KonvaGroup x={MARGIN.left} y={5}>
            {/* Background */}
            <KonvaRect
              width={innerWidth}
              height={MINIMAP_HEIGHT - 10}
              fill="#222"
              cornerRadius={2}
              listening={false}
            />
            {/* Phases */}
            {phases.map((phase) => (
              <KonvaRect
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
                <KonvaRect
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
            <KonvaRect
              x={brushX}
              width={Math.max(4, brushWidth)}
              height={MINIMAP_HEIGHT - 10}
              fill="#3B82F6"
              opacity={0.25}
              stroke="#3B82F6"
              strokeWidth={1}
            />
          </KonvaGroup>
        </KonvaLayer>
      </KonvaStage>
    </div>
  );
});
