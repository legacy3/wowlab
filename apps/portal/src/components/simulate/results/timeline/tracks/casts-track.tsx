"use client";

import { memo, useMemo } from "react";
import { Group, Rect, Text, Line } from "react-konva";
import type Konva from "konva";
import { getSpell, type CastEvent } from "@/atoms/timeline";
import { TRACK_METRICS, getZoomLevel } from "@/hooks/timeline";
import {
  getSpellOpacity,
  isSpellHighlighted,
  buildSpellTooltip,
} from "../timeline-context";
import { getSpellLabel } from "../utils";

interface CastsTrackProps {
  casts: CastEvent[];
  y: number;
  timeToX: (time: number) => number;
  innerWidth: number;
  visibleRange: { start: number; end: number };
  selectedSpell: number | null;
  hoveredSpell: number | null;
  onSpellSelect: (spellId: number | null) => void;
  onSpellHover: (spellId: number | null) => void;
  showTooltip: (
    e: Konva.KonvaEventObject<MouseEvent>,
    content: React.ReactNode,
  ) => void;
  hideTooltip: () => void;
}

// Spell categories for lane assignment
type SpellCategory = "rotational" | "cooldown" | "utility";

function getSpellCategory(spellId: number): SpellCategory {
  const cooldowns = [19574, 359844, 321530];
  const utility = [186265, 147362];

  if (cooldowns.includes(spellId)) {
    return "cooldown";
  }

  if (utility.includes(spellId)) {
    return "utility";
  }

  return "rotational";
}

function getLaneForSpell(spellId: number, rotationalIndex: number): number {
  const category = getSpellCategory(spellId);
  if (category === "cooldown" || category === "utility") {
    return 2;
  }

  return rotationalIndex % 2;
}

interface CastWithLane extends CastEvent {
  lane: number;
  isOverflow: boolean;
}

export const CastsTrack = memo(function CastsTrack({
  casts,
  y,
  timeToX,
  innerWidth,
  visibleRange,
  selectedSpell,
  hoveredSpell,
  onSpellSelect,
  onSpellHover,
  showTooltip,
  hideTooltip,
}: CastsTrackProps) {
  const {
    castHeight,
    castMinWidth,
    castLaneCount,
    castLaneGap,
    castCornerRadius,
  } = TRACK_METRICS;

  const zoomLevel = getZoomLevel(visibleRange);

  // Assign lanes to casts with overlap detection
  const castsWithLanes = useMemo(() => {
    const sortedCasts = [...casts].sort((a, b) => a.timestamp - b.timestamp);
    const result: CastWithLane[] = [];

    // Track end times per lane for overlap detection
    const laneEndTimes: number[] = Array(castLaneCount).fill(-Infinity);

    // Track rotational spell index for alternating
    const rotationalSpellIndices = new Map<number, number>();
    let rotationalCounter = 0;

    // Track overflow per time window (for +N badges)
    const overflowWindows = new Map<number, number>();

    sortedCasts.forEach((cast) => {
      const spell = getSpell(cast.spellId);
      if (!spell) {
        return;
      }

      // Get rotational index for this spell
      if (getSpellCategory(cast.spellId) === "rotational") {
        if (!rotationalSpellIndices.has(cast.spellId)) {
          rotationalSpellIndices.set(cast.spellId, rotationalCounter++);
        }
      }

      const rotIdx = rotationalSpellIndices.get(cast.spellId) ?? 0;
      const preferredLane = getLaneForSpell(cast.spellId, rotIdx);

      // Find available lane (check preferred first, then others)
      const minGap = 0.3; // Minimum gap in seconds between casts in same lane
      let assignedLane = -1;

      // Try preferred lane first
      if (laneEndTimes[preferredLane] + minGap < cast.timestamp) {
        assignedLane = preferredLane;
      } else {
        // Try other lanes
        for (let i = 0; i < castLaneCount; i++) {
          if (
            i !== preferredLane &&
            laneEndTimes[i] + minGap < cast.timestamp
          ) {
            assignedLane = i;
            break;
          }
        }
      }

      const isOverflow = assignedLane === -1;
      if (isOverflow) {
        // Mark as overflow, will be shown as +N badge
        const windowKey = Math.floor(cast.timestamp * 2) / 2; // 0.5s windows

        overflowWindows.set(
          windowKey,
          (overflowWindows.get(windowKey) ?? 0) + 1,
        );

        assignedLane = 0; // Default to lane 0 for positioning
      } else {
        // Update lane end time
        const castDuration = Math.max(cast.duration, 0.3);
        laneEndTimes[assignedLane] = cast.timestamp + castDuration;
      }

      result.push({
        ...cast,
        lane: assignedLane,
        isOverflow,
      });
    });

    return result;
  }, [casts, castLaneCount]);

  // Filter to visible casts
  const visibleCasts = useMemo(() => {
    const padding = 1;

    return castsWithLanes.filter(
      (cast) =>
        !cast.isOverflow &&
        cast.timestamp >= visibleRange.start - padding &&
        cast.timestamp <= visibleRange.end + padding,
    );
  }, [castsWithLanes, visibleRange.start, visibleRange.end]);

  // Calculate overflow badges for visible range
  const overflowBadges = useMemo(() => {
    const badges: Array<{ x: number; count: number; timestamp: number }> = [];
    const windowCounts = new Map<
      number,
      { count: number; timestamp: number }
    >();

    castsWithLanes
      .filter(
        (c) =>
          c.isOverflow &&
          c.timestamp >= visibleRange.start &&
          c.timestamp <= visibleRange.end,
      )
      .forEach((cast) => {
        const windowKey = Math.floor(cast.timestamp * 2) / 2;
        const existing = windowCounts.get(windowKey);

        if (existing) {
          existing.count++;
        } else {
          windowCounts.set(windowKey, { count: 1, timestamp: cast.timestamp });
        }
      });

    windowCounts.forEach(({ count, timestamp }) => {
      badges.push({
        x: timeToX(timestamp),
        count,
        timestamp,
      });
    });

    return badges;
  }, [castsWithLanes, visibleRange, timeToX]);

  // Density heatmap for aggregate zoom level
  const densityBuckets = useMemo(() => {
    if (zoomLevel !== "aggregate") {
      return null;
    }

    const bucketSize = 1; // 1 second buckets
    const buckets = new Map<number, { count: number; spells: Set<number> }>();

    casts.forEach((cast) => {
      if (
        cast.timestamp >= visibleRange.start &&
        cast.timestamp <= visibleRange.end
      ) {
        const bucketKey = Math.floor(cast.timestamp / bucketSize) * bucketSize;
        const existing = buckets.get(bucketKey);

        if (existing) {
          existing.count++;
          existing.spells.add(cast.spellId);
        } else {
          buckets.set(bucketKey, { count: 1, spells: new Set([cast.spellId]) });
        }
      }
    });

    const maxCount = Math.max(
      ...Array.from(buckets.values()).map((b) => b.count),
      1,
    );

    return Array.from(buckets.entries()).map(([timestamp, data]) => ({
      x: timeToX(timestamp),
      width: timeToX(timestamp + bucketSize) - timeToX(timestamp),
      height: (data.count / maxCount) * (castHeight * castLaneCount),
      count: data.count,
      spells: data.spells,
    }));
  }, [casts, visibleRange, zoomLevel, timeToX, castHeight, castLaneCount]);

  // Render density heatmap for aggregate zoom
  if (zoomLevel === "aggregate" && densityBuckets) {
    return (
      <Group y={y}>
        {densityBuckets.map((bucket, i) => (
          <Rect
            key={i}
            x={bucket.x}
            y={castHeight * castLaneCount - bucket.height}
            width={Math.max(2, bucket.width - 1)}
            height={bucket.height}
            fill="#3B82F6"
            opacity={0.6}
            cornerRadius={1}
            listening={false}
            perfectDrawEnabled={false}
          />
        ))}
      </Group>
    );
  }

  const trackHeight =
    castHeight * castLaneCount + castLaneGap * (castLaneCount - 1);

  return (
    <Group y={y}>
      {/* Lane separator lines (subtle) */}
      {Array.from({ length: castLaneCount - 1 }).map((_, i) => (
        <Line
          key={`lane-sep-${i}`}
          points={[
            0,
            (i + 1) * (castHeight + castLaneGap) - castLaneGap / 2,
            innerWidth,
            (i + 1) * (castHeight + castLaneGap) - castLaneGap / 2,
          ]}
          stroke="#333"
          strokeWidth={1}
          opacity={0.3}
          dash={[2, 4]}
          listening={false}
          perfectDrawEnabled={false}
        />
      ))}

      {/* Cast capsules */}
      {visibleCasts.map((cast) => {
        const cx = timeToX(cast.timestamp);
        const spell = getSpell(cast.spellId);

        // Add top padding (2px) to keep casts within track bounds
        const cy = cast.lane * (castHeight + castLaneGap) + 2;

        // Calculate width based on cast duration (minimum width for instant casts)
        const castDuration = Math.max(cast.duration, 0);
        const width =
          castDuration > 0
            ? Math.max(
                castMinWidth,
                timeToX(cast.timestamp + castDuration) - cx,
              )
            : castMinWidth;

        const opacity = getSpellOpacity(selectedSpell, cast.spellId);
        const highlighted = isSpellHighlighted(
          selectedSpell,
          hoveredSpell,
          cast.spellId,
        );

        const spellName = spell?.name ?? "";
        const availableWidth = width - 8;
        const label = getSpellLabel(spellName, availableWidth, {
          maxInitials: 2,
        });

        // TODO Get this from spell data
        const isChanneled = cast.duration > 0;

        return (
          <Group
            key={cast.id}
            x={cx}
            y={cy}
            opacity={opacity}
            onClick={() =>
              onSpellSelect(
                selectedSpell === cast.spellId ? null : cast.spellId,
              )
            }
            onTap={() =>
              onSpellSelect(
                selectedSpell === cast.spellId ? null : cast.spellId,
              )
            }
            onMouseEnter={(e) => {
              onSpellHover(cast.spellId);

              const tooltip = buildSpellTooltip(cast.spellId, cast.timestamp, {
                target: cast.target,
                duration: cast.duration > 0 ? cast.duration : undefined,
              });

              if (tooltip) {
                showTooltip(e, tooltip);
              }
            }}
            onMouseLeave={() => {
              onSpellHover(null);
              hideTooltip();
            }}
          >
            {/* Capsule background */}
            <Rect
              width={width}
              height={castHeight}
              fill={spell?.color ?? "#888"}
              cornerRadius={castCornerRadius}
              stroke={highlighted ? "#fff" : undefined}
              strokeWidth={highlighted ? 2 : 0}
              perfectDrawEnabled={false}
            />

            {/* Channeled pattern (stripes) */}
            {isChanneled && width > 30 && (
              <>
                {Array.from({ length: Math.floor(width / 8) }).map((_, i) => (
                  <Line
                    key={i}
                    points={[8 + i * 8, 0, 8 + i * 8, castHeight]}
                    stroke="#fff"
                    strokeWidth={1}
                    opacity={0.2}
                    listening={false}
                    perfectDrawEnabled={false}
                  />
                ))}
              </>
            )}

            <Text
              text={label.text}
              x={4}
              width={width - 8}
              height={castHeight}
              align="center"
              verticalAlign="middle"
              fontSize={label.fontSize}
              fontStyle="bold"
              fill="#fff"
              listening={false}
              perfectDrawEnabled={false}
            />
          </Group>
        );
      })}

      {/* Overflow badges (+N) */}
      {overflowBadges.map((badge, i) => (
        <Group key={`overflow-${i}`} x={badge.x} y={trackHeight + 2}>
          <Rect
            x={-10}
            y={0}
            width={20}
            height={14}
            fill="#EF4444"
            cornerRadius={7}
            perfectDrawEnabled={false}
          />
          <Text
            text={`+${badge.count}`}
            x={-10}
            y={0}
            width={20}
            height={14}
            align="center"
            verticalAlign="middle"
            fontSize={8}
            fontStyle="bold"
            fill="#fff"
            listening={false}
            perfectDrawEnabled={false}
          />
        </Group>
      ))}
    </Group>
  );
});
