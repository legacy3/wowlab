"use client";

import { useRef, useState, memo } from "react";
import type Konva from "konva";
import { KonvaStage, KonvaLayer } from "@/components/konva";
import { useResizeObserver } from "@/hooks/canvas";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PriorityListView } from "./priority-list-view";
import { PlaybackControls } from "./playback-controls";
import { StatePanel } from "./state-panel";
import { usePlayback } from "./use-playback";
import { MOCK_PRIORITY_LIST, MOCK_PLAYBACK } from "./mock-data";

interface RotationVisualizerProps {
  rotationId: string;
}

const CANVAS_MIN_HEIGHT = 600;

function VisualizerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-64 bg-muted rounded animate-pulse" />
      <div className="h-[600px] w-full bg-muted rounded-lg animate-pulse" />
    </div>
  );
}

export const RotationVisualizer = memo(function RotationVisualizer({
  rotationId,
}: RotationVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const { width: containerWidth } = useResizeObserver(containerRef);

  const [activeTab, setActiveTab] = useState("priority");

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

  // Calculate canvas dimensions
  const canvasWidth = Math.max(400, containerWidth - 320); // Leave space for state panel
  const canvasHeight = CANVAS_MIN_HEIGHT;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/rotations/${rotationId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Rotation
            </Link>
          </Button>
          <Badge variant="secondary" className="gap-1">
            <Eye className="h-3 w-3" />
            Mock Data
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Beast Mastery Hunter • Single Target
        </div>
      </div>

      {/* View tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="priority">Priority List</TabsTrigger>
          <TabsTrigger value="flowchart" disabled>
            Flowchart (Soon)
          </TabsTrigger>
          <TabsTrigger value="timeline" disabled>
            Timeline (Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="priority" className="mt-4">
          <div className="flex gap-4">
            {/* Main canvas area */}
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Decision Flow</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  ref={containerRef}
                  className="w-full rounded-b-lg overflow-hidden bg-[#0a0a0b]"
                  style={{ minHeight: canvasHeight }}
                >
                  {containerWidth > 0 && (
                    <KonvaStage
                      ref={stageRef}
                      width={canvasWidth}
                      height={canvasHeight}
                    >
                      <KonvaLayer>
                        <PriorityListView
                          priorityList={MOCK_PRIORITY_LIST}
                          currentFrame={currentFrame}
                          width={canvasWidth}
                          height={canvasHeight}
                        />
                      </KonvaLayer>
                    </KonvaStage>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* State panel sidebar */}
            <div className="w-80 shrink-0 space-y-4">
              <StatePanel frame={currentFrame} />
            </div>
          </div>

          {/* Playback controls */}
          <div className="mt-4">
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
        </TabsContent>

        <TabsContent value="flowchart">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Flowchart view coming soon - will show decision tree visualization
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Timeline view coming soon - will integrate with simulation
              timeline
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Decision log for current frame */}
      {currentFrame && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Decision Log @ {currentFrame.time.toFixed(1)}s
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm">
              {currentFrame.decisions.map((decision, index) => (
                <div
                  key={`${decision.spellId}-${index}`}
                  className={`flex items-center gap-2 py-1 px-2 rounded ${
                    decision.result === "cast"
                      ? "bg-green-500/10 text-green-400"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="w-4">
                    {decision.result === "cast" ? "✓" : "✗"}
                  </span>
                  <span className="w-32 truncate">{decision.spellName}</span>
                  <span className="text-xs opacity-70">→</span>
                  <span className="flex-1 text-xs">{decision.reason}</span>
                  {decision.stateSnapshot.cooldownRemaining !== undefined && (
                    <span className="text-xs opacity-50">
                      CD: {decision.stateSnapshot.cooldownRemaining.toFixed(1)}s
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
