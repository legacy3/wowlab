"use client";

import type { ReactNode } from "react";
import { getSpell, formatTime, formatDamage } from "@/atoms/timeline";

export interface TooltipState {
  x: number;
  y: number;
  content: ReactNode;
}

export function getSpellOpacity(
  selectedSpell: number | null,
  spellId: number,
  defaultOpacity = 1,
  dimmedOpacity = 0.3,
): number {
  if (selectedSpell === null) return defaultOpacity;
  return selectedSpell === spellId ? defaultOpacity : dimmedOpacity;
}

export function isSpellHighlighted(
  selectedSpell: number | null,
  hoveredSpell: number | null,
  spellId: number,
): boolean {
  return selectedSpell === spellId || hoveredSpell === spellId;
}

export function isRangeVisible(
  startX: number,
  endX: number,
  innerWidth: number,
  padding = 0,
): boolean {
  return startX <= innerWidth + padding && endX >= -padding;
}

export function isPointVisible(
  x: number,
  innerWidth: number,
  padding = 0,
): boolean {
  return x >= -padding && x <= innerWidth + padding;
}

export function buildSpellTooltip(
  spellId: number,
  timestamp: number,
  extra?: {
    target?: string;
    damage?: number;
    isCrit?: boolean;
    duration?: { start: number; end: number };
    stacks?: number;
  },
) {
  const spell = getSpell(spellId);
  if (!spell) return null;

  return (
    <div className="space-y-1">
      <div className="font-semibold" style={{ color: spell.color }}>
        {spell.name}
      </div>
      {extra?.duration ? (
        <div className="text-xs text-muted-foreground">
          Duration: {formatTime(extra.duration.start)} -{" "}
          {formatTime(extra.duration.end)}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          Time: {formatTime(timestamp)}
        </div>
      )}
      {extra?.target && (
        <div className="text-xs text-muted-foreground">
          Target: {extra.target}
        </div>
      )}
      {extra?.damage !== undefined && (
        <div className="text-sm">
          {formatDamage(extra.damage)}
          {extra.isCrit && <span className="ml-1 text-yellow-400">CRIT!</span>}
        </div>
      )}
      {extra?.stacks && extra.stacks > 1 && (
        <div className="text-xs text-muted-foreground">
          Stacks: {extra.stacks}
        </div>
      )}
    </div>
  );
}
