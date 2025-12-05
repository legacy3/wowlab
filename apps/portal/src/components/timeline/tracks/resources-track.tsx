"use client";

import { memo, useMemo } from "react";
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
  visibleRange: { start: number; end: number };
}

export const ResourcesTrack = memo(function ResourcesTrack({
  resources,
  y,
  height,
  timeToX,
  focusToY,
  innerWidth,
  visibleRange,
}: ResourcesTrackProps) {
  const { resourceThresholds } = TRACK_METRICS;

  // Filter to visible resources with padding for line continuity
  const visibleResources = useMemo(() => {
    // Include one point before and after visible range for smooth lines
    const padding = (visibleRange.end - visibleRange.start) * 0.1;
    return resources.filter(
      (r) =>
        r.timestamp >= visibleRange.start - padding &&
        r.timestamp <= visibleRange.end + padding,
    );
  }, [resources, visibleRange.start, visibleRange.end]);

  // Generate points for area and line
  const points = useMemo(() => {
    const linePoints: number[] = [];
    const areaPoints: number[] = [];

    if (visibleResources.length === 0) {
      return { linePoints, areaPoints };
    }

    // Start area at bottom-left of first point
    const firstX = timeToX(visibleResources[0].timestamp);
    areaPoints.push(firstX, height - 5);

    visibleResources.forEach((r) => {
      const x = timeToX(r.timestamp);
      const fy = focusToY(r.focus);
      linePoints.push(x, fy);
      areaPoints.push(x, fy);
    });

    // Close the area
    const lastX = timeToX(visibleResources[visibleResources.length - 1].timestamp);
    areaPoints.push(lastX, height - 5);

    return { linePoints, areaPoints };
  }, [visibleResources, timeToX, focusToY, height]);

  return (
    <Group y={y}>
      {/* Area fill */}
      {points.areaPoints.length > 0 && (
        <Line
          points={points.areaPoints}
          fill="#3B82F6"
          opacity={0.2}
          closed
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      {/* Focus line */}
      {points.linePoints.length > 0 && (
        <Line
          points={points.linePoints}
          stroke="#3B82F6"
          strokeWidth={2}
          tension={0.3}
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
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
          perfectDrawEnabled={false}
        />
      ))}
    </Group>
  );
});
