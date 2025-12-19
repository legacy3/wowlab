"use client";

import { useMemo } from "react";
import type { TrackId } from "@/atoms/timeline";

export const TRACK_METRICS = {
  // Margins
  margin: { top: 10, right: 20, bottom: 30, left: 90 },

  // Minimap
  minimapHeight: 40,

  // Cast elements - capsule style
  castHeight: 22,
  castMinWidth: 24,
  castLaneCount: 3,
  castLaneGap: 2,
  castCornerRadius: 11, // Half of height for pill shape

  // Buff elements - category lanes
  buffHeight: 18,
  buffGap: 2,
  buffCornerRadius: 3,
  buffCategoryGap: 4,

  // Debuff elements - target lanes
  debuffHeight: 16,
  debuffGap: 2,
  debuffDash: [3, 2] as readonly number[],
  debuffCornerRadius: 3,

  // Damage - lollipop style + bucketing
  damageStemWidth: 2,
  damageMarkerRadius: 3,
  damageCritRadius: 4,
  damageBucketSizes: {
    fine: 0.1, // < 5s visible
    medium: 0.25, // 5-30s visible
    coarse: 0.5, // 30-120s visible
    aggregate: 1.0, // > 120s visible
  } as const,

  // Resource thresholds
  resourceThresholds: [30, 60, 90] as readonly number[],
  resourceCriticalThreshold: 30,
  maxFocus: 120,

  // Grid
  gridTickCount: 20,
  axisTickCount: 10,

  // Minimap
  minimapDensityBuckets: 100,
  minimapDensityMaxHeight: 20,

  // General
  trackGap: 8, // Increased gap for better visual separation
  cornerRadius: 4,

  // Zoom level thresholds (in seconds of visible range)
  zoomLevels: {
    fine: 10,
    medium: 60,
    coarse: 120,
  } as const,

  // Legacy compatibility
  castSize: 24,
  castGap: 2,
  damageBarWidth: 4,
} as const;

export type ZoomLevel = "fine" | "medium" | "coarse" | "aggregate";

export function getZoomLevel(visibleRange: {
  start: number;
  end: number;
}): ZoomLevel {
  const duration = visibleRange.end - visibleRange.start;
  if (duration < TRACK_METRICS.zoomLevels.fine) {
    return "fine";
  }

  if (duration < TRACK_METRICS.zoomLevels.medium) {
    return "medium";
  }

  if (duration < TRACK_METRICS.zoomLevels.coarse) {
    return "coarse";
  }

  return "aggregate";
}

export interface TrackConfig {
  readonly id: TrackId;
  readonly label: string;
  readonly baseHeight: number;
  readonly minHeight: number;
  readonly collapsible: boolean;
  readonly expandable: boolean; // Can grow in zen mode
}

export interface TrackLayout {
  readonly y: number;
  readonly height: number;
  readonly visible: boolean;
}

export interface TrackLayoutResult {
  readonly tracks: Record<TrackId, TrackLayout>;
  readonly totalHeight: number;
}

const GAP = TRACK_METRICS.trackGap;

// Calculate base heights from metrics
const CAST_TRACK_HEIGHT =
  TRACK_METRICS.castHeight * TRACK_METRICS.castLaneCount +
  TRACK_METRICS.castLaneGap * (TRACK_METRICS.castLaneCount - 1) +
  4; // padding

export const TRACK_CONFIGS: TrackConfig[] = [
  {
    id: "phases",
    label: "Phases",
    baseHeight: 28,
    minHeight: 28,
    collapsible: false,
    expandable: false,
  },
  {
    id: "casts",
    label: "Casts",
    baseHeight: CAST_TRACK_HEIGHT,
    minHeight: 50,
    collapsible: true,
    expandable: false,
  },
  {
    id: "buffs",
    label: "Buffs",
    baseHeight: 100,
    minHeight: 50,
    collapsible: true,
    expandable: true,
  },
  {
    id: "debuffs",
    label: "Debuffs",
    baseHeight: 50,
    minHeight: 25,
    collapsible: true,
    expandable: false,
  },
  {
    id: "damage",
    label: "Damage",
    baseHeight: 140,
    minHeight: 80,
    collapsible: true,
    expandable: true,
  },
  {
    id: "resources",
    label: "Focus",
    baseHeight: 80,
    minHeight: 50,
    collapsible: true,
    expandable: true,
  },
];

export function useTrackLayout(
  expandedTracks: Set<TrackId>,
  availableHeight?: number,
): TrackLayoutResult {
  return useMemo(() => {
    let y = 0;
    const tracks = {} as Record<TrackId, TrackLayout>;

    // First pass: calculate base heights
    const visibleTracks = TRACK_CONFIGS.filter(
      (track) => !track.collapsible || expandedTracks.has(track.id),
    );

    let baseTotal = 0;
    for (const track of visibleTracks) {
      baseTotal += track.baseHeight + GAP;
    }

    // Calculate extra space available in zen mode
    const extraSpace =
      availableHeight && availableHeight > baseTotal
        ? availableHeight - baseTotal
        : 0;

    // Distribute extra space to expandable tracks
    const expandableTracks = visibleTracks.filter((t) => t.expandable);
    const extraPerTrack =
      expandableTracks.length > 0
        ? Math.floor(extraSpace / expandableTracks.length)
        : 0;

    // Second pass: assign positions with expanded heights
    for (const track of TRACK_CONFIGS) {
      const visible = !track.collapsible || expandedTracks.has(track.id);
      let height = visible ? track.baseHeight : 0;

      // Add extra height for expandable tracks in zen mode
      if (visible && track.expandable && extraPerTrack > 0) {
        height += extraPerTrack;
      }

      tracks[track.id] = { y, height, visible };
      y += height + (visible ? GAP : 0);
    }

    return { tracks, totalHeight: y };
  }, [expandedTracks, availableHeight]);
}
