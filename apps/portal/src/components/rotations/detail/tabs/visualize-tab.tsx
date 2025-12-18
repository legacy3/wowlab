"use client";

import { memo, useRef } from "react";
import type Konva from "konva";
import { KonvaStage, KonvaLayer } from "@/components/konva";
import { useResizeObserver } from "@/hooks/canvas";
import type { Rotation } from "@/lib/supabase/types";

import { PriorityListView } from "../../visualizer/priority-list-view";
import { PlaybackControls } from "../../visualizer/playback-controls";
import { StatePanel } from "../../visualizer/state-panel";
import { usePlayback } from "../../visualizer/use-playback";
import { MOCK_PRIORITY_LIST, MOCK_PLAYBACK } from "../../visualizer/mock-data";

interface VisualizeTabProps {
  rotation: Rotation;
}

// Calculate height based on content
const ROW_HEIGHT = 52;
const ROW_GAP = 6;
const HEADER_HEIGHT = 36;
const PADDING = 12;
const CANVAS_HEIGHT =
  MOCK_PRIORITY_LIST.length * (ROW_HEIGHT + ROW_GAP) -
  ROW_GAP +
  HEADER_HEIGHT +
  PADDING * 2;

export const VisualizeTab = memo(function VisualizeTab({
  rotation,
}: VisualizeTabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const { width: containerWidth } = useResizeObserver(containerRef);

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

  return (
    <div className="space-y-4">
      {/* Main layout */}
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Priority list canvas */}
        <div
          ref={containerRef}
          className="rounded-lg border bg-[#09090b] overflow-auto"
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
                  height={CANVAS_HEIGHT}
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
  );
});
