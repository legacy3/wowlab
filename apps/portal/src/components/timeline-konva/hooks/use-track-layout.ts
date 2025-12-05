import { useMemo } from "react";
import type { TrackId } from "@/atoms/timeline";

// =============================================================================
// Track Metrics - Consolidated magic numbers
// =============================================================================

export const TRACK_METRICS = {
  // Margins
  margin: { top: 10, right: 20, bottom: 30, left: 90 },

  // Minimap
  minimapHeight: 40,

  // Cast elements
  castSize: 24,
  castGap: 2,

  // Buff elements
  buffHeight: 20,
  buffGap: 3,
  buffCornerRadius: 3,

  // Debuff elements
  debuffHeight: 18,
  debuffGap: 2,
  debuffDash: [3, 2] as readonly number[],

  // Damage bars
  damageBarWidth: 4,
  damageCritRadius: 3,

  // Resource thresholds
  resourceThresholds: [30, 60, 90] as readonly number[],
  maxFocus: 120,

  // Grid
  gridTickCount: 20,
  axisTickCount: 10,

  // Minimap
  minimapDensityBuckets: 100,
  minimapDensityMaxHeight: 20,

  // General
  trackGap: 4,
  cornerRadius: 4,
} as const;

// =============================================================================
// Track Configuration
// =============================================================================

export interface TrackConfig {
  readonly id: TrackId;
  readonly label: string;
  readonly height: number;
  readonly collapsible: boolean;
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

export const TRACK_CONFIGS: TrackConfig[] = [
  { id: "phases", label: "Phases", height: 24, collapsible: false },
  { id: "casts", label: "Casts", height: 60, collapsible: true },
  { id: "buffs", label: "Buffs", height: 80, collapsible: true },
  { id: "debuffs", label: "Debuffs", height: 40, collapsible: true },
  { id: "damage", label: "Damage", height: 80, collapsible: true },
  { id: "resources", label: "Focus", height: 50, collapsible: true },
];

export function useTrackLayout(
  expandedTracks: Set<TrackId>,
): TrackLayoutResult {
  return useMemo(() => {
    let y = 0;
    const tracks = {} as Record<TrackId, TrackLayout>;

    for (const track of TRACK_CONFIGS) {
      const visible = !track.collapsible || expandedTracks.has(track.id);
      const height = visible ? track.height : 0;
      tracks[track.id] = { y, height, visible };
      y += height + (visible ? GAP : 0);
    }

    return { tracks, totalHeight: y };
  }, [expandedTracks]);
}
