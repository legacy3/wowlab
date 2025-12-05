"use client";

import { Group, Rect, Circle } from "react-konva";
import type Konva from "konva";
import { getSpell } from "@/atoms/timeline";
import { TRACK_METRICS } from "../hooks";
import {
  getSpellOpacity,
  isPointVisible,
  buildSpellTooltip,
} from "../timeline-context";

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
  selectedSpell: number | null;
  showTooltip: (
    e: Konva.KonvaEventObject<MouseEvent>,
    content: React.ReactNode,
  ) => void;
  hideTooltip: () => void;
}

export function DamageTrack({
  damage,
  y,
  height,
  timeToX,
  damageToY,
  innerWidth,
  selectedSpell,
  showTooltip,
  hideTooltip,
}: DamageTrackProps) {
  const { damageBarWidth, damageCritRadius } = TRACK_METRICS;

  return (
    <Group y={y}>
      {damage.map((dmg) => {
        const dx = timeToX(dmg.timestamp);
        if (!isPointVisible(dx, innerWidth, damageBarWidth)) return null;

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
            />
            {dmg.isCrit && (
              <Circle
                x={0}
                y={dy - 4}
                radius={damageCritRadius}
                fill="#FFD700"
                listening={false}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}
