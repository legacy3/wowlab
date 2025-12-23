"use client";

import type { ReactNode } from "react";
import { getSpell } from "@/atoms/timeline";
import { formatTime, formatDamage } from "./utils";
import { formatDurationSeconds } from "@/lib/format";

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
  if (selectedSpell === null) {
    return defaultOpacity;
  }

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
    duration?: { start: number; end: number } | number;
    stacks?: number;
    refreshCount?: number;
  },
) {
  const spell = getSpell(spellId);
  if (!spell) {
    return null;
  }

  // Handle duration as either object or number
  const durationObj =
    extra?.duration !== undefined
      ? typeof extra.duration === "number"
        ? null // Just a cast duration, not a range
        : extra.duration
      : null;

  const castDuration =
    extra?.duration !== undefined && typeof extra.duration === "number"
      ? extra.duration
      : null;

  return (
    <div className="space-y-1">
      <div className="font-semibold" style={{ color: spell.color }}>
        {spell.name}
      </div>

      {durationObj ? (
        <div className="text-xs text-muted-foreground">
          Duration: {formatTime(durationObj.start)} -{" "}
          {formatTime(durationObj.end)} (
          {formatDurationSeconds(durationObj.end - durationObj.start)})
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          Time: {formatTime(timestamp)}
          {castDuration !== null && castDuration > 0 && (
            <span className="ml-1">
              (cast: {formatDurationSeconds(castDuration)})
            </span>
          )}
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

      {extra?.refreshCount !== undefined && extra.refreshCount > 0 && (
        <div className="text-xs text-muted-foreground">
          Refreshed: {extra.refreshCount}x
        </div>
      )}
    </div>
  );
}
