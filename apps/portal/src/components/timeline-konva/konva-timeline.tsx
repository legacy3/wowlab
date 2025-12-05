"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Stage, Layer } from "react-konva";
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
  formatTime,
  type TrackId,
} from "@/atoms/timeline";

import {
  useKonvaZoom,
  useKonvaScales,
  useTrackLayout,
  useResizeObserver,
  useThrottledCallback,
  TRACK_CONFIGS,
  TRACK_METRICS,
} from "./hooks";

import { type TooltipState } from "./timeline-context";
import { TimelineTooltip } from "./timeline-tooltip";
import { Minimap } from "./minimap";
import {
  GridLayer,
  XAxis,
  PhasesTrack,
  CastsTrack,
  BuffsTrack,
  DebuffsTrack,
  DamageTrack,
  ResourcesTrack,
  TrackLabels,
} from "./tracks";

const { margin: MARGIN } = TRACK_METRICS;

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
  const { timeToX, damageToY, focusToY, visibleRange } = useKonvaScales({
    bounds,
    innerWidth,
    damageTrackHeight: tracks.damage.height,
    resourceTrackHeight: tracks.resources.height,
    maxDamage,
    zoomState,
  });

  // Throttled tooltip setter
  const throttledSetTooltip = useThrottledCallback(setTooltip, 16);

  // Tooltip handlers for tracks
  const showTooltip = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, content: React.ReactNode) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      throttledSetTooltip({
        x: pos.x + MARGIN.left,
        y: pos.y + MARGIN.top,
        content,
      });
    },
    [throttledSetTooltip],
  );

  const hideTooltip = useCallback(() => {
    throttledSetTooltip(null);
  }, [throttledSetTooltip]);

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
                timeToX={timeToX}
                innerWidth={innerWidth}
                selectedSpell={selectedSpell}
                hoveredSpell={hoveredSpell}
                onSpellSelect={setSelectedSpell}
                onSpellHover={setHoveredSpell}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            )}

            {/* Buffs track */}
            {tracks.buffs.visible && (
              <BuffsTrack
                buffs={buffsBySpell}
                y={tracks.buffs.y}
                timeToX={timeToX}
                innerWidth={innerWidth}
                selectedSpell={selectedSpell}
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
              />
            )}

            {/* Debuffs track */}
            {tracks.debuffs.visible && (
              <DebuffsTrack
                debuffs={debuffs}
                y={tracks.debuffs.y}
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
                showTooltip={showTooltip}
                hideTooltip={hideTooltip}
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
