"use client";

import { memo } from "react";
import { Group, Text } from "react-konva";
import type { TrackId } from "@/atoms/timeline";
import { TRACK_CONFIGS } from "../hooks";

interface TrackLayout {
  y: number;
  height: number;
  visible: boolean;
}

interface TrackLabelsProps {
  tracks: Record<TrackId, TrackLayout>;
  expandedTracks: Set<TrackId>;
  onToggleTrack: (trackId: TrackId) => void;
}

export const TrackLabels = memo(function TrackLabels({
  tracks,
  expandedTracks,
  onToggleTrack,
}: TrackLabelsProps) {
  return (
    <Group>
      {TRACK_CONFIGS.map((track) => {
        const layout = tracks[track.id];
        if (!layout.visible && !track.collapsible) return null;

        const labelY = track.collapsible
          ? layout.y + (layout.visible ? layout.height / 2 : 10)
          : layout.y + layout.height / 2;

        return (
          <Group
            key={track.id}
            x={8}
            y={labelY}
            onClick={() => track.collapsible && onToggleTrack(track.id)}
          >
            {track.collapsible && (
              <Text
                text={expandedTracks.has(track.id) ? "\u25BC" : "\u25B6"}
                fontSize={10}
                fill="#888"
              />
            )}
            <Text
              text={track.label}
              x={track.collapsible ? 14 : 0}
              fontSize={11}
              fontStyle="500"
              fill="#ddd"
            />
          </Group>
        );
      })}
    </Group>
  );
});
