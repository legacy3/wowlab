"use client";

import { useCallback, useRef, useState, useMemo, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Stage, Layer, Rect, Line, Text, Group, Circle } from "react-konva";
import type Konva from "konva";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  combatDataAtom,
  timelineBoundsAtom,
  buffsBySpellAtom,
  debuffsAtom,
  uniqueSpellsAtom,
  maxDamageAtom,
  expandedTracksAtom,
  selectedSpellAtom,
  hoveredSpellAtom,
  viewRangeAtom,
  formatDamage,
  formatTime,
  getSpell,
  type TrackId,
  type CastEvent,
} from "@/atoms/timeline";

import {
  useKonvaZoom,
  useKonvaScales,
  useTrackLayout,
  useResizeObserver,
  useThrottledCallback,
  TRACK_CONFIGS,
} from "./hooks";

// =============================================================================
// Constants
// =============================================================================

const MARGIN = { top: 10, right: 20, bottom: 30, left: 90 } as const;
const MINIMAP_HEIGHT = 40;
const CAST_SIZE = 24;

// =============================================================================
// Tooltip Component
// =============================================================================

interface TooltipState {
  x: number;
  y: number;
  content: React.ReactNode;
}

function TimelineTooltip({ tooltip }: { tooltip: TooltipState | null }) {
  if (!tooltip) return null;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: tooltip.x,
        top: tooltip.y - 10,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
        {tooltip.content}
      </div>
    </div>
  );
}

// =============================================================================
// Track Components
// =============================================================================

interface TrackProps {
  timeToX: (time: number) => number;
  innerWidth: number;
  selectedSpell: number | null;
  hoveredSpell: number | null;
  onSpellSelect: (spellId: number | null) => void;
  onSpellHover: (spellId: number | null) => void;
  onTooltip: (tooltip: TooltipState | null) => void;
}

// Grid and Background
function GridLayer({
  innerWidth,
  totalHeight,
  timeToX,
  bounds,
}: {
  innerWidth: number;
  totalHeight: number;
  timeToX: (time: number) => number;
  bounds: { min: number; max: number };
}) {
  // Generate tick marks
  const ticks = useMemo(() => {
    const tickCount = 20;
    const range = bounds.max - bounds.min;
    const step = range / tickCount;
    return Array.from(
      { length: tickCount + 1 },
      (_, i) => bounds.min + i * step,
    );
  }, [bounds]);

  return (
    <>
      {/* Background */}
      <Rect
        x={0}
        y={0}
        width={innerWidth}
        height={totalHeight}
        fill="#1a1a1a"
        cornerRadius={4}
      />
      {/* Grid lines */}
      {ticks.map((tick, i) => {
        const x = timeToX(tick);
        if (x < 0 || x > innerWidth) return null;
        const isMajor = Math.round(tick) % 10 === 0;
        return (
          <Line
            key={`grid-${i}`}
            points={[x, 0, x, totalHeight]}
            stroke="#333"
            strokeWidth={1}
            opacity={isMajor ? 0.4 : 0.15}
            dash={isMajor ? undefined : [2, 2]}
            listening={false}
          />
        );
      })}
    </>
  );
}

// X Axis
function XAxis({
  innerWidth,
  totalHeight,
  timeToX,
  bounds,
}: {
  innerWidth: number;
  totalHeight: number;
  timeToX: (time: number) => number;
  bounds: { min: number; max: number };
}) {
  const ticks = useMemo(() => {
    const tickCount = 10;
    const range = bounds.max - bounds.min;
    const step = range / tickCount;
    return Array.from(
      { length: tickCount + 1 },
      (_, i) => bounds.min + i * step,
    );
  }, [bounds]);

  return (
    <Group y={totalHeight}>
      <Line
        points={[0, 0, innerWidth, 0]}
        stroke="#444"
        strokeWidth={1}
        listening={false}
      />
      {ticks.map((tick, i) => {
        const x = timeToX(tick);
        if (x < -50 || x > innerWidth + 50) return null;
        return (
          <Group key={`tick-${i}`} x={x}>
            <Line points={[0, 0, 0, 6]} stroke="#444" strokeWidth={1} />
            <Text
              text={formatTime(tick)}
              x={-20}
              y={10}
              width={40}
              align="center"
              fontSize={11}
              fill="#888"
              listening={false}
            />
          </Group>
        );
      })}
    </Group>
  );
}

// Phases Track
function PhasesTrack({
  phases,
  y,
  height,
  timeToX,
  innerWidth,
  totalHeight,
}: {
  phases: Array<{
    id: string;
    name: string;
    start: number;
    end: number;
    color: string;
  }>;
  y: number;
  height: number;
  timeToX: (time: number) => number;
  innerWidth: number;
  totalHeight: number;
}) {
  return (
    <Group y={y}>
      {phases.map((phase) => {
        const startX = Math.max(0, timeToX(phase.start));
        const endX = Math.min(innerWidth, timeToX(phase.end));
        const width = endX - startX;
        if (width <= 0) return null;

        return (
          <Group key={phase.id}>
            {/* Phase rectangle */}
            <Rect
              x={startX}
              y={2}
              width={width}
              height={height - 4}
              fill={phase.color}
              opacity={0.2}
              cornerRadius={2}
              listening={false}
            />
            {/* Phase label */}
            {width > 50 && (
              <Text
                x={startX}
                y={height / 2 - 5}
                width={width}
                align="center"
                text={phase.name}
                fontSize={10}
                fontStyle="bold"
                fill={phase.color}
                listening={false}
              />
            )}
            {/* Phase boundary line */}
            <Line
              points={[startX, 0, startX, totalHeight - y]}
              stroke={phase.color}
              strokeWidth={1}
              opacity={0.5}
              dash={[4, 2]}
              listening={false}
            />
          </Group>
        );
      })}
    </Group>
  );
}

// Casts Track
function CastsTrack({
  casts,
  y,
  height,
  timeToX,
  innerWidth,
  selectedSpell,
  hoveredSpell,
  onSpellSelect,
  onSpellHover,
  onTooltip,
  containerRef,
}: TrackProps & {
  casts: CastEvent[];
  y: number;
  height: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  // Row layout to avoid overlaps
  const castsWithRow = useMemo(() => {
    const rows: CastEvent[][] = [];
    casts.forEach((cast) => {
      const cx = timeToX(cast.timestamp);
      let placed = false;
      for (const row of rows) {
        const lastInRow = row[row.length - 1];
        if (timeToX(lastInRow.timestamp) + CAST_SIZE + 2 < cx) {
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
  }, [casts, timeToX]);

  return (
    <Group y={y}>
      {castsWithRow.map((cast) => {
        const cx = timeToX(cast.timestamp);
        if (cx < -CAST_SIZE || cx > innerWidth + CAST_SIZE) return null;

        const spell = getSpell(cast.spellId);
        const cy = cast.rowIndex * (CAST_SIZE + 3) + 4;
        const isDimmed =
          selectedSpell !== null && selectedSpell !== cast.spellId;
        const isHighlighted =
          selectedSpell === cast.spellId || hoveredSpell === cast.spellId;
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
            opacity={isDimmed ? 0.3 : 1}
            onClick={() =>
              onSpellSelect(
                selectedSpell === cast.spellId ? null : cast.spellId,
              )
            }
            onMouseEnter={(e) => {
              onSpellHover(cast.spellId);
              const container = containerRef.current;
              if (!container || !spell) return;
              const stage = e.target.getStage();
              if (!stage) return;
              const pos = stage.getPointerPosition();
              if (!pos) return;
              onTooltip({
                x: pos.x + MARGIN.left,
                y: pos.y + MARGIN.top,
                content: (
                  <div className="space-y-1">
                    <div
                      className="font-semibold"
                      style={{ color: spell.color }}
                    >
                      {spell.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Time: {formatTime(cast.timestamp)}
                    </div>
                    {cast.target && (
                      <div className="text-xs text-muted-foreground">
                        Target: {cast.target}
                      </div>
                    )}
                  </div>
                ),
              });
            }}
            onMouseLeave={() => {
              onSpellHover(null);
              onTooltip(null);
            }}
          >
            <Rect
              width={CAST_SIZE}
              height={CAST_SIZE}
              fill={spell?.color ?? "#888"}
              cornerRadius={4}
              stroke={isHighlighted ? "#fff" : undefined}
              strokeWidth={isHighlighted ? 2 : 0}
            />
            <Text
              text={initials}
              width={CAST_SIZE}
              height={CAST_SIZE}
              align="center"
              verticalAlign="middle"
              fontSize={9}
              fontStyle="bold"
              fill="#fff"
              listening={false}
            />
          </Group>
        );
      })}
    </Group>
  );
}

// Buffs Track
function BuffsTrack({
  buffs,
  y,
  height,
  timeToX,
  innerWidth,
  selectedSpell,
  onTooltip,
  containerRef,
}: TrackProps & {
  buffs: Map<
    number,
    Array<{
      id: string;
      spellId: number;
      start: number;
      end: number;
      stacks?: number;
    }>
  >;
  y: number;
  height: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const BUFF_HEIGHT = 20;

  const allBuffs = useMemo(() => {
    let rowIndex = 0;
    const result: Array<{
      buff: {
        id: string;
        spellId: number;
        start: number;
        end: number;
        stacks?: number;
      };
      rowIndex: number;
    }> = [];

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
        const by = rowIndex * (BUFF_HEIGHT + 3) + 2;
        const spell = getSpell(buff.spellId);
        const isDimmed =
          selectedSpell !== null && selectedSpell !== buff.spellId;

        if (startX > innerWidth || endX < 0) return null;

        return (
          <Group
            key={buff.id}
            x={startX}
            y={by}
            opacity={isDimmed ? 0.3 : 0.85}
            onMouseEnter={(e) => {
              const container = containerRef.current;
              if (!container || !spell) return;
              const stage = e.target.getStage();
              if (!stage) return;
              const pos = stage.getPointerPosition();
              if (!pos) return;
              onTooltip({
                x: pos.x + MARGIN.left,
                y: pos.y + MARGIN.top,
                content: (
                  <div className="space-y-1">
                    <div
                      className="font-semibold"
                      style={{ color: spell.color }}
                    >
                      {spell.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Duration: {formatTime(buff.start)} -{" "}
                      {formatTime(buff.end)}
                    </div>
                    {buff.stacks && (
                      <div className="text-xs text-muted-foreground">
                        Stacks: {buff.stacks}
                      </div>
                    )}
                  </div>
                ),
              });
            }}
            onMouseLeave={() => onTooltip(null)}
          >
            <Rect
              width={width}
              height={BUFF_HEIGHT}
              fill={spell?.color ?? "#888"}
              cornerRadius={3}
            />
            {width > 60 && (
              <Text
                text={spell?.name ?? ""}
                x={6}
                y={BUFF_HEIGHT / 2 - 5}
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

// Debuffs Track
function DebuffsTrack({
  debuffs,
  y,
  height,
  timeToX,
  innerWidth,
}: {
  debuffs: Array<{ id: string; spellId: number; start: number; end: number }>;
  y: number;
  height: number;
  timeToX: (time: number) => number;
  innerWidth: number;
}) {
  const DEBUFF_HEIGHT = 18;

  return (
    <Group y={y}>
      {debuffs.map((debuff, i) => {
        const startX = timeToX(debuff.start);
        const endX = timeToX(debuff.end);
        const width = Math.max(4, endX - startX);
        const dy = (i % 2) * (DEBUFF_HEIGHT + 2) + 2;
        const spell = getSpell(debuff.spellId);

        if (startX > innerWidth || endX < 0) return null;

        return (
          <Group key={debuff.id} x={startX} y={dy} opacity={0.7}>
            <Rect
              width={width}
              height={DEBUFF_HEIGHT}
              fill={spell?.color ?? "#888"}
              cornerRadius={3}
              stroke={spell?.color ?? "#888"}
              strokeWidth={1}
              dash={[3, 2]}
            />
            {width > 50 && (
              <Text
                text={spell?.name ?? ""}
                x={6}
                y={DEBUFF_HEIGHT / 2 - 4}
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

// Damage Track
function DamageTrack({
  damage,
  y,
  height,
  timeToX,
  damageToY,
  innerWidth,
  selectedSpell,
  onTooltip,
  containerRef,
}: TrackProps & {
  damage: Array<{
    id: string;
    spellId: number;
    timestamp: number;
    amount: number;
    isCrit: boolean;
    target: string;
  }>;
  y: number;
  height: number;
  damageToY: (amount: number) => number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Group y={y}>
      {damage.map((dmg) => {
        const dx = timeToX(dmg.timestamp);
        if (dx < -4 || dx > innerWidth + 4) return null;

        const spell = getSpell(dmg.spellId);
        const dy = damageToY(dmg.amount);
        const dh = height - 5 - dy;
        const isDimmed =
          selectedSpell !== null && selectedSpell !== dmg.spellId;

        return (
          <Group
            key={dmg.id}
            x={dx}
            opacity={isDimmed ? 0.2 : 1}
            onMouseEnter={(e) => {
              const container = containerRef.current;
              if (!container || !spell) return;
              const stage = e.target.getStage();
              if (!stage) return;
              const pos = stage.getPointerPosition();
              if (!pos) return;
              onTooltip({
                x: pos.x + MARGIN.left,
                y: pos.y + MARGIN.top,
                content: (
                  <div className="space-y-1">
                    <div
                      className="font-semibold"
                      style={{ color: spell.color }}
                    >
                      {spell.name}
                    </div>
                    <div className="text-sm">
                      {formatDamage(dmg.amount)}
                      {dmg.isCrit && (
                        <span className="ml-1 text-yellow-400">CRIT!</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Target: {dmg.target}
                    </div>
                  </div>
                ),
              });
            }}
            onMouseLeave={() => onTooltip(null)}
          >
            <Rect
              x={-2}
              y={dy}
              width={4}
              height={Math.max(0, dh)}
              fill={spell?.color ?? "#888"}
              cornerRadius={1}
            />
            {dmg.isCrit && (
              <Circle
                x={0}
                y={dy - 4}
                radius={3}
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

// Resources Track
function ResourcesTrack({
  resources,
  y,
  height,
  timeToX,
  focusToY,
  innerWidth,
}: {
  resources: Array<{ timestamp: number; focus: number }>;
  y: number;
  height: number;
  timeToX: (time: number) => number;
  focusToY: (focus: number) => number;
  innerWidth: number;
}) {
  // Generate points for area and line
  const points = useMemo(() => {
    const linePoints: number[] = [];
    const areaPoints: number[] = [0, height - 5]; // Start at bottom-left

    resources.forEach((r) => {
      const x = timeToX(r.timestamp);
      const fy = focusToY(r.focus);
      linePoints.push(x, fy);
      areaPoints.push(x, fy);
    });

    // Close the area
    if (resources.length > 0) {
      const lastX = timeToX(resources[resources.length - 1].timestamp);
      areaPoints.push(lastX, height - 5);
    }

    return { linePoints, areaPoints };
  }, [resources, timeToX, focusToY, height]);

  // Threshold lines
  const thresholds = [30, 60, 90];

  return (
    <Group y={y}>
      {/* Area fill */}
      <Line
        points={points.areaPoints}
        fill="#3B82F6"
        opacity={0.2}
        closed
        listening={false}
      />
      {/* Focus line */}
      <Line
        points={points.linePoints}
        stroke="#3B82F6"
        strokeWidth={2}
        tension={0.3}
        listening={false}
      />
      {/* Threshold lines */}
      {thresholds.map((threshold) => (
        <Line
          key={threshold}
          points={[0, focusToY(threshold), innerWidth, focusToY(threshold)]}
          stroke="#444"
          strokeWidth={1}
          opacity={0.3}
          dash={[2, 4]}
          listening={false}
        />
      ))}
    </Group>
  );
}

// Track Labels
function TrackLabels({
  tracks,
  expandedTracks,
  onToggleTrack,
}: {
  tracks: Record<TrackId, { y: number; height: number; visible: boolean }>;
  expandedTracks: Set<TrackId>;
  onToggleTrack: (trackId: TrackId) => void;
}) {
  return (
    <Group>
      {TRACK_CONFIGS.map((track) => {
        const layout = tracks[track.id];
        if (!layout.visible && !track.collapsible) return null;

        const labelY = track.collapsible
          ? layout.y + (layout.visible ? layout.height / 2 : 10)
          : layout.y + layout.height / 2;

        return (
          <Group
            key={track.id}
            x={8}
            y={labelY}
            onClick={() => track.collapsible && onToggleTrack(track.id)}
          >
            {track.collapsible && (
              <Text
                text={expandedTracks.has(track.id) ? "\u25BC" : "\u25B6"}
                fontSize={10}
                fill="#888"
              />
            )}
            <Text
              text={track.label}
              x={track.collapsible ? 14 : 0}
              fontSize={11}
              fontStyle="500"
              fill="#ddd"
            />
          </Group>
        );
      })}
    </Group>
  );
}

// Minimap
function Minimap({
  phases,
  casts,
  bounds,
  viewRange,
  innerWidth,
  onRangeSelect,
}: {
  phases: Array<{ id: string; start: number; end: number; color: string }>;
  casts: CastEvent[];
  bounds: { min: number; max: number };
  viewRange: { start: number; end: number };
  innerWidth: number;
  onRangeSelect: (start: number, end: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Scale for minimap (always shows full range)
  const timeToX = useCallback(
    (time: number) => {
      const ratio = (time - bounds.min) / (bounds.max - bounds.min);
      return ratio * innerWidth;
    },
    [bounds, innerWidth],
  );

  // Convert mouse X position to time range
  const updateRangeFromX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left - MARGIN.left;
      const clickTime =
        bounds.min + (x / innerWidth) * (bounds.max - bounds.min);
      const currentRangeSize = viewRange.end - viewRange.start;
      const newStart = Math.max(
        bounds.min,
        Math.min(
          bounds.max - currentRangeSize,
          clickTime - currentRangeSize / 2,
        ),
      );
      onRangeSelect(newStart, newStart + currentRangeSize);
    },
    [bounds, innerWidth, viewRange, onRangeSelect],
  );

  // Use window-level listeners for reliable drag handling
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateRangeFromX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateRangeFromX]);

  // Cast density buckets
  const densityBars = useMemo(() => {
    const numBuckets = 100;
    const bucketSize = (bounds.max - bounds.min) / numBuckets;
    const buckets = new Array(numBuckets).fill(0);
    casts.forEach((c) => {
      const bucket = Math.floor((c.timestamp - bounds.min) / bucketSize);
      if (bucket >= 0 && bucket < numBuckets) buckets[bucket]++;
    });
    const maxDensity = Math.max(...buckets, 1);
    return buckets.map((count, i) => ({
      x: (i / numBuckets) * innerWidth,
      width: innerWidth / numBuckets,
      height: (count / maxDensity) * 20,
    }));
  }, [casts, bounds, innerWidth]);

  // Brush position
  const brushX = timeToX(viewRange.start);
  const brushWidth = timeToX(viewRange.end) - brushX;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateRangeFromX(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? "grabbing" : "pointer" }}
    >
      <Stage
        width={innerWidth + MARGIN.left + MARGIN.right}
        height={MINIMAP_HEIGHT}
      >
        <Layer>
          <Group x={MARGIN.left} y={5}>
            {/* Background */}
            <Rect
              width={innerWidth}
              height={MINIMAP_HEIGHT - 10}
              fill="#222"
              cornerRadius={2}
              listening={false}
            />
            {/* Phases */}
            {phases.map((phase) => (
              <Rect
                key={phase.id}
                x={timeToX(phase.start)}
                width={timeToX(phase.end) - timeToX(phase.start)}
                height={MINIMAP_HEIGHT - 10}
                fill={phase.color}
                opacity={0.15}
                listening={false}
              />
            ))}
            {/* Cast density */}
            {densityBars.map((bar, i) =>
              bar.height > 0 ? (
                <Rect
                  key={i}
                  x={bar.x}
                  y={MINIMAP_HEIGHT - 10 - bar.height}
                  width={Math.max(1, bar.width)}
                  height={bar.height}
                  fill="#3B82F6"
                  opacity={0.4}
                  listening={false}
                />
              ) : null,
            )}
            {/* Brush/selection */}
            <Rect
              x={brushX}
              width={Math.max(4, brushWidth)}
              height={MINIMAP_HEIGHT - 10}
              fill="#3B82F6"
              opacity={0.25}
              stroke="#3B82F6"
              strokeWidth={1}
            />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function KonvaTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Atoms
  const combatData = useAtomValue(combatDataAtom);
  const bounds = useAtomValue(timelineBoundsAtom);
  const buffsBySpell = useAtomValue(buffsBySpellAtom);
  const debuffs = useAtomValue(debuffsAtom);
  const uniqueSpells = useAtomValue(uniqueSpellsAtom);
  const maxDamage = useAtomValue(maxDamageAtom);
  const [expandedTracks, setExpandedTracks] = useAtom(expandedTracksAtom);
  const [selectedSpell, setSelectedSpell] = useAtom(selectedSpellAtom);
  const [hoveredSpell, setHoveredSpell] = useAtom(hoveredSpellAtom);
  const [viewRange, setViewRange] = useAtom(viewRangeAtom);

  // Local state
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Container size
  const { width: containerWidth } = useResizeObserver(containerRef);
  const innerWidth = Math.max(0, containerWidth - MARGIN.left - MARGIN.right);

  // Track layout
  const { tracks, totalHeight } = useTrackLayout(expandedTracks);

  // Zoom state
  const {
    zoomState,
    setZoomState,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    fitAll,
    zoomToRange,
  } = useKonvaZoom({
    totalDuration: bounds.max - bounds.min,
    innerWidth,
    initialWindow: 60,
  });

  // Scales
  const { timeToX, xToTime, damageToY, focusToY, visibleRange } =
    useKonvaScales({
      bounds,
      innerWidth,
      damageTrackHeight: tracks.damage.height,
      resourceTrackHeight: tracks.resources.height,
      maxDamage,
      zoomState,
    });

  // Throttled tooltip setter
  const throttledSetTooltip = useThrottledCallback(setTooltip, 16);

  // Update view range when zoom changes
  useEffect(() => {
    if (innerWidth > 0) {
      setViewRange(visibleRange);
    }
  }, [visibleRange, innerWidth, setViewRange]);

  // Toggle track expansion
  const toggleTrack = useCallback(
    (trackId: TrackId) => {
      setExpandedTracks((prev) => {
        const next = new Set(prev);
        if (next.has(trackId)) {
          next.delete(trackId);
        } else {
          next.add(trackId);
        }
        return next;
      });
    },
    [setExpandedTracks],
  );

  // Handle drag for panning
  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const stage = e.target;
      if (stage !== stageRef.current) return;

      const newX = stage.x();
      const maxX = 0;
      const minX = -(innerWidth * zoomState.scale - innerWidth);

      setZoomState((prev) => ({
        ...prev,
        x: Math.min(maxX, Math.max(minX, newX)),
      }));

      // Reset stage position since we handle it via transform
      stage.x(0);
    },
    [innerWidth, zoomState.scale, setZoomState],
  );

  // Handle range select from minimap
  const handleMinimapRangeSelect = useCallback(
    (start: number, end: number) => {
      zoomToRange(start, end);
    },
    [zoomToRange],
  );

  const stageHeight = totalHeight + MARGIN.top + MARGIN.bottom;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {formatTime(viewRange.start)} - {formatTime(viewRange.end)}
          <span className="ml-2 opacity-60">(Scroll to zoom, drag to pan)</span>
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={zoomOut}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={resetZoom}
            title="Reset to 60s view"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={fitAll}
            title="Fit all (show entire timeline)"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={zoomIn}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main timeline */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg border bg-background overflow-hidden"
      >
        <Stage
          ref={stageRef}
          width={containerWidth || 800}
          height={stageHeight}
          onWheel={handleWheel}
          draggable
          onDragMove={handleDragMove}
          dragBoundFunc={(pos) => ({
            x: Math.min(
              0,
              Math.max(-(innerWidth * zoomState.scale - innerWidth), pos.x),
            ),
            y: 0,
          })}
        >
          {/* Track labels layer (static) */}
          <Layer y={MARGIN.top} listening={false}>
            <TrackLabels
              tracks={tracks}
              expandedTracks={expandedTracks}
              onToggleTrack={toggleTrack}
            />
          </Layer>

          {/* Main content layer */}
          <Layer x={MARGIN.left} y={MARGIN.top}>
            {/* Background and grid */}
            <GridLayer
              innerWidth={innerWidth}
              totalHeight={totalHeight}
              timeToX={timeToX}
              bounds={bounds}
            />

            {/* Phases track (always visible) */}
            {tracks.phases.visible && (
              <PhasesTrack
                phases={combatData.phases}
                y={tracks.phases.y}
                height={tracks.phases.height}
                timeToX={timeToX}
                innerWidth={innerWidth}
                totalHeight={totalHeight}
              />
            )}

            {/* Casts track */}
            {tracks.casts.visible && (
              <CastsTrack
                casts={combatData.casts}
                y={tracks.casts.y}
                height={tracks.casts.height}
                timeToX={timeToX}
                innerWidth={innerWidth}
                selectedSpell={selectedSpell}
                hoveredSpell={hoveredSpell}
                onSpellSelect={setSelectedSpell}
                onSpellHover={setHoveredSpell}
                onTooltip={throttledSetTooltip}
                containerRef={containerRef}
              />
            )}

            {/* Buffs track */}
            {tracks.buffs.visible && (
              <BuffsTrack
                buffs={buffsBySpell}
                y={tracks.buffs.y}
                height={tracks.buffs.height}
                timeToX={timeToX}
                innerWidth={innerWidth}
                selectedSpell={selectedSpell}
                hoveredSpell={hoveredSpell}
                onSpellSelect={setSelectedSpell}
                onSpellHover={setHoveredSpell}
                onTooltip={throttledSetTooltip}
                containerRef={containerRef}
              />
            )}

            {/* Debuffs track */}
            {tracks.debuffs.visible && (
              <DebuffsTrack
                debuffs={debuffs}
                y={tracks.debuffs.y}
                height={tracks.debuffs.height}
                timeToX={timeToX}
                innerWidth={innerWidth}
              />
            )}

            {/* Damage track */}
            {tracks.damage.visible && (
              <DamageTrack
                damage={combatData.damage}
                y={tracks.damage.y}
                height={tracks.damage.height}
                timeToX={timeToX}
                damageToY={damageToY}
                innerWidth={innerWidth}
                selectedSpell={selectedSpell}
                hoveredSpell={hoveredSpell}
                onSpellSelect={setSelectedSpell}
                onSpellHover={setHoveredSpell}
                onTooltip={throttledSetTooltip}
                containerRef={containerRef}
              />
            )}

            {/* Resources track */}
            {tracks.resources.visible && (
              <ResourcesTrack
                resources={combatData.resources}
                y={tracks.resources.y}
                height={tracks.resources.height}
                timeToX={timeToX}
                focusToY={focusToY}
                innerWidth={innerWidth}
              />
            )}

            {/* X Axis */}
            <XAxis
              innerWidth={innerWidth}
              totalHeight={totalHeight}
              timeToX={timeToX}
              bounds={bounds}
            />
          </Layer>
        </Stage>
        <TimelineTooltip tooltip={tooltip} />
      </div>

      {/* Minimap */}
      <div className="rounded border bg-card overflow-hidden">
        <Minimap
          phases={combatData.phases}
          casts={combatData.casts}
          bounds={bounds}
          viewRange={viewRange}
          innerWidth={innerWidth}
          onRangeSelect={handleMinimapRangeSelect}
        />
      </div>

      {/* Track toggles */}
      <div className="flex flex-wrap gap-2">
        {TRACK_CONFIGS.filter((t) => t.collapsible).map((track) => (
          <Button
            key={track.id}
            variant={expandedTracks.has(track.id) ? "secondary" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => toggleTrack(track.id)}
          >
            {expandedTracks.has(track.id) ? (
              <ChevronDown className="mr-1 h-3 w-3" />
            ) : (
              <ChevronRight className="mr-1 h-3 w-3" />
            )}
            {track.label}
          </Button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {uniqueSpells.map((spell) => (
          <button
            key={spell.id}
            className={cn(
              "flex items-center gap-1.5 rounded px-2 py-1 transition-opacity",
              selectedSpell === spell.id
                ? "bg-accent"
                : selectedSpell !== null
                  ? "opacity-40"
                  : "hover:bg-accent/50",
            )}
            onClick={() =>
              setSelectedSpell((prev) => (prev === spell.id ? null : spell.id))
            }
          >
            <div
              className="h-3 w-3 rounded"
              style={{ background: spell.color }}
            />
            <span className="text-muted-foreground">{spell.name}</span>
          </button>
        ))}
        {selectedSpell && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setSelectedSpell(null)}
          >
            Clear filter
          </Button>
        )}
      </div>
    </div>
  );
}
