"use client";

import { memo, useMemo } from "react";
import {
  KonvaGroup,
  KonvaRect,
  KonvaText,
  KonvaLine,
} from "@/components/konva";

interface Phase {
  id: string;
  name: string;
  start: number;
  end: number;
  color: string;
}

interface PhasesTrackProps {
  phases: Phase[];
  y: number;
  height: number;
  timeToX: (time: number) => number;
  innerWidth: number;
  totalHeight: number;
  visibleRange: { start: number; end: number };
}

export const PhasesTrack = memo(function PhasesTrack({
  phases,
  y,
  height,
  timeToX,
  innerWidth,
  totalHeight,
  visibleRange,
}: PhasesTrackProps) {
  // Filter to visible phases
  const visiblePhases = useMemo(() => {
    return phases.filter(
      (phase) =>
        phase.end >= visibleRange.start && phase.start <= visibleRange.end,
    );
  }, [phases, visibleRange.start, visibleRange.end]);

  return (
    <KonvaGroup y={y}>
      {visiblePhases.map((phase) => {
        const startX = Math.max(0, timeToX(phase.start));
        const endX = Math.min(innerWidth, timeToX(phase.end));
        const width = endX - startX;
        if (width <= 0) {
          return null;
        }

        return (
          <KonvaGroup key={phase.id}>
            {/* Phase rectangle */}
            <KonvaRect
              x={startX}
              y={2}
              width={width}
              height={height - 4}
              fill={phase.color}
              opacity={0.2}
              cornerRadius={2}
              listening={false}
            />
            {/* Phase label */}
            {width > 50 && (
              <KonvaText
                x={startX}
                y={height / 2 - 5}
                width={width}
                align="center"
                text={phase.name}
                fontSize={10}
                fontStyle="bold"
                fill={phase.color}
                listening={false}
              />
            )}
            {/* Phase boundary line */}
            <KonvaLine
              points={[startX, 0, startX, totalHeight - y]}
              stroke={phase.color}
              strokeWidth={1}
              opacity={0.5}
              dash={[4, 2]}
              listening={false}
            />
          </KonvaGroup>
        );
      })}
    </KonvaGroup>
  );
});
