"use client";

import { Group, Rect, Text } from "react-konva";
import { getSpell } from "@/atoms/timeline";
import { TRACK_METRICS } from "../hooks";
import { isRangeVisible } from "../timeline-context";

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
}

export function DebuffsTrack({
  debuffs,
  y,
  timeToX,
  innerWidth,
}: DebuffsTrackProps) {
  const { debuffHeight, debuffGap, debuffDash, buffCornerRadius } =
    TRACK_METRICS;

  return (
    <Group y={y}>
      {debuffs.map((debuff, i) => {
        const startX = timeToX(debuff.start);
        const endX = timeToX(debuff.end);
        const width = Math.max(4, endX - startX);
        const dy = (i % 2) * (debuffHeight + debuffGap) + 2;
        const spell = getSpell(debuff.spellId);

        if (!isRangeVisible(startX, endX, innerWidth)) return null;

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
            />
            {width > 50 && (
              <Text
                text={spell?.name ?? ""}
                x={6}
                y={debuffHeight / 2 - 4}
                fontSize={9}
                fill="#fff"
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
