"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type Konva from "konva";
import { getSpell, formatTime, formatDamage } from "@/atoms/timeline";

// =============================================================================
// Types
// =============================================================================

export interface TooltipState {
  x: number;
  y: number;
  content: ReactNode;
}

export interface TimelineContextValue {
  // Scales
  timeToX: (time: number) => number;
  innerWidth: number;

  // Selection state
  selectedSpell: number | null;
  hoveredSpell: number | null;
  onSpellSelect: (spellId: number | null) => void;
  onSpellHover: (spellId: number | null) => void;

  // Tooltip
  showTooltip: (
    e: Konva.KonvaEventObject<MouseEvent>,
    content: ReactNode,
  ) => void;
  hideTooltip: () => void;

  // Container ref for tooltip positioning
  containerRef: React.RefObject<HTMLDivElement | null>;

  // Margins for tooltip offset
  margin: { top: number; left: number };
}

// =============================================================================
// Context
// =============================================================================

const TimelineContext = createContext<TimelineContextValue | null>(null);

export function useTimelineContext(): TimelineContextValue {
  const ctx = useContext(TimelineContext);
  if (!ctx) {
    throw new Error("useTimelineContext must be used within TimelineProvider");
  }
  return ctx;
}

// =============================================================================
// Provider
// =============================================================================

interface TimelineProviderProps {
  children: ReactNode;
  timeToX: (time: number) => number;
  innerWidth: number;
  selectedSpell: number | null;
  hoveredSpell: number | null;
  onSpellSelect: (spellId: number | null) => void;
  onSpellHover: (spellId: number | null) => void;
  onTooltip: (tooltip: TooltipState | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  margin: { top: number; left: number };
}

export function TimelineProvider({
  children,
  timeToX,
  innerWidth,
  selectedSpell,
  hoveredSpell,
  onSpellSelect,
  onSpellHover,
  onTooltip,
  containerRef,
  margin,
}: TimelineProviderProps) {
  const showTooltip = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, content: ReactNode) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      onTooltip({
        x: pos.x + margin.left,
        y: pos.y + margin.top,
        content,
      });
    },
    [onTooltip, margin.left, margin.top],
  );

  const hideTooltip = useCallback(() => {
    onTooltip(null);
  }, [onTooltip]);

  const value: TimelineContextValue = {
    timeToX,
    innerWidth,
    selectedSpell,
    hoveredSpell,
    onSpellSelect,
    onSpellHover,
    showTooltip,
    hideTooltip,
    containerRef,
    margin,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

// =============================================================================
// Shared Utilities
// =============================================================================

/**
 * Calculate opacity based on selection state
 */
export function getSpellOpacity(
  selectedSpell: number | null,
  spellId: number,
  defaultOpacity = 1,
  dimmedOpacity = 0.3,
): number {
  if (selectedSpell === null) return defaultOpacity;
  return selectedSpell === spellId ? defaultOpacity : dimmedOpacity;
}

/**
 * Check if a spell is currently highlighted (selected or hovered)
 */
export function isSpellHighlighted(
  selectedSpell: number | null,
  hoveredSpell: number | null,
  spellId: number,
): boolean {
  return selectedSpell === spellId || hoveredSpell === spellId;
}

/**
 * Check if a time range is visible within the viewport
 */
export function isRangeVisible(
  startX: number,
  endX: number,
  innerWidth: number,
  padding = 0,
): boolean {
  return startX <= innerWidth + padding && endX >= -padding;
}

/**
 * Check if a point is visible within the viewport
 */
export function isPointVisible(
  x: number,
  innerWidth: number,
  padding = 0,
): boolean {
  return x >= -padding && x <= innerWidth + padding;
}

// =============================================================================
// Tooltip Content Builders
// =============================================================================

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
