"use client";

import { useMemo } from "react";
import { Group, Line } from "react-konva";
import { TRACK_METRICS } from "../hooks";

interface ResourcePoint {
  timestamp: number;
  focus: number;
}

interface ResourcesTrackProps {
  resources: ResourcePoint[];
  y: number;
  height: number;
  timeToX: (time: number) => number;
  focusToY: (focus: number) => number;
  innerWidth: number;
}

export function ResourcesTrack({
  resources,
  y,
  height,
  timeToX,
  focusToY,
  innerWidth,
}: ResourcesTrackProps) {
  const { resourceThresholds } = TRACK_METRICS;

  // Generate points for area and line
  const points = useMemo(() => {
    const linePoints: number[] = [];
    const areaPoints: number[] = [0, height - 5]; // Start at bottom-left

    resources.forEach((r) => {
      const x = timeToX(r.timestamp);
      const fy = focusToY(r.focus);
      linePoints.push(x, fy);
      areaPoints.push(x, fy);
    });

    // Close the area
    if (resources.length > 0) {
      const lastX = timeToX(resources[resources.length - 1].timestamp);
      areaPoints.push(lastX, height - 5);
    }

    return { linePoints, areaPoints };
  }, [resources, timeToX, focusToY, height]);

  return (
    <Group y={y}>
      {/* Area fill */}
      <Line
        points={points.areaPoints}
        fill="#3B82F6"
        opacity={0.2}
        closed
        listening={false}
      />
      {/* Focus line */}
      <Line
        points={points.linePoints}
        stroke="#3B82F6"
        strokeWidth={2}
        tension={0.3}
        listening={false}
      />
      {/* Threshold lines */}
      {resourceThresholds.map((threshold) => (
        <Line
          key={threshold}
          points={[0, focusToY(threshold), innerWidth, focusToY(threshold)]}
          stroke="#444"
          strokeWidth={1}
          opacity={0.3}
          dash={[2, 4]}
          listening={false}
        />
      ))}
    </Group>
  );
}
