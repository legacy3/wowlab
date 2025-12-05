"use client";

import { useCallback, useRef, useState, useEffect, memo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Stage, Layer, Text } from "react-konva";
import Konva from "konva";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronRight,
  Expand,
  X,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  formatTime,
  type TrackId,
} from "@/atoms/timeline";

import {
  useZoom,
  useScales,
  useTrackLayout,
  useResizeObserver,
  useThrottledCallback,
  useExport,
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

// Memoized header component
interface TimelineHeaderProps {
  visibleRange: { start: number; end: number };
  zenMode: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitAll: () => void;
  onToggleZenMode: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
}

const TimelineHeader = memo(function TimelineHeader({
  visibleRange,
  zenMode,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitAll,
  onToggleZenMode,
  onExportPNG,
  onExportPDF,
}: TimelineHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {formatTime(visibleRange.start)} - {formatTime(visibleRange.end)}
        <span className="ml-2 opacity-60">
          {zenMode ? "(ESC to exit)" : "(Scroll to zoom, drag to pan)"}
        </span>
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onResetZoom}
          title="Reset to 60s view"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onFitAll}
          title="Fit all (show entire timeline)"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant={zenMode ? "secondary" : "outline"}
          size="icon"
          className="h-8 w-8"
          onClick={onToggleZenMode}
          title={zenMode ? "Exit zen mode (ESC)" : "Zen mode"}
        >
          {zenMode ? <X className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Download timeline"
            >
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportPNG}>
              Download PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPDF}>
              Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
});

// Memoized track toggle buttons
interface TrackTogglesProps {
  expandedTracks: Set<TrackId>;
  onToggleTrack: (trackId: TrackId) => void;
}

const TrackToggles = memo(function TrackToggles({
  expandedTracks,
  onToggleTrack,
}: TrackTogglesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TRACK_CONFIGS.filter((t) => t.collapsible).map((track) => (
        <Button
          key={track.id}
          variant={expandedTracks.has(track.id) ? "secondary" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onToggleTrack(track.id)}
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
  );
});

// Memoized legend component - subscribes to its own atoms
const TimelineLegend = memo(function TimelineLegend() {
  const uniqueSpells = useAtomValue(uniqueSpellsAtom);
  const [selectedSpell, setSelectedSpell] = useAtom(selectedSpellAtom);

  return (
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
  );
});

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Static data atoms (only read once, data doesn't change)
  const combatData = useAtomValue(combatDataAtom);
  const bounds = useAtomValue(timelineBoundsAtom);
  const buffsBySpell = useAtomValue(buffsBySpellAtom);
  const debuffs = useAtomValue(debuffsAtom);
  const maxDamage = useAtomValue(maxDamageAtom);

  // Interactive atoms
  const [expandedTracks, setExpandedTracks] = useAtom(expandedTracksAtom);
  const [selectedSpell, setSelectedSpell] = useAtom(selectedSpellAtom);
  const [hoveredSpell, setHoveredSpell] = useAtom(hoveredSpellAtom);

  // Local state
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zenMode, setZenMode] = useState(false);
  const [fps, setFps] = useState(0);
  const fpsTextRef = useRef<Konva.Text>(null);

  // Escape key to exit zen mode
  useEffect(() => {
    if (!zenMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setZenMode(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [zenMode]);

  // FPS counter animation
  useEffect(() => {
    const layer = fpsTextRef.current?.getLayer();
    if (!layer) {
      return;
    }

    const fpsHistory: number[] = [];
    const maxSamples = 30;

    const anim = new Konva.Animation((frame) => {
      if (!frame) {
        return;
      }

      fpsHistory.push(frame.frameRate);
      if (fpsHistory.length > maxSamples) {
        fpsHistory.shift();
      }

      const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
      setFps(Math.round(avgFps));
    }, layer);

    anim.start();

    return () => {
      anim.stop();
    };
  }, []);

  // Container size
  const { width: containerWidth, height: containerHeight } =
    useResizeObserver(containerRef);
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
  } = useZoom({
    totalDuration: bounds.max - bounds.min,
    innerWidth,
    initialWindow: 60,
  });

  // Scales - visibleRange is derived from zoom state here
  const { timeToX, damageToY, focusToY, visibleRange } = useScales({
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

  // Toggle track expansion
  const toggleTrack = useCallback(
    (trackId: TrackId) => {
      setExpandedTracks((prev: Set<TrackId>) => {
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

  // Handle drag for panning via pointer events
  const isDragging = useRef(false);
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button !== 0) return;

      const stage = stageRef.current;
      if (!stage) return;

      isDragging.current = true;
      lastPointerPos.current = stage.getPointerPosition();
    },
    [],
  );

  const handleMouseMove = useCallback(
    (_e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDragging.current) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos || !lastPointerPos.current) return;

      const dx = pos.x - lastPointerPos.current.x;
      lastPointerPos.current = pos;

      setZoomState((prev) => {
        const maxX = 0;
        const minX = -(innerWidth * prev.scale - innerWidth);
        return {
          ...prev,
          x: Math.min(maxX, Math.max(minX, prev.x + dx)),
        };
      });
    },
    [innerWidth, setZoomState],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    lastPointerPos.current = null;
  }, []);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      // Only handle single touch for panning
      if (e.evt.touches.length !== 1) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) {
        return;
      }

      isDragging.current = true;
      lastPointerPos.current = stage.getPointerPosition();
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (!isDragging.current) {
        return;
      }

      // Only handle single touch for panning
      if (e.evt.touches.length !== 1) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) {
        return;
      }

      const pos = stage.getPointerPosition();
      if (!pos || !lastPointerPos.current) {
        return;
      }

      const dx = pos.x - lastPointerPos.current.x;
      lastPointerPos.current = pos;

      setZoomState((prev) => {
        const maxX = 0;
        const minX = -(innerWidth * prev.scale - innerWidth);

        return {
          ...prev,
          x: Math.min(maxX, Math.max(minX, prev.x + dx)),
        };
      });
    },
    [innerWidth, setZoomState],
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastPointerPos.current = null;
  }, []);

  // Handle range select from minimap
  const handleMinimapRangeSelect = useCallback(
    (start: number, end: number) => {
      zoomToRange(start, end);
    },
    [zoomToRange],
  );

  const defaultStageHeight = totalHeight + MARGIN.top + MARGIN.bottom;
  const stageHeight =
    zenMode && containerHeight > 0 ? containerHeight : defaultStageHeight;

  const toggleZenMode = useCallback(() => setZenMode((z) => !z), []);

  const { exportPNG, exportPDF } = useExport({
    stageRef,
    contentHeight: totalHeight + MARGIN.top + MARGIN.bottom,
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        zenMode &&
          "fixed inset-0 z-50 bg-background p-4 overflow-auto animate-in fade-in duration-200",
      )}
    >
      {/* Header */}
      <TimelineHeader
        visibleRange={visibleRange}
        zenMode={zenMode}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onFitAll={fitAll}
        onToggleZenMode={toggleZenMode}
        onExportPNG={exportPNG}
        onExportPDF={exportPDF}
      />

      {/* Main timeline */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full rounded-lg border bg-background overflow-hidden cursor-grab active:cursor-grabbing",
          zenMode && "flex-1 min-h-0",
        )}
      >
        <Stage
          ref={stageRef}
          width={containerWidth || 800}
          height={stageHeight}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
              visibleRange={visibleRange}
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
                visibleRange={visibleRange}
              />
            )}

            {/* Casts track */}
            {tracks.casts.visible && (
              <CastsTrack
                casts={combatData.casts}
                y={tracks.casts.y}
                timeToX={timeToX}
                innerWidth={innerWidth}
                visibleRange={visibleRange}
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
                visibleRange={visibleRange}
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
                visibleRange={visibleRange}
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
                visibleRange={visibleRange}
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
                visibleRange={visibleRange}
              />
            )}

            {/* X Axis */}
            <XAxis
              innerWidth={innerWidth}
              totalHeight={totalHeight}
              timeToX={timeToX}
              bounds={bounds}
              visibleRange={visibleRange}
            />

            {/* FPS Counter */}
            <Text
              ref={fpsTextRef}
              x={innerWidth - 60}
              y={-MARGIN.top + 8}
              text={`FPS: ${fps}`}
              fontSize={12}
              fontFamily="monospace"
              fill="#888"
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
          viewRange={visibleRange}
          innerWidth={innerWidth}
          onRangeSelect={handleMinimapRangeSelect}
        />
      </div>

      {/* Track toggles */}
      <TrackToggles
        expandedTracks={expandedTracks}
        onToggleTrack={toggleTrack}
      />

      {/* Legend - has its own atom subscriptions */}
      <TimelineLegend />
    </div>
  );
}
