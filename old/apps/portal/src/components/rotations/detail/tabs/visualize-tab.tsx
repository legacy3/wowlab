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
import { calculateCanvasHeight } from "../../visualizer/constants";

interface VisualizeTabProps {
  rotation: Rotation;
}

const CANVAS_HEIGHT = calculateCanvasHeight(MOCK_PRIORITY_LIST.length);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const VisualizeTab = memo(function VisualizeTab(
  props: VisualizeTabProps,
) {
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
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
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
  );
});
