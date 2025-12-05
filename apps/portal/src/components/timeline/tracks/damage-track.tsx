"use client";

import { memo, useMemo } from "react";
import { Group, Rect, Circle } from "react-konva";
import type Konva from "konva";
import { getSpell } from "@/atoms/timeline";
import { TRACK_METRICS } from "../hooks";
import { getSpellOpacity, buildSpellTooltip } from "../timeline-context";

interface DamageEvent {
  id: string;
  spellId: number;
  timestamp: number;
  amount: number;
  isCrit: boolean;
  target: string;
}

interface DamageTrackProps {
  damage: DamageEvent[];
  y: number;
  height: number;
  timeToX: (time: number) => number;
  damageToY: (amount: number) => number;
  innerWidth: number;
  visibleRange: { start: number; end: number };
  selectedSpell: number | null;
  showTooltip: (
    e: Konva.KonvaEventObject<MouseEvent>,
    content: React.ReactNode,
  ) => void;
  hideTooltip: () => void;
}

export const DamageTrack = memo(function DamageTrack({
  damage,
  y,
  height,
  timeToX,
  damageToY,
  innerWidth,
  visibleRange,
  selectedSpell,
  showTooltip,
  hideTooltip,
}: DamageTrackProps) {
  const { damageBarWidth, damageCritRadius } = TRACK_METRICS;

  // Filter to visible damage events BEFORE rendering
  const visibleDamage = useMemo(() => {
    const padding = 0.5; // Small time padding
    return damage.filter(
      (dmg) =>
        dmg.timestamp >= visibleRange.start - padding &&
        dmg.timestamp <= visibleRange.end + padding,
    );
  }, [damage, visibleRange.start, visibleRange.end]);

  return (
    <Group y={y}>
      {visibleDamage.map((dmg) => {
        const dx = timeToX(dmg.timestamp);
        const spell = getSpell(dmg.spellId);
        const dy = damageToY(dmg.amount);
        const dh = height - 5 - dy;
        const opacity = getSpellOpacity(selectedSpell, dmg.spellId, 1, 0.2);

        return (
          <Group
            key={dmg.id}
            x={dx}
            opacity={opacity}
            onMouseEnter={(e) => {
              const tooltip = buildSpellTooltip(dmg.spellId, dmg.timestamp, {
                damage: dmg.amount,
                isCrit: dmg.isCrit,
                target: dmg.target,
              });
              if (tooltip) showTooltip(e, tooltip);
            }}
            onMouseLeave={hideTooltip}
          >
            <Rect
              x={-damageBarWidth / 2}
              y={dy}
              width={damageBarWidth}
              height={Math.max(0, dh)}
              fill={spell?.color ?? "#888"}
              cornerRadius={1}
              perfectDrawEnabled={false}
            />
            {dmg.isCrit && (
              <Circle
                x={0}
                y={dy - 4}
                radius={damageCritRadius}
                fill="#FFD700"
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
