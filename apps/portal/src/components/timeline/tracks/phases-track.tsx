"use client";

import { Group, Rect, Text, Line } from "react-konva";

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
}

export function PhasesTrack({
  phases,
  y,
  height,
  timeToX,
  innerWidth,
  totalHeight,
}: PhasesTrackProps) {
  return (
    <Group y={y}>
      {phases.map((phase) => {
        const startX = Math.max(0, timeToX(phase.start));
        const endX = Math.min(innerWidth, timeToX(phase.end));
        const width = endX - startX;
        if (width <= 0) return null;

        return (
          <Group key={phase.id}>
            {/* Phase rectangle */}
            <Rect
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
              <Text
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
            <Line
              points={[startX, 0, startX, totalHeight - y]}
              stroke={phase.color}
              strokeWidth={1}
              opacity={0.5}
              dash={[4, 2]}
              listening={false}
            />
          </Group>
        );
      })}
    </Group>
  );
}
