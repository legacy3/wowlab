"use client";

import { memo, useMemo } from "react";
import { Group, Rect, Text } from "react-konva";
import { getSpell } from "@/atoms/timeline";
import { TRACK_METRICS } from "../hooks";

interface Debuff {
  id: string;
  spellId: number;
  start: number;
  end: number;
}

interface DebuffsTrackProps {
  debuffs: Debuff[];
  y: number;
  timeToX: (time: number) => number;
  innerWidth: number;
  visibleRange: { start: number; end: number };
}

export const DebuffsTrack = memo(function DebuffsTrack({
  debuffs,
  y,
  timeToX,
  innerWidth,
  visibleRange,
}: DebuffsTrackProps) {
  const { debuffHeight, debuffGap, debuffDash, buffCornerRadius } =
    TRACK_METRICS;

  // Filter to visible debuffs BEFORE rendering
  const visibleDebuffs = useMemo(() => {
    return debuffs.filter(
      (debuff) =>
        debuff.end >= visibleRange.start && debuff.start <= visibleRange.end,
    );
  }, [debuffs, visibleRange.start, visibleRange.end]);

  return (
    <Group y={y}>
      {visibleDebuffs.map((debuff, i) => {
        const startX = timeToX(debuff.start);
        const endX = timeToX(debuff.end);
        const width = Math.max(4, endX - startX);
        const dy = (i % 2) * (debuffHeight + debuffGap) + 2;
        const spell = getSpell(debuff.spellId);

        return (
          <Group key={debuff.id} x={startX} y={dy} opacity={0.7}>
            <Rect
              width={width}
              height={debuffHeight}
              fill={spell?.color ?? "#888"}
              cornerRadius={buffCornerRadius}
              stroke={spell?.color ?? "#888"}
              strokeWidth={1}
              dash={[...debuffDash]}
              perfectDrawEnabled={false}
            />
            {width > 50 && (
              <Text
                text={spell?.name ?? ""}
                x={6}
                y={debuffHeight / 2 - 4}
                fontSize={9}
                fill="#fff"
                listening={false}
                perfectDrawEnabled={false}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
});
