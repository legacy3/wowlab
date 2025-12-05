"use client";

import { useMemo } from "react";
import { Group, Rect, Text, Circle } from "react-konva";
import type Konva from "konva";
import { getSpell } from "@/atoms/timeline";
import { TRACK_METRICS } from "../hooks";
import {
  getSpellOpacity,
  isRangeVisible,
  buildSpellTooltip,
} from "../timeline-context";

interface Buff {
  id: string;
  spellId: number;
  start: number;
  end: number;
  stacks?: number;
}

interface BuffsTrackProps {
  buffs: Map<number, Buff[]>;
  y: number;
  timeToX: (time: number) => number;
  innerWidth: number;
  selectedSpell: number | null;
  showTooltip: (
    e: Konva.KonvaEventObject<MouseEvent>,
    content: React.ReactNode,
  ) => void;
  hideTooltip: () => void;
}

export function BuffsTrack({
  buffs,
  y,
  timeToX,
  innerWidth,
  selectedSpell,
  showTooltip,
  hideTooltip,
}: BuffsTrackProps) {
  const { buffHeight, buffGap, buffCornerRadius } = TRACK_METRICS;

  const allBuffs = useMemo(() => {
    let rowIndex = 0;
    const result: Array<{ buff: Buff; rowIndex: number }> = [];

    buffs.forEach((spellBuffs) => {
      spellBuffs.forEach((buff) => {
        result.push({ buff, rowIndex });
      });
      rowIndex++;
    });

    return result;
  }, [buffs]);

  return (
    <Group y={y}>
      {allBuffs.map(({ buff, rowIndex }) => {
        const startX = timeToX(buff.start);
        const endX = timeToX(buff.end);
        const width = Math.max(4, endX - startX);
        const by = rowIndex * (buffHeight + buffGap) + 2;
        const spell = getSpell(buff.spellId);
        const opacity = getSpellOpacity(selectedSpell, buff.spellId, 0.85, 0.3);

        if (!isRangeVisible(startX, endX, innerWidth)) return null;

        return (
          <Group
            key={buff.id}
            x={startX}
            y={by}
            opacity={opacity}
            onMouseEnter={(e) => {
              const tooltip = buildSpellTooltip(buff.spellId, buff.start, {
                duration: { start: buff.start, end: buff.end },
                stacks: buff.stacks,
              });
              if (tooltip) showTooltip(e, tooltip);
            }}
            onMouseLeave={hideTooltip}
          >
            <Rect
              width={width}
              height={buffHeight}
              fill={spell?.color ?? "#888"}
              cornerRadius={buffCornerRadius}
            />
            {width > 60 && (
              <Text
                text={spell?.name ?? ""}
                x={6}
                y={buffHeight / 2 - 5}
                fontSize={10}
                fontStyle="500"
                fill="#fff"
                listening={false}
              />
            )}
            {/* Stack indicator */}
            {buff.stacks && buff.stacks > 1 && (
              <>
                <Circle
                  x={width - 8}
                  y={8}
                  radius={6}
                  fill="#000"
                  opacity={0.6}
                  listening={false}
                />
                <Text
                  text={String(buff.stacks)}
                  x={width - 12}
                  y={4}
                  fontSize={9}
                  fontStyle="bold"
                  fill="#fff"
                  listening={false}
                />
              </>
            )}
          </Group>
        );
      })}
    </Group>
  );
}
