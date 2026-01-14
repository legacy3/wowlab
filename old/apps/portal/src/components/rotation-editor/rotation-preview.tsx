"use client";

import { useMemo, useRef, useState } from "react";
import { Code2Icon, BracesIcon, TextIcon, PlayIcon } from "lucide-react";
import type Konva from "konva";

import { CodeBlock } from "@/components/ui/code-block";
import { KonvaStage, KonvaLayer } from "@/components/konva";
import { useClassesAndSpecs } from "@/hooks/use-classes-and-specs";
import { useResizeObserver } from "@/hooks/canvas";
import { cn } from "@/lib/utils";

import { PriorityListView } from "@/components/rotations/visualizer/priority-list-view";
import { PlaybackControls } from "@/components/rotations/visualizer/playback-controls";
import { StatePanel } from "@/components/rotations/visualizer/state-panel";
import { usePlayback } from "@/components/rotations/visualizer/use-playback";
import {
  MOCK_PRIORITY_LIST,
  MOCK_PLAYBACK,
} from "@/components/rotations/visualizer/mock-data";
import { calculateCanvasHeight } from "@/components/rotations/visualizer/constants";

import type { RotationDraft } from "./types";
import { generateDSL, generateNatural, generateJSON } from "./utils";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RotationPreviewProps {
  draft: RotationDraft;
}

type ViewMode = "visualize" | "natural" | "dsl" | "json";

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

const CANVAS_HEIGHT = calculateCanvasHeight(MOCK_PRIORITY_LIST.length);

export function RotationPreview({ draft }: RotationPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("visualize");
  const { classes, specs } = useClassesAndSpecs();

  // Refs for visualizer
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const { width: containerWidth } = useResizeObserver(containerRef);

  // Playback state
  const {
    currentFrameIndex,
    currentFrame,
    isPlaying,
    playbackSpeed,
    setFrameIndex,
    togglePlayPause,
    stepForward,
    stepBack,
    reset,
    setPlaybackSpeed,
  } = usePlayback({ frames: MOCK_PLAYBACK });

  const canvasWidth = Math.max(300, containerWidth);

  const specName = useMemo(() => {
    if (!draft.specId) return "Unknown";
    const spec = specs.result?.data?.find((s) => s.ID === draft.specId);
    const cls = spec
      ? classes.result?.data?.find((c) => c.ID === spec.ClassID)
      : null;
    return cls && spec ? `${cls.Name_lang} ${spec.Name_lang}` : "Unknown";
  }, [draft.specId, classes.result?.data, specs.result?.data]);

  const content = useMemo(() => {
    switch (viewMode) {
      case "natural":
        return generateNatural(draft, specName);
      case "dsl":
        return generateDSL(draft, specName);
      case "json":
        return generateJSON(draft);
      default:
        return "";
    }
  }, [draft, specName, viewMode]);

  return (
    <div className="flex flex-col h-full">
      {/* View toggle */}
      <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 w-fit mb-3">
        {(["visualize", "natural", "dsl", "json"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === mode
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {mode === "visualize" && <PlayIcon className="size-3.5" />}
            {mode === "natural" && <TextIcon className="size-3.5" />}
            {mode === "dsl" && <Code2Icon className="size-3.5" />}
            {mode === "json" && <BracesIcon className="size-3.5" />}
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Content based on view mode */}
      {viewMode === "visualize" ? (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Main layout */}
          <div className="grid gap-4 lg:grid-cols-[1fr_260px] flex-1 min-h-0">
            {/* Priority list canvas */}
            <div
              ref={containerRef}
              className="rounded-lg border border-border/60 bg-[#09090b] overflow-auto"
              style={{ maxHeight: 600 }}
            >
              {containerWidth > 0 && (
                <KonvaStage
                  ref={stageRef}
                  width={canvasWidth}
                  height={CANVAS_HEIGHT}
                >
                  <KonvaLayer>
                    <PriorityListView
                      priorityList={MOCK_PRIORITY_LIST}
                      currentFrame={currentFrame}
                      width={canvasWidth}
                    />
                  </KonvaLayer>
                </KonvaStage>
              )}
            </div>

            {/* State panel */}
            <StatePanel frame={currentFrame} />
          </div>

          {/* Playback controls */}
          <PlaybackControls
            currentFrame={currentFrameIndex}
            totalFrames={MOCK_PLAYBACK.length}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onFrameChange={setFrameIndex}
            onPlayPause={togglePlayPause}
            onStepBack={stepBack}
            onStepForward={stepForward}
            onReset={reset}
            onSpeedChange={setPlaybackSpeed}
          />
        </div>
      ) : (
        /* Code display */
        <CodeBlock
          code={content}
          language={
            viewMode === "json"
              ? "json"
              : viewMode === "dsl"
                ? "yaml"
                : "markdown"
          }
          maxHeight="max-h-[calc(100vh-16rem)]"
        />
      )}
    </div>
  );
}
