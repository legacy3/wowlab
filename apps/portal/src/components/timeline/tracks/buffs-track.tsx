"use client";

import { memo, useMemo } from "react";
import { Group, Rect, Text, Circle } from "react-konva";
import type Konva from "konva";
import { getSpell } from "@/atoms/timeline";
import { TRACK_METRICS } from "../hooks";
import { getSpellOpacity, buildSpellTooltip } from "../timeline-context";

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
  visibleRange: { start: number; end: number };
  selectedSpell: number | null;
  showTooltip: (
    e: Konva.KonvaEventObject<MouseEvent>,
    content: React.ReactNode,
  ) => void;
  hideTooltip: () => void;
}

export const BuffsTrack = memo(function BuffsTrack({
  buffs,
  y,
  timeToX,
  innerWidth,
  visibleRange,
  selectedSpell,
  showTooltip,
  hideTooltip,
}: BuffsTrackProps) {
  const { buffHeight, buffGap, buffCornerRadius } = TRACK_METRICS;

  // Flatten buffs with row indices
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

  // Filter to visible buffs BEFORE rendering
  const visibleBuffs = useMemo(() => {
    return allBuffs.filter(
      ({ buff }) =>
        buff.end >= visibleRange.start && buff.start <= visibleRange.end,
    );
  }, [allBuffs, visibleRange.start, visibleRange.end]);

  return (
    <Group y={y}>
      {visibleBuffs.map(({ buff, rowIndex }) => {
        const startX = timeToX(buff.start);
        const endX = timeToX(buff.end);
        const width = Math.max(4, endX - startX);
        const by = rowIndex * (buffHeight + buffGap) + 2;
        const spell = getSpell(buff.spellId);
        const opacity = getSpellOpacity(selectedSpell, buff.spellId, 0.85, 0.3);

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
              perfectDrawEnabled={false}
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
                perfectDrawEnabled={false}
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
                  perfectDrawEnabled={false}
                />
                <Text
                  text={String(buff.stacks)}
                  x={width - 12}
                  y={4}
                  fontSize={9}
                  fontStyle="bold"
                  fill="#fff"
                  listening={false}
                  perfectDrawEnabled={false}
                />
              </>
            )}
          </Group>
        );
      })}
    </Group>
  );
});
