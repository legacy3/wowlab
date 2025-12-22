"use client";

import { memo, useMemo } from "react";
import {
  KonvaGroup,
  KonvaLine,
  KonvaRect,
  KonvaText,
} from "@/components/konva";
import { TRACK_METRICS, getZoomLevel } from "@/hooks/timeline";
import {
  TIMELINE_ERROR,
  TIMELINE_PRIMARY,
  TIMELINE_GRID_LINE,
  TIMELINE_TEXT_DIM,
  TIMELINE_SUCCESS,
  TIMELINE_RESOURCE_BGS,
} from "../colors";

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
  const { resourceThresholds, resourceCriticalThreshold, maxFocus } =
    TRACK_METRICS;
  const zoomLevel = getZoomLevel(visibleRange);

  // TODO Track all resources
  const visibleResources = useMemo(() => {
    const padding = (visibleRange.end - visibleRange.start) * 0.1;

    return resources.filter(
      (r) =>
        r.timestamp >= visibleRange.start - padding &&
        r.timestamp <= visibleRange.end + padding,
    );
  }, [resources, visibleRange.start, visibleRange.end]);

  // Downsample for aggregate zoom
  const processedResources = useMemo(() => {
    if (zoomLevel !== "aggregate" || visibleResources.length < 100) {
      return visibleResources;
    }

    // Downsample to ~100 points
    const step = Math.ceil(visibleResources.length / 100);

    return visibleResources.filter((_, i) => i % step === 0);
  }, [visibleResources, zoomLevel]);

  // Generate points for area and line
  const { linePoints, areaPoints, criticalZonePoints } = useMemo(() => {
    const line: number[] = [];
    const area: number[] = [];
    const critical: number[] = [];

    if (processedResources.length === 0) {
      return {
        linePoints: line,
        areaPoints: area,
        criticalZonePoints: critical,
      };
    }

    // Start area at bottom-left of first point
    const firstX = timeToX(processedResources[0].timestamp);
    area.push(firstX, height - 5);

    // Track critical zone segments
    let inCritical = false;
    let criticalStart: number | null = null;

    processedResources.forEach((r) => {
      const x = timeToX(r.timestamp);
      const fy = focusToY(r.focus);

      line.push(x, fy);
      area.push(x, fy);

      // Track critical zones (below threshold)
      const isCritical = r.focus < resourceCriticalThreshold;
      if (isCritical && !inCritical) {
        criticalStart = x;
        inCritical = true;
      } else if (!isCritical && inCritical && criticalStart !== null) {
        critical.push(criticalStart, x);
        inCritical = false;
        criticalStart = null;
      }
    });

    // Close critical zone if still open
    if (inCritical && criticalStart !== null) {
      const lastX = timeToX(
        processedResources[processedResources.length - 1].timestamp,
      );

      critical.push(criticalStart, lastX);
    }

    // Close the area
    const lastX = timeToX(
      processedResources[processedResources.length - 1].timestamp,
    );

    area.push(lastX, height - 5);

    return { linePoints: line, areaPoints: area, criticalZonePoints: critical };
  }, [
    processedResources,
    timeToX,
    focusToY,
    height,
    resourceCriticalThreshold,
  ]);

  // Calculate gain/loss markers for fine zoom
  const gainLossMarkers = useMemo(() => {
    if (zoomLevel !== "fine") {
      return [];
    }

    const markers: Array<{
      x: number;
      y: number;
      delta: number;
      isGain: boolean;
    }> = [];

    for (let i = 1; i < processedResources.length; i++) {
      const prev = processedResources[i - 1];
      const curr = processedResources[i];
      const delta = curr.focus - prev.focus;

      // Only show significant changes
      if (Math.abs(delta) > 5) {
        markers.push({
          x: timeToX(curr.timestamp),
          y: focusToY(curr.focus),
          delta,
          isGain: delta > 0,
        });
      }
    }

    // Limit to prevent clutter
    return markers.slice(0, 50);
  }, [processedResources, zoomLevel, timeToX, focusToY]);

  return (
    <KonvaGroup y={y}>
      {/* Critical zone highlights (red tint below threshold) */}
      {criticalZonePoints.length > 0 &&
        Array.from({ length: criticalZonePoints.length / 2 }).map((_, i) => {
          const startX = criticalZonePoints[i * 2];
          const endX = criticalZonePoints[i * 2 + 1];
          const criticalY = focusToY(resourceCriticalThreshold);

          return (
            <KonvaRect
              key={`critical-${i}`}
              x={startX}
              y={criticalY}
              width={endX - startX}
              height={height - 5 - criticalY}
              fill={TIMELINE_ERROR}
              opacity={0.15}
              listening={false}
            />
          );
        })}

      {/* Threshold zone backgrounds (subtle bands) */}
      {resourceThresholds.map((threshold, i) => {
        const prevThreshold = i === 0 ? 0 : resourceThresholds[i - 1];
        const topY = focusToY(threshold);
        const bottomY = focusToY(prevThreshold);

        // Alternate subtle background colors for zones
        const colors = TIMELINE_RESOURCE_BGS;

        return (
          <KonvaRect
            key={`zone-${threshold}`}
            x={0}
            y={topY}
            width={innerWidth}
            height={bottomY - topY}
            fill={colors[i % colors.length]}
            opacity={0.3}
            listening={false}
          />
        );
      })}

      {/* Area fill with gradient effect */}
      {areaPoints.length > 0 && (
        <KonvaLine
          points={areaPoints}
          fill={TIMELINE_PRIMARY}
          opacity={0.2}
          closed
          listening={false}
        />
      )}

      {/* Focus line */}
      {linePoints.length > 0 && (
        <KonvaLine
          points={linePoints}
          stroke={TIMELINE_PRIMARY}
          strokeWidth={2}
          tension={zoomLevel === "aggregate" ? 0.4 : 0.2}
          listening={false}
        />
      )}

      {/* Threshold lines with labels */}
      {resourceThresholds.map((threshold) => {
        const ty = focusToY(threshold);
        const isCritical = threshold === resourceCriticalThreshold;

        return (
          <KonvaGroup key={threshold}>
            <KonvaLine
              points={[0, ty, innerWidth, ty]}
              stroke={isCritical ? TIMELINE_ERROR : TIMELINE_GRID_LINE}
              strokeWidth={1}
              opacity={isCritical ? 0.5 : 0.3}
              dash={[2, 4]}
              listening={false}
            />
            {/* Threshold label - positioned inside track with safe margin */}
            <KonvaText
              x={innerWidth - 35}
              y={ty - 6}
              text={String(threshold)}
              fontSize={9}
              fill={isCritical ? TIMELINE_ERROR : TIMELINE_TEXT_DIM}
              opacity={0.7}
              listening={false}
            />
          </KonvaGroup>
        );
      })}

      {/* Max focus line */}
      <KonvaLine
        points={[0, focusToY(maxFocus), innerWidth, focusToY(maxFocus)]}
        stroke={TIMELINE_GRID_LINE}
        strokeWidth={1}
        opacity={0.2}
        listening={false}
      />
      <KonvaText
        x={innerWidth - 35}
        y={focusToY(maxFocus) + 2}
        text={String(maxFocus)}
        fontSize={9}
        fill={TIMELINE_TEXT_DIM}
        opacity={0.5}
        listening={false}
      />

      {/* Gain/loss arrows for fine zoom */}
      {gainLossMarkers.map((marker, i) => (
        <KonvaGroup key={i} x={marker.x} y={marker.y}>
          {/* Arrow indicator */}
          <KonvaLine
            points={marker.isGain ? [-3, 6, 0, 0, 3, 6] : [-3, -6, 0, 0, 3, -6]}
            stroke={marker.isGain ? TIMELINE_SUCCESS : TIMELINE_ERROR}
            strokeWidth={1.5}
            opacity={0.7}
            listening={false}
          />
        </KonvaGroup>
      ))}

      {/* Critical threshold glow effect when line crosses it */}
      {zoomLevel === "fine" &&
        processedResources.map((r, i) => {
          if (i === 0) {
            return null;
          }

          const prev = processedResources[i - 1];

          // Check if crossed critical threshold
          const crossed =
            (prev.focus >= resourceCriticalThreshold &&
              r.focus < resourceCriticalThreshold) ||
            (prev.focus < resourceCriticalThreshold &&
              r.focus >= resourceCriticalThreshold);

          if (!crossed) {
            return null;
          }

          const x = timeToX(r.timestamp);
          const crossY = focusToY(resourceCriticalThreshold);

          return (
            <KonvaGroup key={`cross-${i}`} x={x} y={crossY}>
              {/* Glow effect */}
              <KonvaRect
                x={-4}
                y={-4}
                width={8}
                height={8}
                fill={TIMELINE_ERROR}
                cornerRadius={4}
                opacity={0.4}
                listening={false}
              />
            </KonvaGroup>
          );
        })}
    </KonvaGroup>
  );
});
