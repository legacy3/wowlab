"use client";

import { memo, useMemo } from "react";
import { Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import { getSpell, type CastEvent } from "@/atoms/timeline";
import { TRACK_METRICS } from "../hooks";
import {
  getSpellOpacity,
  isSpellHighlighted,
  buildSpellTooltip,
} from "../timeline-context";

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
  const { castSize, castGap, cornerRadius } = TRACK_METRICS;

  // Row layout to avoid overlaps - computed based on timestamps only
  const castsWithRow = useMemo(() => {
    const rows: CastEvent[][] = [];
    const sortedCasts = [...casts].sort((a, b) => a.timestamp - b.timestamp);

    sortedCasts.forEach((cast) => {
      let placed = false;
      for (const row of rows) {
        const lastInRow = row[row.length - 1];
        // Use a small time threshold instead of pixel-based calculation
        if (lastInRow.timestamp + 0.5 < cast.timestamp) {
          row.push(cast);
          placed = true;
          break;
        }
      }
      if (!placed) rows.push([cast]);
    });

    return rows.flatMap((row, rowIndex) =>
      row.map((cast) => ({ ...cast, rowIndex })),
    );
  }, [casts]);

  // Filter to visible casts BEFORE rendering - data is time-sorted
  const visibleCasts = useMemo(() => {
    const padding = 1; // Small time padding for shapes near edges
    return castsWithRow.filter(
      (cast) =>
        cast.timestamp >= visibleRange.start - padding &&
        cast.timestamp <= visibleRange.end + padding,
    );
  }, [castsWithRow, visibleRange.start, visibleRange.end]);

  return (
    <Group y={y}>
      {visibleCasts.map((cast) => {
        const cx = timeToX(cast.timestamp);
        const spell = getSpell(cast.spellId);
        const cy = cast.rowIndex * (castSize + castGap + 1) + 4;
        const opacity = getSpellOpacity(selectedSpell, cast.spellId);
        const highlighted = isSpellHighlighted(
          selectedSpell,
          hoveredSpell,
          cast.spellId,
        );
        const initials =
          spell?.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2) ?? "";

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
            onMouseEnter={(e) => {
              onSpellHover(cast.spellId);
              const tooltip = buildSpellTooltip(cast.spellId, cast.timestamp, {
                target: cast.target,
              });
              if (tooltip) showTooltip(e, tooltip);
            }}
            onMouseLeave={() => {
              onSpellHover(null);
              hideTooltip();
            }}
          >
            <Rect
              width={castSize}
              height={castSize}
              fill={spell?.color ?? "#888"}
              cornerRadius={cornerRadius}
              stroke={highlighted ? "#fff" : undefined}
              strokeWidth={highlighted ? 2 : 0}
              perfectDrawEnabled={false}
            />
            <Text
              text={initials}
              width={castSize}
              height={castSize}
              align="center"
              verticalAlign="middle"
              fontSize={9}
              fontStyle="bold"
              fill="#fff"
              listening={false}
              perfectDrawEnabled={false}
            />
          </Group>
        );
      })}
    </Group>
  );
});
