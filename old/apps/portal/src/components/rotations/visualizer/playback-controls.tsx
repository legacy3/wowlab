"use client";

import { memo } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface PlaybackControlsProps {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onFrameChange: (frame: number) => void;
  onPlayPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls = memo(function PlaybackControls({
  currentFrame,
  totalFrames,
  isPlaying,
  playbackSpeed,
  onFrameChange,
  onPlayPause,
  onStepBack,
  onStepForward,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card">
      {/* Transport controls */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onFrameChange(0)}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onStepBack}
          disabled={currentFrame === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10"
          onClick={onPlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onStepForward}
          disabled={currentFrame >= totalFrames - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onFrameChange(totalFrames - 1)}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline */}
      <div className="flex-1 flex items-center gap-4">
        <Slider
          value={[currentFrame]}
          min={0}
          max={Math.max(0, totalFrames - 1)}
          step={1}
          onValueChange={([value]) => onFrameChange(value)}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground font-mono tabular-nums min-w-[3.5rem] text-right">
          {currentFrame + 1}/{totalFrames}
        </span>
      </div>

      {/* Speed */}
      <div className="flex items-center border-l border-border/50 pl-4 gap-1">
        {[0.5, 1, 2].map((speed) => (
          <Button
            key={speed}
            variant={playbackSpeed === speed ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs font-mono"
            onClick={() => onSpeedChange(speed)}
          >
            {speed}x
          </Button>
        ))}
      </div>
    </div>
  );
});
