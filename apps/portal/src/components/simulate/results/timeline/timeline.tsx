"use client";

import { useCallback, useRef, useState, memo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useThrottledCallback } from "@react-hookz/web";
import type Konva from "konva";
import {
  KonvaStage,
  KonvaLayer,
  KonvaText,
  KonvaGroup,
} from "@/components/konva";
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
  type TrackId,
} from "@/atoms/timeline";
import { formatTime } from "./utils";

import {
  useZoom,
  useResizeObserver,
  useExport,
  useDragPan,
  useFpsCounter,
} from "@/hooks/canvas";
import {
  useScales,
  useTrackLayout,
  TRACK_CONFIGS,
  TRACK_METRICS,
} from "@/hooks/timeline";
import { useZenMode } from "@/hooks/use-zen-mode";

import { type TooltipState } from "./timeline-context";
import { TimelineTooltip } from "./timeline-tooltip";
import { TimelineSettings } from "./timeline-settings";
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

interface TimelineHeaderProps {
  visibleRange: { start: number; end: number };
  zenMode: boolean;
  showFps: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitAll: () => void;
  onToggleZenMode: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onShowFpsChange: (value: boolean) => void;
}

const TimelineHeader = memo(function TimelineHeader({
  visibleRange,
  zenMode,
  showFps,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitAll,
  onToggleZenMode,
  onExportPNG,
  onExportPDF,
  onShowFpsChange,
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
        <TimelineSettings showFps={showFps} onShowFpsChange={onShowFpsChange} />
      </div>
    </div>
  );
});

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

  const combatData = useAtomValue(combatDataAtom);
  const bounds = useAtomValue(timelineBoundsAtom);
  const buffsBySpell = useAtomValue(buffsBySpellAtom);
  const debuffs = useAtomValue(debuffsAtom);
  const maxDamage = useAtomValue(maxDamageAtom);

  const [expandedTracks, setExpandedTracks] = useAtom(expandedTracksAtom);
  const [selectedSpell, setSelectedSpell] = useAtom(selectedSpellAtom);
  const [hoveredSpell, setHoveredSpell] = useAtom(hoveredSpellAtom);

  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const { isZen: zenMode, toggleZen: toggleZenMode } = useZenMode();
  const [showFps, setShowFps] = useState(false);
  const fpsTextRef = useRef<Konva.Text>(null);
  const fps = useFpsCounter({ enabled: showFps, layerRef: fpsTextRef });

  const { width: containerWidth, height: containerHeight } =
    useResizeObserver(containerRef);
  const innerWidth = Math.max(0, containerWidth - MARGIN.left - MARGIN.right);
  const availableTrackHeight =
    zenMode && containerHeight > 0
      ? containerHeight - MARGIN.top - MARGIN.bottom
      : undefined;

  const { tracks, totalHeight } = useTrackLayout(
    expandedTracks,
    availableTrackHeight,
  );

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

  const { timeToX, damageToY, focusToY, visibleRange } = useScales({
    bounds,
    innerWidth,
    damageTrackHeight: tracks.damage.height,
    resourceTrackHeight: tracks.resources.height,
    maxDamage,
    zoomState,
  });

  const throttledSetTooltip = useThrottledCallback(
    setTooltip,
    [setTooltip],
    16,
  );

  const showTooltip = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, content: React.ReactNode) => {
      const stage = e.target.getStage();
      if (!stage) {
        return;
      }

      const pos = stage.getPointerPosition();
      if (!pos) {
        return;
      }

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

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useDragPan({ stageRef, innerWidth, setZoomState });

  const handleMinimapRangeSelect = useCallback(
    (start: number, end: number) => {
      zoomToRange(start, end);
    },
    [zoomToRange],
  );

  const defaultStageHeight = totalHeight + MARGIN.top + MARGIN.bottom;
  const stageHeight =
    zenMode && containerHeight > 0 ? containerHeight : defaultStageHeight;

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
      <TimelineHeader
        visibleRange={visibleRange}
        zenMode={zenMode}
        showFps={showFps}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onFitAll={fitAll}
        onToggleZenMode={toggleZenMode}
        onExportPNG={exportPNG}
        onExportPDF={exportPDF}
        onShowFpsChange={setShowFps}
      />

      <div
        ref={containerRef}
        className={cn(
          "relative w-full rounded-lg border bg-background overflow-hidden cursor-grab active:cursor-grabbing",
          zenMode ? "flex-1 min-h-0" : "min-h-[500px]",
        )}
      >
        <KonvaStage
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
          <KonvaLayer y={MARGIN.top} listening={false}>
            <TrackLabels
              tracks={tracks}
              expandedTracks={expandedTracks}
              onToggleTrack={toggleTrack}
            />
          </KonvaLayer>

          <KonvaLayer x={MARGIN.left} y={MARGIN.top}>
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

            <KonvaGroup
              clipX={0}
              clipY={tracks.phases.visible ? tracks.phases.height : 0}
              clipWidth={innerWidth}
              clipHeight={
                totalHeight - (tracks.phases.visible ? tracks.phases.height : 0)
              }
            >
              <GridLayer
                innerWidth={innerWidth}
                totalHeight={totalHeight}
                timeToX={timeToX}
                bounds={bounds}
                visibleRange={visibleRange}
              />

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

              {tracks.buffs.visible && (
                <BuffsTrack
                  buffs={buffsBySpell}
                  y={tracks.buffs.y}
                  timeToX={timeToX}
                  visibleRange={visibleRange}
                  selectedSpell={selectedSpell}
                  showTooltip={showTooltip}
                  hideTooltip={hideTooltip}
                />
              )}

              {tracks.debuffs.visible && (
                <DebuffsTrack
                  debuffs={debuffs}
                  y={tracks.debuffs.y}
                  timeToX={timeToX}
                  visibleRange={visibleRange}
                />
              )}

              {tracks.damage.visible && (
                <DamageTrack
                  damage={combatData.damage}
                  y={tracks.damage.y}
                  height={tracks.damage.height}
                  timeToX={timeToX}
                  damageToY={damageToY}
                  visibleRange={visibleRange}
                  selectedSpell={selectedSpell}
                  showTooltip={showTooltip}
                  hideTooltip={hideTooltip}
                />
              )}

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

              <XAxis
                innerWidth={innerWidth}
                totalHeight={totalHeight}
                timeToX={timeToX}
                bounds={bounds}
                visibleRange={visibleRange}
              />
            </KonvaGroup>

            {showFps && (
              <KonvaText
                ref={fpsTextRef}
                x={innerWidth - 60}
                y={-MARGIN.top + 8}
                text={`FPS: ${fps}`}
                fontSize={12}
                fontFamily="monospace"
                fill="#888"
              />
            )}
          </KonvaLayer>
        </KonvaStage>
        <TimelineTooltip tooltip={tooltip} />
      </div>

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

      <TrackToggles
        expandedTracks={expandedTracks}
        onToggleTrack={toggleTrack}
      />

      <TimelineLegend />
    </div>
  );
}
